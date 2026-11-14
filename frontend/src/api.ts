import type { Job, Project, Region, Warning } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      /* body was not JSON */
    }
    throw new ApiError(response.status, String(detail));
  }
  return response.json() as Promise<T>;
}

export function uploadVideo(
  file: File,
  onProgress: (fraction: number) => void,
): Promise<{ project: Project; job: Job }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/projects");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      let payload: { project?: Project; job?: Job; detail?: string } | null = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = null;
      }
      if (xhr.status >= 200 && xhr.status < 300 && payload?.project && payload.job) {
        resolve({ project: payload.project, job: payload.job });
        return;
      }
      const detail = payload?.detail || "The processing service did not accept that video.";
      reject(new ApiError(xhr.status, detail));
    };
    xhr.onerror = () => reject(new ApiError(0, "Upload failed. Is the API running?"));
    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  });
}

export async function openSample(): Promise<{ project: Project; job: Job }> {
  const response = await fetch("/api/sample", { method: "POST" });
  return parse(response);
}

export async function getProject(id: string): Promise<Project> {
  return parse(await fetch(`/api/projects/${id}`));
}

export async function getRegions(id: string): Promise<{ regions: Region[]; warnings: Warning[] }> {
  return parse(await fetch(`/api/projects/${id}/regions`));
}

export async function getJob(id: string): Promise<Job> {
  return parse(await fetch(`/api/jobs/${id}`));
}

export async function cancelJob(id: string): Promise<Job> {
  return parse(await fetch(`/api/jobs/${id}/cancel`, { method: "POST" }));
}

export async function resumeProject(id: string): Promise<Job> {
  return parse(
    await fetch(`/api/projects/${id}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quality: "balanced" }),
    }),
  );
}
