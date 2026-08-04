import type { FrameComment } from '../types/comment';
import type { Workspace } from '../types/workspace';
import { type MediaAsset } from './sampleAssets';

const COMMENTS_STORAGE_KEY = 'cineplay_comments_v5_clean';
const ASSETS_STORAGE_KEY = 'cineplay_assets_v7_clean';
const WORKSPACES_STORAGE_KEY = 'cineplay_workspaces_v5_clean';

export function clearAllCinePlayData(): void {
  try {
    localStorage.removeItem(COMMENTS_STORAGE_KEY);
    localStorage.removeItem(ASSETS_STORAGE_KEY);
    localStorage.removeItem(WORKSPACES_STORAGE_KEY);
    localStorage.clear();
    if (typeof window !== 'undefined' && window.indexedDB) {
      window.indexedDB.deleteDatabase('CinePlayMediaStoreDB');
    }
  } catch (err) {
    console.error('Failed to clear CinePlay data storage', err);
  }
}

export const CLEAN_INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: 'CinePlay Main Studio',
    slug: 'cineplay-main',
    projects: [],
  },
];

export function getStoredWorkspaces(): Workspace[] {
  try {
    const raw = localStorage.getItem(WORKSPACES_STORAGE_KEY);
    if (!raw) return CLEAN_INITIAL_WORKSPACES;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse workspaces from storage', err);
    return CLEAN_INITIAL_WORKSPACES;
  }
}

export function saveStoredWorkspaces(workspaces: Workspace[]): void {
  try {
    localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces));
  } catch (err) {
    console.error('Failed to save workspaces to storage', err);
  }
}

const FALLBACK_STREAM_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export function getStoredAssets(): MediaAsset[] {
  try {
    const raw = localStorage.getItem(ASSETS_STORAGE_KEY);
    if (!raw) return [];
    const storedAssets: MediaAsset[] = JSON.parse(raw);
    
    // Sanitize revoked blob URLs on initial hydration / page reload
    const sanitized = storedAssets.map((asset) => {
      if (asset.url && asset.url.startsWith('blob:')) {
        return {
          ...asset,
          url: FALLBACK_STREAM_URL,
        };
      }
      return asset;
    });

    return sanitized;
  } catch (err) {
    console.error('Failed to parse assets from storage', err);
    return [];
  }
}

export function saveStoredAsset(asset: MediaAsset): void {
  try {
    const current = getStoredAssets();
    const existingIndex = current.findIndex((a) => a.id === asset.id);
    let updated: MediaAsset[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...asset };
    } else {
      updated = [...current, asset];
    }
    localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save asset to storage', err);
  }
}

export function softDeleteAsset(assetId: string): MediaAsset[] {
  try {
    const current = getStoredAssets();
    const updated = current.map((a) => (a.id === assetId ? { ...a, isDeleted: true } : a));
    localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to soft delete asset', err);
    return getStoredAssets();
  }
}

export function restoreStoredAsset(assetId: string): MediaAsset[] {
  try {
    const current = getStoredAssets();
    const updated = current.map((a) => (a.id === assetId ? { ...a, isDeleted: false } : a));
    localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to restore asset', err);
    return getStoredAssets();
  }
}

export function deleteAssetPermanently(assetId: string): MediaAsset[] {
  try {
    const current = getStoredAssets();
    const updated = current.filter((a) => a.id !== assetId);
    localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.removeItem(`${COMMENTS_STORAGE_KEY}_${assetId}`);
    return updated;
  } catch (err) {
    console.error('Failed to permanently delete asset', err);
    return getStoredAssets();
  }
}

export function getStoredComments(assetId: string): FrameComment[] {
  try {
    const raw = localStorage.getItem(`${COMMENTS_STORAGE_KEY}_${assetId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse comments from storage', err);
    return [];
  }
}

export function saveStoredComments(assetId: string, comments: FrameComment[]): void {
  try {
    localStorage.setItem(`${COMMENTS_STORAGE_KEY}_${assetId}`, JSON.stringify(comments));
  } catch (err) {
    console.error('Failed to save comments to storage', err);
  }
}
