import { captureFrame, readFrame } from "./ocr";
import { normText, type Lock, type Sample } from "./spots";
import { glyphAngle } from "./style";

export async function trackEdits(options: {
  src: string;
  width: number;
  height: number;
  locks: Lock[];
  onProgress: (fraction: number) => void;
  signal: { stopped: boolean };
}): Promise<Map<string, Sample[]>> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = options.src;
  const found = new Map<string, Sample[]>();
  for (const lock of options.locks) found.set(lock.id, []);
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Could not follow the text through the clip."));
    });
    const duration = video.duration || 0;
    const times: number[] = [];
    for (let time = 0.04; time < duration - 0.02; time += 0.15) times.push(time);
    if (times.length === 0) times.push(Math.min(0.04, duration));
    for (let index = 0; index < times.length; index += 1) {
      if (options.signal.stopped) return found;
      const time = times[index] ?? 0;
      video.currentTime = time;
      await new Promise<void>((resolve) => video.addEventListener("seeked", () => resolve(), { once: true }));
      const words = await readFrame(video, options.width, options.height);
      const frame = captureFrame(video);
      for (const lock of options.locks) {
        const key = normText(lock.original);
        const hits = words.filter((word) => normText(word.original) === key);
        const hit = hits.sort((left, right) => centerDistance(left.box, lock.anchor) - centerDistance(right.box, lock.anchor))[0];
        if (!hit || !frame) continue;
        const scaleX = frame.canvas.width / options.width;
        const scaleY = frame.canvas.height / options.height;
        found.get(lock.id)?.push({
          time,
          box: hit.box,
          color: hit.color,
          background: hit.background,
          angle: glyphAngle(frame, {
            x: hit.box.x * scaleX,
            y: hit.box.y * scaleY,
            w: hit.box.w * scaleX,
            h: hit.box.h * scaleY,
          }),
        });
      }
      options.onProgress((index + 1) / times.length);
    }
    return found;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
}

function centerDistance(box: { x: number; y: number; w: number; h: number }, anchor: { x: number; y: number; w: number; h: number }) {
  const dx = box.x + box.w / 2 - (anchor.x + anchor.w / 2);
  const dy = box.y + box.h / 2 - (anchor.y + anchor.h / 2);
  return dx * dx + dy * dy;
}
