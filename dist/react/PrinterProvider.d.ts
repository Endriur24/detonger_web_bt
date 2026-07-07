import type { PrinterContextValue, PrinterProviderProps } from './types';
export declare const PrinterContext: import("react").Context<PrinterContextValue | null>;
/**
 * React context provider for the DothanTech printer.
 * Manages a single printer instance and exposes connection/printing methods via context.
 */
export declare function PrinterProvider({ children, config, autoConnect, autoDisconnectOnUnmount, onConnected, onDisconnected, onError: onErrorProp, }: PrinterProviderProps): import("react/jsx-runtime").JSX.Element;
