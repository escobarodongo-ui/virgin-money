import type { Box } from "./spots";

export type Look = {
  fontFamily: string;
  fontWeight: number;
};

type Rgb = [number, number, number];

const CANDIDATES: Look[] = [
  { fontFamily: "Anton", fontWeight: 400 },
  { fontFamily: "Archivo Black", fontWeight: 400 },
  { fontFamily: "Bebas Neue", fontWeight: 400 },
  { fontFamily: "Oswald", fontWeight: 700 },
  { fontFamily: "Oswald", fontWeight: 500 },
  { fontFamily: "Roboto Condensed", fontWeight: 700 },
  { fontFamily: "Roboto", fontWeight: 700 },
  { fontFamily: "Roboto", fontWeight: 400 },
  { fontFamily: "Libre Baskerville", fontWeight: 700 },
  { fontFamily: "Arial", fontWeight: 700 },
  { fontFamily: "Arial", fontWeight: 400 },
  { fontFamily: "Impact", fontWeight: 400 },
  { fontFamily: "Georgia", fontWeight: 700 },
  { fontFamily: "Courier New", fontWeight: 700 },
];

let fontsReady: Promise<void> | null = null;

function ensureFonts() {
  if (!fontsReady) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Bebas+Neue&family=Libre+Baskerville:wght@700&family=Oswald:wght@500;700&family=Roboto+Condensed:wght@700&family=Roboto:ital,wght@0,400;0,700;1,700&display=swap";
    document.head.appendChild(link);
    fontsReady = Promise.race([
      document.fonts.ready.then(() => undefined),
      new Promise<void>((resolve) => window.setTimeout(resolve, 4000)),
    ]);
  }
  return fontsReady;
}

function fontSpec(look: Look, size: number, italic = false) {
  return `${italic ? "italic " : ""}${look.fontWeight} ${size}px "${look.fontFamily}"`;
}

export function fitFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  look: Look,
  box: Box,
) {
  let low = 4;
  let high = Math.max(8, box.h * 1.35);
  for (let step = 0; step < 12; step += 1) {
    const size = (low + high) / 2;
    context.font = fontSpec(look, size);
    const metrics = context.measureText(text);
    const height = (metrics.actualBoundingBoxAscent || size * 0.78) + (metrics.actualBoundingBoxDescent || size * 0.18);
    if (height > box.h * 0.9 || metrics.width > box.w * 0.96) high = size;
    else low = size;
  }
  return low;
}

export function glyphAngle(context: CanvasRenderingContext2D, box: Box) {
  const crop = cropBox(context, box);
  if (!crop) return 0;
  const mask = inkMask(crop.pixels, crop.width, crop.height);
  if (mask.ink < 12) return 0;
  let meanX = 0;
  let meanY = 0;
  for (let y = 0; y < crop.height; y += 1) {
    for (let x = 0; x < crop.width; x += 1) {
      if (!mask.mask[y * crop.width + x]) continue;
      meanX += x;
      meanY += y;
    }
  }
  meanX /= mask.ink;
  meanY /= mask.ink;
  let xx = 0;
  let xy = 0;
  let yy = 0;
  for (let y = 0; y < crop.height; y += 1) {
    for (let x = 0; x < crop.width; x += 1) {
      if (!mask.mask[y * crop.width + x]) continue;
      const dx = x - meanX;
      const dy = y - meanY;
      xx += dx * dx;
      xy += dx * dy;
      yy += dy * dy;
    }
  }
  const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
  return Math.abs(angle) > 0.6 ? 0 : angle;
}

export function paintReplacement(
  context: CanvasRenderingContext2D,
  box: Box,
  text: string,
  look: Look & { color: string; background: string; angle?: number },
) {
  const angle = look.angle ?? 0;
  const padX = box.w * 0.08;
  const padY = box.h * 0.22;
  const width = box.w + padX * 2;
  const height = box.h + padY * 2;
  const centerX = box.x + box.w / 2;
  const centerY = box.y + box.h / 2;
  context.save();
  context.translate(centerX, centerY);
  context.rotate(angle);
  context.fillStyle = look.background;
  context.fillRect(-width / 2, -height / 2, width, height);
  const fitted = { x: -box.w / 2, y: -box.h / 2, w: box.w, h: box.h };
  const size = fitFontSize(context, text, look, { x: 0, y: 0, w: box.w, h: box.h });
  context.font = fontSpec(look, size);
  context.fillStyle = look.color;
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  const metrics = context.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent || size * 0.78;
  const descent = metrics.actualBoundingBoxDescent || size * 0.18;
  context.fillText(text, 0, (fitted.h - (ascent + descent)) / 2 + ascent - box.h / 2);
  context.restore();
}

