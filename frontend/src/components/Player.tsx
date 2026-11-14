import { useEffect, useRef, useState } from "react";
import { quadAt } from "../geometry";
import type { Spot } from "../spots";
import { paintQuad, type Quad, type TextTrack } from "../textTrack";
import type { Project, Region } from "../types";

type Props = {
  project: Project;
  regions: Region[];
  spots: Spot[];
  tracked: Array<{ id: string; quad: Quad; text: string; style: TextTrack["style"]; confidence: number }>;
  frame: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFrame: (frame: number) => void;
  onPick: (x: number, y: number) => void;
  onVideo: (video: HTMLVideoElement | null) => void;
  onPlayback: (playing: boolean) => void;
};

export function Player({
  project,
  regions,
  spots,
  tracked,
  frame,
  selectedId,
  onSelect,
  onFrame,
  onPick,
  onVideo,
  onPlayback,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pictureNote, setPictureNote] = useState<string | null>(null);
  const fromVideo = useRef(false);
  const sourceWidth = project.width ?? 1;
  const sourceHeight = project.height ?? 1;
  const fps = project.fps || 1;

  useEffect(() => {
    onVideo(videoRef.current);
    return () => onVideo(null);
  }, [onVideo, project.id, project.local_url]);

  useEffect(() => {
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!stage || !video) return;
    const measure = () => {
      const stageBox = stage.getBoundingClientRect();
      const videoBox = video.getBoundingClientRect();
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) {
        setBox(null);
        return;
      }
      const scale = Math.min(videoBox.width / vw, videoBox.height / vh);
      const width = vw * scale;
      const height = vh * scale;
      setBox({
        left: videoBox.left + (videoBox.width - width) / 2 - stageBox.left,
        top: videoBox.top + (videoBox.height - height) / 2 - stageBox.top,
        width,
        height,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    video.addEventListener("loadedmetadata", measure);
    return () => {
      observer.disconnect();
      video.removeEventListener("loadedmetadata", measure);
    };
  }, [project.id, project.local_url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (fromVideo.current) {
      fromVideo.current = false;
      return;
    }
    const target = frame / fps;
    if (Math.abs(video.currentTime - target) > 0.45 / fps) {
      video.currentTime = target;
    }
  }, [frame, fps, project.id]);

  const visible = regions
    .map((region) => ({ region, quad: quadAt(region, frame) }))
    .filter((item): item is { region: Region; quad: [number, number][] } => item.quad != null);

  function pauseOrPlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  return (
    <div className="relative h-full min-h-[280px] bg-black">
      <div ref={stageRef} className="absolute inset-0">
        <video
          key={project.local_url ?? project.id}
          ref={videoRef}
          className="h-full w-full object-contain bg-black"
          src={project.local_url ?? `/api/projects/${project.id}/media/proxy`}
          playsInline
          onPlay={() => {
            setPlaying(true);
            onPlayback(true);
          }}
          onPause={() => {
            setPlaying(false);
            onPlayback(false);
          }}
          onTimeUpdate={(event) => {
            const next = Math.round(event.currentTarget.currentTime * fps);
            const clamped = Math.max(0, Math.min((project.frame_count ?? 1) - 1, next));
            fromVideo.current = true;
            onFrame(clamped);
          }}
          onLoadedData={() => {
            if (videoRef.current?.paused) onPlayback(false);
            const video = videoRef.current;
            if (video) void showPicture(video, fps, onFrame, setPictureNote);
          }}
          onError={() => {
            setPictureNote("This browser could not play that video. Save it as an MP4 (H.264) and open it again.");
          }}
          onClick={() => {
            if (!videoRef.current?.paused) videoRef.current?.pause();
          }}
        />
        {box && (
          <div
            className={`absolute ${playing ? "pointer-events-none" : ""}`}
            style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
            onClick={(event) => {
              if (playing) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width) * sourceWidth;
              const y = ((event.clientY - rect.top) / rect.height) * sourceHeight;
              onPick(x, y);
            }}
          >
            <svg
              className="pointer-events-none h-full w-full overflow-visible"
              viewBox={`0 0 ${sourceWidth} ${sourceHeight}`}
              preserveAspectRatio="none"
            >
              {visible.map(({ region, quad }) => {
                const points = quad.map((point) => point.join(",")).join(" ");
                return (
                  <polygon
                    key={region.id}
                    points={points}
                    vectorEffect="non-scaling-stroke"
                    fill="rgba(243,236,223,0.05)"
                    stroke="#f3ecdf"
                    strokeWidth={1.25}
                  />
                );
              })}
              {spots.map((spot) => {
                const selected = spot.id === selectedId;
                return (
                  <rect
                    key={spot.id}
                    x={spot.box.x}
                    y={spot.box.y}
                    width={spot.box.w}
                    height={spot.box.h}
                    vectorEffect="non-scaling-stroke"
                    className="pointer-events-auto cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(spot.id);
                    }}
                    fill={selected ? "rgba(214,242,92,0.2)" : "rgba(214,242,92,0.08)"}
                    stroke={selected ? "#d6f25c" : "#f3ecdf"}
                    strokeWidth={selected ? 2.5 : 1.5}
                  />
                );
              })}
            </svg>
            {tracked.length > 0 && <CoverCanvas tracked={tracked} width={sourceWidth} height={sourceHeight} />}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 ${sourceWidth} ${sourceHeight}`}
              preserveAspectRatio="none"
            >
              {tracked.map((item) => (
                <polygon
                  key={`${item.id}-quad`}
                  points={item.quad.map((point) => point.join(",")).join(" ")}
                  vectorEffect="non-scaling-stroke"
                  fill="transparent"
                  stroke="#d6f25c"
                  strokeWidth={1.5}
                />
              ))}
            </svg>
          </div>
        )}
      </div>
      {pictureNote && (
        <p className="absolute left-4 right-4 top-4 z-10 bg-ink/90 px-3 py-2 text-sm text-paper">{pictureNote}</p>
      )}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
        <button type="button" onClick={pauseOrPlay} className="bg-lime px-3 py-2 text-sm text-ink">
          {playing ? "Pause to edit" : "Play"}
        </button>
        <span className="rounded-full bg-ink/75 px-3 py-1 text-xs tracking-[0.16em] uppercase text-paper">
          {playing ? "Playing" : "Paused"} · frame {frame}
        </span>
      </div>
    </div>
  );
}

function frameIsBlank(video: HTMLVideoElement) {
  if (!video.videoWidth) return true;
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return false;
  context.drawImage(video, 0, 0, 24, 24);
  const data = context.getImageData(0, 0, 24, 24).data;
  let sum = 0;
  for (let index = 0; index < data.length; index += 4) sum += data[index] + data[index + 1] + data[index + 2];
  return sum / (24 * 24) < 12;
}

async function showPicture(
  video: HTMLVideoElement,
  fps: number,
  onFrame: (frame: number) => void,
  setNote: (note: string | null) => void,
) {
  if (!frameIsBlank(video)) {
    setNote(null);
    return;
  }
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  for (let time = 0.2; time < Math.min(Math.max(duration - 0.05, 0), 3); time += 0.25) {
    video.currentTime = time;
    await new Promise<void>((resolve) => video.addEventListener("seeked", () => resolve(), { once: true }));
    if (!frameIsBlank(video)) {
      onFrame(Math.round(time * fps));
      setNote(null);
      return;
    }
  }
  setNote("The opening is black. Scrub the timeline until the picture appears, or use an MP4 (H.264) file.");
}

function CoverCanvas({
  tracked,
  width,
  height,
}: {
  tracked: Array<{ quad: Quad; text: string; style: TextTrack["style"] }>;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, width, height);
    for (const item of tracked) paintQuad(context, item.quad, item.text, item.style);
  }, [tracked, width, height]);
  return <canvas ref={ref} width={width} height={height} className="pointer-events-none absolute inset-0 h-full w-full" />;
}
