import {
  EditSettings,
  HISTOGRAM_BINS,
  HistogramData,
  PREVIEW_MAX_DIMENSION
} from "@/lib/editor-defaults";

interface RenderOptions {
  image: HTMLImageElement;
  settings: EditSettings;
  maxDimension?: number;
}

export interface RenderResult {
  canvas: HTMLCanvasElement;
  histogram: HistogramData;
  width: number;
  height: number;
  scale: number;
}

interface CropRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function computeLuminance(red: number, green: number, blue: number) {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function safeCropPercent(first: number, second: number) {
  const total = first + second;
  if (total <= 95) {
    return [first / 100, second / 100] as const;
  }

  const scale = 95 / total;
  return [(first * scale) / 100, (second * scale) / 100] as const;
}

function getCropRectangle(width: number, height: number, settings: EditSettings): CropRectangle {
  const [topPct, bottomPct] = safeCropPercent(settings.crop.top, settings.crop.bottom);
  const [leftPct, rightPct] = safeCropPercent(settings.crop.left, settings.crop.right);

  const x = width * leftPct;
  const y = height * topPct;
  const cropWidth = Math.max(1, width * (1 - leftPct - rightPct));
  const cropHeight = Math.max(1, height * (1 - topPct - bottomPct));

  return {
    x,
    y,
    width: cropWidth,
    height: cropHeight
  };
}

function blurScalar(input: Float32Array, width: number, height: number, radius: number) {
  if (radius <= 0) {
    return input.slice();
  }

  const temp = new Float32Array(input.length);
  const output = new Float32Array(input.length);
  const windowSize = radius * 2 + 1;

  for (let y = 0; y < height; y += 1) {
    let sum = 0;

    for (let index = -radius; index <= radius; index += 1) {
      const sampleX = clamp(index, 0, width - 1);
      sum += input[y * width + sampleX];
    }

    for (let x = 0; x < width; x += 1) {
      temp[y * width + x] = sum / windowSize;

      const removeX = clamp(x - radius, 0, width - 1);
      const addX = clamp(x + radius + 1, 0, width - 1);
      sum += input[y * width + addX] - input[y * width + removeX];
    }
  }

  for (let x = 0; x < width; x += 1) {
    let sum = 0;

    for (let index = -radius; index <= radius; index += 1) {
      const sampleY = clamp(index, 0, height - 1);
      sum += temp[sampleY * width + x];
    }

    for (let y = 0; y < height; y += 1) {
      output[y * width + x] = sum / windowSize;

      const removeY = clamp(y - radius, 0, height - 1);
      const addY = clamp(y + radius + 1, 0, height - 1);
      sum += temp[addY * width + x] - temp[removeY * width + x];
    }
  }

  return output;
}

function blurRgb(input: Float32Array, width: number, height: number, radius: number) {
  if (radius <= 0) {
    return input.slice();
  }

  const channels = 3;
  const temp = new Float32Array(input.length);
  const output = new Float32Array(input.length);
  const windowSize = radius * 2 + 1;

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width * channels;
    const sum = [0, 0, 0];

    for (let index = -radius; index <= radius; index += 1) {
      const sampleX = clamp(index, 0, width - 1);
      const offset = rowOffset + sampleX * channels;
      sum[0] += input[offset];
      sum[1] += input[offset + 1];
      sum[2] += input[offset + 2];
    }

    for (let x = 0; x < width; x += 1) {
      const offset = rowOffset + x * channels;
      temp[offset] = sum[0] / windowSize;
      temp[offset + 1] = sum[1] / windowSize;
      temp[offset + 2] = sum[2] / windowSize;

      const removeX = clamp(x - radius, 0, width - 1);
      const addX = clamp(x + radius + 1, 0, width - 1);
      const removeOffset = rowOffset + removeX * channels;
      const addOffset = rowOffset + addX * channels;

      sum[0] += input[addOffset] - input[removeOffset];
      sum[1] += input[addOffset + 1] - input[removeOffset + 1];
      sum[2] += input[addOffset + 2] - input[removeOffset + 2];
    }
  }

