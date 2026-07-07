/**
 * DothanTech Printer Library - Types & Interfaces
 */
const PaperType = {
    Ticket: 0x00,
    Adhesive: 0x02,
    CardPaper: 0x03,
    Transparent: 0x04,
};
const ConnectionStatus = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    PRINTING: 'printing',
    ERROR: 'error',
};

/**
 * DothanTech Printer Library - Constants
 */
const START_BYTE = 0x1F;
const CMD_FEED_LINES = 0x4A;
const CMD_PAPER_TYPE = 0x42;
const CMD_DENSITY = 0x43;
const CMD_SPEED = 0x44;
const CMD_GAP_SPACING = 0x45;
const CMD_MOTOR_MODE = 0x47;
const CMD_AUTO_POWEROFF = 0x48;
const CMD_QUERY_STATUS = 0x70;
const CMD_QUERY_DPI = 0x71;
const CMD_QUERY_WIDTH = 0x72;
const CMD_QUERY_STATS = 0x73;
const CMD_MANUFACTURER = 0x75;
const CMD_DEVICE_NAME = 0x79;
const CMD_DEVICE_VERSION = 0x7A;
const CMD_SW_VERSION = 0x7C;
const CMD_PRINT_INIT = 0x20;
const CMD_PRINT_LINE = 0x21;
const CMD_LINE_WIDTH = 0x27;
const CMD_PRINT_END = 0x28;
const PaperTypeNames = {
    [PaperType.Ticket]: 'Ticket',
    [PaperType.Adhesive]: 'Adhesive',
    [PaperType.CardPaper]: 'Card Paper',
    [PaperType.Transparent]: 'Transparent',
};
const DEFAULT_CONFIG = {
    serviceUUID: '0000ff00-0000-1000-8000-00805f9b34fb',
    writeUUID: '0000ff02-0000-1000-8000-00805f9b34fb',
    notifyUUID: '0000ff01-0000-1000-8000-00805f9b34fb',
    namePrefix: 'DP',
    mtu: 512,
    packetDelay: 10,
    debug: false,
    paperWidth: 56,
};
const OPTIONAL_SERVICES = [
    '0000ff00-0000-1000-8000-00805f9b34fb',
    '0000ffe0-0000-1000-8000-00805f9b34fb',
    '000018f0-0000-1000-8000-00805f9b34fb',
    '0000180a-0000-1000-8000-00805f9b34fb',
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    '49535343-fe7d-4ae5-8fa9-9fafd205e45a',
    '49535343-8841-43f4-a8d4-ecbe34729bb3',
];

/**
 * DothanTech Printer Library - Protocol Helpers
 */
/**
 * Calculate checksum per DothanTech protocol: bitwise NOT of byte sum, excluding the start byte.
 */
function calculateChecksum(packet) {
    let sum = 0;
    for (let i = 1; i < packet.length; i++)
        sum += packet[i] & 0xFF;
    return (~sum) & 0xFF;
}
/**
 * Variable-length encoding for DothanTech protocol:
 * - value < 192 → 1 byte
 * - value >= 192 → 2 bytes (MSB | 0xC0, LSB)
 */
function encodeShort(value) {
    if (value >= 192)
        return [(value >>> 8) | 0xC0, value & 0xFF];
    return [value & 0xFF];
}
/**
 * Build a DothanTech protocol command packet.
 * Format: [START_BYTE, cmd, <encoded length>, ...data, checksum]
 */
function buildCommand(cmd, ...data) {
    const lenEncoded = encodeShort(data.length);
    const packet = [START_BYTE, cmd, ...lenEncoded, ...data];
    packet.push(calculateChecksum(packet));
    return new Uint8Array(packet);
}
/**
 * Create a conditional debug logger.
 */
function createDebugLogger(debug) {
    return function debugLog(msg, ...args) {
        if (debug) {
            console.log(`[DothanTech] ${msg}`, ...args);
        }
    };
}

/**
 * DothanTech Printer Library - Bluetooth Manager
 *
 * Manages Bluetooth Low Energy connections to DothanTech printers.
 */
