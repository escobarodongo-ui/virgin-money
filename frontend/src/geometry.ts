import type { Quad, Region } from "./types";

/** Straight blend between sampled boxes. Optical-flow tracking replaces this later. */
export function quadAt(region: Region, frame: number): Quad | null {
  if (frame < region.start_frame || frame > region.end_frame) return null;
  const samples = region.frames;
  if (samples.length === 0) return null;
  let previous = samples[0];
  let next = samples[samples.length - 1];
  for (const sample of samples) {
    if (sample.frame_index === frame) return sample.quad;
    if (sample.frame_index < frame) previous = sample;
    else {
      next = sample;
      break;
    }
  }
  if (previous.frame_index === next.frame_index) return previous.quad;
  const span = next.frame_index - previous.frame_index;
  const t = (frame - previous.frame_index) / span;
  return previous.quad.map((point, index) => [
    point[0] + (next.quad[index][0] - point[0]) * t,
    point[1] + (next.quad[index][1] - point[1]) * t,
  ]);
}

export function formatTimecode(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return "0:00.0";
  const sign = seconds < 0 ? "-" : "";
  const abs = Math.abs(seconds);
  const mins = Math.floor(abs / 60);
  const rest = abs - mins * 60;
  return `${sign}${mins}:${rest.toFixed(1).padStart(4, "0")}`;
}
