export { PrinterProvider, PrinterContext } from './PrinterProvider';
export { usePrinter } from './usePrinter';
export { usePrinterStatus } from './usePrinterStatus';
export { usePrinterConnection } from './usePrinterConnection';
export type {
  PrinterContextValue,
  PrinterProviderProps,
} from './types';
export type { UsePrinterConnectionReturn } from './usePrinterConnection';
export type { UsePrinterStatusOptions, UsePrinterStatusReturn } from './usePrinterStatus';

export {
  PaperType,
  PaperTypeNames,
  ConnectionStatus,
} from 'detonger-web-bt';

export type {
  PrinterConfig,
  TextPrintOptions,
  ImagePrintOptions,
  PrintStats,
  PrinterStatus,
  PrinterPrintStats,
  ErrorCallback,
  StatusChangeCallback,
} from '../index';
