/**
 * DothanTech Printer Library - Response Parser
 *
 * Parses printer response packets and updates status/stats objects.
 */

import type { PrinterStatus, PrinterPrintStats, PaperType } from './types';
import { PaperTypeNames, START_BYTE } from './constants';

/**
 * Parse a printer response packet.
 * Supports both USB-style packets (with 0x1F header) and BLE-style packets (raw payload).
 */
export function parseStatusResponse(
  data: Uint8Array,
  printerStatus: PrinterStatus,
  printingStats: PrinterPrintStats,
  debugLog: (msg: string, ...args: unknown[]) => void
): void {
  if (data.length < 3) return;

  if (data[0] !== START_BYTE) {
    debugLog('Received BLE-style packet (no header)');
    return;
  }

  const cmd = data[1];
  const lengthByte1 = data[2];

  let dataOffset: number;
  let payloadLen: number;
  if ((lengthByte1 & 0xC0) === 0xC0) {
    const lengthByte2 = data[3];
    payloadLen = ((lengthByte1 & 0x3F) << 8) | lengthByte2;
    dataOffset = 4;
    debugLog(`2-byte length field: 0x${lengthByte1.toString(16).padStart(2,'0')} 0x${lengthByte2.toString(16).padStart(2,'0')} = ${payloadLen}`);
  } else {
    payloadLen = lengthByte1 & 0xFF;
    dataOffset = 3;
    debugLog(`1-byte length field: 0x${lengthByte1.toString(16).padStart(2,'0')} = ${payloadLen}`);
  }

  debugLog(`Parse CMD=0x${cmd.toString(16)} payloadLen=${payloadLen} dataOffset=${dataOffset} totalLen=${data.length}`);

  if (data.length < dataOffset + payloadLen) {
    debugLog('Incomplete packet, skipping');
    return;
  }

  if (cmd === 0x71) {
    const payloadBytes = Array.from(data.slice(dataOffset, dataOffset + payloadLen));
    const hexBytes = payloadBytes.map(b => `0x${b.toString(16).padStart(2,'0')}`).join(' ');
    debugLog(`DPI raw payload: ${hexBytes}`);
  }

  const p = data;

  switch (cmd) {
    case 0x79: {
      const end = p.indexOf(0x00, dataOffset);
      const bytes = p.slice(dataOffset, end < 0 ? undefined : end);
      printerStatus.deviceName = new TextDecoder('ascii').decode(bytes);
      debugLog('Device name:', printerStatus.deviceName);
      break;
    }

    case 0x7C: {
      const end = p.indexOf(0x00, dataOffset);
      const bytes = p.slice(dataOffset, end < 0 ? undefined : end);
      printerStatus.softwareVersion = new TextDecoder('ascii').decode(bytes);
      debugLog('Software version:', printerStatus.softwareVersion);
      break;
    }

    case 0x75: {
      const end = p.indexOf(0x00, dataOffset);
      const bytes = p.slice(dataOffset, end < 0 ? undefined : end);
      try {
        printerStatus.manufacturer = new TextDecoder('gbk').decode(bytes);
      } catch {
        printerStatus.manufacturer = new TextDecoder('ascii').decode(bytes);
      }
      debugLog('Manufacturer:', printerStatus.manufacturer);
      break;
    }

    case 0x70: {
      if (p.length > dataOffset) {
        printerStatus.printerStatus = p[dataOffset] & 0xFF;
        debugLog('Printer status:', printerStatus.printerStatus);

        if (payloadLen >= 5) {
          const pageKey = ((p[dataOffset + 1] & 0xFF) << 8) | (p[dataOffset + 2] & 0xFF);
          debugLog('Status pageKey:', pageKey);
        }

        if (payloadLen > 1) {
          const statusBytes = Array.from(p.slice(dataOffset, dataOffset + payloadLen));
          const hexBytes = statusBytes.map(b => `0x${b.toString(16).padStart(2,'0')}`).join(' ');
          debugLog('Full status payload:', hexBytes);
        }
      }
      break;
    }

    case 0x71: {
      if (p.length >= dataOffset + 1) {
        if (payloadLen === 1) {
          printerStatus.printerDPI = p[dataOffset] & 0xFF;
          debugLog('DPI:', printerStatus.printerDPI, '(1 byte)');
        } else if (payloadLen === 2) {
          const msb = p[dataOffset] & 0xFF;
          const lsb = p[dataOffset + 1] & 0xFF;
          printerStatus.printerDPI = (msb << 8) | lsb;
          debugLog('DPI:', printerStatus.printerDPI, '(2 bytes)');
        } else {
          debugLog(`Warning: Unexpected DPI payload length: ${payloadLen}`);
        }

        if (printerStatus.printerDPI && (printerStatus.printerDPI < 96 || printerStatus.printerDPI > 600)) {
          debugLog(`Warning: Unusual DPI value ${printerStatus.printerDPI}`);
        }
      } else {
        debugLog('Insufficient bytes for DPI parsing');
      }
      break;
    }

    case 0x7A: {
      const end = p.indexOf(0x00, dataOffset);
      const bytes = p.slice(dataOffset, end < 0 ? undefined : end);
      printerStatus.deviceVersion = new TextDecoder('ascii').decode(bytes);
      debugLog('Device version:', printerStatus.deviceVersion);
      break;
    }

    case 0x72: {
      if (p.length >= dataOffset + 4) {
        printerStatus.printerWidth = ((p[dataOffset] & 0xFF) << 8) | (p[dataOffset + 1] & 0xFF);
        const rawPaper = ((p[dataOffset + 2] & 0xFF) << 8) | (p[dataOffset + 3] & 0xFF);
        printerStatus.paperWidthMm = rawPaper / 10;
        if (payloadLen >= 5) {
          printerStatus.printerLocateArea = p[dataOffset + 4] & 0xFF;
          debugLog(`Width: ${printerStatus.printerWidth}px, paper: ${printerStatus.paperWidthMm}mm, locateArea: ${printerStatus.printerLocateArea}`);
        } else {
          debugLog(`Width: ${printerStatus.printerWidth}px, paper: ${printerStatus.paperWidthMm}mm`);
        }
        if (payloadLen > 4) {
          const widthBytes = Array.from(p.slice(dataOffset, dataOffset + payloadLen));
          const hexBytes = widthBytes.map(b => `0x${b.toString(16).padStart(2,'0')}`).join(' ');
          debugLog('Full width payload:', hexBytes);
        }
      }
      break;
    }

    case 0x73: {
      if (p.length >= dataOffset + 16) {
        const v = new DataView(p.buffer, p.byteOffset + dataOffset);
        printingStats.workLines  = v.getUint32(0);
        printingStats.printLines = v.getUint32(4);
        printingStats.nullLines  = v.getUint32(8);
        printingStats.printPages = v.getUint32(12);
        debugLog('Print stats:', printingStats);
      }
      break;
    }

    case 0x43: {
      const val = p[dataOffset] & 0xFF;
      printerStatus.currentDensity = val;
      if (payloadLen >= 2) {
        printerStatus.currentDensityLevel = p[dataOffset + 1] & 0xFF;
        printerStatus.darknessCount = printerStatus.currentDensityLevel;
        debugLog('Density:', val, 'level:', printerStatus.currentDensityLevel);
      } else {
        debugLog('Density:', val);
      }
      break;
    }

    case 0x44: {
      const val = p[dataOffset] & 0xFF;
      printerStatus.currentSpeed = val;
      if (payloadLen >= 2) {
        printerStatus.currentSpeedLevel = p[dataOffset + 1] & 0xFF;
        printerStatus.speedCount = printerStatus.currentSpeedLevel;
        debugLog('Speed:', val, 'level:', printerStatus.currentSpeedLevel);
      } else {
        debugLog('Speed:', val);
      }
      break;
    }

    case 0x42: {
      const val = p[dataOffset] & 0xFF;
      printerStatus.currentPaperType = val as PaperType;
      const paperTypeName = PaperTypeNames[val as PaperType] ?? 'Unknown';
      debugLog('Paper type:', val, paperTypeName);
      break;
    }

    case 0x45: {
      if (p.length > dataOffset) {
        let spacing: number;
        if ((p[dataOffset] & 0xC0) === 0xC0) {
          spacing = ((p[dataOffset] & 0x3F) << 8) | p[dataOffset + 1];
        } else {
          spacing = p[dataOffset];
        }
        debugLog('Gap spacing:', spacing, '(0.01mm)');
      }
      break;
    }

    case 0x47: {
      const val = p[dataOffset] & 0xFF;
      debugLog('Motor mode:', val);
      break;
    }

    case 0x48: {
      if (payloadLen === 1) {
        const val = p[dataOffset] & 0xFF;
        debugLog('Auto power off:', val, 'min');
      } else if (payloadLen === 2 && p.length >= dataOffset + 2) {
        const val = ((p[dataOffset] & 0xFF) << 8) | (p[dataOffset + 1] & 0xFF);
        debugLog('Auto power off:', val, 'min');
      }
      break;
    }

    case 0x66: {
      if (p.length > dataOffset) {
        const val = p[dataOffset] & 0xFF;
        debugLog('Gap type:', val);
      }
      break;
    }

    default:
      debugLog(`Unhandled CMD: 0x${cmd.toString(16)}`);
  }
}
