/**
 * DothanTech Printer Library - Protocol Helpers
 */
/**
 * Calculate checksum per DothanTech protocol: bitwise NOT of byte sum, excluding the start byte.
 */
export declare function calculateChecksum(packet: number[]): number;
/**
 * Variable-length encoding for DothanTech protocol:
 * - value < 192 → 1 byte
 * - value >= 192 → 2 bytes (MSB | 0xC0, LSB)
 */
export declare function encodeShort(value: number): number[];
/**
 * Build a DothanTech protocol command packet.
 * Format: [START_BYTE, cmd, <encoded length>, ...data, checksum]
 */
export declare function buildCommand(cmd: number, ...data: number[]): Uint8Array;
/**
 * Create a conditional debug logger.
 */
export declare function createDebugLogger(debug: boolean): (msg: string, ...args: unknown[]) => void;
