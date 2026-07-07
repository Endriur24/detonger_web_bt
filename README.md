> [!IMPORTANT]
> This is NOT an official DothanTech library. I am not affiliated with DothanTech in any way and take no responsibility for the use of this library.

# DETONGER WEB BT

[![npm version](https://img.shields.io/npm/v/detonger-web-bt)](https://www.npmjs.com/package/detonger-web-bt)
[![license](https://img.shields.io/npm/l/detonger-web-bt)](https://github.com/Endriur24/detonger_web_bt/blob/main/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/detonger-web-bt)](https://bundlephobia.com/package/detonger-web-bt)

JavaScript/TypeScript library for DothanTech/LPAPI-BLE thermal printers via Web Bluetooth API, with optional React integration.

## Live Demo

[Live Demo](https://detonger-web-bt-example.pages.dev)

## Tested with

- DP30S

## Installation

```bash
npm install detonger-web-bt
```

React 18+ is optional — required only when using the React integration (`detonger-web-bt/react`). The core library works without React.

---

## Quick Start (Core)

```typescript
import { DothanTechPrinter } from 'detonger-web-bt';

const printer = new DothanTechPrinter({ namePrefix: "DP30S-", paperWidth: 56 });

await printer.connect();
await printer.printText('Hello World!', { fontSize: 24, textAlign: 'center' });
await printer.feedLines(3);
await printer.disconnect();
```

See the [vanilla JS integration docs](https://github.com/Endriur24/detonger_web_bt/blob/main/vanilla/README.md) and the [HTML demo](https://github.com/Endriur24/detonger_web_bt/tree/main/examples/html-demo) for a full working example with no build step.

## Quick Start (React)

```tsx
import { PrinterProvider, usePrinter, usePrinterConnection } from 'detonger-web-bt/react';

function App() {
  return (
    <PrinterProvider config={{ namePrefix: "DP30S-", paperWidth: 56 }}>
      <PrintButton />
    </PrinterProvider>
  );
}

function PrintButton() {
  const { printText, isConnected } = usePrinter();
  const { connect, isConnecting } = usePrinterConnection();

  if (!isConnected) {
    return (
      <button onClick={connect} disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Connect'}
      </button>
    );
  }

  return <button onClick={() => printText('Hello World!')}>Print</button>;
}
```

---

## API Reference

### `new DothanTechPrinter(config?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `namePrefix` | `string` | `'DP'` | Device name prefix for Bluetooth filtering |
| `paperWidth` | `number` | `56` | Paper width in mm (fallback for `maxWidth`) |
| `mtu` | `number` | `512` | Max packet MTU size |
| `packetDelay` | `number` | `10` | Delay between packets (ms) |
| `debug` | `boolean` | `false` | Enable verbose console logging |

### Connection

| Signature | Description |
|-----------|-------------|
| `connect(): Promise<void>` | Connect to printer via Bluetooth |
| `disconnect(): Promise<void>` | Disconnect from printer |
| `isConnected(): boolean` | `true` if connected or printing |
| `getStatus(): ConnectionStatus` | Current connection status |
| `getDeviceName(): string \| null` | Connected device name or `null` |

### Printing

| Signature | Description |
|-----------|-------------|
| `printText(text, options?): Promise<PrintStats>` | Print text with formatting |
| `printImage(imageUrl, options?): Promise<PrintStats>` | Print image from URL |
| `printCanvas(canvas, options?): Promise<PrintStats>` | Print a canvas element |
| `printImageData(imageData, options?): Promise<PrintStats>` | Print raw `ImageData` |
| `feedLines(n): Promise<void>` | Feed N blank lines (0–255) |

### Printer Status

| Signature | Description |
|-----------|-------------|
| `refreshPrinterStatus(options?): Promise<void>` | Query printer params. `{ minimal: true }` for faster UI-only refresh |
| `getPrinterStatus(): PrinterStatus` | Latest printer status (DPI, paper width, density, etc.) |
| `getPrintingStats(): PrinterPrintStats` | Cumulative print statistics |
| `getPaperWidth(): number` | Current paper width in mm |
| `setPaperWidth(width): void` | Set paper width in mm (≥ 1) |

### Event Callbacks

| Signature | Description |
|-----------|-------------|
| `onStatusChange(cb): () => void` | Called on connection status change. Returns unsubscribe fn |
| `onDataReceived(cb): () => void` | Called on incoming data. Returns unsubscribe fn |
| `onError(cb): () => void` | Called on error. Returns unsubscribe fn |

---

## Types

### `TextPrintOptions`

| Option | Type | Description |
|--------|------|-------------|
| `fontSize` | `number` | Font size in pixels |
| `fontFamily` | `string` | Font family name |
| `fontWeight` | `'normal' \| 'bold'` | Font weight |
| `fontStyle` | `'normal' \| 'italic'` | Font style |
| `textAlign` | `'left' \| 'center' \| 'right'` | Text alignment |
| `lineHeight` | `number` | Line spacing multiplier |
| `padding` | `[number, number, number, number]` | Margins [top, right, bottom, left] in mm |
| `maxWidth` | `number` | Max width in mm |
| `autoScale` | `boolean` | Auto-scale to fit max width |
| `minScale` | `number` | Minimum scale factor (e.g. `0.3` = 30%) |
| `autoWrap` | `boolean` | Auto line wrapping |

### `ImagePrintOptions`

| Option | Type | Description |
|--------|------|-------------|
| `threshold` | `number` | Binarization threshold 0–255 |
| `invertColors` | `boolean` | Invert colors |
| `scale` | `number` | Scale factor |
| `autoCrop` | `boolean` | Auto-crop white margins |
| `maxWidth` | `number` | Max width in mm |
| `ditherMethod` | `'atkinson' \| 'threshold' \| 'none'` | Dithering algorithm |

### `PrintStats`

Returned by all print methods.

| Property | Type | Description |
|----------|------|-------------|
| `totalBytes` | `number` | Total bytes sent |
| `bitmapLines` | `number` | Number of bitmap lines |
| `commandsCount` | `number` | Number of print commands |
| `compressionRatio` | `number` | Compression ratio (%) |
| `conversionTime` | `number` | Image conversion time (ms) |
| `transmissionTime` | `number` | Transmission time (ms) |
| `transmissionSpeed` | `number` | Transmission speed (KB/s) |

### `PrinterStatus`

Returned by `getPrinterStatus()`.

| Property | Type | Description |
|----------|------|-------------|
| `deviceName` | `string` | Device name |
| `deviceVersion` | `string` | Hardware version |
| `softwareVersion` | `string` | Software version |
| `manufacturer` | `string` | Manufacturer |
| `printerDPI` | `number` | DPI |
| `printerWidth` | `number` | Width in pixels |
| `paperWidthMm` | `number` | Paper width in mm |
| `currentDensity` | `number` | Print density |
| `currentDensityLevel` | `number` | Density level |
| `currentSpeed` | `number` | Print speed |
| `currentSpeedLevel` | `number` | Speed level |
| `currentPaperType` | `PaperType` | Current paper type |
| `deviceType` | `number` | Device type identifier |
| `seriesName` | `string` | Printer series name |
| `devIntName` | `string` | Internal device name |
| `printerStatus` | `number` | Printer status code |
| `printerLocateArea` | `number` | Printer locate area |
| `darknessCount` | `number` | Darkness count |
| `speedCount` | `number` | Speed count |

### `PrinterPrintStats`

Returned by `getPrintingStats()`.

| Property | Type | Description |
|----------|------|-------------|
| `workLines` | `number` | Total work lines |
| `printLines` | `number` | Total printed lines |
| `nullLines` | `number` | Blank lines |
| `printPages` | `number` | Total printed pages |

### `PaperType`

| Constant | Description |
|----------|-------------|
| `PaperType.Ticket` | Receipt paper |
| `PaperType.Adhesive` | Sticker/label paper |
| `PaperType.CardPaper` | Cardboard paper |
| `PaperType.Transparent` | Transparent film |

### `ConnectionStatus`

`'disconnected' | 'connecting' | 'connected' | 'printing' | 'error'`

### Callback Types

| Type | Signature |
|------|-----------|
| `StatusChangeCallback` | `(status: ConnectionStatus) => void` |
| `DataReceivedCallback` | `(data: Uint8Array) => void` |
| `ErrorCallback` | `(error: Error) => void` |

---

## React API

### `<PrinterProvider>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `PrinterConfig` | `{}` | Printer configuration |
| `autoConnect` | `boolean` | `false` | Auto-connect on mount |
| `autoDisconnectOnUnmount` | `boolean` | `true` | Auto-disconnect on unmount |
| `onConnected` | `() => void` | — | Called on successful connection |
| `onDisconnected` | `() => void` | — | Called on disconnection |
| `onError` | `(error: Error) => void` | — | Called on error |

### `usePrinter()`

Core access to the printer. Must be inside `<PrinterProvider>`.

```typescript
const {
  printer,           // DothanTechPrinter instance
  isConnected,       // boolean
  connectionStatus,  // ConnectionStatus
  deviceName,        // string | null
  printerStatus,     // PrinterStatus | null
  printerStats,      // PrinterPrintStats | null
  connect,           // () => Promise<void>
  disconnect,        // () => Promise<void>
  refreshStatus,     // (options?: { full?: boolean }) => Promise<void>
  printText,         // (text, options?) => Promise<PrintStats>
  printImage,        // (imageUrl, options?) => Promise<PrintStats>
  printCanvas,       // (canvas, options?) => Promise<PrintStats>
  printImageData,    // (imageData, options?) => Promise<PrintStats>
  feedLines,         // (n) => Promise<void>
  onError,           // (cb) => () => void
  onStatusChange,    // (cb) => () => void
} = usePrinter();
```

### `usePrinterConnection()`

Connection management with loading and error states.

```typescript
const {
  connect,           // () => Promise<void>
  disconnect,        // () => Promise<void>
  isConnected,       // boolean
  isConnecting,      // boolean
  isDisconnecting,   // boolean
  connectionStatus,  // ConnectionStatus
  error,             // Error | null
  clearError,        // () => void
} = usePrinterConnection();
```

### `usePrinterStatus(options?)`

Status monitoring with optional polling.

```typescript
const {
  status,    // PrinterStatus | null
  stats,     // PrinterPrintStats | null
  isLoading, // boolean
  refresh,   // (full?: boolean) => Promise<void>
} = usePrinterStatus({
  refetchInterval: 5000, // polling interval in ms, or false to disable
  enabled: true,
});
```

---

## Troubleshooting

- **Won't connect**: Requires Chrome or Edge (Web Bluetooth API). Printer must be on and in pairing mode.
- **HTTPS required**: Web Bluetooth requires a secure context. Use `https://` or `localhost` — it won't work on `http://192.168.x.x` or other non-localhost HTTP origins.
- **"usePrinter must be used within a PrinterProvider"**: Hook must be inside `<PrinterProvider>`.
- **Printing fails**: Check `isConnected` is `true`. Enable `debug: true` in config for console logs.

## Browser Support

Web Bluetooth API is supported in:
- **Desktop**: Chrome, Edge, Opera
- **Android**: Chrome, Edge, Opera
- **Not supported**: Firefox, Safari, iOS (all browsers)

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Watch mode for development
npm run watch

# Run examples
cd examples/html-demo && npx serve
cd examples/vite-react-demo && npm install && npm run dev
```

## License

MIT
