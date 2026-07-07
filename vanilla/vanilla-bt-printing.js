/**
 * Default library URL (jsdelivr CDN serving from GitHub repo).
 * Can be overridden via config.libUrl or by injecting config.DothanTechPrinter.
 */
// Relative path resolved from this module's location (works with file:// and http://)
// For CDN usage, pass libUrl in config: { libUrl: 'https://cdn.jsdelivr.net/...' }
const DEFAULT_LIB_URL = new URL('../dist/detonger-web-bt.min.js', import.meta.url).href;

/**
 * Resolve the printer class: priority is explicit injection, then dynamic import from libUrl.
 * @param {Object} config
 * @returns {Promise<{DothanTechPrinter: Function, PaperTypeNames: Object}>}
 */
async function resolvePrinterLib(config) {
    const injected = config.DothanTechPrinter || config.printerClass;
    if (injected) {
        return {
            DothanTechPrinter: injected,
            PaperTypeNames: config.PaperTypeNames || injected.PaperTypeNames,
        };
    }

    const url = config.printer?.libUrl || config.libUrl || DEFAULT_LIB_URL;
    const mod = await import(/* @vite-ignore */ url);

    if (!mod?.DothanTechPrinter) {
        throw new Error(
            `Module at "${url}" does not export DothanTechPrinter class. ` +
                `Ensure libUrl points to a valid bundle.`
        );
    }

    return {
        DothanTechPrinter: mod.DothanTechPrinter,
        PaperTypeNames: mod.PaperTypeNames || mod.DothanTechPrinter.PaperTypeNames,
    };
}

/**
 * Setup function for DothanTech Printer Demo.
 *
 * Works without local files — import this module from a CDN:
 *
 *   import { setupPrinter } from 'https://cdn.jsdelivr.net/gh/Endriur24/detonger_web_bt@main/vanilla/vanilla-bt-printing.js';
 *   const printer = await setupPrinter({ ... });
 *
 * @param {Object} config - Configuration object
 * @param {Function} [config.DothanTechPrinter] - Printer class injected directly (skips dynamic import)
 * @param {Function} [config.printerClass] - Alias for config.DothanTechPrinter
 * @param {string} [config.libUrl] - URL to the printer library bundle (defaults to CDN). Ignored when DothanTechPrinter is provided.
 * @param {Object} [config.PaperTypeNames] - Optional paper type name map (when injecting a class without the static property)
 * @param {Object} config.printer - DothanTechPrinter constructor options
 * @param {string} config.selectors.status - Selector for the status element
 * @param {string} config.selectors.printerInfo - Selector for the printer info element
 * @param {string} config.selectors.btnConnect - Selector for the connect button
 * @param {string} config.selectors.btnDisconnect - Selector for the disconnect button
 * @param {Array<Object>} config.textPrints - Array of text print configurations
 * @param {string} config.textPrints[].input - Selector for the text input
 * @param {string} config.textPrints[].button - Selector for the print button
 * @param {Object} config.textPrints[].options - Options for printText
 * @param {Array<Object>} config.canvasPrints - Array of canvas print configurations
 * @param {string} config.canvasPrints[].canvas - Selector for the canvas element
 * @param {string} config.canvasPrints[].button - Selector for the print button
 * @param {Object} config.canvasPrints[].options - Options for printCanvas
 * @param {Array<Object>} config.imagePrints - Array of image print configurations
 * @param {string} config.imagePrints[].url - Image URL to print
 * @param {string} config.imagePrints[].button - Selector for the print button
 * @param {Object} config.imagePrints[].options - Options for printImage
 * @returns {Promise<DothanTechPrinter>} Initialized printer instance
 */