class BluetoothManager {
    constructor(config) {
        this.device = null;
        this.writeCharacteristic = null;
        this.notifyCharacteristic = null;
        this.status = 'disconnected';
        this.statusCallbacks = new Set();
        this.dataCallbacks = new Set();
        this.errorCallbacks = new Set();
        this.handleDataReceived = (event) => {
            const char = event.target;
            if (!char?.value)
                return;
            const data = new Uint8Array(char.value.buffer);
            const hexStr = Array.from(data).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ');
            this.debugLog(`Received ${data.length} bytes`, hexStr);
            this.dataCallbacks.forEach(cb => cb(data));
        };
        this.handleDisconnected = () => {
            this.cleanup();
            this.setStatus('disconnected');
        };
        this.config = config;
        this.debugLog = createDebugLogger(config.debug);
        this.handleDataReceivedBound = this.handleDataReceived.bind(this);
        this.handleDisconnectedBound = this.handleDisconnected.bind(this);
    }
    /**
     * Connect to a printer via Bluetooth.
     * @throws Error if connection fails or required characteristics are not found.
     */
    async connect() {
        try {
            this.debugLog('Starting connection process with config:', this.config);
            this.setStatus('connecting');
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ namePrefix: this.config.namePrefix }],
                optionalServices: OPTIONAL_SERVICES,
            });
            this.debugLog('Bluetooth device found:', this.device.name);
            const server = await this.device.gatt.connect();
            this.debugLog('GATT server connected');
            await this.findCharacteristics(server);
            if (!this.writeCharacteristic || !this.notifyCharacteristic) {
                throw new Error('Required Bluetooth characteristics not found.');
            }
            await this.notifyCharacteristic.startNotifications();
            this.notifyCharacteristic.addEventListener('characteristicvaluechanged', this.handleDataReceivedBound);
            this.device.addEventListener('gattserverdisconnected', this.handleDisconnectedBound);
            this.debugLog('Connection complete!');
            this.setStatus('connected');
        }
        catch (error) {
            this.setStatus('error');
            this.emitError(error);
            throw error;
        }
    }
    /**
     * Disconnect from the printer.
     */
    async disconnect() {
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect();
        }
        this.cleanup();
    }
    /**
     * Check if the printer is connected.
     */
    isConnected() {
        return this.status === 'connected' || this.status === 'printing';
    }
    /**
     * Get the current connection status.
     */
    getStatus() {
        return this.status;
    }
    /**
     * Get the connected device name.
     */
    getDeviceName() {
        return this.device?.name || null;
    }
    /**
     * Send data to the printer in MTU-sized chunks.
     * @param data - The data to send.
     */
    async sendData(data) {
        if (!this.writeCharacteristic)
            throw new Error('No write characteristic available');
        const { mtu, packetDelay } = this.config;
        this.debugLog(`Sending ${data.length} bytes in chunks of ${mtu}`);
        for (let i = 0; i < data.length; i += mtu) {
            const chunk = data.slice(i, Math.min(i + mtu, data.length));
            await this.writeCharacteristic.writeValue(chunk);
            if (i + mtu < data.length) {
                await new Promise(r => setTimeout(r, packetDelay));
            }
        }
    }
    /**
     * Register a callback for connection status changes.
     * @returns Unsubscribe function.
     */
    onStatusChange(cb) {
        this.statusCallbacks.add(cb);
        return () => this.statusCallbacks.delete(cb);
    }
    /**
     * Register a callback for incoming data.
     * @returns Unsubscribe function.
     */
    onDataReceived(cb) {
        this.dataCallbacks.add(cb);
        return () => this.dataCallbacks.delete(cb);
    }
    /**
     * Register a callback for errors.
     * @returns Unsubscribe function.
     */
    onError(cb) {
        this.errorCallbacks.add(cb);
        return () => this.errorCallbacks.delete(cb);
    }
    /**
     * Check if GATT characteristics are available.
     */
    hasCharacteristics() {
        return !!this.writeCharacteristic && !!this.notifyCharacteristic;
    }
    async findCharacteristics(server) {
        let foundWrite = false;
        let foundNotify = false;
        try {
            const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb').catch(() => null);
            if (service) {
                this.debugLog('Found service FFE0');
                const writeChar = await service.getCharacteristic('0000ffe2-0000-1000-8000-00805f9b34fb').catch(() => null);
                const notifyChar = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb').catch(() => null);
                if (writeChar) {
                    this.writeCharacteristic = writeChar;
                    foundWrite = true;
                    this.debugLog('Found write char FFE2');
                }
                if (notifyChar) {
                    this.notifyCharacteristic = notifyChar;
                    foundNotify = true;
                    this.debugLog('Found notify char FFE1');
                }
            }
            else {
                this.debugLog('Service FFE0 not found');
            }
        }
        catch (e) {
            this.debugLog('Error accessing FFE0 service:', e);
        }
        const commonServices = [
            'ffffff00-0000-1000-8000-00805f9b34fb',
            '0000ff00-0000-1000-8000-00805f9b34fb',
            '0000180a-0000-1000-8000-00805f9b34fb',
        ];
        const knownChars = [
            '0000ffe2-0000-1000-8000-00805f9b34fb',
            '0000ff02-0000-1000-8000-00805f9b34fb',
            '0000ffe1-0000-1000-8000-00805f9b34fb',
            '0000ff01-0000-1000-8000-00805f9b34fb',
        ];
        for (const svcUUID of commonServices) {
            try {
                const service = await server.getPrimaryService(svcUUID);
                this.debugLog(`Trying service: ${svcUUID}`);
                for (const charUUID of knownChars) {
                    try {
                        const char = await service.getCharacteristic(charUUID);
                        if (!foundWrite && (charUUID.includes('ffe2') || charUUID.includes('ff02'))) {
                            this.writeCharacteristic = char;
                            foundWrite = true;
                            this.debugLog(`Found write characteristic: ${charUUID}`);
                        }
                        if (!foundNotify && (charUUID.includes('ffe1') || charUUID.includes('ff01'))) {
                            this.notifyCharacteristic = char;
                            foundNotify = true;
                            this.debugLog(`Found notify characteristic: ${charUUID}`);
                        }
                    }
                    catch { /* ignore */ }
                }
                if (foundWrite && foundNotify)
                    break;
            }
            catch { /* ignore */ }
        }
    }
    setStatus(status) {
        this.status = status;
        this.statusCallbacks.forEach(cb => cb(status));
    }
    emitError(error) {
        this.errorCallbacks.forEach(cb => cb(error));
    }
    cleanup() {
        this.notifyCharacteristic?.removeEventListener('characteristicvaluechanged', this.handleDataReceivedBound);
        this.device?.removeEventListener('gattserverdisconnected', this.handleDisconnectedBound);
        this.device = null;
        this.writeCharacteristic = null;
        this.notifyCharacteristic = null;
        this.setStatus('disconnected');
    }
}

