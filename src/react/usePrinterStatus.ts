import { useRef, useEffect, useCallback, useState } from 'react';
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
export function usePrinterStatus(options?: UsePrinterStatusOptions): UsePrinterStatusReturn {
  const { isConnected, printerStatus, printerStats, refreshStatus } = usePrinter();
  const [isLoading, setIsLoading] = useState(false);
  const isRefreshingRef = useRef(false);
  const intervalIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabled = isConnected && (options?.enabled ?? true);

  const refresh = useCallback(async (full?: boolean) => {
    if (!enabled || isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsLoading(true);
    try {
      await refreshStatus({ full });
    } finally {
      isRefreshingRef.current = false;
      setIsLoading(false);
    }
  }, [enabled, refreshStatus]);

  useEffect(() => {
    const interval = options?.refetchInterval;
    if (typeof interval === 'number' && enabled) {
      const tick = async () => {
        if (!isRefreshingRef.current) {
          await refresh();
        }
        intervalIdRef.current = setTimeout(tick, interval);
      };
      intervalIdRef.current = setTimeout(tick, interval);
      return () => {
        if (intervalIdRef.current) {
          clearTimeout(intervalIdRef.current);
        }
      };
    }
    return;
  }, [enabled, options?.refetchInterval, refresh]);

  return {
    status: printerStatus,
    stats: printerStats,
    isLoading,
    refresh,
  };
}

/**
 * Alias for usePrinterStatus - compatible with TanStack Query naming convention.
 */
export function usePrinterStatusQuery(options?: UsePrinterStatusOptions) {
  return usePrinterStatus(options);
}
