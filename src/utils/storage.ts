import type { FrameComment } from '../types/comment';
import { SAMPLE_ASSETS, type MediaAsset } from './sampleAssets';

const COMMENTS_STORAGE_KEY = 'frame_alt_comments_v1';
const ASSETS_STORAGE_KEY = 'frame_alt_assets_v2';

export function getStoredAssets(): MediaAsset[] {
  try {
    const raw = localStorage.getItem(ASSETS_STORAGE_KEY);
    if (!raw) return SAMPLE_ASSETS;
    const storedAssets: MediaAsset[] = JSON.parse(raw);
    const merged = [...SAMPLE_ASSETS];
    storedAssets.forEach((sa) => {
      const idx = merged.findIndex((a) => a.id === sa.id);
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], ...sa };
      } else {
        merged.push(sa);
      }
    });
    return merged;
  } catch (err) {
    console.error('Failed to parse assets from storage', err);
    return SAMPLE_ASSETS;
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
    if (!raw) return getInitialDemoComments(assetId);
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

function getInitialDemoComments(assetId: string): FrameComment[] {
  if (assetId !== 'demo-asset-1') return [];

  return [
    {
      id: 'demo-comment-1',
      assetId: 'demo-asset-1',
      authorName: 'Sarah Connor (Colorist)',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      frameNumber: 96,
      timeSeconds: 4.0,
      timecodeFormatted: '00:00:04:00',
      fps: 24,
      text: "Highlight levels look slightly blown out on the left side. Let's pull down exposure by -0.3 stops.",
      resolved: false,
      replies: [
        {
          id: 'reply-1',
          authorName: 'Alex Rivers (Editor)',
          authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          text: 'Good catch! Adjusting in LUT pass 2 now.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      drawingData: {
        version: '1.0',
        canvasWidth: 1280,
        canvasHeight: 720,
        shapes: [
          {
            id: 'rect-demo-1',
            type: 'rectangle',
            color: '#ef4444',
            lineWidth: 3,
            x: 200,
            y: 120,
            width: 340,
            height: 220,
          },
          {
            id: 'arrow-demo-1',
            type: 'arrow',
            color: '#eab308',
            lineWidth: 3,
            start: { x: 560, y: 230 },
            end: { x: 480, y: 230 },
          },
        ],
      },
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'demo-comment-2',
      assetId: 'demo-asset-1',
      authorName: 'Marcus Vance (Director)',
      authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      frameNumber: 360,
      timeSeconds: 15.0,
      timecodeFormatted: '00:00:15:00',
      fps: 24,
      text: 'Perfect frame pacing right here! Can we hold this reaction shot for 6 extra frames?',
      resolved: true,
      replies: [],
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];
}