/**
 * DothanTech Printer Library - Dithering Algorithms
 */
/**
 * Convert image to grayscale using luminance weights (R*0.21 + G*0.71 + B*0.07).
 */
function greyscaleLuminance(image) {
    const { data } = image;
    for (let i = 0; i <= data.length; i += 4) {
        const gray = Math.floor(data[i] * 0.21 + data[i + 1] * 0.71 + data[i + 2] * 0.07);
        data[i] = data[i + 1] = data[i + 2] = gray;
    }
    return image;
}
/**
 * Apply Atkinson dithering to image data.
 * @param image - Image data to process.
 * @param imageWidth - Image width in pixels.
 */
function ditherAtkinson(image, imageWidth) {
    const { data } = image;
    const dataLength = data.length;
    const skipPixels = 4;
    const clamp = (val) => Math.max(0, Math.min(255, val));
    for (let i = 0; i <= dataLength; i += skipPixels) {
        const oldPixel = data[i];
        const newPixel = oldPixel <= 128 ? 0 : 255;
        const error = Math.floor((oldPixel - newPixel) / 8);
        data[i] = newPixel;
        if (i + 4 < dataLength)
            data[i + 4] = clamp(data[i + 4] + error);
        if (i + 8 < dataLength)
            data[i + 8] = clamp(data[i + 8] + error);
        const belowLeft = i + (4 * imageWidth) - 4;
        if (belowLeft < dataLength && belowLeft >= 0)
            data[belowLeft] = clamp(data[belowLeft] + error);
        const below = i + (4 * imageWidth);
        if (below < dataLength)
            data[below] = clamp(data[below] + error);
        const belowRight = i + (4 * imageWidth) + 4;
        if (belowRight < dataLength)
            data[belowRight] = clamp(data[belowRight] + error);
        const belowBelow = i + (8 * imageWidth);
        if (belowBelow < dataLength)
            data[belowBelow] = clamp(data[belowBelow] + error);
        data[i + 1] = data[i];
        data[i + 2] = data[i];
    }
    return image;
}
/**
 * Apply simple threshold dithering.
 * @param image - Image data to process.
 * @param thresholdValue - Threshold value (0-255).
 */
function ditherThreshold(image, thresholdValue = 128) {
    const { data } = image;
    for (let i = 0; i <= data.length; i += 4) {
        const isBlack = data[i] > thresholdValue;
        data[i] = isBlack ? 255 : 0;
        data[i + 1] = isBlack ? 255 : 0;
        data[i + 2] = isBlack ? 255 : 0;
    }
    return image;
}
/**
 * Apply dithering to image data. Converts to grayscale first, then applies the selected method.
 * @param imageData - Image data to process.
 * @param options - Dithering options.
 */
function applyDithering(imageData, options = {}) {
    const { ditherMethod = 'none', threshold: thresholdValue = 128 } = options;
    greyscaleLuminance(imageData);
    switch (ditherMethod) {
        case 'atkinson':
            ditherAtkinson(imageData, imageData.width);
            break;
        case 'threshold':
            ditherThreshold(imageData, thresholdValue);
            break;
    }
    return imageData;
}

/**
 * DothanTech Printer Library - Canvas Processor
 *
 * Converts canvas and image data to DothanTech printer protocol commands.
 */
/**
 * Convert a canvas to DothanTech protocol command stream.
 * Uses repeat-count and offset compression for efficient transmission.
 * @param canvas - The canvas element to convert.
 * @param options - Image print options.
 * @param debug - Enable debug logging.
 * @returns The encoded command data and conversion stats.
 */
