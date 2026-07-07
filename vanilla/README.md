# DothanTech Printer - Vanilla JS Integration

Integrate the DothanTech Printer library with Web Bluetooth for vanilla JavaScript projects. The module can be imported directly from a CDN — no local files required.

## Requirements

- A browser with Web Bluetooth support:
  - Chrome on desktop (Windows, macOS, Linux)
  - Chrome on Android
  - Edge on desktop
  - Brave on desktop/Android
- A DothanTech Bluetooth printer (e.g. DP30S, DP30H)
- Optional: Local HTTP server (Firefox may require HTTPS for Web Bluetooth)

## Quick Start

### Import from CDN (recommended)

The simplest integration. `setupPrinter` dynamically loads the printer library from the default CDN (jsdelivr). Everything works from a single `<script>` tag:

```html
<script type="module">
    import { setupPrinter } from 'https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.js';

    // Note: setupPrinter is async (returns a Promise)
    const printer = await setupPrinter({
        printer: { namePrefix: "DP30S-", debug: true },
        selectors: { status: '#printer-status', btnConnect: '#btn-connect', btnDisconnect: '#btn-disconnect' },
        textPrints: [{ input: '#text-input', button: '#btn-print' }],
    });
</script>
```

### Custom Library URL

You can specify a custom library URL via `libUrl` or inject the class via `DothanTechPrinter`:

```javascript
// Custom bundle URL (e.g. unpkg, your own server, local path)
await setupPrinter({ libUrl: 'https://unpkg.com/.../detonger-web-bt.min.js', ... });

// Or inject a class imported earlier (e.g. via bundler)
import { DothanTechPrinter } from 'detonger-web-bt';
await setupPrinter({ DothanTechPrinter, ... });
```

### Local Files

If you prefer using local files:

1. Copy `vanilla-bt-printing.js` to your project
2. Ensure you have the compiled `detonger-web-bt.min.js` in the `dist/` folder

```html
<script type="module">
    import { setupPrinter } from './vanilla-bt-printing.js';

    const printer = await setupPrinter({
        libUrl: './dist/detonger-web-bt.min.js',
        printer: { debug: true },
        selectors: { ... },
        textPrints: [ ... ],
    });
</script>
```

## API Documentation

### setupPrinter(config)

Main initialization function. **It is async** — returns `Promise<DothanTechPrinter>`.

```javascript
import { setupPrinter } from 'https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.js';

const printer = await setupPrinter(config);
```

#### config object

##### libUrl (string) — optional

URL to the printer library bundle, loaded dynamically. Defaults to jsdelivr CDN (GitHub repo). Useful when using local files or a different CDN:

```javascript
libUrl: './dist/detonger-web-bt.min.js'   // local
libUrl: 'https://unpkg.com/.../detonger-web-bt.min.js'  // different CDN
```

Ignored when `DothanTechPrinter` is provided.

##### DothanTechPrinter (Function) / printerClass — optional

Printer class injected directly. Skips dynamic import from `libUrl` — useful with a bundler (Vite/Webpack) or when you already imported the class:

```javascript
import { DothanTechPrinter } from 'detonger-web-bt';
await setupPrinter({ DothanTechPrinter, ... });
```

##### printer (Object)

`DothanTechPrinter` constructor options.

```javascript
printer: {
    namePrefix: "DP30S-", // Bluetooth device name prefix (default: "DP")
    debug: true,        // Enable console logging (default: false)
    paperWidth: 56,     // Paper width in pixels (default: 56)
}
```

##### selectors (Object)

UI element selectors for connection management.

```javascript
selectors: {
    status: '#printer-status',           // Status display element
    printerInfo: '#printer-info',         // Printer info element
    btnConnect: '#btn-connect',           // Connect button
    btnDisconnect: '#btn-disconnect'      // Disconnect button
}
```

All fields are optional — if omitted, that functionality is inactive.

##### textPrints (Array\<Object\>)

Array of text print configurations. You can define multiple input + button pairs.

```javascript
textPrints: [
    {
        input: '#text-input-1',      // Text input selector
        button: '#btn-print-1',      // Print button selector
        options: {                   // printText options (optional)
            fontSize: 24,
            fontFamily: 'Arial',
            textAlign: 'left',
            padding: [20, 20, 20, 20]
        }
    },
    {
        input: '#text-input-2',
        button: '#btn-print-2',
        options: {
            fontSize: 32,
            fontFamily: 'Courier New',
            textAlign: 'center'
        }
    }
]
```

##### canvasPrints (Array\<Object\>)

Array of canvas print configurations.

```javascript
canvasPrints: [
    {
        canvas: '#canvas-1',         // Canvas element selector
        button: '#btn-print-canvas', // Print button selector
        options: {                   // printCanvas options (optional)
            threshold: 192,          // Binarization threshold (0-255)
            invertColors: false,      // Invert colors
            scale: 1.0,              // Image scale
            autoCrop: true           // Auto-crop white margins
        }
    }
]
```

##### imagePrints (Array\<Object\>)

Array of image print configurations from URL. URL can be a static string or a function returning a URL (e.g. from an input field).

