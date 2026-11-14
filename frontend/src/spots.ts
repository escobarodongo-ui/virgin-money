export type Box = { x: number; y: number; w: number; h: number };

export type Spot = {
  id: string;
  frame: number;
  box: Box;
  original: string;
  replacement: string;
  color: string;
  background: string;
  fontFamily: string;
  fontWeight: number;
  angle: number;
};

export type Sample = {
  time: number;
  box: Box;
  color: string;
  background: string;
  angle: number;
};

export type Lock = {
  id: string;
  original: string;
  replacement: string;
  fontFamily: string;
  fontWeight: number;
  angle: number;
  color: string;
  background: string;
  anchor: Box;
  manual: boolean;
  samples: Sample[];
  scanned: boolean;
};

export const DEFAULT_FONT = "Oswald";
export const DEFAULT_WEIGHT = 700;

export function newSpotId() {
  return `s${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export function normText(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

export function showsReplacement(spot: { original: string; replacement: string }) {
  const next = spot.replacement.trim();
  if (!next) return false;
  return next !== spot.original.trim();
}

export function appearance(lock: Lock, time: number): { box: Box; color: string; background: string; angle: number } | null {
  if (!showsReplacement(lock)) return null;
  const anchor = { box: lock.anchor, color: lock.color, background: lock.background, angle: lock.angle };
  if (lock.manual || lock.samples.length === 0) return anchor;
  let before: Sample | null = null;
  let after: Sample | null = null;
  for (const sample of lock.samples) {
    if (sample.time <= time) before = sample;
    if (sample.time >= time && !after) after = sample;
  }
  if (before && after && before !== after) {
    const span = after.time - before.time || 1;
    const mix = (time - before.time) / span;
    return {
      box: {
        x: before.box.x + (after.box.x - before.box.x) * mix,
        y: before.box.y + (after.box.y - before.box.y) * mix,
        w: before.box.w + (after.box.w - before.box.w) * mix,
        h: before.box.h + (after.box.h - before.box.h) * mix,
      },
      color: before.color,
      background: before.background,
      angle: before.angle + (after.angle - before.angle) * mix,
    };
  }
  const nearest = before ?? after;
  if (!nearest) return anchor;
  const distance = Math.abs(nearest.time - time);
  if (!lock.scanned && distance > 0.45) return anchor;
  if (lock.scanned && distance > 0.45) return null;
  return { box: nearest.box, color: nearest.color, background: nearest.background, angle: nearest.angle };
}
