import { createWorker, PSM } from "tesseract.js";
import { DEFAULT_FONT, DEFAULT_WEIGHT, type Spot } from "./spots";

type Worker = Awaited<ReturnType<typeof createWorker>>;

let workerPromise: Promise<Worker> | null = null;
let tail: Promise<unknown> = Promise.resolve();

function queue<T>(job: () => Promise<T>): Promise<T> {
  const run = tail.then(job, job);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function worker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng", 1, {
      logger: () => undefined,
    }).then(async (instance) => {
      await instance.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      });
      return instance;
    });
  }
  return workerPromise;
}

export type Ink = { color: string; background: string };

function keepText(text: string, confidence: number) {
  const compact = text.replace(/\s/g, "");
  const core = compact.replace(/[^A-Za-z0-9]/g, "");
  if (!core || core.length < compact.length * 0.6) return false;
  return confidence >= (core.length < 2 ? 70 : 25);
}

function wordSpot(
  bbox: { x0: number; y0: number; x1: number; y1: number },
  text: string,
  context: CanvasRenderingContext2D,
  toSourceX: number,
  toSourceY: number,
) {
  const box = {
    x: bbox.x0 * toSourceX,
    y: bbox.y0 * toSourceY,
    w: Math.max(8, (bbox.x1 - bbox.x0) * toSourceX),
    h: Math.max(8, (bbox.y1 - bbox.y0) * toSourceY),
  };
  const ink = sampleInk(context, {
    x: bbox.x0,
    y: bbox.y0,
    w: bbox.x1 - bbox.x0,
    h: bbox.y1 - bbox.y0,
  });
  return { box, original: text, ...ink, fontFamily: DEFAULT_FONT, fontWeight: DEFAULT_WEIGHT, angle: 0 };
}

export async function warmFrame(video: HTMLVideoElement) {
  if (!isBlank(video)) return;
  const next = Math.min(0.05, Math.max((video.duration || 0.05) - 0.01, 0));
  if (next <= video.currentTime + 0.001) return;
  video.currentTime = next;
  await new Promise<void>((resolve) => video.addEventListener("seeked", () => resolve(), { once: true }));
}

function isBlank(video: HTMLVideoElement) {
  if (!video.videoWidth) return true;
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return false;
  context.drawImage(video, 0, 0, 24, 24);
  const data = context.getImageData(0, 0, 24, 24).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += data[i] + data[i + 1] + data[i + 2];
  return sum / (24 * 24) < 12;
}

export function readFrame(
  video: HTMLVideoElement,
  sourceWidth: number,
  sourceHeight: number,
): Promise<Array<Pick<Spot, "box" | "original" | "color" | "background" | "fontFamily" | "fontWeight" | "angle">>> {
  return queue(() => readFrameNow(video, sourceWidth, sourceHeight));
}

async function readFrameNow(
  video: HTMLVideoElement,
  sourceWidth: number,
  sourceHeight: number,
): Promise<Array<Pick<Spot, "box" | "original" | "color" | "background" | "fontFamily" | "fontWeight" | "angle">>> {
  await warmFrame(video);
  const mediaWidth = video.videoWidth || sourceWidth;
  const mediaHeight = video.videoHeight || sourceHeight;
  const scale = Math.min(1, 1280 / mediaWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(mediaWidth * scale));
  canvas.height = Math.max(1, Math.round(mediaHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const result = await (await worker()).recognize(canvas, {}, { blocks: true, text: true });
  const toSourceX = sourceWidth / canvas.width;
  const toSourceY = sourceHeight / canvas.height;
  const found: Array<Pick<Spot, "box" | "original" | "color" | "background" | "fontFamily" | "fontWeight" | "angle">> = [];

  for (const block of result.data.blocks ?? []) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        const kept: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }> = [];
        for (const word of line.words ?? []) {
          const text = word.text.replace(/\s+/g, " ").trim();
          if (!keepText(text, word.confidence)) continue;
          kept.push({ text, bbox: word.bbox });
        }
        if (kept.length > 1) {
          const x0 = Math.min(...kept.map((word) => word.bbox.x0));
          const y0 = Math.min(...kept.map((word) => word.bbox.y0));
          const x1 = Math.max(...kept.map((word) => word.bbox.x1));
          const y1 = Math.max(...kept.map((word) => word.bbox.y1));
          found.push(wordSpot({ x0, y0, x1, y1 }, kept.map((word) => word.text).join(" "), context, toSourceX, toSourceY));
        } else if (kept.length === 1) {
          found.push(wordSpot(kept[0].bbox, kept[0].text, context, toSourceX, toSourceY));
        }
      }
    }
  }
  return found;
}

export function sampleInk(
  context: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
): Ink {
  const x = clamp(Math.floor(box.x), 0, context.canvas.width - 1);
  const y = clamp(Math.floor(box.y), 0, context.canvas.height - 1);
  const w = clamp(Math.floor(box.w), 1, context.canvas.width - x);
  const h = clamp(Math.floor(box.h), 1, context.canvas.height - y);
  const pixels = context.getImageData(x, y, w, h).data;
  const corners = [
    pixel(pixels, 0, 0, w),
    pixel(pixels, w - 1, 0, w),
    pixel(pixels, 0, h - 1, w),
    pixel(pixels, w - 1, h - 1, w),
  ];
  const background = average(corners);
  const ink: Array<[number, number, number]> = [];
  for (let py = 0; py < h; py += 1) {
    for (let px = 0; px < w; px += 1) {
      const sample = pixel(pixels, px, py, w);
      if (Math.abs(luma(sample) - luma(background)) > 42) ink.push(sample);
    }
  }
  const color = ink.length > 8 ? average(ink) : invert(background);
  return { background: rgb(background), color: rgb(color) };
}

export function captureFrame(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1;
  canvas.height = video.videoHeight || 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return context;
}

function pixel(data: Uint8ClampedArray, x: number, y: number, width: number): [number, number, number] {
  const index = (y * width + x) * 4;
  return [data[index] ?? 0, data[index + 1] ?? 0, data[index + 2] ?? 0];
}

function average(samples: Array<[number, number, number]>): [number, number, number] {
  const total = samples.reduce((sum, sample) => [sum[0] + sample[0], sum[1] + sample[1], sum[2] + sample[2]], [0, 0, 0]);
  return [
    Math.round(total[0] / samples.length),
    Math.round(total[1] / samples.length),
    Math.round(total[2] / samples.length),
  ];
}

function luma([r, g, b]: [number, number, number]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function invert(sample: [number, number, number]): [number, number, number] {
  return luma(sample) > 140 ? [20, 16, 12] : [245, 240, 230];
}

function rgb(sample: [number, number, number]) {
  return `rgb(${sample[0]}, ${sample[1]}, ${sample[2]})`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
