/**
 * DothanTech Printer Library - Canvas Processor
 *
 * Converts canvas and image data to DothanTech printer protocol commands.
 */
import type { TextPrintOptions, ImagePrintOptions, PrintStats } from './types';
/**
 * Convert a canvas to DothanTech protocol command stream.
 * Uses repeat-count and offset compression for efficient transmission.
 * @param canvas - The canvas element to convert.
 * @param options - Image print options.
 * @param debug - Enable debug logging.
 * @returns The encoded command data and conversion stats.
 */
export declare function canvasToDothanTech(canvas: HTMLCanvasElement, options?: ImagePrintOptions, debug?: boolean): Promise<{
    data: Uint8Array;
    stats: Omit<PrintStats, 'conversionTime' | 'transmissionTime' | 'transmissionSpeed'>;
}>;
/**
 * Render text onto a canvas element with the given formatting options.
 * @param text - The text to render.
 * @param options - Text formatting options.
 * @param printerDPI - Printer DPI for pixel-to-mm conversion.
 * @param paperWidthMm - Paper width in mm (fallback when maxWidth is not set in options).
 * @returns A canvas element with the rendered text.
 */
export declare function renderTextToCanvas(text: string, options?: TextPrintOptions, printerDPI?: number, paperWidthMm?: number): HTMLCanvasElement;
/**
 * Scale a canvas to a maximum width specified in millimeters.
 * @param canvas - The source canvas.
 * @param maxWidthMm - Maximum width in mm. If undefined, falls back to paperWidthMm.
 * @param printerDPI - Printer DPI for conversion.
 * @param paperWidthMm - Paper width in mm (fallback when maxWidthMm is not set).
 * @returns The original or a scaled canvas.
 */
export declare function scaleCanvasByMaxWidth(canvas: HTMLCanvasElement, maxWidthMm: number | undefined, printerDPI: number, paperWidthMm: number): HTMLCanvasElement;
/**
 * Load an image from a URL into a canvas element.
 * @param imageUrl - The URL of the image to load.
 * @returns A Promise resolving to a canvas with the loaded image.
 */
export declare function loadImageToCanvas(imageUrl: string): Promise<HTMLCanvasElement>;
