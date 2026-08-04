export type AssetStatus = 'needs_review' | 'in_progress' | 'approved';

export interface MediaAsset {
  id: string;
  title: string;
  filename: string;
  fps: number;
  duration: number; // estimated
  url: string;
  poster: string;
  isCustom?: boolean;
  status?: AssetStatus;
  isDeleted?: boolean;
  assignedClient?: string; // Client email or 'all'
  projectId?: string; // Associated Project ID
}

export const SAMPLE_ASSETS: MediaAsset[] = [];
