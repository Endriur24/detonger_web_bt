/**
 * DothanTech Printer Library - Dithering Algorithms
 */
export interface DitheringOptions {
    ditherMethod?: 'atkinson' | 'threshold' | 'none';
    threshold?: number;
}
export interface ImageDataLike {
    data: Uint8ClampedArray;
    width: number;
    height: number;
}
/**
 * Convert image to grayscale using luminance weights (R*0.21 + G*0.71 + B*0.07).
 */
export declare function greyscaleLuminance(image: ImageDataLike): ImageDataLike;
/**
 * Apply Atkinson dithering to image data.
 * @param image - Image data to process.
 * @param imageWidth - Image width in pixels.
 */
export declare function ditherAtkinson(image: ImageDataLike, imageWidth: number): ImageDataLike;
/**
 * Apply simple threshold dithering.
 * @param image - Image data to process.
 * @param thresholdValue - Threshold value (0-255).
 */
export declare function ditherThreshold(image: ImageDataLike, thresholdValue?: number): ImageDataLike;
/**
 * Apply dithering to image data. Converts to grayscale first, then applies the selected method.
 * @param imageData - Image data to process.
 * @param options - Dithering options.
 */
export declare function applyDithering(imageData: ImageDataLike, options?: DitheringOptions): ImageDataLike;
