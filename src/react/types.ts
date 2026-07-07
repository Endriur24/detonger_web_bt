import type { ReactNode } from 'react';
import type {
  DothanTechPrinter,
  PrinterConfig,
  TextPrintOptions,
  ImagePrintOptions,
  PrintStats,
  PrinterStatus,
  PrinterPrintStats,
  ConnectionStatus,
  ErrorCallback,
  StatusChangeCallback,
} from '../index';

/**
 * The value exposed by PrinterContext.
 */
export interface PrinterContextValue {
  printer: DothanTechPrinter;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  deviceName: string | null;
  printerStatus: PrinterStatus | null;
  printerStats: PrinterPrintStats | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshStatus: (options?: { full?: boolean }) => Promise<void>;
  printText: (text: string, options?: TextPrintOptions) => Promise<PrintStats>;
  printImage: (imageUrl: string, options?: ImagePrintOptions) => Promise<PrintStats>;
  printCanvas: (canvas: HTMLCanvasElement, options?: ImagePrintOptions) => Promise<PrintStats>;
  printImageData: (imageData: ImageData, options?: ImagePrintOptions) => Promise<PrintStats>;
  feedLines: (n: number) => Promise<void>;
  onError: (cb: ErrorCallback) => () => void;
  onStatusChange: (cb: StatusChangeCallback) => () => void;
}

/**
 * Props for the PrinterProvider component.
 */
export interface PrinterProviderProps {
  children: ReactNode;
  config?: PrinterConfig;
  autoConnect?: boolean;
  autoDisconnectOnUnmount?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}
