export type Quad = [number, number][];

export type RegionFrame = {
  frame_index: number;
  time: number;
  quad: Quad;
  text: string;
  confidence: number;
};

export type Region = {
  id: string;
  text: string;
  confidence: number;
  start_frame: number;
  end_frame: number;
  start_time: number;
  end_time: number;
  angle: number;
  frames: RegionFrame[];
};

export type Warning = {
  code: string;
  message: string;
  region_id?: string;
  start_frame?: number;
  end_frame?: number;
};

export type Project = {
  id: string;
  filename: string;
  created_at: string;
  status: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  frame_count: number | null;
  duration: number | null;
  video_codec: string | null;
  audio_present: boolean;
  audio_copied: boolean;
  proxy_ready: boolean;
  proxy_width: number | null;
  proxy_height: number | null;
  region_count: number;
  warnings: Warning[];
  /** Browser object URL used when the processing API is not what plays the clip. */
  local_url?: string;
};

export type Stage = {
  name: string;
  status: string;
  progress: number;
};

export type Job = {
  id: string;
  project_id: string;
  status: string;
  stage: string;
  progress: number;
  message: string;
  error: string | null;
  stages: Stage[];
  created_at: string;
  updated_at: string;
};

export const STAGE_LABELS: Record<string, string> = {
  probe: "Read the file",
  extract_audio: "Lift the audio",
  proxy: "Make a preview",
  detect: "Find the text",
  associate: "Link it across frames",
};
