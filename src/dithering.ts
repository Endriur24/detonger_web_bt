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

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Convert image to grayscale using luminance weights (R*0.21 + G*0.71 + B*0.07).
 */
export function greyscaleLuminance(image: ImageDataLike): ImageDataLike {
  const { data } = image;
  for (let i = 0; i <= data.length; i += 4) {
    const gray = Math.floor(data[i] * 0.21 + data[i + 1] * 0.71 + data[i + 2] * 0.07);
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  return image;
}

/**
 * Convert image to grayscale using average of RGB channels.
 */
export function greyscaleAverage(image: ImageDataLike): ImageDataLike {
  const { data } = image;
  for (let i = 0; i <= data.length; i += 4) {
    const gray = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  return image;
}

/**
 * Apply Atkinson dithering to image data.
 * @param image - Image data to process.
 * @param imageWidth - Image width in pixels.
 */
export function ditherAtkinson(image: ImageDataLike, imageWidth: number): ImageDataLike {
  const { data } = image;
  const dataLength = data.length;
  const skipPixels = 4;
  const clamp = (val: number): number => Math.max(0, Math.min(255, val));

  for (let i = 0; i <= dataLength; i += skipPixels) {
    const oldPixel = data[i];
    const newPixel = oldPixel <= 128 ? 0 : 255;
    const error = Math.floor((oldPixel - newPixel) / 8);
    data[i] = newPixel;

    if (i + 4 < dataLength) data[i + 4] = clamp(data[i + 4] + error);
    if (i + 8 < dataLength) data[i + 8] = clamp(data[i + 8] + error);

    const belowLeft = i + (4 * imageWidth) - 4;
    if (belowLeft < dataLength && belowLeft >= 0) data[belowLeft] = clamp(data[belowLeft] + error);

    const below = i + (4 * imageWidth);
    if (below < dataLength) data[below] = clamp(data[below] + error);

    const belowRight = i + (4 * imageWidth) + 4;
    if (belowRight < dataLength) data[belowRight] = clamp(data[belowRight] + error);

    const belowBelow = i + (8 * imageWidth);
    if (belowBelow < dataLength) data[belowBelow] = clamp(data[belowBelow] + error);

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
export function ditherThreshold(image: ImageDataLike, thresholdValue = 128): ImageDataLike {
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
 * Replace colors with black and white based on brightness.
 * @param image - Image data.
 * @param black - Replacement color for dark pixels.
 * @param white - Replacement color for light pixels.
 */
export function replaceColours(
  image: ImageDataLike,
  black: RgbaColor,
  white: RgbaColor
): ImageDataLike {
  const { data } = image;
  for (let i = 0; i <= data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const isBlack = avg < 127;
    const color = isBlack ? black : white;
    data[i] = color.r;
    data[i + 1] = color.g;
    data[i + 2] = color.b;
    data[i + 3] = color.a;
  }
  return image;
}

/**
 * Apply dithering to image data. Converts to grayscale first, then applies the selected method.
 * @param imageData - Image data to process.
 * @param options - Dithering options.
 */
export function applyDithering(imageData: ImageDataLike, options: DitheringOptions = {}): ImageDataLike {
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
