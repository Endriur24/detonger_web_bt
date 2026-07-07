> [!IMPORTANT]
> This is NOT an official DothanTech library. I am not affiliated with DothanTech in any way and take no responsibility for the use of this library.

# DETONGER WEB BT

JavaScript/TypeScript library for DothanTech/LPAPI-BLE thermal printers via Web Bluetooth API, with optional React integration.

## Tested with 

- DP30S

## Installation

```bash
npm install detonger-web-bt
```

React 18+ is optional — required only when using the React integration (`detonger-web-bt/react`). The core library works without React.

## Core API (no React required)

Use the `DothanTechPrinter` class directly in any JavaScript/TypeScript project:

```typescript
import { DothanTechPrinter } from 'detonger-web-bt';

const printer = new DothanTechPrinter({ namePrefix: "DP30S-", paperWidth: 56, debug: false });

await printer.connect();
await printer.printText('Hello World!', { fontSize: 24, textAlign: 'center' });
await printer.feedLines(3);
await printer.disconnect();
```

See the [vanilla JS integration docs](https://github.com/Endriur24/detonger_web_bt/blob/main/vanilla/README.md) and the [HTML demo](https://github.com/Endriur24/detonger_web_bt/tree/main/examples/html-demo) for a full working example with no build step.

## Quick Start (React)

```tsx
import { PrinterProvider, usePrinter, usePrinterConnection } from 'detonger-web-bt/react';

// 1. Wrap your app
function App() {
  return (
    <PrinterProvider config={{ namePrefix: "DP30S-", paperWidth: 56 }}>
      <YourApp />
    </PrinterProvider>
  );
}

// 2. Use in any component
function PrintButton() {
  const { printText, isConnected } = usePrinter();
  const { connect, isConnecting, error } = usePrinterConnection();

  const handlePrint = async () => {
    await printText('Hello World!', { fontSize: 24, textAlign: 'center' });
  };

  if (!isConnected) {
    return (
      <button onClick={connect} disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Connect'}
      </button>
    );
  }

  return <button onClick={handlePrint}>Print</button>;
}
```

## React API

### React Hooks

| Hook | Purpose |
|------|---------|
| `usePrinter()` | Core access: `printer`, `isConnected`, `connectionStatus`, `deviceName`, `printerStatus`, `printerStats`, `connect`, `disconnect`, `refreshStatus`, `printText`, `printImage`, `printCanvas`, `printImageData`, `feedLines`, `onError`, `onStatusChange` |
| `usePrinterConnection()` | Connection UI helper: loading/error states, `connect`, `disconnect`, `clearError` |
| `usePrinterStatus()` | Status polling: `status`, `stats`, `refresh`, optional `refetchInterval` |

### Printing Methods (via React hooks)

```tsx
// Print text
await printText('Hello\nWorld', {
  fontSize: 24,
  textAlign: 'center',    // 'left' | 'center' | 'right'
  fontWeight: 'bold',
  autoWrap: true,
  padding: [4, 4, 4, 4],  // margins in pixels [top, right, bottom, left]
  maxWidth: 56,           // max width in pixels
});

// Print image from URL
await printImage('https://example.com/logo.png', {
  threshold: 192,           // binarization 0-255
  ditherMethod: 'atkinson', // 'atkinson' | 'threshold' | 'none'
  maxWidth: 56,
});

// Print canvas or ImageData
await printCanvas(canvasElement);
await printImageData(imageData);

// Feed paper
await feedLines(5);
```

### Paper Types

```tsx
import { PaperType } from 'detonger-web-bt/react';

PaperType.Ticket      // Receipt
PaperType.Adhesive    // Sticker/Label
PaperType.CardPaper   // Cardboard
PaperType.Transparent // Transparent film
```

### PrinterProvider Props (React only)

| Prop | Type | Default |
|------|------|---------|
| `config` | `PrinterConfig` | `{}` |
| `autoConnect` | `boolean` | `false` |
| `autoDisconnectOnUnmount` | `boolean` | `true` |
| `onConnected` | `() => void` | - |
| `onDisconnected` | `() => void` | - |
| `onError` | `(error: Error) => void` | - |

### PrinterConfig (shared by Core & React)

| Option | Type | Default |
|--------|------|---------|
| `paperWidth` | `number` | `56` (pixels) |
| `debug` | `boolean` | `false` |
| `namePrefix` | `string` | `'DP'` |
| `mtu` | `number` | `512` |
| `packetDelay` | `number` | `10` |

## Troubleshooting

- **Won't connect**: Requires Chrome or Edge (Web Bluetooth API). Printer must be on and in pairing mode.
- **"usePrinter must be used within a PrinterProvider"**: Hook must be inside `<PrinterProvider>`.
- **Printing fails**: Check `isConnected` is true. Enable `debug: true` in config for console logs.

## License

MIT
