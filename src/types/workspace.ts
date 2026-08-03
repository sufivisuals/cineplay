import type { MediaAsset } from '../utils/sampleAssets';

export interface ProjectFolder {
  id: string;
  name: string;
  assetIds: string[];
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  folders: ProjectFolder[];
  assetIds: string[];
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  projects: Project[];
}

export interface VersionStack {
  versionGroup: string; // e.g. "asset_v_group_1"
  activeVersionId: string;
  versions: MediaAsset[];
}
