/**
 * DothanTech Printer Library - Main Entry Point
 *
 * Primary class for communicating with DothanTech printers.
 *
 * @author Reverse-engineered from com.dothantech Android library
 * @version 1.0.0
 */

import type {
  PrinterConfig,
  TextPrintOptions,
  ImagePrintOptions,
  PrintStats,
  PrinterStatus,
  PrinterPrintStats,
  DataReceivedCallback,
  ErrorCallback,
  StatusChangeCallback
} from './types';
import { ConnectionStatus, PaperType } from './types';
import {
  DEFAULT_CONFIG,
  CMD_FEED_LINES,
  CMD_PAPER_TYPE,
  CMD_DENSITY,
  CMD_SPEED,
  CMD_GAP_SPACING,
  CMD_MOTOR_MODE,
  CMD_AUTO_POWEROFF,
  CMD_QUERY_STATUS,
  CMD_QUERY_DPI,
  CMD_QUERY_WIDTH,
  CMD_QUERY_STATS,
  CMD_MANUFACTURER,
  CMD_DEVICE_NAME,
  CMD_DEVICE_VERSION,
  CMD_SW_VERSION,
  PaperTypeNames,
} from './constants';
import { BluetoothManager } from './bluetooth-manager';
import { canvasToDothanTech, renderTextToCanvas, loadImageToCanvas, scaleCanvasByMaxWidth } from './canvas-processor';
import { parseStatusResponse } from './response-parser';
import { buildCommand, createDebugLogger } from './protocol';

/**
 * Main class for communicating with a DothanTech printer via Web Bluetooth.
 *
 * @example
 * ```typescript
 * const printer = new DothanTechPrinter();
 * await printer.connect();
 * await printer.printText('Hello World!', { fontSize: 32 });
 * await printer.disconnect();
 * ```
 */
export class DothanTechPrinter {

  static readonly ConnectionStatus = {
    DISCONNECTED: 'disconnected',
    CONNECTING:   'connecting',
    CONNECTED:    'connected',
    PRINTING:     'printing',
    ERROR:        'error',
  } as const;

  static readonly PaperTypeNames = PaperTypeNames;

  private config: Required<PrinterConfig>;
  private bluetoothManager: BluetoothManager;
  private status: ConnectionStatus = 'disconnected' as ConnectionStatus;

  private statusCallbacks: Set<StatusChangeCallback> = new Set();
  private dataCallbacks:   Set<DataReceivedCallback>  = new Set();
  private errorCallbacks:  Set<ErrorCallback>          = new Set();

  private printerStatus:    PrinterStatus         = {};
  private printingStats:    PrinterPrintStats      = {};

  private debugLog: (msg: string, ...args: unknown[]) => void;

  constructor(config?: PrinterConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.bluetoothManager = new BluetoothManager(this.config);
    this.debugLog = createDebugLogger(this.config.debug);

    this.bluetoothManager.onStatusChange((status) => {
      this.status = status;
      this.statusCallbacks.forEach(cb => cb(status));
    });

    this.bluetoothManager.onDataReceived((data) => {
      this.parseStatusResponse(data);
      this.dataCallbacks.forEach(cb => cb(data));
    });

    this.bluetoothManager.onError((error) => {
      this.errorCallbacks.forEach(cb => cb(error));
    });
  }

  /**
   * Connect to the printer via Bluetooth.
   */
  async connect(): Promise<void> {
    try {
      await this.bluetoothManager.connect();
      await this.refreshPrinterStatus({ minimal: true });
    } catch (error) {
      this.status = 'error';
      this.errorCallbacks.forEach(cb => cb(error as Error));
      throw error;
    }
  }

  /**
   * Disconnect from the printer.
   */
  async disconnect(): Promise<void> {
    await this.bluetoothManager.disconnect();
  }

  /**
   * Check if the printer is currently connected.
   */
  isConnected(): boolean {
    return this.status === 'connected' || this.status === 'printing';
  }

  /**
   * Get the current connection status.
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get the connected device name.
   */
  getDeviceName(): string | null {
    return this.bluetoothManager.getDeviceName();
  }

  /**
   * Get the latest printer status data (DPI, temperature, battery, etc.).
   */
  getPrinterStatus(): PrinterStatus {
    return { ...this.printerStatus };
  }

  /**
   * Get printing statistics (lines printed, pages, etc.).
   */
  getPrintingStats(): PrinterPrintStats {
    return { ...this.printingStats };
  }

  /**
   * Set paper width in pixels.
   * @param width - Width in pixels (must be >= 1).
   */
  setPaperWidth(width: number): void {
    if (width < 1) throw new Error('Paper width must be >= 1');
    this.config.paperWidth = width;
  }

  /**
   * Get the current paper width in pixels.
   */
  getPaperWidth(): number {
    return this.config.paperWidth;
  }

