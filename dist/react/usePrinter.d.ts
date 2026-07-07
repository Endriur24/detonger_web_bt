import type { PrinterContextValue } from './types';
/**
 * Access the printer context. Must be used within a PrinterProvider.
 * @throws Error if used outside of PrinterProvider.
 */
export declare function usePrinter(): PrinterContextValue;
