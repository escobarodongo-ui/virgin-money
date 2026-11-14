export type Quad = [[number, number], [number, number], [number, number], [number, number]];

export type FramePose = {
  frame_index: number;
  quad: Quad;
  homography: number[][];
  visible: boolean;
  occluded: boolean;
  confidence: number;
  mask: null;
};

export type TextTrack = {
  id: string;
  start_frame: number;
  end_frame: number;
  original_text: string;
  replacement_text: string;
  style: {
    fontFamily: string;
    fontWeight: number;
    color: string;
    background: string;
  };
  reference_quad: Quad;
  frames: FramePose[];
};

type Gray = { data: Float32Array; width: number; height: number };
type Point = [number, number];

export function poseAt(track: TextTrack, frame: number): FramePose | null {
  const pose = track.frames.find((item) => item.frame_index === frame);
  if (!pose?.visible) return null;
  return pose;
}

export function boxToQuad(box: { x: number; y: number; w: number; h: number }): Quad {
  return [
    [box.x, box.y],
    [box.x + box.w, box.y],
    [box.x + box.w, box.y + box.h],
    [box.x, box.y + box.h],
  ];
}

export function finishTrack(track: TextTrack, poses: FramePose[]): TextTrack {
  const visible = poses.filter((pose) => pose.visible);
  const indexes = visible.map((pose) => pose.frame_index);
  return {
    ...track,
    start_frame: indexes.length ? Math.min(...indexes) : track.start_frame,
    end_frame: indexes.length ? Math.max(...indexes) : track.end_frame,
    reference_quad: visible[0]?.quad ?? track.reference_quad,
    frames: poses,
  };
}

export function trackQuads(frames: Gray[], seed: Quad, seedIndex: number): FramePose[] {
  const forward = propagate(frames, seed, seedIndex, 1);
  const backward = propagate(frames, seed, seedIndex, -1);
  const merged = frames.map((_, index) => mergePose(index, seedIndex, forward.get(index), backward.get(index)));
  return smooth(merged, sceneCuts(frames));
}

export async function readGray(video: HTMLVideoElement, width: number, height: number, maxEdge = 480): Promise<Gray> {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not read a frame.");
  context.drawImage(video, 0, 0, w, h);
  const pixels = context.getImageData(0, 0, w, h).data;
  const data = new Float32Array(w * h);
  for (let index = 0; index < data.length; index += 1) {
    const offset = index * 4;
    data[index] = 0.2126 * pixels[offset] + 0.7152 * pixels[offset + 1] + 0.0722 * pixels[offset + 2];
  }
  return { data, width: w, height: h };
}

export function scaleQuad(quad: Quad, scale: number): Quad {
  return quad.map(([x, y]) => [x * scale, y * scale]) as Quad;
}

export type Walk = {
  direction: 1 | -1;
  index: number;
  seedIndex: number;
  seed: Quad;
  points: Point[];
  reference: Point[];
  poses: Map<number, FramePose>;
  prev: Gray | null;
  prevSmall: Float32Array | null;
  cuts: Set<number>;
  done: boolean;
};

export function startWalk(seed: Quad, seedIndex: number, direction: 1 | -1): Walk {
  return {
    direction,
    index: seedIndex,
    seedIndex,
    seed,
    points: samplePoints(seed),
    reference: samplePoints(seed),
    poses: new Map(),
    prev: null,
    prevSmall: null,
    cuts: new Set(),
    done: false,
  };
}

