# HTML Demo

A simple vanilla JS integration demo for the DothanTech Printer library.

## Requirements

- A browser with Web Bluetooth support (Chrome, Edge, Brave)
- A DothanTech printer (e.g. DP30S, DP30H)
- HTTPS connection or localhost (required for Web Bluetooth)

## Quick Start

The demo is fully functional when served over HTTP (Web Bluetooth requires a secure context).

### Option 1: Run a local server

```bash
# From the project root
npx serve examples/html-demo

# or
python3 -m http.server 8000 --directory examples/html-demo
```

Then open: http://localhost:8000 (or the port shown)

### Option 2: Open directly in browser

```bash
# From the project root
open examples/html-demo/index.html
```

> **Note:** Opening directly via `file://` may not work in all browsers due to Web Bluetooth security requirements. Using a local server is recommended.

## Features

- Connect to a Bluetooth printer
- Print formatted text
- Print images from URL
- Print from HTML5 canvas
- Monitor printer status
- Disconnect

## Files

```
examples/html-demo/
├── index.html                     # Main demo (local imports)
├── index_jsdeliver_variant.html   # CDN-only variant (no local files needed)
└── README.md
```

### Which file to use?

| File | Use when... |
|------|-------------|
| `index.html` | Developing locally, testing changes to the library |
| `index_jsdeliver_variant.html` | Quick demo, sharing, or testing without cloning the repo |

## Configuration

### `index.html` (local development)

Uses local imports from `../../dist/` and `../../vanilla/`. Requires building the library first (`npm run build` from the project root).

### `index_jsdeliver_variant.html` (CDN-only)

All resources loaded from [jsDelivr CDN](https://www.jsdelivr.com/) — no local `dist/` files needed.

```javascript
import { setupPrinter } from 'https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.js';
```

Styles:

- **Pico.css**: [https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css](https://picocss.com/docs)
- **Helper styles** (optional): `https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.css`

UI states (`.status`, `.printer-info`) are managed by the helper and styled via the optional CSS file.

The core printer library (`detonger-web-bt.min.js`) is loaded **automatically** by the integration helper. When this module is loaded from CDN, `libUrl` defaults to the jsDelivr URL — no need to specify it manually.

To override (e.g. for local development), pass `libUrl` in the `printer` config.

## Full API Docs

See [vanilla/README.md](../../vanilla/README.md) for the complete integration API reference.
