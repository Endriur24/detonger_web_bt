import type { ConnectionStatus } from '../index';
export interface UsePrinterConnectionReturn {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    isConnected: boolean;
    isConnecting: boolean;
    isDisconnecting: boolean;
    connectionStatus: ConnectionStatus;
    error: Error | null;
    clearError: () => void;
}
/**
 * Helper hook for managing printer connection with loading and error states.
 */
export declare function usePrinterConnection(): UsePrinterConnectionReturn;