export function walkFrame(walk: Walk, gray: Gray, index: number) {
  const small = downsample(gray);
  if (walk.prevSmall) {
    let total = 0;
    for (let pixel = 0; pixel < small.length; pixel += 1) total += Math.abs(small[pixel] - walk.prevSmall[pixel]);
    if (total / small.length >= 28) walk.cuts.add(index);
  }
  walk.prevSmall = small;
  if (!walk.prev) {
    walk.poses.set(index, makePose(index, walk.seed, identity(), 1, true, false));
    walk.prev = gray;
    walk.index = index;
    return;
  }
  if (walk.done) return;
  const tracked = flow(walk.prev, gray, walk.points);
  const back = flow(gray, walk.prev, tracked);
  const good = walk.points.map((point, pointIndex) => distance(point, back[pointIndex]) < 1.5);
  const homography = fitHomography(walk.reference, tracked, good);
  if (!homography) {
    walk.poses.set(index, makePose(index, walk.seed, identity(), 0, false, true));
    walk.done = true;
    walk.prev = gray;
    return;
  }
  const quad = walk.seed.map((point) => apply(homography, point[0], point[1])) as Quad;
  const used = good.filter(Boolean).length / good.length;
  const [cx, cy] = center(quad);
  const finite = quad.every((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
  const visible = finite && cx >= 0 && cy >= 0 && cx < gray.width && cy < gray.height;
  walk.poses.set(index, makePose(index, finite ? quad : walk.seed, homography, used, visible, used < 0.45 || !finite));
  walk.points = tracked;
  walk.prev = gray;
  walk.index = index;
}

export function posesFromWalks(forward: Walk, backward: Walk, start: number, end: number, scaleUp: number): FramePose[] {
  const merged = Array.from({ length: end - start + 1 }, (_, offset) => {
    const index = start + offset;
    return mergePose(index, forward.seedIndex, forward.poses.get(index), backward.poses.get(index));
  });
  const cuts = new Set<number>([...forward.cuts, ...backward.cuts]);
  return smooth(merged, cuts).map((pose) => ({
    ...pose,
    quad: scaleQuad(pose.quad, scaleUp),
  }));
}

export function holdPoses(quad: Quad, start: number, end: number): FramePose[] {
  const homography = identity();
  const poses: FramePose[] = [];
  for (let index = start; index <= end; index += 1) poses.push(makePose(index, quad, homography, 1, true, false));
  return poses;
}

export function paintQuad(
  context: CanvasRenderingContext2D,
  quad: Quad,
  text: string,
  style: TextTrack["style"],
) {
  if (!quad.every((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]))) return;
  const width = Math.max(8, Math.hypot(quad[1][0] - quad[0][0], quad[1][1] - quad[0][1]));
  const height = Math.max(8, Math.hypot(quad[3][0] - quad[0][0], quad[3][1] - quad[0][1]));
  if (width * height > context.canvas.width * context.canvas.height * 0.92) return;
  const source = document.createElement("canvas");
  source.width = Math.ceil(width);
  source.height = Math.ceil(height);
  const flat = source.getContext("2d");
  if (!flat) return;
  flat.fillStyle = style.background;
  flat.fillRect(0, 0, source.width, source.height);
  let size = source.height * 0.82;
  flat.textAlign = "center";
  flat.textBaseline = "middle";
  flat.fillStyle = style.color;
  for (let step = 0; step < 8; step += 1) {
    flat.font = `${style.fontWeight} ${size}px "${style.fontFamily}"`;
    if (flat.measureText(text).width <= source.width * 0.94) break;
    size *= 0.9;
  }
  flat.fillText(text, source.width / 2, source.height / 2);
  const bitmap = flat.getImageData(0, 0, source.width, source.height);
  const src: Quad = [
    [0, 0],
    [source.width, 0],
    [source.width, source.height],
    [0, source.height],
  ];
  const homography = homographyOf(src, quad);
  const inverse = homography ? invert3(homography) : null;
  if (!inverse) return;
  const bounds = boundsOf(quad, context.canvas.width, context.canvas.height);
  if (bounds.w < 1 || bounds.h < 1) return;
  const image = context.getImageData(bounds.x, bounds.y, bounds.w, bounds.h);
  for (let y = 0; y < bounds.h; y += 1) {
    for (let x = 0; x < bounds.w; x += 1) {
      const [u, v] = apply(inverse, bounds.x + x + 0.5, bounds.y + y + 0.5);
      if (u < 0 || v < 0 || u >= source.width - 1 || v >= source.height - 1) continue;
      const sample = bilinear(bitmap, u, v);
      const dest = (y * bounds.w + x) * 4;
      image.data[dest] = sample[0];
      image.data[dest + 1] = sample[1];
      image.data[dest + 2] = sample[2];
      image.data[dest + 3] = 255;
    }
  }
  context.putImageData(image, bounds.x, bounds.y);
}

function identity() {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}

function propagate(frames: Gray[], seed: Quad, seedIndex: number, direction: 1 | -1) {
  const poses = new Map<number, FramePose>();
  const identityMatrix = identity();
  poses.set(seedIndex, makePose(seedIndex, seed, identityMatrix, 1, true, false));
  const reference = samplePoints(seed);
  let points = reference.map((point) => [...point] as Point);
  let index = seedIndex;
  while (index + direction >= 0 && index + direction < frames.length) {
    const next = index + direction;
    const tracked = flow(frames[index], frames[next], points);
    const back = flow(frames[next], frames[index], tracked);
    const good = points.map((point, pointIndex) => distance(point, back[pointIndex]) < 1.5);
    const homography = fitHomography(reference, tracked, good);
    if (!homography) {
      poses.set(next, makePose(next, seed, identityMatrix, 0, false, true));
      break;
    }
    const quad = seed.map((point) => apply(homography, point[0], point[1])) as Quad;
    const used = good.filter(Boolean).length / good.length;
    const [cx, cy] = center(quad);
    const frame = frames[next];
    poses.set(next, makePose(next, quad, homography, used, cx >= 0 && cy >= 0 && cx < frame.width && cy < frame.height, used < 0.45));
    points = tracked;
    index = next;
  }
  return poses;
}

function flow(prev: Gray, next: Gray, points: Point[]): Point[] {
  return points.map((point) => search(prev, next, point));
}

function search(prev: Gray, next: Gray, point: Point): Point {
  const radius = 8;
  const half = 4;
  let best = Number.POSITIVE_INFINITY;
  let found: Point = point;
  const x0 = Math.round(point[0]);
  const y0 = Math.round(point[1]);
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      let score = 0;
      let count = 0;
      for (let py = -half; py <= half; py += 1) {
        for (let px = -half; px <= half; px += 1) {
          const left = grayAt(prev, x0 + px, y0 + py);
          const right = grayAt(next, x0 + dx + px, y0 + dy + py);
          if (left == null || right == null) continue;
          score += Math.abs(left - right);
          count += 1;
        }
      }
      if (count < 20) continue;
      score /= count;
      if (score < best) {
        best = score;
        found = [x0 + dx, y0 + dy];
      }
    }
  }
  return found;
}

