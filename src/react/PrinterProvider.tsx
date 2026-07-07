import { createContext, useRef, useState, useEffect, useMemo, useCallback } from 'react';
import type { PrinterContextValue, PrinterProviderProps } from './types';
import { DothanTechPrinter } from '../index';
import type { ConnectionStatus } from '../index';

export const PrinterContext = createContext<PrinterContextValue | null>(null);

/**
 * React context provider for the DothanTech printer.
 * Manages a single printer instance and exposes connection/printing methods via context.
 */
export function PrinterProvider({
  children,
  config,
  autoConnect = false,
  autoDisconnectOnUnmount = true,
  onConnected,
  onDisconnected,
  onError: onErrorProp,
}: PrinterProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [printerStatus, setPrinterStatus] = useState<PrinterContextValue['printerStatus']>(null);
  const [printerStats, setPrinterStats] = useState<PrinterContextValue['printerStats']>(null);

  const printerRef = useRef<DothanTechPrinter | null>(null);
  if (!printerRef.current) {
    printerRef.current = new DothanTechPrinter(config);
  }
  const printer = printerRef.current;

  useEffect(() => {
    const unsubStatus = printer.onStatusChange((status) => {
      setConnectionStatus(status);
      const connected = status === 'connected' || status === 'printing';
      setIsConnected(connected);
      setDeviceName(connected ? printer.getDeviceName() : null);
      if (connected) {
        setPrinterStatus(printer.getPrinterStatus());
        setPrinterStats(printer.getPrintingStats());
        onConnected?.();
      } else if (status === 'disconnected') {
        setPrinterStatus(null);
        setPrinterStats(null);
        onDisconnected?.();
      }
    });

    const unsubError = printer.onError((error) => {
      onErrorProp?.(error);
    });

    return () => {
      unsubStatus();
      unsubError();
      if (autoDisconnectOnUnmount) {
        printer.disconnect().catch(() => {});
      }
    };
  }, [printer, autoDisconnectOnUnmount, onConnected, onDisconnected, onErrorProp]);

  useEffect(() => {
    if (autoConnect && !isConnected) {
      printer.connect().catch(() => {});
    }
  }, [autoConnect, isConnected, printer]);

  const connect = useCallback(async () => {
    await printer.connect();
  }, [printer]);

  const disconnect = useCallback(async () => {
    await printer.disconnect();
  }, [printer]);

  const refreshStatus = useCallback(async (options?: { full?: boolean }) => {
    await printer.refreshPrinterStatus({ minimal: !options?.full });
    setPrinterStatus(printer.getPrinterStatus());
    setPrinterStats(printer.getPrintingStats());
  }, [printer]);

  const printText = useCallback(async (text: string, options?: Parameters<PrinterContextValue['printText']>[1]) => {
    return printer.printText(text, options);
  }, [printer]);

  const printImage = useCallback(async (imageUrl: string, options?: Parameters<PrinterContextValue['printImage']>[1]) => {
    return printer.printImage(imageUrl, options);
  }, [printer]);

  const printCanvas = useCallback(async (canvas: HTMLCanvasElement, options?: Parameters<PrinterContextValue['printCanvas']>[1]) => {
    return printer.printCanvas(canvas, options);
  }, [printer]);

  const printImageData = useCallback(async (imageData: ImageData, options?: Parameters<PrinterContextValue['printImageData']>[1]) => {
    return printer.printImageData(imageData, options);
  }, [printer]);

  const feedLines = useCallback(async (n: number) => {
    return printer.feedLines(n);
  }, [printer]);

  const contextValue = useMemo<PrinterContextValue>(() => ({
    printer,
    isConnected,
    connectionStatus,
    deviceName,
    printerStatus,
    printerStats,
    isStatusLoading: false,
    connect,
    disconnect,
    refreshStatus,
    printText,
    printImage,
    printCanvas,
    printImageData,
    feedLines,
    onError: (cb) => printer.onError(cb),
    onStatusChange: (cb) => printer.onStatusChange(cb),
  }), [
    printer,
    isConnected,
    connectionStatus,
    deviceName,
    printerStatus,
    printerStats,
    connect,
    disconnect,
    refreshStatus,
    printText,
    printImage,
    printCanvas,
    printImageData,
    feedLines,
  ]);

  return (
    <PrinterContext.Provider value={contextValue}>
      {children}
    </PrinterContext.Provider>
  );
}
