export type ClipScene = {
  id: string;
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  moving: boolean;
};

type Sample = { frame: number; time: number; gray: Float32Array; diff: number };

export async function findScenes(video: HTMLVideoElement, fps: number, frameCount: number): Promise<ClipScene[]> {
  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : frameCount / fps;
  const step = 0.12;
  const samples: Sample[] = [];
  let previous: Float32Array | null = null;
  for (let time = 0; time < duration - 0.04; time += step) {
    const frame = Math.min(frameCount - 1, Math.round(time * fps));
    const target = Math.min(duration - 0.001, (frame + 0.5) / fps);
    if (Math.abs(video.currentTime - target) > 0.0005) {
      video.currentTime = target;
      await new Promise<void>((resolve) => video.addEventListener("seeked", () => resolve(), { once: true }));
    }
    const gray = thumbnail(video);
    let diff = 0;
    if (previous) {
      for (let index = 0; index < gray.length; index += 1) diff += Math.abs(gray[index] - previous[index]);
      diff /= gray.length;
    }
    samples.push({ frame, time, gray, diff });
    previous = gray;
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }
  if (samples.length === 0) return [wholeClip(frameCount, duration)];

  const cuts = new Set<number>();
  for (let index = 1; index < samples.length; index += 1) {
    if (samples[index].diff >= 20) cuts.add(index);
  }
  const ranges: Array<{ from: number; to: number }> = [];
  let from = 0;
  cuts.forEach((cut) => {
    if (cut > from) ranges.push({ from, to: cut - 1 });
    from = cut;
  });
  ranges.push({ from, to: samples.length - 1 });

  const merged: Array<{ from: number; to: number }> = [];
  for (const range of ranges) {
    const length = samples[range.to].time - samples[range.from].time;
    const last = merged[merged.length - 1];
    if (last && length < 0.4) last.to = range.to;
    else merged.push({ ...range });
  }

  return merged.map((range, index) => {
    const start = samples[range.from];
    const next = samples[Math.min(samples.length - 1, range.to + 1)];
    const diffs = [];
    for (let sample = range.from + 1; sample <= range.to; sample += 1) {
      if (samples[sample].diff < 20) diffs.push(samples[sample].diff);
    }
    diffs.sort((a, b) => a - b);
    const median = diffs.length ? diffs[Math.floor(diffs.length / 2)] : 0;
    const moving = median > 2.2;
    return {
      id: `screen-${index + 1}`,
      startFrame: start.frame,
      endFrame: Math.max(start.frame, next.frame - 1),
      startTime: start.time,
      endTime: next.time,
      moving,
    };
  });
}

export function sceneAt(scenes: ClipScene[], frame: number): ClipScene | null {
  return scenes.find((scene) => frame >= scene.startFrame && frame <= scene.endFrame) ?? null;
}

export function formatClock(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = Math.floor(safe % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function wholeClip(frameCount: number, duration: number): ClipScene {
  return {
    id: "screen-1",
    startFrame: 0,
    endFrame: Math.max(0, frameCount - 1),
    startTime: 0,
    endTime: duration,
    moving: true,
  };
}

function thumbnail(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 36;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const gray = new Float32Array(64 * 36);
  if (!context) return gray;
  context.drawImage(video, 0, 0, 64, 36);
  const pixels = context.getImageData(0, 0, 64, 36).data;
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    gray[index] = 0.2126 * pixels[offset] + 0.7152 * pixels[offset + 1] + 0.0722 * pixels[offset + 2];
  }
  return gray;
}