export async function setupPrinter(config) {
    const {
        printer: printerOptions = {},
        selectors = {},
        textPrints = [],
        canvasPrints = [],
        imagePrints = []
    } = config;

    const { DothanTechPrinter, PaperTypeNames } = await resolvePrinterLib(config);

    const printer = new DothanTechPrinter(printerOptions);

    const statusEl = selectors.status ? document.querySelector(selectors.status) : null;
    const printerInfoEl = selectors.printerInfo ? document.querySelector(selectors.printerInfo) : null;
    const btnConnect = selectors.btnConnect ? document.querySelector(selectors.btnConnect) : null;
    const btnDisconnect = selectors.btnDisconnect ? document.querySelector(selectors.btnDisconnect) : null;

    printer.onStatusChange((status) => {
        console.log('Status changed:', status);

        if (statusEl) {
            statusEl.className = 'status ' + status;
            statusEl.textContent = {
                'disconnected': 'Disconnected',
                'connecting': 'Connecting...',
                'connected': 'Connected',
                'printing': 'Printing...',
                'error': 'Error'
            }[status];
        }

        const isConnected = status === 'connected' || status === 'printing';
        if (btnConnect) btnConnect.disabled = isConnected;
        if (btnDisconnect) btnDisconnect.disabled = !isConnected;

        textPrints.forEach(textPrint => {
            if (textPrint.button) {
                const button = document.querySelector(textPrint.button);
                if (button) button.disabled = !isConnected;
            }
        });

        imagePrints.forEach(imagePrint => {
            if (imagePrint.button) {
                const button = document.querySelector(imagePrint.button);
                if (button) button.disabled = !isConnected;
            }
        });

        canvasPrints.forEach(canvasPrint => {
            if (canvasPrint.button) {
                const button = document.querySelector(canvasPrint.button);
                if (button) button.disabled = !isConnected;
            }
        });

        if (status === 'connected') {
            updatePrinterInfo();
        } else if (status === 'disconnected') {
            if (printerInfoEl) printerInfoEl.classList.remove('show');
        }
    });

    async function updatePrinterInfo() {
        if (!printerInfoEl) return;

        try {
            const status = await printer.getPrinterStatus();
            const info = `
                <strong>Printer Info:</strong><br>
                Paper Type: ${PaperTypeNames[status.currentPaperType] || 'N/A'}<br>
                Density: ${status.currentDensity !== undefined ? status.currentDensity : 'N/A'}<br>
                Speed: ${status.currentSpeed !== undefined ? status.currentSpeed : 'N/A'}
            `;
            printerInfoEl.innerHTML = info;
            printerInfoEl.classList.add('show');
        } catch (error) {
            console.error('Error updating printer info:', error);
        }
    }

    if (btnConnect) {
        btnConnect.addEventListener('click', async () => {
            try {
                await printer.connect();
                console.log('Connected to printer');
            } catch (error) {
                console.error('Connection error:', error);
                alert('Connection error: ' + error.message);
            }
        });
    }

    textPrints.forEach(textPrint => {
        const input = textPrint.input ? document.querySelector(textPrint.input) : null;
        const button = textPrint.button ? document.querySelector(textPrint.button) : null;

        if (!input || !button) {
            console.error('Text print input or button not found:', textPrint);
            return;
        }

        button.addEventListener('click', async () => {
            try {
                const text = input.value;
                if (!text.trim()) {
                    alert('Enter text to print!');
                    return;
                }

                const printOptions = {
                    fontSize: 24,
                    fontFamily: 'Arial',
                    textAlign: 'left',
                    padding: [20, 20, 20, 20],
                    ...(textPrint.options || {})
                };

                const stats = await printer.printText(text, printOptions);
                console.log('Print stats:', stats);
            } catch (error) {
                console.error('Print error:', error);
                alert('Print error: ' + error.message);
            }
        });
    });

    if (btnDisconnect) {
        btnDisconnect.addEventListener('click', async () => {
            try {
                await printer.disconnect();
                console.log('Disconnected');
            } catch (error) {
                console.error('Disconnect error:', error);
            }
        });
    }

    printer.onError((error) => {
        console.error('Printer error:', error);
        alert('Printer error: ' + error.message + '\n\nCheck the console (F12) for details.');
    });

    imagePrints.forEach(imagePrint => {
        const button = imagePrint.button ? document.querySelector(imagePrint.button) : null;

        if (!button) {
            console.error('Image print button not found:', imagePrint);
            return;
        }

        button.addEventListener('click', async () => {
            try {
                if (!printer.isConnected()) {
                    alert('Connect to a printer first!');
                    return;
                }

                const url = typeof imagePrint.url === 'function' ? imagePrint.url() : imagePrint.url;

                if (!url) {
                    alert('No image URL!');
                    return;
                }

                console.log('Printing image from URL:', url);

                const printOptions = {
                    threshold: 192,
                    invertColors: false,
                    scale: 1.0,
                    autoCrop: true,
                    ...(imagePrint.options || {})
                };

                const stats = await printer.printImage(url, printOptions);
                console.log('Print stats:', stats);
            } catch (error) {
                console.error('Image print error:', error);
                alert('Image print error: ' + error.message);
            }
        });
    });

    canvasPrints.forEach(canvasPrint => {
        const canvas = canvasPrint.canvas ? document.querySelector(canvasPrint.canvas) : null;
        const button = canvasPrint.button ? document.querySelector(canvasPrint.button) : null;

        if (!canvas || !button) {
            console.error('Canvas or button not found:', canvasPrint);
            return;
        }

        button.addEventListener('click', async () => {
            try {
                if (!printer.isConnected()) {
                    alert('Connect to a printer first!');
                    return;
                }

                console.log('Printing canvas...');

                const printOptions = {
                    threshold: 192,
                    invertColors: false,
                    scale: 1.0,
                    autoCrop: true,
                    ...(canvasPrint.options || {})
                };

                const stats = await printer.printCanvas(canvas, printOptions);
                console.log('Print stats:', stats);
            } catch (error) {
                console.error('Canvas print error:', error);
                alert('Canvas print error: ' + error.message);
            }
        });
    });

    console.log('DothanTech Printer Demo initialized');
    return printer;
}
