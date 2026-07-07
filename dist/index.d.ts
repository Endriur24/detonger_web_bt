/**
 * DothanTech Printer Library - Main Entry Point
 *
 * Primary class for communicating with DothanTech printers.
 *
 * @author Reverse-engineered from com.dothantech Android library
 * @version 1.0.1
 */
import type { PrinterConfig, TextPrintOptions, ImagePrintOptions, PrintStats, PrinterStatus, PrinterPrintStats, DataReceivedCallback, ErrorCallback, StatusChangeCallback } from './types';
import { ConnectionStatus, PaperType } from './types';
import { PaperTypeNames } from './constants';
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
export declare class DothanTechPrinter {
    static readonly ConnectionStatus: {
        readonly DISCONNECTED: "disconnected";
        readonly CONNECTING: "connecting";
        readonly CONNECTED: "connected";
        readonly PRINTING: "printing";
        readonly ERROR: "error";
    };
    static readonly PaperTypeNames: Record<PaperType, string>;
    private config;
    private bluetoothManager;
    private status;
    private statusCallbacks;
    private dataCallbacks;
    private errorCallbacks;
    private printerStatus;
    private printingStats;
    private debugLog;
    constructor(config?: PrinterConfig);
    /**
     * Connect to the printer via Bluetooth.
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the printer.
     */
    disconnect(): Promise<void>;
    /**
     * Check if the printer is currently connected.
     */
    isConnected(): boolean;
    /**
     * Get the current connection status.
     */
    getStatus(): ConnectionStatus;
    /**
     * Get the connected device name.
     */
    getDeviceName(): string | null;
    /**
     * Get the latest printer status data (DPI, temperature, battery, etc.).
     */
    getPrinterStatus(): PrinterStatus;
    /**
     * Get printing statistics (lines printed, pages, etc.).
     */
    getPrintingStats(): PrinterPrintStats;
    /**
     * Set paper width in pixels.
     * @param width - Width in pixels (must be >= 1).
     */
    setPaperWidth(width: number): void;
    /**
     * Get the current paper width in pixels.
     */
    getPaperWidth(): number;
    /**
     * Query the printer for current parameters.
     * Results are available via getPrinterStatus() after the response is received.
     * @param options - Refresh options. Set `minimal: true` for faster UI-only params.
     */
    refreshPrinterStatus(options?: {
        minimal?: boolean;
    }): Promise<void>;
    /**
     * Print text with optional formatting options.
     * @param text - The text to print.
     * @param options - Text formatting options.
     * @returns Print statistics.
     */
    printText(text: string, options?: TextPrintOptions): Promise<PrintStats>;
    /**
     * Print a canvas element.
     * @param canvas - The canvas to print.
     * @param options - Image print options.
     * @returns Print statistics.
     */
    printCanvas(canvas: HTMLCanvasElement, options?: ImagePrintOptions): Promise<PrintStats>;
    /**
     * Print an image from a URL.
     * @param imageUrl - The image URL.
     * @param options - Image print options.
     * @returns Print statistics.
     */
    printImage(imageUrl: string, options?: ImagePrintOptions): Promise<PrintStats>;
    /**
     * Print ImageData.
     * @param imageData - The image data to print.
     * @param options - Image print options.
     * @returns Print statistics.
     */
    printImageData(imageData: ImageData, options?: ImagePrintOptions): Promise<PrintStats>;
    /**
     * Feed N blank lines of paper (0-255).
     * @param n - Number of lines to feed.
     */
    feedLines(n: number): Promise<void>;
    /**
     * Register a callback for connection status changes.
     * @returns Unsubscribe function.
     */
    onStatusChange(cb: StatusChangeCallback): () => void;
    /**
     * Register a callback for incoming data.
     * @returns Unsubscribe function.
     */
    onDataReceived(cb: DataReceivedCallback): () => void;
    /**
     * Register a callback for errors.
     * @returns Unsubscribe function.
     */
    onError(cb: ErrorCallback): () => void;
    private parseStatusResponse;
    private createCanvasFromSource;
    private sendData;
}
export type { PrinterConfig, TextPrintOptions, ImagePrintOptions, PrintStats, PrinterStatus, PrinterPrintStats, DataReceivedCallback, ErrorCallback, StatusChangeCallback, };
export { PaperType, PaperTypeNames, ConnectionStatus, };
