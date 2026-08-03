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
}

export const SAMPLE_ASSETS: MediaAsset[] = [
  {
    id: 'demo-asset-1',
    title: 'Cinematic Film Trailer (24 fps)',
    filename: 'cinematic_trailer_24fps.mp4',
    fps: 24,
    duration: 59.6,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop',
    status: 'needs_review',
    isDeleted: false,
  },
  {
    id: 'demo-asset-2',
    title: 'Sintel Action VFX Reel (23.976 fps)',
    filename: 'vfx_sintel_23.976fps.mp4',
    fps: 23.976,
    duration: 52.2,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop',
    status: 'in_progress',
    isDeleted: false,
  },
  {
    id: 'demo-asset-3',
    title: 'Tears of Steel Sci-Fi Cut (29.97 fps)',
    filename: 'tears_of_steel_29.97fps.mp4',
    fps: 29.97,
    duration: 120.0,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1000&auto=format&fit=crop',
    status: 'approved',
    isDeleted: false,
  },
];
