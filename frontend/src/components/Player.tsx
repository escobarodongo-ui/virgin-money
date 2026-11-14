import { useEffect, useRef, useState } from "react";
import { quadAt } from "../geometry";
import type { Project, Region } from "../types";

type Props = {
  project: Project;
  regions: Region[];
  frame: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFrame: (frame: number) => void;
};

export function Player({ project, regions, frame, selectedId, onSelect, onFrame }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const fromVideo = useRef(false);
  const sourceWidth = project.width ?? 1;
  const sourceHeight = project.height ?? 1;
  const fps = project.fps || 1;

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
  }, [project.id]);

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

  return (
    <div className="relative h-full min-h-[280px] bg-black">
      <div ref={stageRef} className="absolute inset-0">
        <video
          key={project.local_url ?? project.id}
          ref={videoRef}
          className="h-full w-full object-contain bg-black"
          src={project.local_url ?? `/api/projects/${project.id}/media/proxy`}
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(event) => {
            const next = Math.round(event.currentTarget.currentTime * fps);
            const clamped = Math.max(0, Math.min((project.frame_count ?? 1) - 1, next));
            fromVideo.current = true;
            onFrame(clamped);
          }}
          onClick={(event) => {
            const video = event.currentTarget;
            if (video.paused) void video.play();
            else video.pause();
          }}
        />
        {box && (
          <div
            className="pointer-events-none absolute"
            style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          >
            <svg
              className="pointer-events-none h-full w-full overflow-visible"
              viewBox={`0 0 ${sourceWidth} ${sourceHeight}`}
              preserveAspectRatio="none"
            >
              {visible.map(({ region, quad }) => {
                const selected = region.id === selectedId;
                const points = quad.map((point) => point.join(",")).join(" ");
                return (
                  <polygon
                    key={region.id}
                    points={points}
                    vectorEffect="non-scaling-stroke"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(region.id);
                    }}
                    className="pointer-events-auto cursor-pointer"
                    fill={selected ? "rgba(214,242,92,0.22)" : "rgba(243,236,223,0.08)"}
                    stroke={selected ? "#d6f25c" : "#f3ecdf"}
                    strokeWidth={selected ? 2.5 : 1.5}
                  />
                );
              })}
            </svg>
            {visible.map(({ region, quad }) => {
              const left = (Math.min(...quad.map((point) => point[0])) / sourceWidth) * 100;
              const top = (Math.min(...quad.map((point) => point[1])) / sourceHeight) * 100;
              const selected = region.id === selectedId;
              return (
                <button
                  key={`${region.id}-label`}
                  type="button"
                  onClick={() => onSelect(region.id)}
                  className={`pointer-events-auto absolute -translate-y-full px-1.5 py-0.5 text-[11px] tracking-wide ${
                    selected ? "bg-lime text-ink" : "bg-ink/80 text-paper"
                  }`}
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  {region.text}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-ink/75 px-3 py-1 text-xs tracking-[0.16em] uppercase text-paper">
        {playing ? "Playing" : "Paused"} · frame {frame}
      </div>
    </div>
  );
}
