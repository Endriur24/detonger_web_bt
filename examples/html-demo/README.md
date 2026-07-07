# HTML Demo

A simple vanilla JS integration demo for the DothanTech Printer library.

## Quick Start

The demo is fully functional when served over HTTP (Web Bluetooth requires a secure context).

### Option 1: Open directly in browser

```bash
# From the project root
open examples/html-demo/index.html
```

### Option 2: Run a local server

```bash
# From the project root
npx serve examples/html-demo

# or
python3 -m http.server 8000 --directory examples/html-demo
```

Then open: http://localhost:8000 (or the port shown)

## Features

- Connect to a Bluetooth printer
- Print formatted text
- Print images from URL
- Print from HTML5 canvas
- Monitor printer status
- Disconnect

## Configuration

The demo uses the vanilla JS integration from `vanilla/vanilla-bt-printing.js`, imported directly from CDN:

```javascript
import { setupPrinter } from 'https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.js';
```

Styling comes from [Pico.css](https://picocss.com/docs) (CDN). UI states managed by the helper (`.status`, `.printer-info` classes) are styled via the optional `vanilla/vanilla-bt-printing.css` (also from CDN); additional refinements are inline in `index.html`.

Full API docs: [vanilla/README.md](../vanilla/README.md)

## Structure

```
examples/html-demo/
├── index.html              # Main demo (Pico.css + vanilla helper)
└── canvas-editor.js        # Canvas editor (optional)
```

## CDN

All resources are loaded from CDN — no local `dist/` files needed.

- **Vanilla JS integration**: `https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.js`
- **Helper styles (optional)**: `https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.css`
- **Pico.css**: `https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css`
- **Printer library**: loaded automatically by the integration

## Requirements

- A browser with Web Bluetooth support (Chrome, Edge, Brave)
- A DothanTech printer (e.g. DP30S, DP30H)
- HTTPS connection or localhost (required for Web Bluetooth)
