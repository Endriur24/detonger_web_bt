import { useContext } from 'react';
import { PrinterContext } from './PrinterProvider';
import type { PrinterContextValue } from './types';

/**
 * Access the printer context. Must be used within a PrinterProvider.
 * @throws Error if used outside of PrinterProvider.
 */
export function usePrinter(): PrinterContextValue {
  const context = useContext(PrinterContext);
  if (!context) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
}
