import type { MouseEvent } from "react";
import { formatClock, type ClipScene } from "../scenes";
import type { Region } from "../types";

type Props = {
  frame: number;
  frameCount: number;
  fps: number;
  regions: Region[];
  scenes: ClipScene[];
  readingScenes: boolean;
  selectedId: string | null;
  onSeek: (frame: number) => void;
  onSelect: (id: string) => void;
  onOpenScene: (scene: ClipScene) => void;
};

export function Timeline({ frame, frameCount, fps, regions, scenes, readingScenes, selectedId, onSeek, onSelect, onOpenScene }: Props) {
  const lanes = pack(regions);
  const span = Math.max(frameCount - 1, 1);
  return (
    <div className="border-t border-line bg-panel px-4 py-3">
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted">
        <span>Timeline</span>
        <span>
          {frame} / {Math.max(frameCount - 1, 0)} · {(frame / fps).toFixed(2)}s
        </span>
      </div>
      <div
        className="relative h-3 cursor-pointer bg-panel-2"
        onClick={(event) => seekFromEvent(event, span, onSeek)}
      >
        <div className="absolute inset-y-0 left-0 bg-lime/30" style={{ width: `${(frame / span) * 100}%` }} />
        <div className="absolute top-0 h-full w-px bg-lime" style={{ left: `${(frame / span) * 100}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {readingScenes && <p className="text-sm text-muted">Splitting the clip into screens…</p>}
        {scenes.map((scene, index) => {
          const active = frame >= scene.startFrame && frame <= scene.endFrame;
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => onOpenScene(scene)}
              className={`px-2 py-1 text-left text-[12px] ${active ? "bg-lime text-ink" : "bg-panel-2 text-paper hover:bg-line"}`}
            >
              Screen {index + 1} · {formatClock(scene.startTime)}–{formatClock(scene.endTime)} · {scene.moving ? "scrolling" : "still"}
            </button>
          );
        })}
      </div>
      <div className="mt-2 space-y-1">
        {lanes.length === 0 && <p className="text-sm text-muted">Pause a screen, then pick a line to change.</p>}
        {lanes.map((lane, index) => (
          <div key={index} className="relative h-6">
            {lane.map((region) => {
              const left = (region.start_frame / span) * 100;
              const width = Math.max(1.2, ((region.end_frame - region.start_frame) / span) * 100);
              const selected = region.id === selectedId;
              return (
                <button
                  key={region.id}
                  type="button"
                  title={region.text}
                  onClick={() => {
                    onSelect(region.id);
                    onSeek(region.start_frame);
                  }}
                  className={`absolute top-0 h-full truncate px-2 text-left text-[12px] ${
                    selected ? "bg-lime text-ink" : "bg-panel-2 text-paper hover:bg-line"
                  }`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  {region.text}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function seekFromEvent(event: MouseEvent<HTMLDivElement>, span: number, onSeek: (frame: number) => void) {
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  onSeek(Math.round(ratio * span));
}

function pack(regions: Region[]): Region[][] {
  const lanes: Region[][] = [];
  const ordered = [...regions].sort((a, b) => a.start_frame - b.start_frame || a.end_frame - b.end_frame);
  for (const region of ordered) {
    const lane = lanes.find((items) => items.every((other) => other.end_frame < region.start_frame));
    if (lane) lane.push(region);
    else lanes.push([region]);
  }
  return lanes;
}
