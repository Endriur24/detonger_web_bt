# DeTonger Web BT - React Demo

React + TypeScript + Vite demo for the `detonger-web-bt` library with Web Bluetooth.

## Quick Start

### Run with HTTPS (required for Web Bluetooth)

```bash
HTTPS=true npm run dev
```

Open: https://localhost:5173

**Note:** HTTP (`npm run dev`) works for UI preview only. Web Bluetooth requires HTTPS.

### Alternative: Use ngrok

```bash
npm run dev
ngrok http 5173
```

## Features

- Connect to DP30S printer via Web Bluetooth
- Print text, images, and canvas
- Adjustable font size and alignment
- Real-time printer status and statistics
- Paper width configuration

## Usage

```tsx
import { usePrinter } from 'detonger-web-bt/react';

function MyComponent() {
  const { connect, printText, isConnected } = usePrinter();

  return (
    <div>
      <button onClick={connect}>Connect</button>
      <button onClick={() => printText('Hello')} disabled={!isConnected}>
        Print
      </button>
    </div>
  );
}
```

## Browser Requirements

- Chrome 56+ / Edge 79+ / Opera 43+ / Samsung Internet 6.4+

## Troubleshooting

**"Navigator.bluetooth is undefined"** - Use HTTPS.

**"No compatible devices found"** - Enable Bluetooth, turn on printer, ensure pairing mode.

## More

- [Main documentation](../README.md)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