export async function matchLook(
  context: CanvasRenderingContext2D,
  box: Box,
  text: string,
): Promise<Look> {
  const fallback = { fontFamily: "Oswald", fontWeight: 700 };
  const word = text.trim();
  if (!word) return fallback;
  await ensureFonts();
  const crop = cropBox(context, box);
  if (!crop) return fallback;
  const mask = inkMask(crop.pixels, crop.width, crop.height);
  if (mask.ink < 12) return fallback;
  let best = fallback;
  let bestScore = -1;
  for (const candidate of CANDIDATES) {
    try {
      await document.fonts.load(fontSpec(candidate, 48));
    } catch {
      continue;
    }
    const score = scoreFont(crop, mask, word, candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

function cropBox(context: CanvasRenderingContext2D, box: Box) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  const x = clamp(Math.floor(box.x), 0, width - 1);
  const y = clamp(Math.floor(box.y), 0, height - 1);
  const w = clamp(Math.floor(box.w), 1, width - x);
  const h = clamp(Math.floor(box.h), 1, height - y);
  const scale = Math.min(1, 180 / w);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const copy = canvas.getContext("2d", { willReadFrequently: true });
  if (!copy) return null;
  copy.drawImage(context.canvas, x, y, w, h, 0, 0, canvas.width, canvas.height);
  return {
    pixels: copy.getImageData(0, 0, canvas.width, canvas.height).data,
    width: canvas.width,
    height: canvas.height,
  };
}

function inkMask(pixels: Uint8ClampedArray, width: number, height: number) {
  const corners = [
    rgbAt(pixels, 0),
    rgbAt(pixels, width - 1),
    rgbAt(pixels, (height - 1) * width),
    rgbAt(pixels, height * width - 1),
  ];
  const background = average(corners);
  const mask = new Uint8Array(width * height);
  let ink = 0;
  for (let index = 0; index < mask.length; index += 1) {
    const sample = rgbAt(pixels, index);
    if (Math.abs(luma(sample) - luma(background)) > 36) {
      mask[index] = 1;
      ink += 1;
    }
  }
  return { mask, ink, background };
}

function scoreFont(
  crop: { width: number; height: number },
  mask: { mask: Uint8Array; ink: number; background: Rgb },
  text: string,
  look: Look,
) {
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return -1;
  const box = { x: 0, y: 0, w: crop.width, h: crop.height };
  context.fillStyle = rgb(mask.background);
  context.fillRect(0, 0, crop.width, crop.height);
  const size = fitFontSize(context, text, look, box);
  context.font = fontSpec(look, size);
  context.fillStyle = luma(mask.background) > 140 ? "#111111" : "#f4f4f4";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, crop.width / 2, crop.height / 2);
  const painted = context.getImageData(0, 0, crop.width, crop.height).data;
  let hit = 0;
  let extra = 0;
  for (let index = 0; index < mask.mask.length; index += 1) {
    const sample = rgbAt(painted, index);
    const isPaint = Math.abs(luma(sample) - luma(mask.background)) > 36;
    if (mask.mask[index] && isPaint) hit += 1;
    else if (isPaint) extra += 1;
  }
  return hit / (mask.ink + extra + 1);
}

function rgbAt(pixels: Uint8ClampedArray, index: number): Rgb {
  const offset = index * 4;
  return [pixels[offset] ?? 0, pixels[offset + 1] ?? 0, pixels[offset + 2] ?? 0];
}

function average(samples: Rgb[]): Rgb {
  const total = samples.reduce((sum, sample) => [sum[0] + sample[0], sum[1] + sample[1], sum[2] + sample[2]], [0, 0, 0] as Rgb);
  return total.map((value) => Math.round(value / samples.length)) as Rgb;
}

function luma([r, g, b]: Rgb) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function rgb(sample: Rgb) {
  return `rgb(${sample[0]}, ${sample[1]}, ${sample[2]})`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
