import { usePrinter } from './usePrinter';
export interface UsePrinterStatusOptions {
    refetchInterval?: number | false;
    enabled?: boolean;
}
export interface UsePrinterStatusReturn {
    status: ReturnType<typeof usePrinter>['printerStatus'];
    stats: ReturnType<typeof usePrinter>['printerStats'];
    isLoading: boolean;
    refresh: (full?: boolean) => Promise<void>;
}
/**
 * Hook for monitoring printer status with optional polling.
 */
export declare function usePrinterStatus(options?: UsePrinterStatusOptions): UsePrinterStatusReturn;
