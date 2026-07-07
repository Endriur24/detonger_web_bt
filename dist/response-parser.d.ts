/**
 * DothanTech Printer Library - Response Parser
 *
 * Parses printer response packets and updates status/stats objects.
 */
import type { PrinterStatus, PrinterPrintStats } from './types';
/**
 * Parse a printer response packet.
 * Supports both USB-style packets (with 0x1F header) and BLE-style packets (raw payload).
 */
export declare function parseStatusResponse(data: Uint8Array, printerStatus: PrinterStatus, printingStats: PrinterPrintStats, debugLog: (msg: string, ...args: unknown[]) => void): void;