  for (let x = 0; x < width; x += 1) {
    const sum = [0, 0, 0];

    for (let index = -radius; index <= radius; index += 1) {
      const sampleY = clamp(index, 0, height - 1);
      const offset = sampleY * width * channels + x * channels;
      sum[0] += temp[offset];
      sum[1] += temp[offset + 1];
      sum[2] += temp[offset + 2];
    }

    for (let y = 0; y < height; y += 1) {
      const offset = y * width * channels + x * channels;
      output[offset] = sum[0] / windowSize;
      output[offset + 1] = sum[1] / windowSize;
      output[offset + 2] = sum[2] / windowSize;

      const removeY = clamp(y - radius, 0, height - 1);
      const addY = clamp(y + radius + 1, 0, height - 1);
      const removeOffset = removeY * width * channels + x * channels;
      const addOffset = addY * width * channels + x * channels;

      sum[0] += temp[addOffset] - temp[removeOffset];
      sum[1] += temp[addOffset + 1] - temp[removeOffset + 1];
      sum[2] += temp[addOffset + 2] - temp[removeOffset + 2];
    }
  }

  return output;
}

function processImageData(imageData: ImageData, settings: EditSettings) {
  const pixels = imageData.data;
  const pixelCount = pixels.length / 4;
  const rgb = new Float32Array(pixelCount * 3);
  const alpha = new Float32Array(pixelCount);
  let luminance = new Float32Array(pixelCount);

  const exposureFactor = Math.pow(2, settings.exposure / 50);
  const contrastFactor = 1 + (settings.contrast / 100) * 0.85;
  const saturationFactor = 1 + settings.saturation / 100;
  const vibranceAmount = settings.vibrance / 100;
  const temperatureAmount = settings.temperature / 100;
  const tintAmount = settings.tint / 100;
  const shadowsAmount = settings.shadows / 100;
  const highlightsAmount = settings.highlights / 100;
  const whitesAmount = settings.whites / 100;
  const blacksAmount = settings.blacks / 100;
  const dehazeAmount = settings.dehaze / 100;

  for (let index = 0; index < pixelCount; index += 1) {
    const pixelOffset = index * 4;
    const rgbOffset = index * 3;

    let red = pixels[pixelOffset] / 255;
    let green = pixels[pixelOffset + 1] / 255;
    let blue = pixels[pixelOffset + 2] / 255;

    alpha[index] = pixels[pixelOffset + 3] / 255;

    red += temperatureAmount * 0.09 + tintAmount * 0.03;
    green -= tintAmount * 0.055;
    blue -= temperatureAmount * 0.09 - tintAmount * 0.025;

    red *= exposureFactor;
    green *= exposureFactor;
    blue *= exposureFactor;

    red = (red - 0.5) * contrastFactor + 0.5;
    green = (green - 0.5) * contrastFactor + 0.5;
    blue = (blue - 0.5) * contrastFactor + 0.5;

    let pixelLuminance = computeLuminance(red, green, blue);
    const shadowMask = 1 - pixelLuminance;
    const highlightMask = pixelLuminance;

    if (shadowsAmount !== 0) {
      const lift = shadowsAmount * shadowMask * shadowMask * 0.45;
      red += (1 - red) * lift;
      green += (1 - green) * lift;
      blue += (1 - blue) * lift;
    }

    if (highlightsAmount !== 0) {
      const boost = highlightsAmount * highlightMask * highlightMask * 0.32;
      red += boost;
      green += boost;
      blue += boost;
    }

    if (whitesAmount !== 0) {
      const boost = whitesAmount * Math.pow(highlightMask, 4) * 0.42;
      red += boost;
      green += boost;
      blue += boost;
    }

    if (blacksAmount !== 0) {
      const deepen = blacksAmount * Math.pow(shadowMask, 4) * 0.48;
      red += deepen;
      green += deepen;
      blue += deepen;
    }

    if (dehazeAmount !== 0) {
      const contrastPush = 1 + dehazeAmount * 0.35;
      red = (red - 0.5) * contrastPush + 0.5 - dehazeAmount * 0.02;
      green = (green - 0.5) * contrastPush + 0.5 - dehazeAmount * 0.02;
      blue = (blue - 0.5) * contrastPush + 0.5 - dehazeAmount * 0.02;
    }

    pixelLuminance = computeLuminance(red, green, blue);

    const maxChannel = Math.max(red, green, blue);
    const minChannel = Math.min(red, green, blue);
    const chroma = maxChannel - minChannel;
    const vibranceFactor = 1 + vibranceAmount * (1 - chroma) * 1.15 + dehazeAmount * 0.12;
    const colorFactor = saturationFactor * vibranceFactor;

    red = pixelLuminance + (red - pixelLuminance) * colorFactor;
    green = pixelLuminance + (green - pixelLuminance) * colorFactor;
    blue = pixelLuminance + (blue - pixelLuminance) * colorFactor;

    red = clamp01(red);
    green = clamp01(green);
    blue = clamp01(blue);

    rgb[rgbOffset] = red;
    rgb[rgbOffset + 1] = green;
    rgb[rgbOffset + 2] = blue;
    luminance[index] = computeLuminance(red, green, blue);
  }

  if (settings.clarity !== 0) {
    const blurredLuminance = blurScalar(luminance, imageData.width, imageData.height, 2);
    const clarityAmount = settings.clarity / 100;

    for (let index = 0; index < pixelCount; index += 1) {
      const rgbOffset = index * 3;
      const detail = luminance[index] - blurredLuminance[index];
      const midtoneMask = 1 - Math.min(1, Math.abs(luminance[index] - 0.5) * 1.9);
      const shift = detail * clarityAmount * 1.6 * midtoneMask;

      rgb[rgbOffset] = clamp01(rgb[rgbOffset] + shift);
      rgb[rgbOffset + 1] = clamp01(rgb[rgbOffset + 1] + shift);
      rgb[rgbOffset + 2] = clamp01(rgb[rgbOffset + 2] + shift);

      luminance[index] = computeLuminance(rgb[rgbOffset], rgb[rgbOffset + 1], rgb[rgbOffset + 2]);
    }
  }

  if (settings.noiseReduction > 0 || settings.sharpness > 0) {
    const blurRadius = settings.noiseReduction > 50 || settings.sharpness > 65 ? 2 : 1;
    const blurredRgb = blurRgb(rgb, imageData.width, imageData.height, blurRadius);
    const noiseReductionMix = settings.noiseReduction / 100 * 0.5;
    const sharpnessAmount = settings.sharpness / 100 * 1.15;

    for (let index = 0; index < pixelCount; index += 1) {
      const rgbOffset = index * 3;

      for (let channel = 0; channel < 3; channel += 1) {
        const current = rgb[rgbOffset + channel];
        const blurred = blurredRgb[rgbOffset + channel];

        let nextValue = current;

        if (noiseReductionMix > 0) {
          nextValue = current * (1 - noiseReductionMix) + blurred * noiseReductionMix;
        }

        if (sharpnessAmount > 0) {
          nextValue += (current - blurred) * sharpnessAmount;
        }

        rgb[rgbOffset + channel] = clamp01(nextValue);
      }
    }
  }

  const output = new ImageData(imageData.width, imageData.height);
  const histogram: HistogramData = {
    red: Array.from({ length: HISTOGRAM_BINS }, () => 0),
    green: Array.from({ length: HISTOGRAM_BINS }, () => 0),
    blue: Array.from({ length: HISTOGRAM_BINS }, () => 0),
    luminance: Array.from({ length: HISTOGRAM_BINS }, () => 0)
  };

  for (let index = 0; index < pixelCount; index += 1) {
    const pixelOffset = index * 4;
    const rgbOffset = index * 3;

    const red = clamp01(rgb[rgbOffset]);
    const green = clamp01(rgb[rgbOffset + 1]);
    const blue = clamp01(rgb[rgbOffset + 2]);
    const pixelAlpha = clamp01(alpha[index]);

    output.data[pixelOffset] = Math.round(red * 255);
    output.data[pixelOffset + 1] = Math.round(green * 255);
    output.data[pixelOffset + 2] = Math.round(blue * 255);
    output.data[pixelOffset + 3] = Math.round(pixelAlpha * 255);

    if (pixelAlpha > 0.01) {
      const redBin = Math.min(HISTOGRAM_BINS - 1, Math.floor(red * (HISTOGRAM_BINS - 1)));
      const greenBin = Math.min(HISTOGRAM_BINS - 1, Math.floor(green * (HISTOGRAM_BINS - 1)));
      const blueBin = Math.min(HISTOGRAM_BINS - 1, Math.floor(blue * (HISTOGRAM_BINS - 1)));
      const luminanceBin = Math.min(
        HISTOGRAM_BINS - 1,
        Math.floor(computeLuminance(red, green, blue) * (HISTOGRAM_BINS - 1))
      );

      histogram.red[redBin] += 1;
      histogram.green[greenBin] += 1;
      histogram.blue[blueBin] += 1;
      histogram.luminance[luminanceBin] += 1;
    }
  }

  return {
    imageData: output,
    histogram
  };
}

