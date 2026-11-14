import { formatTimecode } from "../geometry";
import type { Region, Warning } from "../types";

type Props = {
  regions: Region[];
  warnings: Warning[];
  selectedId: string | null;
  fps: number;
  onSelect: (id: string) => void;
};

export function Inspector({ regions, warnings, selectedId, fps, onSelect }: Props) {
  const selected = regions.find((region) => region.id === selectedId) ?? null;
  const regionWarnings = warnings.filter((warning) => warning.region_id && warning.region_id === selected?.id);
  return (
    <aside className="flex h-full min-h-[280px] flex-col border-t border-line bg-panel lg:border-t-0 lg:border-l">
      <div className="border-b border-line px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Recognized text</p>
        {selected ? (
          <>
            <h2 className="mt-2 font-serif text-4xl leading-none text-paper">{selected.text}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <Stat label="Confidence" value={`${Math.round(selected.confidence * 100)}%`} />
              <Stat label="Angle" value={`${selected.angle.toFixed(1)}°`} />
              <Stat label="In" value={formatTimecode(selected.start_frame / fps)} />
              <Stat label="Out" value={formatTimecode(selected.end_frame / fps)} />
              <Stat label="Frames" value={`${selected.start_frame}–${selected.end_frame}`} />
              <Stat label="Samples" value={String(selected.frames.length)} />
            </dl>
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Click a box on the picture. The words Tesseract read are shown here, along with any frame range that
            needs a closer look.
          </p>
        )}
      </div>
      {regionWarnings.length > 0 && (
        <div className="border-b border-line px-4 py-3">
          {regionWarnings.map((warning, index) => (
            <p key={index} className="mb-2 text-sm leading-snug text-ember last:mb-0">
              {warning.message}
            </p>
          ))}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        {regions.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted">
            No text boxes yet. The clip is in the player, so you can play it and scrub the timeline.
          </p>
        )}
        {regions.map((region) => {
          const active = region.id === selectedId;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => onSelect(region.id)}
              className={`mb-1 flex w-full items-baseline justify-between gap-3 px-2 py-2 text-left ${
                active ? "bg-lime text-ink" : "hover:bg-panel-2"
              }`}
            >
              <span className="truncate text-[15px]">{region.text}</span>
              <span className={`shrink-0 text-[11px] tracking-wide ${active ? "text-ink/70" : "text-muted"}`}>
                {formatTimecode(region.start_time)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-muted">
        Boxes between sampled frames are a straight blend. Motion tracking, inpainting, and replacement rendering come
        in later phases.
      </p>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="text-paper">{value}</dd>
    </div>
  );
}
