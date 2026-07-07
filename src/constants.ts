/**
 * DothanTech Printer Library - Constants
 */

import { PaperType } from './types';

export const START_BYTE = 0x1F;

export const CMD_FEED_LINES = 0x4A;

export const CMD_PAPER_TYPE    = 0x42;
export const CMD_DENSITY       = 0x43;
export const CMD_SPEED         = 0x44;
export const CMD_GAP_SPACING   = 0x45;
export const CMD_MOTOR_MODE    = 0x47;
export const CMD_AUTO_POWEROFF = 0x48;

export const CMD_QUERY_STATUS   = 0x70;
export const CMD_QUERY_DPI      = 0x71;
export const CMD_QUERY_WIDTH    = 0x72;
export const CMD_QUERY_STATS    = 0x73;
export const CMD_MANUFACTURER   = 0x75;
export const CMD_DEVICE_NAME    = 0x79;
export const CMD_DEVICE_VERSION = 0x7A;
export const CMD_SW_VERSION     = 0x7C;

export const CMD_PRINT_INIT  = 0x20;
export const CMD_PRINT_LINE  = 0x21;
export const CMD_LINE_WIDTH  = 0x27;
export const CMD_PRINT_END   = 0x28;

export const PaperTypeNames: Record<PaperType, string> = {
  [PaperType.Ticket]:      'Ticket',
  [PaperType.Adhesive]:    'Adhesive',
  [PaperType.CardPaper]:   'Card Paper',
  [PaperType.Transparent]: 'Transparent',
};

export const DEFAULT_CONFIG = {
  serviceUUID: '0000ff00-0000-1000-8000-00805f9b34fb',
  writeUUID:   '0000ff02-0000-1000-8000-00805f9b34fb',
  notifyUUID:  '0000ff01-0000-1000-8000-00805f9b34fb',
  namePrefix:  'DP',
  mtu:         512,
  packetDelay: 10,
  debug:       false,
  paperWidth:  56,
} as const;

export const OPTIONAL_SERVICES = [
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000180a-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e45a',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
];
