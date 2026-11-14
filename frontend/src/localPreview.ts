import type { Job, Project } from "./types";

const PREVIEW_FPS = 30;

export type LocalMedia = {
  url: string;
  width: number;
  height: number;
  duration: number;
};

export function readLocalVideo(file: File): Promise<LocalMedia> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.src = url;
  return new Promise((resolve, reject) => {
    const fail = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This browser could not open that video."));
    };
    video.onloadedmetadata = () => {
      if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration)) {
        fail();
        return;
      }
      resolve({
        url,
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
    };
    video.onerror = fail;
  });
}

export function localBundle(file: File, media: LocalMedia): { project: Project; job: Job } {
  const id = `local${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
  const now = new Date().toISOString();
  const frameCount = Math.max(1, Math.round(media.duration * PREVIEW_FPS));
  const project: Project = {
    id,
    filename: file.name,
    created_at: now,
    status: "ready",
    width: media.width,
    height: media.height,
    fps: PREVIEW_FPS,
    frame_count: frameCount,
    duration: media.duration,
    video_codec: null,
    audio_present: false,
    audio_copied: false,
    proxy_ready: true,
    proxy_width: media.width,
    proxy_height: media.height,
    region_count: 0,
    warnings: [],
    local_url: media.url,
  };
  const job: Job = {
    id: `localjob${id}`,
    project_id: id,
    status: "completed",
    stage: "proxy",
    progress: 0.6,
    message: "Your video is in the editor. Play it or scrub the timeline.",
    error: null,
    stages: [
      { name: "probe", status: "completed", progress: 1 },
      { name: "extract_audio", status: "completed", progress: 1 },
      { name: "proxy", status: "completed", progress: 1 },
      { name: "detect", status: "pending", progress: 0 },
      { name: "associate", status: "pending", progress: 0 },
    ],
    created_at: now,
    updated_at: now,
  };
  return { project, job };
}
