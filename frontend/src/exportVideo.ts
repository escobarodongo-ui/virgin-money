import { appearance, type Lock } from "./spots";
import { paintReplacement } from "./style";

const MIME_TYPES = [
  "video/mp4;codecs=avc1.42E01F,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export async function downloadCleanVideo(options: {
  src: string;
  width: number;
  height: number;
  filename: string;
  locks: Lock[];
  onProgress: (fraction: number) => void;
}) {
  const mime = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
  if (!mime) throw new Error("This browser cannot save a video.");

  const video = document.createElement("video");
  video.src = options.src;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.preload = "auto";
  video.style.cssText = "position:fixed;left:0;top:0;width:4px;height:4px;opacity:0;pointer-events:none";
  document.body.appendChild(video);

  const audio = new AudioContext();
  void audio.resume();
  let source: MediaElementAudioSourceNode | null = null;

  try {
    await waitFor(video, "loadeddata");
    const canvas = document.createElement("canvas");
    canvas.width = options.width;
    canvas.height = options.height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("This browser cannot draw the video.");

    const captured = canvas.captureStream(0);
    const videoTrack = captured.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    source = audio.createMediaElementSource(video);
    const destination = audio.createMediaStreamDestination();
    source.connect(destination);
    const stream = new MediaStream([
      videoTrack,
      ...destination.stream.getAudioTracks(),
    ]);
    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: Math.max(2_500_000, options.width * options.height * 3),
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    const stopped = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error("Could not save the video."));
    });
    recorder.start(200);
    video.currentTime = 0;
    await waitFor(video, "seeked");
    await video.play();

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("Saving the video took too long.")), 180000);
      let closed = false;
      const finish = () => {
        if (closed) return;
        closed = true;
        window.clearTimeout(timer);
        resolve();
      };
      const draw = () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const time = video.currentTime;
        for (const lock of options.locks) {
          const placed = appearance(lock, time);
          if (!placed) continue;
          paintReplacement(context, placed.box, lock.replacement.trim(), {
            fontFamily: lock.fontFamily,
            fontWeight: lock.fontWeight,
            color: placed.color,
            background: placed.background,
            angle: placed.angle,
          });
        }
        videoTrack.requestFrame();
        const duration = video.duration || 0;
        if (duration > 0) options.onProgress(Math.min(1, time / duration));
        if (video.ended || (duration > 0 && time >= duration - 0.04)) finish();
      };
      video.requestVideoFrameCallback(function loop() {
        draw();
        if (!video.ended && !video.paused) video.requestVideoFrameCallback(loop);
      });
      video.ontimeupdate = draw;
      video.onended = () => {
        draw();
        finish();
      };
    });

    video.pause();
    if (recorder.state !== "inactive") recorder.stop();
    await stopped;
    const blob = new Blob(chunks, { type: recorder.mimeType || mime });
    if (blob.size < 1000) throw new Error("The saved video was empty.");
    const extension = (recorder.mimeType || mime).includes("mp4") ? "mp4" : "webm";
    const base = options.filename.replace(/\.[^.]+$/, "") || "video";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${base}-edited.${extension}`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  } finally {
    source?.disconnect();
    await audio.close().catch(() => undefined);
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.remove();
  }
}

function waitFor(target: EventTarget, type: string) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Could not read the video.")), 15000);
    target.addEventListener(
      type,
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
