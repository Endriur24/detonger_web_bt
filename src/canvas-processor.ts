/**
 * DothanTech Printer Library - Canvas Processor
 *
 * Converts canvas and image data to DothanTech printer protocol commands.
 */

import type { TextPrintOptions, ImagePrintOptions, PrintStats } from './types';
import { CMD_PRINT_INIT, CMD_PRINT_LINE, CMD_LINE_WIDTH, CMD_PRINT_END } from './constants';
import { buildCommand, encodeShort, createDebugLogger } from './protocol';
import { applyDithering } from './dithering';

/**
 * Convert a canvas to DothanTech protocol command stream.
 * Uses repeat-count and offset compression for efficient transmission.
 * @param canvas - The canvas element to convert.
 * @param options - Image print options.
 * @param debug - Enable debug logging.
 * @returns The encoded command data and conversion stats.
 */
export async function canvasToDothanTech(
  canvas: HTMLCanvasElement,
  options: ImagePrintOptions = {},
  debug = false
): Promise<{ data: Uint8Array; stats: Omit<PrintStats, 'conversionTime' | 'transmissionTime' | 'transmissionSpeed'> }> {
  const {
    invertColors = false,
    ditherMethod = 'none',
    threshold = 192,
  } = options;
  const debugLog = createDebugLogger(debug);

  const ctx = canvas.getContext('2d')!;
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  if (ditherMethod !== 'none') {
    debugLog(`Applying dithering: method=${ditherMethod}, threshold=${threshold}`);
    applyDithering(imageData, { ditherMethod, threshold });
  }

  const lineBytes = Math.ceil(width / 8);
  const commands: number[] = [];

  const pageKey = Math.floor(Math.random() * 65535);
  const initData = [(pageKey >> 8) & 0xFF, pageKey & 0xFF, 0, 0, 0, 0, 0, 0];
  commands.push(...buildCommand(CMD_PRINT_INIT, ...initData));

  const widthEncoded = encodeShort(lineBytes);
  commands.push(...buildCommand(CMD_LINE_WIDTH, ...widthEncoded, 1));

  let lastLine: number[] | null = null;
  let lastLineStr = '';
  let repeatCount = 0;
  let commandsCount = 0;

  for (let y = 0; y < height; y++) {
    const lineData: number[] = [];

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
    } else {
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

  debugLog(
    `Conversion done – commands=${commandsCount}, bytes=${data.length}, ` +
    `compression=${((1 - data.length / (lineBytes * height)) * 100).toFixed(1)}%`
  );

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
export function renderTextToCanvas(
  text: string,
  options: TextPrintOptions = {},
  printerDPI: number = 203,
  paperWidthPx: number = 58
): HTMLCanvasElement {
  const {
    fontSize    = 24,
    fontFamily  = 'Arial',
    fontWeight  = 'normal',
    fontStyle   = 'normal',
    textAlign   = 'left',
    lineHeight  = 1.2,
    padding     = [2, 2, 2, 2],
    maxWidth,
    autoScale   = false,
    minScale    = 0.3,
    autoWrap    = false,
  } = options;

  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d')!;

  const dpi = printerDPI;
  const pxPerMm = dpi / 25.4;

  const [padTopMM, padRightMM, padBottomMM, padLeftMM] = padding;
  const padTop    = padTopMM * pxPerMm;
  const padRight  = padRightMM * pxPerMm;
  const padBottom = padBottomMM * pxPerMm;
  const padLeft   = padLeftMM * pxPerMm;

  const effectiveMaxWidthPx = (maxWidth ?? paperWidthPx) * pxPerMm;
  const maxContentWidthPx = effectiveMaxWidthPx - (padLeft + padRight);

  const wrapText = (lines: string[], maxWidth: number, font: string): string[] => {
    ctx.font = font;
    const result: string[] = [];

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
          } else {
            if (currentLine) result.push(currentLine);
            currentLine = char;
          }
        }
        if (currentLine) result.push(currentLine);
      } else {
        let currentLine = '';
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          if (!word) continue;

          const testLine = currentLine + word;

          if (ctx.measureText(testLine).width <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine.trim()) {
              result.push(currentLine.trim());
              currentLine = /^\s+$/.test(word) ? '' : word;
            } else {
              if (/^\s+$/.test(word)) {
                currentLine = '';
              } else {
                let charLine = '';
                for (const char of word) {
                  const testCharLine = charLine + char;
                  if (ctx.measureText(testCharLine).width <= maxWidth) {
                    charLine = testCharLine;
                  } else {
                    if (charLine) result.push(charLine);
                    charLine = char;
                  }
                }
                currentLine = charLine;
              }
            }
          }
        }
        if (currentLine.trim()) result.push(currentLine.trim());
      }
    }

    return result;
  };

  const measureWidestLine = (size: number, linesToMeasure: string[]): number => {
    const font = `${fontStyle} ${fontWeight} ${size}px ${fontFamily}`;
    ctx.font = font;
    let maxW = 0;
    linesToMeasure.forEach(line => {
      const w = ctx.measureText(line).width;
      if (w > maxW) maxW = w;
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
    if (w > contentWidth) contentWidth = w;
  });

  if (maxContentWidthPx > 0) {
    contentWidth = Math.min(contentWidth, maxContentWidthPx);
  }

  canvas.width  = Math.ceil(contentWidth + padLeft + padRight);
  canvas.height = Math.ceil(finalLines.length * lineHeightPx + padTop + padBottom);

  ctx.font        = font;
  ctx.fillStyle   = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle   = 'black';
  ctx.textBaseline = 'top';

  finalLines.forEach((line, i) => {
    let x = padLeft;
    if (textAlign === 'center') {
      x = (canvas.width - ctx.measureText(line).width) / 2;
    } else if (textAlign === 'right') {
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
export function scaleCanvasByMaxWidth(
  canvas: HTMLCanvasElement,
  maxWidthMm: number | undefined,
  printerDPI: number,
  paperWidthPx: number
): HTMLCanvasElement {

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
  const ctx = scaledCanvas.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0, newWidth, newHeight);

  return scaledCanvas;
}

/**
 * Load an image from a URL into a canvas element.
 * @param imageUrl - The URL of the image to load.
 * @returns A Promise resolving to a canvas with the loaded image.
 */
export async function loadImageToCanvas(imageUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img       = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas  = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src     = imageUrl;
  });
}