function grayAt(frame: Gray, x: number, y: number) {
  if (x < 0 || y < 0 || x >= frame.width || y >= frame.height) return null;
  return frame.data[y * frame.width + x];
}

function fitHomography(src: Point[], dst: Point[], good: boolean[]) {
  const pairs = src
    .map((point, index) => ({ src: point, dst: dst[index], ok: good[index] }))
    .filter((pair) => pair.ok);
  if (pairs.length < 4) return null;
  let best: number[][] | null = null;
  let bestInliers = 0;
  const rounds = Math.min(40, pairs.length * 3);
  for (let round = 0; round < rounds; round += 1) {
    const sample = pick4(pairs, round);
    const model = homographyOf(
      sample.map((pair) => pair.src) as Quad,
      sample.map((pair) => pair.dst) as Quad,
    );
    if (!model) continue;
    const inliers = pairs.filter((pair) => {
      const [x, y] = apply(model, pair.src[0], pair.src[1]);
      return Math.hypot(x - pair.dst[0], y - pair.dst[1]) < 2;
    });
    if (inliers.length > bestInliers) {
      bestInliers = inliers.length;
      best = model;
    }
  }
  return bestInliers >= 4 ? best : null;
}

function pick4<T>(items: T[], salt: number): T[] {
  const chosen: T[] = [];
  const used = new Set<number>();
  for (let step = 0; chosen.length < 4 && step < items.length; step += 1) {
    const index = (salt + step * 5) % items.length;
    if (used.has(index)) continue;
    used.add(index);
    chosen.push(items[index]);
  }
  return chosen;
}

