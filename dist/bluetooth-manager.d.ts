/**
 * DothanTech Printer Library - Bluetooth Manager
 *
 * Manages Bluetooth Low Energy connections to DothanTech printers.
 */
import type { PrinterConfig, DataReceivedCallback, ErrorCallback, StatusChangeCallback } from './types';
import { ConnectionStatus } from './types';
export declare class BluetoothManager {
    private config;
    private debugLog;
    private device;
    private writeCharacteristic;
    private notifyCharacteristic;
    private status;
    private statusCallbacks;
    private dataCallbacks;
    private errorCallbacks;
    private handleDataReceivedBound;
    private handleDisconnectedBound;
    constructor(config: Required<PrinterConfig>);
    /**
     * Connect to a printer via Bluetooth.
     * @throws Error if connection fails or required characteristics are not found.
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the printer.
     */
    disconnect(): Promise<void>;
    /**
     * Check if the printer is connected.
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
     * Send data to the printer in MTU-sized chunks.
     * @param data - The data to send.
     */
    sendData(data: Uint8Array): Promise<void>;
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
    /**
     * Check if GATT characteristics are available.
     */
    hasCharacteristics(): boolean;
    private findCharacteristics;
    private handleDataReceived;
    private handleDisconnected;
    private setStatus;
    private emitError;
    private cleanup;
}