function rotateCanvas(sourceCanvas: HTMLCanvasElement, totalDegrees: number) {
  const radians = (totalDegrees * Math.PI) / 180;

  if (Math.abs(radians) < 0.0001) {
    return sourceCanvas;
  }

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const outputWidth = Math.ceil(width * cos + height * sin);
  const outputHeight = Math.ceil(width * sin + height * cos);

  const canvas = createCanvas(outputWidth, outputHeight);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Skyroom could not create a rotation canvas.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.translate(outputWidth / 2, outputHeight / 2);
  context.rotate(radians);
  context.drawImage(sourceCanvas, -width / 2, -height / 2);

  return canvas;
}

export function renderImageToCanvas({
  image,
  settings,
  maxDimension = PREVIEW_MAX_DIMENSION
}: RenderOptions): RenderResult {
  const cropRectangle = getCropRectangle(image.naturalWidth, image.naturalHeight, settings);
  const scale = maxDimension
    ? Math.min(1, maxDimension / Math.max(cropRectangle.width, cropRectangle.height))
    : 1;

  const targetWidth = Math.max(1, Math.round(cropRectangle.width * scale));
  const targetHeight = Math.max(1, Math.round(cropRectangle.height * scale));
  const workingCanvas = createCanvas(targetWidth, targetHeight);
  const workingContext = workingCanvas.getContext("2d", { willReadFrequently: true });

  if (!workingContext) {
    throw new Error("Skyroom could not initialize the preview canvas.");
  }

  workingContext.imageSmoothingEnabled = true;
  workingContext.imageSmoothingQuality = "high";
  workingContext.drawImage(
    image,
    cropRectangle.x,
    cropRectangle.y,
    cropRectangle.width,
    cropRectangle.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  const sourceData = workingContext.getImageData(0, 0, targetWidth, targetHeight);
  const processed = processImageData(sourceData, settings);

  workingContext.putImageData(processed.imageData, 0, 0);

  const outputCanvas = rotateCanvas(workingCanvas, settings.rotation + settings.straighten);

  return {
    canvas: outputCanvas,
    histogram: processed.histogram,
    width: outputCanvas.width,
    height: outputCanvas.height,
    scale
  };
}
