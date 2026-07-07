import { useState, useCallback } from 'react';
import { usePrinter } from './usePrinter';
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
export function usePrinterConnection(): UsePrinterConnectionReturn {
  const { connect, disconnect, isConnected, connectionStatus } = usePrinter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await connect();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [connect]);

  const handleDisconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await disconnect();
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnect]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    connect: handleConnect,
    disconnect: handleDisconnect,
    isConnected,
    isConnecting,
    isDisconnecting,
    connectionStatus,
    error,
    clearError,
  };
}
