export type Box = { x: number; y: number; w: number; h: number };

export type Spot = {
  id: string;
  frame: number;
  box: Box;
  original: string;
  replacement: string;
  color: string;
  background: string;
};

export function newSpotId() {
  return `s${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export function showsReplacement(spot: Spot) {
  const next = spot.replacement.trim();
  if (!next) return false;
  return next !== spot.original.trim();
}
