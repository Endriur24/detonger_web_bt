/**
 * DothanTech Printer Library - Bluetooth Manager
 *
 * Manages Bluetooth Low Energy connections to DothanTech printers.
 */

import type { PrinterConfig, DataReceivedCallback, ErrorCallback, StatusChangeCallback } from './types';
import { ConnectionStatus } from './types';
import { OPTIONAL_SERVICES } from './constants';
import { createDebugLogger } from './protocol';

export class BluetoothManager {
  private config: Required<PrinterConfig>;
  private debugLog: (msg: string, ...args: unknown[]) => void;

  private device: BluetoothDevice | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  private status: ConnectionStatus = 'disconnected' as ConnectionStatus;
  private statusCallbacks: Set<StatusChangeCallback> = new Set();
  private dataCallbacks: Set<DataReceivedCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();

  private handleDataReceivedBound: (event: Event) => void;
  private handleDisconnectedBound: () => void;

  constructor(config: Required<PrinterConfig>) {
    this.config = config;
    this.debugLog = createDebugLogger(config.debug);

    this.handleDataReceivedBound = this.handleDataReceived.bind(this);
    this.handleDisconnectedBound = this.handleDisconnected.bind(this);
  }

  /**
   * Connect to a printer via Bluetooth.
   * @throws Error if connection fails or required characteristics are not found.
   */
  async connect(): Promise<void> {
    try {
      this.debugLog('Starting connection process with config:', this.config);
      this.setStatus('connecting');

      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: this.config.namePrefix }],
        optionalServices: OPTIONAL_SERVICES,
      });

      this.debugLog('Bluetooth device found:', this.device.name);

      const server = await this.device.gatt!.connect();
      this.debugLog('GATT server connected');

      await this.findCharacteristics(server);

      if (!this.writeCharacteristic || !this.notifyCharacteristic) {
        throw new Error('Required Bluetooth characteristics not found.');
      }

      await this.notifyCharacteristic.startNotifications();
      this.notifyCharacteristic.addEventListener('characteristicvaluechanged', this.handleDataReceivedBound);
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnectedBound);

      this.debugLog('Connection complete!');
      this.setStatus('connected');
    } catch (error) {
      this.setStatus('error');
      this.emitError(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from the printer.
   */
  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.cleanup();
  }

  /**
   * Check if the printer is connected.
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
    return this.device?.name || null;
  }

  /**
   * Send data to the printer in MTU-sized chunks.
   * @param data - The data to send.
   */
  async sendData(data: Uint8Array): Promise<void> {
    if (!this.writeCharacteristic) throw new Error('No write characteristic available');

    const { mtu, packetDelay } = this.config;

    this.debugLog(`Sending ${data.length} bytes in chunks of ${mtu}`);

    for (let i = 0; i < data.length; i += mtu) {
      const chunk = data.slice(i, Math.min(i + mtu, data.length));
      await this.writeCharacteristic.writeValue(chunk);
      if (i + mtu < data.length) {
        await new Promise(r => setTimeout(r, packetDelay));
      }
    }
  }

  /**
   * Register a callback for connection status changes.
   * @returns Unsubscribe function.
   */
  onStatusChange(cb: StatusChangeCallback): () => void {
    this.statusCallbacks.add(cb);
    return () => this.statusCallbacks.delete(cb);
  }

  /**
   * Register a callback for incoming data.
   * @returns Unsubscribe function.
   */
  onDataReceived(cb: DataReceivedCallback): () => void {
    this.dataCallbacks.add(cb);
    return () => this.dataCallbacks.delete(cb);
  }

  /**
   * Register a callback for errors.
   * @returns Unsubscribe function.
   */
  onError(cb: ErrorCallback): () => void {
    this.errorCallbacks.add(cb);
    return () => this.errorCallbacks.delete(cb);
  }

  /**
   * Check if GATT characteristics are available.
   */
  hasCharacteristics(): boolean {
    return !!this.writeCharacteristic && !!this.notifyCharacteristic;
  }

  private async findCharacteristics(server: BluetoothRemoteGATTServer): Promise<void> {
    let foundWrite = false;
    let foundNotify = false;

    try {
      const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb').catch(() => null);
      if (service) {
        this.debugLog('Found service FFE0');
        const writeChar = await service.getCharacteristic('0000ffe2-0000-1000-8000-00805f9b34fb').catch(() => null);
        const notifyChar = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb').catch(() => null);
        if (writeChar) { this.writeCharacteristic = writeChar; foundWrite = true; this.debugLog('Found write char FFE2'); }
        if (notifyChar) { this.notifyCharacteristic = notifyChar; foundNotify = true; this.debugLog('Found notify char FFE1'); }
      } else {
        this.debugLog('Service FFE0 not found');
      }
    } catch (e) {
      this.debugLog('Error accessing FFE0 service:', e);
    }

    const commonServices = [
      'ffffff00-0000-1000-8000-00805f9b34fb',
      '0000ff00-0000-1000-8000-00805f9b34fb',
      '0000180a-0000-1000-8000-00805f9b34fb',
    ];
    const knownChars = [
      '0000ffe2-0000-1000-8000-00805f9b34fb',
      '0000ff02-0000-1000-8000-00805f9b34fb',
      '0000ffe1-0000-1000-8000-00805f9b34fb',
      '0000ff01-0000-1000-8000-00805f9b34fb',
    ];

    for (const svcUUID of commonServices) {
      try {
        const service = await server.getPrimaryService(svcUUID);
        this.debugLog(`Trying service: ${svcUUID}`);
        for (const charUUID of knownChars) {
          try {
            const char = await service.getCharacteristic(charUUID);
            if (!foundWrite && (charUUID.includes('ffe2') || charUUID.includes('ff02'))) {
              this.writeCharacteristic = char;
              foundWrite = true;
              this.debugLog(`Found write characteristic: ${charUUID}`);
            }
            if (!foundNotify && (charUUID.includes('ffe1') || charUUID.includes('ff01'))) {
              this.notifyCharacteristic = char;
              foundNotify = true;
              this.debugLog(`Found notify characteristic: ${charUUID}`);
            }
          } catch { /* ignore */ }
        }
        if (foundWrite && foundNotify) break;
      } catch { /* ignore */ }
    }
  }

  private handleDataReceived = (event: Event): void => {
    const char = (event.target as unknown) as BluetoothRemoteGATTCharacteristic;
    if (!char?.value) return;
    const data = new Uint8Array(char.value.buffer);
    const hexStr = Array.from(data).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ');
    this.debugLog(`Received ${data.length} bytes`, hexStr);
    this.dataCallbacks.forEach(cb => cb(data));
  };

  private handleDisconnected = (): void => {
    this.cleanup();
    this.setStatus('disconnected');
  };

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusCallbacks.forEach(cb => cb(status));
  }

  private emitError(error: Error): void {
    this.errorCallbacks.forEach(cb => cb(error));
  }

  private cleanup(): void {
    this.notifyCharacteristic?.removeEventListener('characteristicvaluechanged', this.handleDataReceivedBound);
    this.device?.removeEventListener('gattserverdisconnected', this.handleDisconnectedBound);
    this.device = null;
    this.writeCharacteristic = null;
    this.notifyCharacteristic = null;
    this.setStatus('disconnected');
  }
}
