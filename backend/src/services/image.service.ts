import sharp from "sharp";

const BLUR_THRESHOLD = 100;
const EXPOSURE_THRESHOLD = 0.01; // 1%

interface ImageQualityResult {
  isBlurry: boolean;
  focusScore: number;
  isOverExposed: boolean;
  isUnderExposed: boolean;
}

export class ImageService {
  static async checkImageQuality(
    imageBuffer: Buffer
  ): Promise<ImageQualityResult> {
    const image = sharp(imageBuffer);

    // Get image stats and convert to grayscale for analysis
    const { width, height } = await image.metadata();
    const grayscaleBuffer = await image.greyscale().raw().toBuffer();

    // Calculate focus score using edge detection approximation
    const focusScore = this.calculateFocusScore(
      grayscaleBuffer,
      width!,
      height!
    );
    const isBlurry = focusScore < BLUR_THRESHOLD;

    // Check exposure using histogram analysis
    const { isOverExposed, isUnderExposed } = await this.checkExposure(image);

    return {
      isBlurry,
      focusScore,
      isOverExposed,
      isUnderExposed,
    };
  }

  private static calculateFocusScore(
    buffer: Buffer,
    width: number,
    height: number
  ): number {
    let variance = 0;
    let mean = 0;
    const totalPixels = width * height;

    // Calculate mean
    for (let i = 0; i < buffer.length; i++) {
      mean += buffer[i];
    }
    mean /= totalPixels;

    // Calculate variance using edge approximation
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const current = buffer[idx];
        const right = buffer[idx + 1];
        const bottom = buffer[idx + width];

        // Simple edge detection (horizontal + vertical gradients)
        const gradient = Math.abs(current - right) + Math.abs(current - bottom);
        variance += Math.pow(gradient - mean, 2);
      }
    }

    return variance / totalPixels;
  }

  private static async checkExposure(
    image: sharp.Sharp
  ): Promise<{ isOverExposed: boolean; isUnderExposed: boolean }> {
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });
    const totalPixels = info.width * info.height;
    const channels = info.channels;

    let underExposedCount = 0;
    let overExposedCount = 0;

    for (let i = 0; i < data.length; i += channels) {
      // Calculate luminance for RGB
      const r = data[i];
      const g = data[i + 1] || r;
      const b = data[i + 2] || r;
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      if (luminance < 10) underExposedCount++;
      if (luminance > 245) overExposedCount++;
    }

    const underExposedRatio = underExposedCount / totalPixels;
    const overExposedRatio = overExposedCount / totalPixels;

    return {
      isUnderExposed: underExposedRatio > EXPOSURE_THRESHOLD,
      isOverExposed: overExposedRatio > EXPOSURE_THRESHOLD,
    };
  }
}