async function canvasToDothanTech(canvas, options = {}, debug = false) {
    const { invertColors = false, ditherMethod = 'none', threshold = 192, } = options;
    const debugLog = createDebugLogger(debug);
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    if (ditherMethod !== 'none') {
        debugLog(`Applying dithering: method=${ditherMethod}, threshold=${threshold}`);
        applyDithering(imageData, { ditherMethod, threshold });
    }
    const lineBytes = Math.ceil(width / 8);
    const commands = [];
    const pageKey = Math.floor(Math.random() * 65535);
    const initData = [(pageKey >> 8) & 0xFF, pageKey & 0xFF, 0, 0, 0, 0, 0, 0];
    commands.push(...buildCommand(CMD_PRINT_INIT, ...initData));
    const widthEncoded = encodeShort(lineBytes);
    commands.push(...buildCommand(CMD_LINE_WIDTH, ...widthEncoded, 1));
    let lastLine = null;
    let lastLineStr = '';
    let repeatCount = 0;
    let commandsCount = 0;
    for (let y = 0; y < height; y++) {
        const lineData = [];
        for (let x = 0; x < lineBytes; x++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const px = x * 8 + bit;
                if (px < width) {
                    const i = (y * width + px) * 4;
                    const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
                    const isBlack = gray < threshold;
                    if (invertColors ? !isBlack : isBlack) {
                        byte |= (1 << (7 - bit));
                    }
                }
            }
            lineData.push(byte);
        }
        const lineStr = lineData.join(',');
        if (lineStr === lastLineStr) {
            repeatCount++;
        }
        else {
            if (lastLine !== null) {
                let offset = 0;
                while (offset < lastLine.length && lastLine[offset] === 0) {
                    offset++;
                }
                const dataWithoutOffset = lastLine.slice(offset);
                const repeatEncoded = encodeShort(repeatCount - 1);
                const offsetEncoded = encodeShort(offset);
                const lineCmd = [...repeatEncoded, ...offsetEncoded, ...dataWithoutOffset];
                commands.push(...buildCommand(CMD_PRINT_LINE, ...lineCmd));
                commandsCount++;
            }
            lastLine = lineData;
            lastLineStr = lineStr;
            repeatCount = 1;
        }
    }
    if (lastLine !== null) {
        let offset = 0;
        while (offset < lastLine.length && lastLine[offset] === 0) {
            offset++;
        }
        const dataWithoutOffset = lastLine.slice(offset);
        const repeatEncoded = encodeShort(repeatCount - 1);
        const offsetEncoded = encodeShort(offset);
        const lineCmd = [...repeatEncoded, ...offsetEncoded, ...dataWithoutOffset];
        commands.push(...buildCommand(CMD_PRINT_LINE, ...lineCmd));
        commandsCount++;
    }
    commands.push(...buildCommand(CMD_PRINT_END));
    const data = new Uint8Array(commands);
    debugLog(`Conversion done – commands=${commandsCount}, bytes=${data.length}, ` +
        `compression=${((1 - data.length / (lineBytes * height)) * 100).toFixed(1)}%`);
    return {
        data,
        stats: {
            totalBytes: data.length,
            bitmapLines: height,
            commandsCount,
            compressionRatio: (data.length / (lineBytes * height)) * 100,
        },
    };
}
/**
 * Render text onto a canvas element with the given formatting options.
 * @param text - The text to render.
 * @param options - Text formatting options.
 * @param printerDPI - Printer DPI for pixel-to-mm conversion.
 * @param paperWidthPx - Paper width in pixels.
 * @returns A canvas element with the rendered text.
 */
function renderTextToCanvas(text, options = {}, printerDPI = 203, paperWidthPx = 58) {
    const { fontSize = 24, fontFamily = 'Arial', fontWeight = 'normal', fontStyle = 'normal', textAlign = 'left', lineHeight = 1.2, padding = [2, 2, 2, 2], maxWidth, autoScale = false, minScale = 0.3, autoWrap = false, } = options;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const dpi = printerDPI;
    const pxPerMm = dpi / 25.4;
    const [padTopMM, padRightMM, padBottomMM, padLeftMM] = padding;
    const padTop = padTopMM * pxPerMm;
    const padRight = padRightMM * pxPerMm;
    const padBottom = padBottomMM * pxPerMm;
    const padLeft = padLeftMM * pxPerMm;
    const effectiveMaxWidthPx = (maxWidth ?? paperWidthPx) * pxPerMm;
    const maxContentWidthPx = effectiveMaxWidthPx - (padLeft + padRight);
    const wrapText = (lines, maxWidth, font) => {
        ctx.font = font;
        const result = [];
        for (const line of lines) {
            if (ctx.measureText(line).width <= maxWidth) {
                result.push(line);
                continue;
            }
            const words = line.split(/(\s+)/);
            if (words.length === 1) {
                let currentLine = '';
                for (const char of line) {
                    const testLine = currentLine + char;
                    if (ctx.measureText(testLine).width <= maxWidth) {
                        currentLine = testLine;
                    }
                    else {
                        if (currentLine)
                            result.push(currentLine);
                        currentLine = char;
                    }
                }
                if (currentLine)
                    result.push(currentLine);
            }
            else {
                let currentLine = '';
                for (let i = 0; i < words.length; i++) {
                    const word = words[i];
                    if (!word)
                        continue;
                    const testLine = currentLine + word;
                    if (ctx.measureText(testLine).width <= maxWidth) {
                        currentLine = testLine;
                    }
                    else {
                        if (currentLine.trim()) {
                            result.push(currentLine.trim());
                            currentLine = /^\s+$/.test(word) ? '' : word;
                        }
                        else {
                            if (/^\s+$/.test(word)) {
                                currentLine = '';
                            }
                            else {
                                let charLine = '';
                                for (const char of word) {
                                    const testCharLine = charLine + char;
                                    if (ctx.measureText(testCharLine).width <= maxWidth) {
                                        charLine = testCharLine;
                                    }
                                    else {
                                        if (charLine)
                                            result.push(charLine);
                                        charLine = char;
                                    }
                                }
                                currentLine = charLine;
                            }
                        }
                    }
                }
                if (currentLine.trim())
                    result.push(currentLine.trim());
            }
        }
        return result;
    };
    const measureWidestLine = (size, linesToMeasure) => {
        const font = `${fontStyle} ${fontWeight} ${size}px ${fontFamily}`;
        ctx.font = font;
        let maxW = 0;
        linesToMeasure.forEach(line => {
            const w = ctx.measureText(line).width;
            if (w > maxW)
                maxW = w;
        });
        return maxW;
    };
    let initialLines = text.split('\n');
    let finalFontSize = fontSize;
    let finalLines = initialLines;
    if (autoWrap && maxContentWidthPx > 0) {
        const initialFont = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        finalLines = wrapText(initialLines, maxContentWidthPx, initialFont);
    }
    if (autoScale && maxContentWidthPx > 0) {
        const contentWidth = measureWidestLine(finalFontSize, finalLines);
        if (contentWidth > maxContentWidthPx) {
            const scaleFactor = maxContentWidthPx / contentWidth;
            const clampedScaleFactor = Math.max(scaleFactor, minScale);
            finalFontSize = Math.max(1, fontSize * clampedScaleFactor);
            if (autoWrap) {
                const scaledFont = `${fontStyle} ${fontWeight} ${finalFontSize}px ${fontFamily}`;
                finalLines = wrapText(text.split('\n'), maxContentWidthPx, scaledFont);
            }
        }
    }
    const font = `${fontStyle} ${fontWeight} ${finalFontSize}px ${fontFamily}`;
    ctx.font = font;
    const lineHeightPx = finalFontSize * lineHeight;
    let contentWidth = 0;
    finalLines.forEach(line => {
        const w = ctx.measureText(line).width;
        if (w > contentWidth)
            contentWidth = w;
    });
    if (maxContentWidthPx > 0) {
        contentWidth = Math.min(contentWidth, maxContentWidthPx);
    }
    canvas.width = Math.ceil(contentWidth + padLeft + padRight);
    canvas.height = Math.ceil(finalLines.length * lineHeightPx + padTop + padBottom);
    ctx.font = font;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'top';
    finalLines.forEach((line, i) => {
        let x = padLeft;
        if (textAlign === 'center') {
            x = (canvas.width - ctx.measureText(line).width) / 2;
        }
        else if (textAlign === 'right') {
            x = canvas.width - ctx.measureText(line).width - padRight;
        }
        ctx.fillText(line, x, padTop + i * lineHeightPx);
    });
    return canvas;
}
/**
 * Scale a canvas to a maximum width specified in millimeters.
 * @param canvas - The source canvas.
 * @param maxWidthMm - Maximum width in mm. If undefined, returns the canvas unchanged.
 * @param printerDPI - Printer DPI for conversion.
 * @param paperWidthPx - Paper width in pixels (fallback).
 * @returns The original or a scaled canvas.
 */
