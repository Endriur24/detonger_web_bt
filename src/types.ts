/**
 * DothanTech Printer Library - Types & Interfaces
 */

export interface PrinterConfig {
  /** Bluetooth service UUID */
  serviceUUID?: string;
  /** Write characteristic UUID */
  writeUUID?: string;
  /** Notify characteristic UUID */
  notifyUUID?: string;
  /** Device name prefix for filtering */
  namePrefix?: string;
  /** Maximum packet MTU size */
  mtu?: number;
  /** Delay between packets in ms */
  packetDelay?: number;
  /** Debug mode - enables verbose console logging */
  debug?: boolean;
  /** Paper width in mm (fallback for maxWidth in TextPrintOptions and ImagePrintOptions) */
  paperWidth?: number;
}

export interface TextPrintOptions {
  /** Font size in pixels */
  fontSize?: number;
  /** Font family name */
  fontFamily?: string;
  /** Font weight */
  fontWeight?: 'normal' | 'bold';
  /** Font style */
  fontStyle?: 'normal' | 'italic';
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Line spacing multiplier */
  lineHeight?: number;
  /** Margins [top, right, bottom, left] in mm */
  padding?: [number, number, number, number];
  /** Maximum width in mm */
  maxWidth?: number;
  /** Enable automatic scaling to fit max width */
  autoScale?: boolean;
  /** Minimum scale factor (e.g. 0.3 = 30%) */
  minScale?: number;
  /** Enable automatic line wrapping */
  autoWrap?: boolean;
}

export interface ImagePrintOptions {
  /** Binarization threshold 0-255 */
  threshold?: number;
  /** Invert colors */
  invertColors?: boolean;
  /** Image scale factor */
  scale?: number;
  /** Auto-crop white margins */
  autoCrop?: boolean;
  /** Maximum width in mm */
  maxWidth?: number;
  /** Dithering method */
  ditherMethod?: 'atkinson' | 'threshold' | 'none';
}

export const PaperType = {
  Ticket:      0x00,
  Adhesive:    0x02,
  CardPaper:   0x03,
  Transparent: 0x04,
} as const;

export type PaperType = (typeof PaperType)[keyof typeof PaperType];

export interface PrintStats {
  totalBytes: number;
  bitmapLines: number;
  commandsCount: number;
  compressionRatio: number;
  conversionTime: number;
  transmissionTime: number;
  transmissionSpeed: number;
}

export interface PrinterStatus {
  deviceType?: number;
  deviceName?: string;
  deviceVersion?: string;
  softwareVersion?: string;
  manufacturer?: string;
  seriesName?: string;
  devIntName?: string;
  printerStatus?: number;
  printerDPI?: number;
  printerWidth?: number;
  paperWidthMm?: number;
  printerLocateArea?: number;
  currentDensity?: number;
  currentDensityLevel?: number;
  darknessCount?: number;
  currentSpeed?: number;
  currentSpeedLevel?: number;
  speedCount?: number;
  currentPaperType?: PaperType;
}

export interface PrinterPrintStats {
  workLines?: number;
  printLines?: number;
  nullLines?: number;
  printPages?: number;
}

export const ConnectionStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING:   'connecting',
  CONNECTED:    'connected',
  PRINTING:     'printing',
  ERROR:        'error',
} as const;

export type ConnectionStatus = typeof ConnectionStatus[keyof typeof ConnectionStatus];

export type StatusChangeCallback = (status: ConnectionStatus) => void;
export type DataReceivedCallback  = (data: Uint8Array) => void;
export type ErrorCallback         = (error: Error) => void;