```javascript
imagePrints: [
    {
        url: 'https://example.com/image.png',  // Image URL (string or function)
        button: '#btn-print-image',            // Print button selector
        options: {                            // printImage options (optional)
            threshold: 192,                   // Binarization threshold (0-255)
            invertColors: false,               // Invert colors
            scale: 1.0,                       // Image scale
            autoCrop: true                    // Auto-crop white margins
        }
    },
    {
        // Dynamic URL from input
        url: () => document.getElementById('image-url').value,
        button: '#btn-print-dynamic-image'
    }
]
```

**Note:** Images from URL must be same-origin or support CORS with `crossorigin="anonymous"`.

#### Return Value

Returns `Promise<DothanTechPrinter>`, which you can use for advanced operations:

```javascript
const printer = await setupPrinter(config);

// Check connection
if (printer.isConnected()) {
    console.log('Printer is connected');
}

// Get status
const status = await printer.getPrinterStatus();
console.log(status);

// Direct printing
await printer.printText('Test', { fontSize: 24 });
```

## Styles (optional)

The helper dynamically assigns classes to UI elements but does not style them — you need to do that in your own CSS:

- `.status` + state: `disconnected` / `connecting` / `connected` / `printing` / `error` (helper sets `statusEl.className = 'status ' + status`)
- `.printer-info` + `.printer-info.show` (helper toggles `.show` class)

For convenience, we provide a ready-made, framework-agnostic stylesheet `vanilla/vanilla-bt-printing.css`. Colors and border radii can be adjusted via CSS variables (`--dtn-*`) or by overriding rules.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.css">
```

The file is optional — you can skip it and style the classes in your own CSS (e.g. following your framework like Pico.css, Bootstrap, etc.).

## Usage Examples

### Example 1: Basic - text printing only

```html
<div id="status"></div>
<textarea id="text" placeholder="Enter text..."></textarea>
<button id="connect">Connect</button>
<button id="print" disabled>Print</button>
<button id="disconnect" disabled>Disconnect</button>

<script type="module">
    import { setupPrinter } from 'https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.js';

    await setupPrinter({
        printer: { debug: true },
        selectors: {
            status: '#status',
            btnConnect: '#connect',
            btnDisconnect: '#disconnect'
        },
        textPrints: [{
            input: '#text',
            button: '#print'
        }]
    });
</script>
```

### Example 2: Canvas only

```html
<div id="status"></div>
<button id="connect">Connect</button>
<canvas id="my-canvas" width="384" height="200"></canvas>
<button id="print-canvas" disabled>Print Canvas</button>
<button id="disconnect" disabled>Disconnect</button>

<script type="module">
    import { setupPrinter } from 'https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.js';

    await setupPrinter({
        printer: { debug: true },
        selectors: {
            status: '#status',
            btnConnect: '#connect',
            btnDisconnect: '#disconnect'
        },
        canvasPrints: [{
            canvas: '#my-canvas',
            button: '#print-canvas'
        }]
    });
</script>
```

### Example 3: Multiple text inputs

```html
<div id="status"></div>
<button id="connect">Connect</button>
<button id="disconnect" disabled>Disconnect</button>

<!-- First text -->
<textarea id="text1">Small text</textarea>
<button id="print1" disabled>Print Small</button>

<!-- Second text -->
<textarea id="text2">Large text</textarea>
<button id="print2" disabled>Print Large</button>

<script type="module">
    import { setupPrinter } from 'https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.js';

    await setupPrinter({
        printer: { debug: true },
        selectors: {
            status: '#status',
            btnConnect: '#connect',
            btnDisconnect: '#disconnect'
        },
        textPrints: [
            {
                input: '#text1',
                button: '#print1',
                options: { fontSize: 18 }
            },
            {
                input: '#text2',
                button: '#print2',
                options: { fontSize: 48, textAlign: 'center' }
            }
        ]
    });
</script>
```

### Example 4: Print image from URL

```html
<div id="status"></div>
<button id="connect">Connect</button>
<button id="disconnect" disabled>Disconnect</button>

<!-- Image URL -->
<input type="url" id="image-url" placeholder="https://example.com/image.png" value="https://via.placeholder.com/384x200/000000/FFFFFF/?text=Hello">
<button id="print-image" disabled>Print Image</button>

<script type="module">
    import { setupPrinter } from 'https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.js';

    await setupPrinter({
        printer: { debug: true },
        selectors: {
            status: '#status',
            btnConnect: '#connect',
            btnDisconnect: '#disconnect'
        },
        imagePrints: [
            {
                url: () => document.getElementById('image-url').value,
                button: '#print-image',
                options: {
                    threshold: 192,
                    scale: 0.8,
                    autoCrop: true
                }
            }
        ]
    });
</script>
```

### Example 5: Minimal usage (no UI) — fully from CDN

```html
<script type="module">
    // Entire module imported from CDN — no local files
    import { setupPrinter } from 'https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.js';

    // setupPrinter is async and dynamically loads the printer library from CDN
    const printer = await setupPrinter({});

    // Connect programmatically
    await printer.connect();

    // Print
    await printer.printText('Hello World!', { fontSize: 24 });

    // Disconnect
    await printer.disconnect();
</script>
```

## License

MIT