function homographyOf(src: Quad, dst: Quad): number[][] | null {
  const rows: number[][] = [];
  const target: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    const [x, y] = src[index];
    const [u, v] = dst[index];
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    target.push(u);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    target.push(v);
  }
  const solved = solve(rows, target);
  if (!solved) return null;
  return [
    [solved[0], solved[1], solved[2]],
    [solved[3], solved[4], solved[5]],
    [solved[6], solved[7], 1],
  ];
}

function solve(rows: number[][], target: number[]): number[] | null {
  const size = target.length;
  const matrix = rows.map((row, index) => [...row, target[index]]);
  for (let col = 0; col < size; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < size; row += 1) {
      if (Math.abs(matrix[row][col]) > Math.abs(matrix[pivot][col])) pivot = row;
    }
    if (Math.abs(matrix[pivot][col]) < 1e-8) return null;
    [matrix[col], matrix[pivot]] = [matrix[pivot], matrix[col]];
    const divisor = matrix[col][col];
    for (let colIndex = col; colIndex <= size; colIndex += 1) matrix[col][colIndex] /= divisor;
    for (let row = 0; row < size; row += 1) {
      if (row === col) continue;
      const factor = matrix[row][col];
      for (let colIndex = col; colIndex <= size; colIndex += 1) matrix[row][colIndex] -= factor * matrix[col][colIndex];
    }
  }
  return matrix.map((row) => row[size]);
}

function invert3(matrix: number[][]) {
  const [a, b, c] = matrix[0];
  const [d, e, f] = matrix[1];
  const [g, h, i] = matrix[2];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-8) return null;
  const inv = 1 / det;
  return [
    [(e * i - f * h) * inv, (c * h - b * i) * inv, (b * f - c * e) * inv],
    [(f * g - d * i) * inv, (a * i - c * g) * inv, (c * d - a * f) * inv],
    [(d * h - e * g) * inv, (b * g - a * h) * inv, (a * e - b * d) * inv],
  ];
}

function apply(matrix: number[][], x: number, y: number): Point {
  const w = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2];
  return [(matrix[0][0] * x + matrix[0][1] * y + matrix[0][2]) / w, (matrix[1][0] * x + matrix[1][1] * y + matrix[1][2]) / w];
}

function mergePose(index: number, seedIndex: number, forward?: FramePose, backward?: FramePose): FramePose {
  if (index === seedIndex) return (forward ?? backward) as FramePose;
  if (forward?.visible && backward?.visible) {
    const gap = cornerGap(forward.quad, backward.quad);
    if (gap <= 3) {
      const quad = forward.quad.map((point, pointIndex) => [
        (point[0] + backward.quad[pointIndex][0]) / 2,
        (point[1] + backward.quad[pointIndex][1]) / 2,
      ]) as Quad;
      return makePose(index, quad, forward.homography, Math.min(forward.confidence, backward.confidence), true, false);
    }
    const chosen = forward.confidence >= backward.confidence ? forward : backward;
    return { ...chosen, confidence: Math.min(forward.confidence, backward.confidence) * 0.5, occluded: true };
  }
  return (
    forward ??
    backward ??
    makePose(index, [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ], [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ], 0, false, true)
  );
}

function smooth(poses: FramePose[], cuts: Set<number>): FramePose[] {
  const value = Array<number | null>(8).fill(null);
  return poses.map((pose) => {
    if (cuts.has(pose.frame_index) || !pose.visible) {
      value.fill(null);
      return pose;
    }
    const flat = pose.quad.flat();
    const next = flat.map((item, index) => {
      const previous = value[index];
      const filtered = previous == null ? item : previous * 0.35 + item * 0.65;
      value[index] = filtered;
      return filtered;
    });
    const quad = [
      [round(next[0]), round(next[1])],
      [round(next[2]), round(next[3])],
      [round(next[4]), round(next[5])],
      [round(next[6]), round(next[7])],
    ] as Quad;
    return { ...pose, quad };
  });
}

