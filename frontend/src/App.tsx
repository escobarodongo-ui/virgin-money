import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelJob,
  getJob,
  getProject,
  getRegions,
  openSample,
  resumeProject,
  uploadVideo,
} from "./api";
import { FrameEditor } from "./components/FrameEditor";
import { Player } from "./components/Player";
import { Stages } from "./components/Stages";
import { Timeline } from "./components/Timeline";
import { downloadCleanVideo } from "./exportVideo";
import { localBundle, readLocalVideo } from "./localPreview";
import { captureFrame, readFrame, sampleInk } from "./ocr";
import { appearance, DEFAULT_FONT, DEFAULT_WEIGHT, newSpotId, normText, showsReplacement, type Lock, type Spot } from "./spots";
import { glyphAngle, matchLook } from "./style";
import { trackEdits } from "./trackEdits";
import type { Job, Project, Region } from "./types";

const ACCEPT = ".mp4,.mov,.webm,.mkv,video/mp4,video/quicktime,video/webm,video/x-matroska";

export default function App() {
  const [project, setProject] = useState<Project | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadSeq = useRef(0);
  const localUrl = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ocrCache = useRef(new Map<number, Spot[]>());
  const [spots, setSpots] = useState<Spot[]>([]);
  const [locks, setLocks] = useState<Lock[]>([]);
  const [spotId, setSpotId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [reading, setReading] = useState(false);
  const [locking, setLocking] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const spotsRef = useRef<Spot[]>([]);
  const locksRef = useRef<Lock[]>([]);
  const matched = useRef(new Set<string>());
  spotsRef.current = spots;
  locksRef.current = locks;

  const applyBundle = useCallback((nextProject: Project, nextJob: Job) => {
    setProject(nextProject);
    setJob(nextJob);
    setRegions([]);
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
        setProject((current) => {
          const keepLocal = Boolean(current?.local_url) && !nextProject.proxy_ready;
          if (current?.local_url && nextProject.proxy_ready) {
            URL.revokeObjectURL(current.local_url);
            if (localUrl.current === current.local_url) localUrl.current = null;
          }
          return { ...nextProject, local_url: keepLocal ? current?.local_url : undefined };
        });
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
    if (!project || project.local_url || project.id.startsWith("local") || job?.status !== "completed") return;
    let stop = false;
    getRegions(project.id)
      .then((found) => {
        if (stop) return;
        setRegions(found.regions);
        setSelectedId((current) => current ?? found.regions[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        if (!stop) setError(err instanceof Error ? err.message : "Could not load text regions.");
      });
    return () => {
      stop = true;
    };
  }, [project?.id, project?.local_url, job?.status]);

  function rememberLocalUrl(url: string | null) {
    if (localUrl.current && localUrl.current !== url) URL.revokeObjectURL(localUrl.current);
    localUrl.current = url;
  }

  async function takeFile(file: File) {
    const seq = ++uploadSeq.current;
    setError(null);
    setUploadProgress(0);
    let media;
    try {
      media = await readLocalVideo(file);
    } catch (err) {
      if (seq !== uploadSeq.current) return;
      setUploadProgress(null);
      setError(err instanceof Error ? err.message : "Could not open that video.");
      return;
    }
    if (seq !== uploadSeq.current) {
      URL.revokeObjectURL(media.url);
      return;
    }
    rememberLocalUrl(media.url);
    const preview = localBundle(file, media);
    applyBundle(preview.project, preview.job);
    setUploadProgress(null);
    try {
      const created = await uploadVideo(file, (fraction) => {
        if (seq === uploadSeq.current) setUploadProgress(fraction);
      });
      if (seq !== uploadSeq.current) return;
      if (created.project.proxy_ready) rememberLocalUrl(null);
      applyBundle(
        { ...created.project, local_url: created.project.proxy_ready ? undefined : media.url },
        created.job,
      );
    } catch {
      if (seq !== uploadSeq.current) return;
      setJob((current) =>
        current
          ? {
              ...current,
              message: "Your video is in the editor. Pause a frame, then change the text or numbers.",
            }
          : current,
      );
    } finally {
      if (seq === uploadSeq.current) setUploadProgress(null);
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

  const onVideo = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
  }, []);

  useEffect(() => {
    ocrCache.current.clear();
    setSpots([]);
    setLocks([]);
    setSpotId(null);
    setPaused(false);
    matched.current.clear();
  }, [project?.id]);

  useEffect(() => {
    if (!paused || !project?.width || !project.height) return;
    const video = videoRef.current;
    if (!video) return;
    const frameNow = frame;
    if (ocrCache.current.has(frameNow)) return;
    let stop = false;
    setReading(true);
    const run = async () => {
      if (video.readyState < 2) {
        await new Promise<void>((resolve) => video.addEventListener("loadeddata", () => resolve(), { once: true }));
      }
      if (video.seeking) {
        await new Promise<void>((resolve) => video.addEventListener("seeked", () => resolve(), { once: true }));
      }
      if (stop) return;
      try {
        const found = await readFrame(video, project.width ?? 1, project.height ?? 1);
        if (stop) return;
        const created: Spot[] = found.map((item) => ({
          ...item,
          id: newSpotId(),
          frame: frameNow,
          replacement: item.original,
        }));
        ocrCache.current.set(frameNow, created);
        setSpots((current) => {
          const kept = current.filter(
            (spot) => spot.frame === frameNow && (spot.original === "" || showsReplacement(spot)),
          );
          const keptText = new Set(kept.map((spot) => normText(spot.original)).filter(Boolean));
          const fresh = created.filter((spot) => !spot.original || !keptText.has(normText(spot.original)));
          return [...current.filter((spot) => spot.frame !== frameNow), ...kept, ...fresh];
        });
        setSpotId((current) => current ?? created[0]?.id ?? null);
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Could not read the text on this frame.");
      } finally {
        if (!stop) setReading(false);
      }
    };
    void run();
    return () => {
      stop = true;
    };
  }, [paused, frame, project?.id, project?.width, project?.height]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  function placeBox(x: number, y: number) {
    if (!project?.width || !project.height) return;
    const box = {
      w: Math.max(72, project.width * 0.14),
      h: Math.max(32, project.height * 0.07),
      x: 0,
      y: 0,
    };
    box.x = Math.min(Math.max(0, x - box.w / 2), project.width - box.w);
    box.y = Math.min(Math.max(0, y - box.h / 2), project.height - box.h);
    const video = videoRef.current;
    const context = video ? captureFrame(video) : null;
    const ink = context
      ? sampleInk(context, {
          x: (box.x / project.width) * context.canvas.width,
          y: (box.y / project.height) * context.canvas.height,
          w: (box.w / project.width) * context.canvas.width,
          h: (box.h / project.height) * context.canvas.height,
        })
      : { color: "#14120e", background: "#f3ecdf" };
    const spot: Spot = {
      id: newSpotId(),
      frame,
      box,
      original: "",
      replacement: "",
      fontFamily: DEFAULT_FONT,
      fontWeight: DEFAULT_WEIGHT,
      angle: 0,
      ...ink,
    };
    setSpots((current) => [...current, spot]);
    setSpotId(spot.id);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (!project?.frame_count) return;
      if (event.key === " ") {
        event.preventDefault();
        togglePlayback();
        return;
      }
      if (event.key === "ArrowRight") {
        setFrame((current) => Math.min(project.frame_count! - 1, current + 1));
      } else if (event.key === "ArrowLeft") {
        setFrame((current) => Math.max(0, current - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project?.frame_count]);

  function onReplace(id: string, value: string) {
    setSpots((current) => current.map((spot) => (spot.id === id ? { ...spot, replacement: value } : spot)));
    const spot = spotsRef.current.find((item) => item.id === id);
    const locked = locksRef.current.find((lock) => lock.id === id);
    const source = spot ?? locked;
    const box = spot?.box ?? locked?.anchor;
    setLocks((current) => {
      const existing = current.find((lock) => lock.id === id);
      if (existing) return current.map((lock) => (lock.id === id ? { ...lock, replacement: value } : lock));
      if (!source || !box || !value.trim() || value.trim() === source.original.trim()) return current;
      return [
        ...current,
        {
          id,
          original: source.original,
          replacement: value,
          fontFamily: source.fontFamily || DEFAULT_FONT,
          fontWeight: source.fontWeight || DEFAULT_WEIGHT,
          angle: "angle" in source ? source.angle : 0,
          color: source.color,
          background: source.background,
          anchor: box,
          manual: !source.original.trim(),
          samples: [],
          scanned: !source.original.trim(),
        },
      ];
    });
    if (!source?.original.trim() || !box || matched.current.has(id) || !project?.width || !project.height) return;
    const video = videoRef.current;
    const context = video ? captureFrame(video) : null;
    if (!context) return;
    matched.current.add(id);
    const scaleX = context.canvas.width / project.width;
    const scaleY = context.canvas.height / project.height;
    const measured = {
      x: box.x * scaleX,
      y: box.y * scaleY,
      w: box.w * scaleX,
      h: box.h * scaleY,
    };
    const angle = glyphAngle(context, measured);
    setLocks((current) => current.map((lock) => (lock.id === id ? { ...lock, angle } : lock)));
    void matchLook(context, measured, source.original).then((look) => {
      setLocks((current) => current.map((lock) => (lock.id === id ? { ...lock, ...look, angle } : lock)));
      setSpots((current) => current.map((item) => (item.id === id ? { ...item, ...look, angle } : item)));
    });
  }

  const scanKey = locks
    .filter((lock) => !lock.manual && lock.original.trim() && !lock.scanned)
    .map((lock) => lock.id)
    .join(",");

  useEffect(() => {
    if (!scanKey || !project?.width || !project.height) return;
    const src = videoRef.current?.currentSrc;
    if (!src) return;
    const ids = new Set(scanKey.split(","));
    const signal = { stopped: false };
    setLocking(0);
    void trackEdits({
      src,
      width: project.width,
      height: project.height,
      locks: locksRef.current.filter((lock) => ids.has(lock.id)),
      signal,
      onProgress: setLocking,
    })
      .then((found) => {
        if (signal.stopped) return;
        setLocks((current) =>
          current.map((lock) => {
            const samples = found.get(lock.id);
            if (!samples || lock.scanned) return lock;
            return { ...lock, samples, scanned: true };
          }),
        );
        setLocking(null);
      })
      .catch((err: unknown) => {
        if (signal.stopped) return;
        setLocking(null);
        setError(err instanceof Error ? err.message : "Could not keep the change through the clip.");
      });
    return () => {
      signal.stopped = true;
    };
  }, [scanKey, project?.id, project?.width, project?.height]);

  async function onDownload() {
    const video = videoRef.current;
    if (!video?.currentSrc || !project?.width || !project.height) return;
    if (!video.paused) video.pause();
    setDownloading(true);
    setDownloadProgress(0);
    setError(null);
    try {
      await downloadCleanVideo({
        src: video.currentSrc,
        width: project.width,
        height: project.height,
        filename: project.filename,
        locks: locksRef.current,
        onProgress: setDownloadProgress,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download the video.");
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  }

  const busy = job?.status === "queued" || job?.status === "running" || uploadProgress != null;
  const frameCount = project?.frame_count ?? 0;
  const fps = project?.fps || 1;
  const covered = new Set<string>();
  const painted: Spot[] = locks.flatMap((lock) => {
    const placed = appearance(lock, frame / fps);
    if (!placed) return [];
    covered.add(lock.id);
    if (lock.original) covered.add(normText(lock.original));
    return [
      {
        id: lock.id,
        frame,
        box: placed.box,
        original: lock.original,
        replacement: lock.replacement,
        color: placed.color,
        background: placed.background,
        fontFamily: lock.fontFamily,
        fontWeight: lock.fontWeight,
        angle: placed.angle,
      },
    ];
  });
  const frameSpots = [
    ...spots.filter(
      (spot) =>
        spot.frame === frame &&
        !covered.has(spot.id) &&
        !(spot.original && covered.has(normText(spot.original))),
    ),
    ...painted,
  ];
  const canDownload = locks.some((lock) => showsReplacement(lock));

  return (
    <div className="shell">
      <header className="col-span-full flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-3xl italic leading-none text-paper">TextSwap</h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Edits stay in the video</p>
        </div>
        <p className="hidden text-xs text-muted sm:block">Text editor</p>
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
        {(project?.local_url || project?.proxy_ready) && project.width && project.fps && project.frame_count ? (
          <>
            <Player
              project={project}
              regions={regions}
              spots={frameSpots}
              frame={frame}
              selectedId={spotId}
              onSelect={setSpotId}
              onFrame={setFrame}
              onPick={placeBox}
              onVideo={onVideo}
              onPlayback={(playing) => setPaused(!playing)}
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

      <FrameEditor
        hasVideo={Boolean((project?.local_url || project?.proxy_ready) && project.width)}
        paused={paused}
        frame={frame}
        reading={reading}
        spots={frameSpots}
        selectedId={spotId}
        canDownload={canDownload}
        downloading={downloading}
        downloadProgress={downloadProgress}
        locking={locking}
        onPause={togglePlayback}
        onPlay={togglePlayback}
        onSelect={setSpotId}
        onChange={onReplace}
        onDownload={() => void onDownload()}
      />
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
