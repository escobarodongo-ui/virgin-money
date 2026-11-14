import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  cancelJob,
  getJob,
  getProject,
  getRegions,
  openSample,
  resumeProject,
  uploadVideo,
} from "./api";
import { Inspector } from "./components/Inspector";
import { Player } from "./components/Player";
import { Stages } from "./components/Stages";
import { Timeline } from "./components/Timeline";
import type { Job, Project, Region, Warning } from "./types";

const ACCEPT = ".mp4,.mov,.webm,.mkv,video/mp4,video/quicktime,video/webm,video/x-matroska";

export default function App() {
  const [project, setProject] = useState<Project | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const applyBundle = useCallback((nextProject: Project, nextJob: Job) => {
    setProject(nextProject);
    setJob(nextJob);
    setRegions([]);
    setWarnings([]);
    setSelectedId(null);
    setFrame(0);
    setError(null);
  }, []);

  useEffect(() => {
    if (!job || (job.status !== "queued" && job.status !== "running")) return;
    let stop = false;
    const tick = async () => {
      try {
        const [nextJob, nextProject] = await Promise.all([getJob(job.id), getProject(job.project_id)]);
        if (stop) return;
        setProject(nextProject);
        if (nextJob.status === "failed") setError(nextJob.error || "The job failed.");
        setJob(nextJob);
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Lost contact with the API.");
      }
    };
    const timer = window.setInterval(() => void tick(), 400);
    void tick();
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [job?.id, job?.status]);

  useEffect(() => {
    if (!project || job?.status !== "completed") return;
    let stop = false;
    getRegions(project.id)
      .then((found) => {
        if (stop) return;
        setRegions(found.regions);
        setWarnings(found.warnings);
        setSelectedId((current) => current ?? found.regions[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        if (!stop) setError(err instanceof Error ? err.message : "Could not load text regions.");
      });
    return () => {
      stop = true;
    };
  }, [project?.id, job?.status]);

  async function takeFile(file: File) {
    setUploadProgress(0);
    setError(null);
    try {
      const created = await uploadVideo(file, setUploadProgress);
      applyBundle(created.project, created.job);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setUploadProgress(null);
    }
  }

  async function loadSample() {
    setError(null);
    try {
      const created = await openSample();
      applyBundle(created.project, created.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the sample.");
    }
  }

  async function onCancel() {
    if (!job) return;
    const next = await cancelJob(job.id);
    setJob(next);
  }

  async function onResume() {
    if (!project) return;
    setError(null);
    const next = await resumeProject(project.id);
    setJob(next);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (!project?.frame_count) return;
      if (event.key === "ArrowRight") {
        setFrame((current) => Math.min(project.frame_count! - 1, current + 1));
      } else if (event.key === "ArrowLeft") {
        setFrame((current) => Math.max(0, current - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project?.frame_count]);

  const busy = job?.status === "queued" || job?.status === "running" || uploadProgress != null;
  const frameCount = project?.frame_count ?? 0;
  const fps = project?.fps || 1;

  return (
    <div className="shell">
      <header className="col-span-full flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-3xl italic leading-none text-paper">TextSwap</h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Find the words in the picture</p>
        </div>
        <p className="hidden text-xs text-muted sm:block">Phase 1 · ingest, detect, review</p>
      </header>

      <aside className="flex min-h-0 flex-col gap-5 border-r border-line bg-ink px-4 py-4">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) void takeFile(file);
          }}
          className={`border border-dashed px-4 py-5 ${dragging ? "border-lime bg-panel" : "border-line"}`}
        >
          <p className="font-serif text-2xl leading-tight text-paper">Drop a video</p>
          <p className="mt-1 text-sm text-muted">mp4, mov, webm, or mkv. Audio is copied, not re-encoded.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="bg-lime px-3 py-1.5 text-sm text-ink disabled:opacity-40"
            >
              Choose file
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void loadSample()}
              className="border border-line px-3 py-1.5 text-sm text-paper disabled:opacity-40"
            >
              Load sample
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void takeFile(file);
              event.target.value = "";
            }}
          />
          {uploadProgress != null && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] uppercase tracking-[0.14em] text-muted">
                <span>Uploading</span>
                <span>{Math.round(uploadProgress * 100)}%</span>
              </div>
              <div className="h-1 bg-panel-2">
                <div className="h-full bg-lime" style={{ width: `${uploadProgress * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {project && (
          <div className="text-sm">
            <p className="truncate text-paper">{project.filename}</p>
            <p className="mt-1 text-muted">
              {project.width && project.height ? `${project.width}×${project.height}` : "Reading…"}
              {project.fps ? ` · ${project.fps.toFixed(2)} fps` : ""}
              {project.audio_present ? " · audio kept" : ""}
            </p>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Pipeline</p>
            {job && (
              <span className="text-[11px] uppercase tracking-[0.14em] text-lime">{Math.round(job.progress * 100)}%</span>
            )}
          </div>
          <div className="mb-3 h-1 bg-panel-2">
            <div className="h-full bg-lime transition-[width]" style={{ width: `${Math.round((job?.progress ?? 0) * 100)}%` }} />
          </div>
          <Stages job={job} />
          {job?.message && <p className="mt-3 text-sm text-muted">{job.message}</p>}
          <div className="mt-3 flex gap-2">
            {busy && job && (
              <button type="button" onClick={() => void onCancel()} className="border border-line px-3 py-1.5 text-sm">
                Cancel
              </button>
            )}
            {job && (job.status === "cancelled" || job.status === "failed") && (
              <button type="button" onClick={() => void onResume()} className="bg-paper px-3 py-1.5 text-sm text-ink">
                Resume
              </button>
            )}
          </div>
          {error && <p className="mt-3 text-sm leading-snug text-ember">{error}</p>}
        </div>
      </aside>

      <main className="workspace min-w-0 bg-black">
        {project?.proxy_ready && project.width && project.fps && project.frame_count ? (
          <>
            <Player
              project={project}
              regions={regions}
              frame={frame}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onFrame={setFrame}
            />
            <Timeline
              frame={frame}
              frameCount={frameCount}
              fps={fps}
              regions={regions}
              selectedId={selectedId}
              onSeek={setFrame}
              onSelect={setSelectedId}
            />
          </>
        ) : (
          <Empty busy={busy} filename={project?.filename ?? null} />
        )}
      </main>

      <Inspector regions={regions} warnings={warnings} selectedId={selectedId} fps={fps} onSelect={(id) => {
        setSelectedId(id);
        const region = regions.find((item) => item.id === id);
        if (region) setFrame(region.start_frame);
      }} />
    </div>
  );
}

function Empty({ busy, filename }: { busy: boolean; filename: string | null }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-start justify-end bg-[radial-gradient(circle_at_20%_20%,#2a241c,transparent_42%),linear-gradient(#17140f,#0e0c0a)] px-8 py-10">
      <p className="font-serif text-5xl italic leading-[0.95] text-paper sm:text-6xl">
        {busy ? "Working through the clip." : "The words are already in the shot."}
      </p>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        {filename
          ? `${filename} is being prepared. The preview opens as soon as the proxy is encoded, and the boxes arrive when detection finishes.`
          : "Upload footage or load the storefront sample. TextSwap outlines every phrase it can read and keeps that outline on the timeline."}
      </p>
    </div>
  );
}