function sceneCuts(frames: Gray[]) {
  const cuts = new Set<number>();
  let previous: Float32Array | null = null;
  for (let index = 0; index < frames.length; index += 1) {
    const small = downsample(frames[index]);
    if (previous) {
      let total = 0;
      for (let pixel = 0; pixel < small.length; pixel += 1) total += Math.abs(small[pixel] - previous[pixel]);
      if (total / small.length >= 28) cuts.add(index);
    }
    previous = small;
  }
  return cuts;
}

function downsample(frame: Gray) {
  const out = new Float32Array(64 * 36);
  for (let y = 0; y < 36; y += 1) {
    for (let x = 0; x < 64; x += 1) {
      const sx = Math.min(frame.width - 1, Math.floor((x / 64) * frame.width));
      const sy = Math.min(frame.height - 1, Math.floor((y / 36) * frame.height));
      out[y * 64 + x] = frame.data[sy * frame.width + sx];
    }
  }
  return out;
}

function samplePoints(quad: Quad): Point[] {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad;
  void bottomRight;
  const points: Point[] = [];
  for (let row = 0; row < 3; row += 1) {
    const v = row / 2;
    for (let col = 0; col < 4; col += 1) {
      const u = col / 3;
      const top: Point = [topLeft[0] * (1 - u) + topRight[0] * u, topLeft[1] * (1 - u) + topRight[1] * u];
      const bottom: Point = [bottomLeft[0] * (1 - u) + quad[2][0] * u, bottomLeft[1] * (1 - u) + quad[2][1] * u];
      points.push([top[0] * (1 - v) + bottom[0] * v, top[1] * (1 - v) + bottom[1] * v]);
    }
  }
  return points;
}

function makePose(index: number, quad: Quad, homography: number[][], confidence: number, visible: boolean, occluded: boolean): FramePose {
  return {
    frame_index: index,
    quad: quad.map((point) => [round(point[0]), round(point[1])]) as Quad,
    homography: homography.map((row) => row.map((value) => Math.round(value * 1e6) / 1e6)),
    visible,
    occluded,
    confidence: Math.round(confidence * 10000) / 10000,
    mask: null,
  };
}

function boundsOf(quad: Quad, maxWidth: number, maxHeight: number) {
  const xs = quad.map((point) => point[0]);
  const ys = quad.map((point) => point[1]);
  const x = Math.min(maxWidth - 1, Math.max(0, Math.floor(Math.min(...xs)) - 2));
  const y = Math.min(maxHeight - 1, Math.max(0, Math.floor(Math.min(...ys)) - 2));
  const w = Math.min(maxWidth - x, Math.ceil(Math.max(...xs) - x + 2));
  const h = Math.min(maxHeight - y, Math.ceil(Math.max(...ys) - y + 2));
  return { x, y, w: Math.max(0, w), h: Math.max(0, h) };
}

function bilinear(image: ImageData, x: number, y: number): [number, number, number] {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const dx = x - x0;
  const dy = y - y0;
  const pixel = (px: number, py: number) => {
    const offset = (py * image.width + px) * 4;
    return [image.data[offset], image.data[offset + 1], image.data[offset + 2]] as [number, number, number];
  };
  const a = pixel(x0, y0);
  const b = pixel(x0 + 1, y0);
  const c = pixel(x0, y0 + 1);
  const d = pixel(x0 + 1, y0 + 1);
  return [0, 1, 2].map(
    (channel) =>
      a[channel] * (1 - dx) * (1 - dy) +
      b[channel] * dx * (1 - dy) +
      c[channel] * (1 - dx) * dy +
      d[channel] * dx * dy,
  ) as [number, number, number];
}

function cornerGap(left: Quad, right: Quad) {
  return left.reduce((sum, point, index) => sum + Math.hypot(point[0] - right[index][0], point[1] - right[index][1]), 0) / 4;
}

function center(quad: Quad): Point {
  return [quad.reduce((sum, point) => sum + point[0], 0) / 4, quad.reduce((sum, point) => sum + point[1], 0) / 4];
}

function distance(left: Point, right: Point) {
  return Math.hypot(left[0] - right[0], left[1] - right[1]);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
