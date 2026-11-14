import { useEffect, useRef } from "react";
import type { Spot } from "../spots";

type Props = {
  hasVideo: boolean;
  paused: boolean;
  frame: number;
  reading: boolean;
  spots: Spot[];
  selectedId: string | null;
  onPause: () => void;
  onPlay: () => void;
  onSelect: (id: string) => void;
  onChange: (id: string, value: string) => void;
};

export function FrameEditor({
  hasVideo,
  paused,
  frame,
  reading,
  spots,
  selectedId,
  onPause,
  onPlay,
  onSelect,
  onChange,
}: Props) {
  const selected = spots.find((spot) => spot.id === selectedId) ?? null;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selected && paused) inputRef.current?.focus();
  }, [selected?.id, paused]);

  return (
    <aside className="flex h-full min-h-[280px] flex-col border-t border-line bg-panel lg:border-t-0 lg:border-l">
      <div className="border-b border-line px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-lime">Text editor</p>
        <h2 className="mt-1 font-serif text-4xl italic leading-none text-paper">Edit this frame</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Pause on the picture, click a word or number, then type the replacement. It is painted onto that frame.
        </p>
        {hasVideo && (
          <button
            type="button"
            onClick={paused ? onPlay : onPause}
            className="mt-4 w-full bg-lime px-3 py-3 text-sm font-medium text-ink"
          >
            {paused ? "Play" : "Pause to edit this frame"}
          </button>
        )}
      </div>

      {hasVideo && paused && (
        <div className="border-b border-line px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Frame {frame}</p>
          {reading && <p className="mt-3 text-sm text-paper">Reading the text and numbers on this frame…</p>}
          {!reading && !selected && (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Click a highlighted word or number. Click empty picture to drop a new box, then type.
            </p>
          )}
          {selected && (
            <label className="mt-3 block">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted">
                {selected.original ? `Replace “${selected.original}”` : "New text or number"}
              </span>
              <input
                ref={inputRef}
                value={selected.replacement}
                onChange={(event) => onChange(selected.id, event.target.value)}
                placeholder={selected.original || "Type here"}
                className="mt-2 w-full border border-line bg-ink px-3 py-3 text-2xl text-paper outline-none focus:border-lime"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        {spots.map((spot) => {
          const active = spot.id === selectedId;
          const label = spot.replacement.trim() || spot.original || "New box";
          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => onSelect(spot.id)}
              className={`mb-1 flex w-full items-baseline justify-between gap-3 px-2 py-2 text-left ${
                active ? "bg-lime text-ink" : "hover:bg-panel-2"
              }`}
            >
              <span className="truncate text-[15px]">{label}</span>
              <span className={`shrink-0 text-[11px] tracking-wide ${active ? "text-ink/70" : "text-muted"}`}>
                {spot.original && spot.replacement.trim() && spot.replacement.trim() !== spot.original
                  ? spot.original
                  : /[0-9]/.test(spot.original)
                    ? "number"
                    : "text"}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