  /**
   * Query the printer for current parameters.
   * Results are available via getPrinterStatus() after the response is received.
   * @param options - Refresh options. Set `minimal: true` for faster UI-only params.
   */
  async refreshPrinterStatus(options?: { minimal?: boolean }): Promise<void> {
    if (!this.bluetoothManager.hasCharacteristics()) {
      throw new Error('Printer is not connected');
    }

    const minimal = options?.minimal ?? false;

    const queries = minimal
      ? [
          buildCommand(CMD_QUERY_DPI),
          buildCommand(CMD_QUERY_WIDTH),
          buildCommand(CMD_DENSITY),
          buildCommand(CMD_SPEED),
          buildCommand(CMD_PAPER_TYPE),
          buildCommand(0x66),
          buildCommand(CMD_GAP_SPACING),
          buildCommand(CMD_MOTOR_MODE),
          buildCommand(CMD_AUTO_POWEROFF),
        ]
      : [
          buildCommand(CMD_DEVICE_NAME),
          buildCommand(CMD_DEVICE_VERSION),
          buildCommand(CMD_SW_VERSION),
          buildCommand(CMD_MANUFACTURER),
          buildCommand(CMD_QUERY_STATUS),
          buildCommand(CMD_QUERY_DPI),
          buildCommand(CMD_QUERY_WIDTH),
          buildCommand(CMD_QUERY_STATS),
          buildCommand(CMD_DENSITY),
          buildCommand(CMD_SPEED),
          buildCommand(CMD_PAPER_TYPE),
          buildCommand(0x66),
          buildCommand(CMD_GAP_SPACING),
          buildCommand(CMD_MOTOR_MODE),
          buildCommand(CMD_AUTO_POWEROFF),
        ];

    for (const query of queries) {
      await this.sendData(query);
      await new Promise(r => setTimeout(r, 50));
    }
  }

  /**
   * Print text with optional formatting options.
   * @param text - The text to print.
   * @param options - Text formatting options.
   * @returns Print statistics.
   */
  async printText(text: string, options?: TextPrintOptions): Promise<PrintStats> {
    if (!this.isConnected()) throw new Error('Printer is not connected');

    const printerDPI = this.printerStatus.printerDPI || 203;
    const canvas = renderTextToCanvas(text, options, printerDPI, this.config.paperWidth);
    return await this.printCanvas(canvas);
  }

  /**
   * Print a canvas element.
   * @param canvas - The canvas to print.
   * @param options - Image print options.
   * @returns Print statistics.
   */
  async printCanvas(canvas: HTMLCanvasElement, options?: ImagePrintOptions): Promise<PrintStats> {
    if (!this.isConnected()) throw new Error('Printer is not connected');

    this.status = 'printing';
    this.statusCallbacks.forEach(cb => cb(this.status));

    try {
      const printerDPI = this.printerStatus.printerDPI || 203;
      const scaledCanvas = scaleCanvasByMaxWidth(canvas, options?.maxWidth, printerDPI, this.config.paperWidth);

      const conversionStart = performance.now();
      const { data, stats: convStats } = await canvasToDothanTech(scaledCanvas, options, this.config.debug);
      const conversionTime = performance.now() - conversionStart;

      const transmissionStart = performance.now();
      await this.sendData(data);
      const transmissionTime = performance.now() - transmissionStart;

      this.status = 'connected';
      this.statusCallbacks.forEach(cb => cb(this.status));

      return {
        ...convStats,
        conversionTime,
        transmissionTime,
        transmissionSpeed: data.length / (transmissionTime / 1000) / 1024,
      };
    } catch (error) {
      this.status = 'error';
      this.statusCallbacks.forEach(cb => cb(this.status));
      this.errorCallbacks.forEach(cb => cb(error as Error));
      throw error;
    }
  }

  /**
   * Print an image from a URL.
   * @param imageUrl - The image URL.
   * @param options - Image print options.
   * @returns Print statistics.
   */
  async printImage(imageUrl: string, options?: ImagePrintOptions): Promise<PrintStats> {
    const canvas = await this.createCanvasFromSource(imageUrl);
    return await this.printCanvas(canvas, options);
  }

  /**
   * Print ImageData.
   * @param imageData - The image data to print.
   * @param options - Image print options.
   * @returns Print statistics.
   */
  async printImageData(imageData: ImageData, options?: ImagePrintOptions): Promise<PrintStats> {
    const canvas = await this.createCanvasFromSource(imageData);
    return await this.printCanvas(canvas, options);
  }

  /**
   * Feed N blank lines of paper (0-255).
   * @param n - Number of lines to feed.
   */
  async feedLines(n: number): Promise<void> {
    if (!this.isConnected()) throw new Error('Printer is not connected');
    if (n < 0 || n > 255) throw new Error('n must be 0-255');
    await this.sendData(new Uint8Array([0x1B, CMD_FEED_LINES, n]));
  }

  /**
   * Register a callback for connection status changes.
   * @returns Unsubscribe function.
   */
  onStatusChange(cb: StatusChangeCallback): () => void { this.statusCallbacks.add(cb); return () => this.statusCallbacks.delete(cb); }

  /**
   * Register a callback for incoming data.
   * @returns Unsubscribe function.
   */
  onDataReceived(cb: DataReceivedCallback): () => void { this.dataCallbacks.add(cb);   return () => this.dataCallbacks.delete(cb); }

  /**
   * Register a callback for errors.
   * @returns Unsubscribe function.
   */
  onError(cb: ErrorCallback): () => void { this.errorCallbacks.add(cb);   return () => this.errorCallbacks.delete(cb); }

  private parseStatusResponse(data: Uint8Array): void {
    parseStatusResponse(data, this.printerStatus, this.printingStats, this.debugLog);
  }

  private async createCanvasFromSource(source: string | ImageData): Promise<HTMLCanvasElement> {
    if (typeof source === 'string') {
      return await loadImageToCanvas(source);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = source.width;
      canvas.height = source.height;
      canvas.getContext('2d')!.putImageData(source, 0, 0);
      return canvas;
    }
  }

  private async sendData(data: Uint8Array): Promise<void> {
    await this.bluetoothManager.sendData(data);
  }
}

/**
 * Singleton printer instance for convenience.
 */
export const printer = new DothanTechPrinter();

export type {
  PrinterConfig,
  TextPrintOptions,
  ImagePrintOptions,
  PrintStats,
  PrinterStatus,
  PrinterPrintStats,
  DataReceivedCallback,
  ErrorCallback,
  StatusChangeCallback,
};

export {
  PaperType,
  PaperTypeNames,
  ConnectionStatus,
};
