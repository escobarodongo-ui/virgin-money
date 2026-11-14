import { STAGE_LABELS, type Job } from "../types";

const ORDER = ["probe", "extract_audio", "proxy", "detect", "associate"];

export function Stages({ job }: { job: Job | null }) {
  const byName = new Map((job?.stages ?? []).map((stage) => [stage.name, stage]));
  return (
    <ol className="space-y-2">
      {ORDER.map((name) => {
        const stage = byName.get(name);
        const status = stage?.status ?? "pending";
        const progress = stage?.progress ?? 0;
        return (
          <li key={name} className="grid grid-cols-[16px_1fr] gap-2 items-start">
            <StatusDot status={status} />
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <span className={status === "pending" ? "text-muted" : "text-paper"}>{STAGE_LABELS[name]}</span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  {status === "running" ? `${Math.round(progress * 100)}%` : status}
                </span>
              </div>
              <div className="mt-1 h-[3px] bg-panel-2 overflow-hidden">
                <div
                  className={`h-full ${status === "failed" ? "bg-ember" : "bg-lime"}`}
                  style={{ width: `${Math.round((status === "completed" ? 1 : progress) * 100)}%` }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "completed" ? "bg-lime" : status === "running" ? "bg-lime animate-pulse" : status === "failed" ? "bg-ember" : "bg-line";
  return <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${color}`} />;
}