function scaleCanvasByMaxWidth(canvas, maxWidthMm, printerDPI, paperWidthPx) {
    const dpi = printerDPI;
    const pxPerMm = dpi / 25.4;
    const effectiveMaxWidthPx = (maxWidthMm ?? paperWidthPx) * pxPerMm;
    if (canvas.width <= effectiveMaxWidthPx) {
        return canvas;
    }
    const scaleFactor = effectiveMaxWidthPx / canvas.width;
    const newWidth = Math.floor(canvas.width * scaleFactor);
    const newHeight = Math.floor(canvas.height * scaleFactor);
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = newWidth;
    scaledCanvas.height = newHeight;
    const ctx = scaledCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
    return scaledCanvas;
}
/**
 * Load an image from a URL into a canvas element.
 * @param imageUrl - The URL of the image to load.
 * @returns A Promise resolving to a canvas with the loaded image.
 */
async function loadImageToCanvas(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
    });
}

/**
 * DothanTech Printer Library - Response Parser
 *
 * Parses printer response packets and updates status/stats objects.
 */
/**
 * Parse a printer response packet.
 * Supports both USB-style packets (with 0x1F header) and BLE-style packets (raw payload).
 */
function parseStatusResponse(data, printerStatus, printingStats, debugLog) {
    if (data.length < 3)
        return;
    if (data[0] !== START_BYTE) {
        debugLog('Received BLE-style packet (no header)');
        return;
    }
    const cmd = data[1];
    const lengthByte1 = data[2];
    let dataOffset;
    let payloadLen;
    if ((lengthByte1 & 0xC0) === 0xC0) {
        const lengthByte2 = data[3];
        payloadLen = ((lengthByte1 & 0x3F) << 8) | lengthByte2;
        dataOffset = 4;
        debugLog(`2-byte length field: 0x${lengthByte1.toString(16).padStart(2, '0')} 0x${lengthByte2.toString(16).padStart(2, '0')} = ${payloadLen}`);
    }
    else {
        payloadLen = lengthByte1 & 0xFF;
        dataOffset = 3;
        debugLog(`1-byte length field: 0x${lengthByte1.toString(16).padStart(2, '0')} = ${payloadLen}`);
    }
    debugLog(`Parse CMD=0x${cmd.toString(16)} payloadLen=${payloadLen} dataOffset=${dataOffset} totalLen=${data.length}`);
    if (data.length < dataOffset + payloadLen) {
        debugLog('Incomplete packet, skipping');
        return;
    }
    if (cmd === 0x71) {
        const payloadBytes = Array.from(data.slice(dataOffset, dataOffset + payloadLen));
        const hexBytes = payloadBytes.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ');
        debugLog(`DPI raw payload: ${hexBytes}`);
    }
    const p = data;
    switch (cmd) {
        case 0x79: {
            const end = p.indexOf(0x00, dataOffset);
            const bytes = p.slice(dataOffset, end < 0 ? undefined : end);
            printerStatus.deviceName = new TextDecoder('ascii').decode(bytes);
            debugLog('Device name:', printerStatus.deviceName);
            break;
        }
        case 0x7C: {
            const end = p.indexOf(0x00, dataOffset);
            const bytes = p.slice(dataOffset, end < 0 ? undefined : end);
            printerStatus.softwareVersion = new TextDecoder('ascii').decode(bytes);
            debugLog('Software version:', printerStatus.softwareVersion);
            break;
        }
        case 0x75: {
            const end = p.indexOf(0x00, dataOffset);
            const bytes = p.slice(dataOffset, end < 0 ? undefined : end);
            try {
                printerStatus.manufacturer = new TextDecoder('gbk').decode(bytes);
            }
            catch {
                printerStatus.manufacturer = new TextDecoder('ascii').decode(bytes);
            }
            debugLog('Manufacturer:', printerStatus.manufacturer);
            break;
        }
        case 0x70: {
            if (p.length > dataOffset) {
                printerStatus.printerStatus = p[dataOffset] & 0xFF;
                debugLog('Printer status:', printerStatus.printerStatus);
                if (payloadLen >= 5) {
                    const pageKey = ((p[dataOffset + 1] & 0xFF) << 8) | (p[dataOffset + 2] & 0xFF);
                    debugLog('Status pageKey:', pageKey);
                }
                if (payloadLen > 1) {
                    const statusBytes = Array.from(p.slice(dataOffset, dataOffset + payloadLen));
                    const hexBytes = statusBytes.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ');
                    debugLog('Full status payload:', hexBytes);
                }
            }
            break;
        }
        case 0x71: {
            if (p.length >= dataOffset + 1) {
                if (payloadLen === 1) {
                    printerStatus.printerDPI = p[dataOffset] & 0xFF;
                    debugLog('DPI:', printerStatus.printerDPI, '(1 byte)');
                }
                else if (payloadLen === 2) {
                    const msb = p[dataOffset] & 0xFF;
                    const lsb = p[dataOffset + 1] & 0xFF;
                    printerStatus.printerDPI = (msb << 8) | lsb;
                    debugLog('DPI:', printerStatus.printerDPI, '(2 bytes)');
                }
                else {
                    debugLog(`Warning: Unexpected DPI payload length: ${payloadLen}`);
                }
                if (printerStatus.printerDPI && (printerStatus.printerDPI < 96 || printerStatus.printerDPI > 600)) {
                    debugLog(`Warning: Unusual DPI value ${printerStatus.printerDPI}`);
                }
            }
            else {
                debugLog('Insufficient bytes for DPI parsing');
            }
            break;
        }
        case 0x7A: {
            const end = p.indexOf(0x00, dataOffset);
            const bytes = p.slice(dataOffset, end < 0 ? undefined : end);
            printerStatus.deviceVersion = new TextDecoder('ascii').decode(bytes);
            debugLog('Device version:', printerStatus.deviceVersion);
            break;
        }
        case 0x72: {
            if (p.length >= dataOffset + 4) {
                printerStatus.printerWidth = ((p[dataOffset] & 0xFF) << 8) | (p[dataOffset + 1] & 0xFF);
                const rawPaper = ((p[dataOffset + 2] & 0xFF) << 8) | (p[dataOffset + 3] & 0xFF);
                printerStatus.paperWidthMm = rawPaper / 10;
                if (payloadLen >= 5) {
                    printerStatus.printerLocateArea = p[dataOffset + 4] & 0xFF;
                    debugLog(`Width: ${printerStatus.printerWidth}px, paper: ${printerStatus.paperWidthMm}mm, locateArea: ${printerStatus.printerLocateArea}`);
                }
                else {
                    debugLog(`Width: ${printerStatus.printerWidth}px, paper: ${printerStatus.paperWidthMm}mm`);
                }
                if (payloadLen > 4) {
                    const widthBytes = Array.from(p.slice(dataOffset, dataOffset + payloadLen));
                    const hexBytes = widthBytes.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ');
                    debugLog('Full width payload:', hexBytes);
                }
            }
            break;
        }
        case 0x73: {
            if (p.length >= dataOffset + 16) {
                const v = new DataView(p.buffer, p.byteOffset + dataOffset);
                printingStats.workLines = v.getUint32(0);
                printingStats.printLines = v.getUint32(4);
                printingStats.nullLines = v.getUint32(8);
                printingStats.printPages = v.getUint32(12);
                debugLog('Print stats:', printingStats);
            }
            break;
        }
        case 0x43: {
            const val = p[dataOffset] & 0xFF;
            printerStatus.currentDensity = val;
            if (payloadLen >= 2) {
                printerStatus.currentDensityLevel = p[dataOffset + 1] & 0xFF;
                printerStatus.darknessCount = printerStatus.currentDensityLevel;
                debugLog('Density:', val, 'level:', printerStatus.currentDensityLevel);
            }
            else {
                debugLog('Density:', val);
            }
            break;
        }
        case 0x44: {
            const val = p[dataOffset] & 0xFF;
            printerStatus.currentSpeed = val;
            if (payloadLen >= 2) {
                printerStatus.currentSpeedLevel = p[dataOffset + 1] & 0xFF;
                printerStatus.speedCount = printerStatus.currentSpeedLevel;
                debugLog('Speed:', val, 'level:', printerStatus.currentSpeedLevel);
            }
            else {
                debugLog('Speed:', val);
            }
            break;
        }
        case 0x42: {
            const val = p[dataOffset] & 0xFF;
            printerStatus.currentPaperType = val;
            const paperTypeName = PaperTypeNames[val] ?? 'Unknown';
            debugLog('Paper type:', val, paperTypeName);
            break;
        }
        case 0x45: {
            if (p.length > dataOffset) {
                let spacing;
                if ((p[dataOffset] & 0xC0) === 0xC0) {
                    spacing = ((p[dataOffset] & 0x3F) << 8) | p[dataOffset + 1];
                }
                else {
                    spacing = p[dataOffset];
                }
                debugLog('Gap spacing:', spacing, '(0.01mm)');
            }
            break;
        }
        case 0x47: {
            const val = p[dataOffset] & 0xFF;
            debugLog('Motor mode:', val);
            break;
        }
        case 0x48: {
            if (payloadLen === 1) {
                const val = p[dataOffset] & 0xFF;
                debugLog('Auto power off:', val, 'min');
            }
            else if (payloadLen === 2 && p.length >= dataOffset + 2) {
                const val = ((p[dataOffset] & 0xFF) << 8) | (p[dataOffset + 1] & 0xFF);
                debugLog('Auto power off:', val, 'min');
            }
            break;
        }
        case 0x66: {
            if (p.length > dataOffset) {
                const val = p[dataOffset] & 0xFF;
                debugLog('Gap type:', val);
            }
            break;
        }
        default:
            debugLog(`Unhandled CMD: 0x${cmd.toString(16)}`);
    }
}

