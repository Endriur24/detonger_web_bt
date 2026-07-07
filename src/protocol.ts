/**
 * DothanTech Printer Library - Protocol Helpers
 */

import { START_BYTE } from './constants';

/**
 * Calculate checksum per DothanTech protocol: bitwise NOT of byte sum, excluding the start byte.
 */
export function calculateChecksum(packet: number[]): number {
  let sum = 0;
  for (let i = 1; i < packet.length; i++) sum += packet[i] & 0xFF;
  return (~sum) & 0xFF;
}

/**
 * Variable-length encoding for DothanTech protocol:
 * - value < 192 → 1 byte
 * - value >= 192 → 2 bytes (MSB | 0xC0, LSB)
 */
export function encodeShort(value: number): number[] {
  if (value >= 192) return [(value >>> 8) | 0xC0, value & 0xFF];
  return [value & 0xFF];
}

/**
 * Build a DothanTech protocol command packet.
 * Format: [START_BYTE, cmd, <encoded length>, ...data, checksum]
 */
export function buildCommand(
  cmd: number,
  ...data: number[]
): Uint8Array {
  const lenEncoded = encodeShort(data.length);
  const packet = [START_BYTE, cmd, ...lenEncoded, ...data];
  packet.push(calculateChecksum(packet));
  return new Uint8Array(packet);
}

/**
 * Create a conditional debug logger.
 */
export function createDebugLogger(debug: boolean) {
  return function debugLog(msg: string, ...args: unknown[]): void {
    if (debug) {
      console.log(`[DothanTech] ${msg}`, ...args);
    }
  };
}
