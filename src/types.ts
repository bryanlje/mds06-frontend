export interface BadmintonEvent {
  label: string;
  track_id: number;
  t0: number; // Start time/frame
  t1?: number; // End time/frame
  score?: number;
}

export interface ModelResult {
  events: BadmintonEvent[];
  aiSummary?: string;
  aiVerified?: string;
  outputs?: {
    overlay_mp4?: { gcs_uri: string };
    overlay_video?: string;
  };
}

export interface PlayerStats {
  [shotType: string]: number[]; // Index corresponds to player ID
}