/**
 * DothanTech Printer Library - Main Entry Point
 *
 * Primary class for communicating with DothanTech printers.
 *
 * @author Reverse-engineered from com.dothantech Android library
 * @version 1.0.0
 */
/**
 * Main class for communicating with a DothanTech printer via Web Bluetooth.
 *
 * @example
 * ```typescript
 * const printer = new DothanTechPrinter();
 * await printer.connect();
 * await printer.printText('Hello World!', { fontSize: 32 });
 * await printer.disconnect();
 * ```
 */
class DothanTechPrinter {
    constructor(config) {
        this.status = 'disconnected';
        this.statusCallbacks = new Set();
        this.dataCallbacks = new Set();
        this.errorCallbacks = new Set();
        this.printerStatus = {};
        this.printingStats = {};
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.bluetoothManager = new BluetoothManager(this.config);
        this.debugLog = createDebugLogger(this.config.debug);
        this.bluetoothManager.onStatusChange((status) => {
            this.status = status;
            this.statusCallbacks.forEach(cb => cb(status));
        });
        this.bluetoothManager.onDataReceived((data) => {
            this.parseStatusResponse(data);
            this.dataCallbacks.forEach(cb => cb(data));
        });
        this.bluetoothManager.onError((error) => {
            this.errorCallbacks.forEach(cb => cb(error));
        });
    }
    /**
     * Connect to the printer via Bluetooth.
     */
    async connect() {
        try {
            await this.bluetoothManager.connect();
            await this.refreshPrinterStatus({ minimal: true });
        }
        catch (error) {
            this.status = 'error';
            this.errorCallbacks.forEach(cb => cb(error));
            throw error;
        }
    }
    /**
     * Disconnect from the printer.
     */
    async disconnect() {
        await this.bluetoothManager.disconnect();
    }
    /**
     * Check if the printer is currently connected.
     */
    isConnected() {
        return this.status === 'connected' || this.status === 'printing';
    }
    /**
     * Get the current connection status.
     */
    getStatus() {
        return this.status;
    }
    /**
     * Get the connected device name.
     */
    getDeviceName() {
        return this.bluetoothManager.getDeviceName();
    }
    /**
     * Get the latest printer status data (DPI, temperature, battery, etc.).
     */
    getPrinterStatus() {
        return { ...this.printerStatus };
    }
    /**
     * Get printing statistics (lines printed, pages, etc.).
     */
    getPrintingStats() {
        return { ...this.printingStats };
    }
    /**
     * Set paper width in pixels.
     * @param width - Width in pixels (must be >= 1).
     */
    setPaperWidth(width) {
        if (width < 1)
            throw new Error('Paper width must be >= 1');
        this.config.paperWidth = width;
    }
    /**
     * Get the current paper width in pixels.
     */
    getPaperWidth() {
        return this.config.paperWidth;
    }
    /**
     * Query the printer for current parameters.
     * Results are available via getPrinterStatus() after the response is received.
     * @param options - Refresh options. Set `minimal: true` for faster UI-only params.
     */
    async refreshPrinterStatus(options) {
        if (!this.bluetoothManager.hasCharacteristics()) {
            throw new Error('Printer is not connected');
        }
        const minimal = options?.minimal ?? false;
        const queries = minimal
            ? [
                buildCommand(CMD_QUERY_DPI),
                buildCommand(CMD_QUERY_WIDTH),
                buildCommand(CMD_DENSITY),
                buildCommand(CMD_SPEED),
                buildCommand(CMD_PAPER_TYPE),
                buildCommand(0x66),
                buildCommand(CMD_GAP_SPACING),
                buildCommand(CMD_MOTOR_MODE),
                buildCommand(CMD_AUTO_POWEROFF),
            ]
            : [
                buildCommand(CMD_DEVICE_NAME),
                buildCommand(CMD_DEVICE_VERSION),
                buildCommand(CMD_SW_VERSION),
                buildCommand(CMD_MANUFACTURER),
                buildCommand(CMD_QUERY_STATUS),
                buildCommand(CMD_QUERY_DPI),
                buildCommand(CMD_QUERY_WIDTH),
                buildCommand(CMD_QUERY_STATS),
                buildCommand(CMD_DENSITY),
                buildCommand(CMD_SPEED),
                buildCommand(CMD_PAPER_TYPE),
                buildCommand(0x66),
                buildCommand(CMD_GAP_SPACING),
                buildCommand(CMD_MOTOR_MODE),
                buildCommand(CMD_AUTO_POWEROFF),
            ];
        for (const query of queries) {
            await this.sendData(query);
            await new Promise(r => setTimeout(r, 50));
        }
    }
    /**
     * Print text with optional formatting options.
     * @param text - The text to print.
     * @param options - Text formatting options.
     * @returns Print statistics.
     */
    async printText(text, options) {
        if (!this.isConnected())
            throw new Error('Printer is not connected');
        const printerDPI = this.printerStatus.printerDPI || 203;
        const canvas = renderTextToCanvas(text, options, printerDPI, this.config.paperWidth);
        return await this.printCanvas(canvas);
    }
    /**
     * Print a canvas element.
     * @param canvas - The canvas to print.
     * @param options - Image print options.
     * @returns Print statistics.
     */
    async printCanvas(canvas, options) {
        if (!this.isConnected())
            throw new Error('Printer is not connected');
        this.status = 'printing';
        this.statusCallbacks.forEach(cb => cb(this.status));
        try {
            const printerDPI = this.printerStatus.printerDPI || 203;
            const scaledCanvas = scaleCanvasByMaxWidth(canvas, options?.maxWidth, printerDPI, this.config.paperWidth);
            const conversionStart = performance.now();
            const { data, stats: convStats } = await canvasToDothanTech(scaledCanvas, options, this.config.debug);
            const conversionTime = performance.now() - conversionStart;
            const transmissionStart = performance.now();
            await this.sendData(data);
            const transmissionTime = performance.now() - transmissionStart;
            this.status = 'connected';
            this.statusCallbacks.forEach(cb => cb(this.status));
            return {
                ...convStats,
                conversionTime,
                transmissionTime,
                transmissionSpeed: data.length / (transmissionTime / 1000) / 1024,
            };
        }
        catch (error) {
            this.status = 'error';
            this.statusCallbacks.forEach(cb => cb(this.status));
            this.errorCallbacks.forEach(cb => cb(error));
            throw error;
        }
    }
    /**
     * Print an image from a URL.
     * @param imageUrl - The image URL.
     * @param options - Image print options.
     * @returns Print statistics.
     */
    async printImage(imageUrl, options) {
        const canvas = await this.createCanvasFromSource(imageUrl);
        return await this.printCanvas(canvas, options);
    }
    /**
     * Print ImageData.
     * @param imageData - The image data to print.
     * @param options - Image print options.
     * @returns Print statistics.
     */
    async printImageData(imageData, options) {
        const canvas = await this.createCanvasFromSource(imageData);
        return await this.printCanvas(canvas, options);
    }
    /**
     * Feed N blank lines of paper (0-255).
     * @param n - Number of lines to feed.
     */
    async feedLines(n) {
        if (!this.isConnected())
            throw new Error('Printer is not connected');
        if (n < 0 || n > 255)
            throw new Error('n must be 0-255');
        await this.sendData(new Uint8Array([0x1B, CMD_FEED_LINES, n]));
    }
    /**
     * Register a callback for connection status changes.
     * @returns Unsubscribe function.
     */
    onStatusChange(cb) { this.statusCallbacks.add(cb); return () => this.statusCallbacks.delete(cb); }
    /**
     * Register a callback for incoming data.
     * @returns Unsubscribe function.
     */
    onDataReceived(cb) { this.dataCallbacks.add(cb); return () => this.dataCallbacks.delete(cb); }
    /**
     * Register a callback for errors.
     * @returns Unsubscribe function.
     */
    onError(cb) { this.errorCallbacks.add(cb); return () => this.errorCallbacks.delete(cb); }
    parseStatusResponse(data) {
        parseStatusResponse(data, this.printerStatus, this.printingStats, this.debugLog);
    }
    async createCanvasFromSource(source) {
        if (typeof source === 'string') {
            return await loadImageToCanvas(source);
        }
        else {
            const canvas = document.createElement('canvas');
            canvas.width = source.width;
            canvas.height = source.height;
            canvas.getContext('2d').putImageData(source, 0, 0);
            return canvas;
        }
    }
    async sendData(data) {
        await this.bluetoothManager.sendData(data);
    }
}
DothanTechPrinter.ConnectionStatus = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    PRINTING: 'printing',
    ERROR: 'error',
};
DothanTechPrinter.PaperTypeNames = PaperTypeNames;

export { ConnectionStatus, DothanTechPrinter, PaperType, PaperTypeNames };
//# sourceMappingURL=detonger-web-bt.js.map
