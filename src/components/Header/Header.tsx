import React, { useRef, useState } from 'react';
import type { MediaAsset } from '../../utils/sampleAssets';
import type { FrameRate } from '../../types/timecode';
import { Film, Upload, Clock, CheckCircle2, Share2, ChevronRight, Layers } from 'lucide-react';
import { ShareModal } from '../Sharing/ShareModal';

interface HeaderProps {
  currentAsset: MediaAsset;
  assets: MediaAsset[];
  onSelectAsset: (asset: MediaAsset) => void;
  onUploadCustomVideo: (file: File) => void;
  fps: FrameRate;
  onFpsChange: (fps: FrameRate) => void;
  commentCount: number;
  workspaceName?: string;
  projectName?: string;
  onNavigateGrid?: () => void;
  onOpenShareModal?: (asset: MediaAsset) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentAsset,
  assets,
  onSelectAsset,
  onUploadCustomVideo,
  fps,
  onFpsChange,
  commentCount,
  workspaceName = 'CinePlay Main Studio',
  projectName = 'Commercial Reel 2026',
  onNavigateGrid,
  onOpenShareModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLocalShareOpen, setIsLocalShareOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCustomVideo(file);
    }
  };

  const handleShareClick = () => {
    if (onOpenShareModal) {
      onOpenShareModal(currentAsset);
    } else {
      setIsLocalShareOpen(true);
    }
  };

  return (
    <header className="header-bar">
      <div className="header-brand">
        <div className="brand-logo" onClick={onNavigateGrid} style={{ cursor: 'pointer' }}>
          <Film className="brand-icon" />
          <span className="brand-title">CINEPLAY</span>
          <span className="brand-tag">PRO</span>
        </div>

        {/* Frame.io-Inspired Breadcrumb Trail */}
        <nav className="header-breadcrumbs">
          <span className="bc-item workspace">{workspaceName}</span>
          <ChevronRight className="bc-sep" />
          <span
            className="bc-item project clickable"
            onClick={onNavigateGrid}
            title="Back to Project Asset Grid"
          >
            {projectName}
          </span>
          <ChevronRight className="bc-sep" />
          <div className="bc-item asset-version-picker">
            <select
              className="header-asset-select"
              value={currentAsset.id}
              onChange={(e) => {
                const selected = assets.find((a) => a.id === e.target.value);
                if (selected) onSelectAsset(selected);
              }}
            >
              {assets.map((asset, idx) => {
                const verTag = `V${assets.length - idx}`;
                return (
                  <option key={asset.id} value={asset.id}>
                    {asset.title} ({verTag}) {asset.isCustom ? '[Local]' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </nav>
      </div>

      <div className="header-meta">
        {/* Active Presence Avatars */}
        <div className="presence-avatar-stack" title="2 Active Reviewers Viewing Asset">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Alex Producer"
            className="presence-avatar"
          />
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
            alt="Sarah Connor"
            className="presence-avatar avatar-offset"
          />
          <span className="presence-pulse-dot" />
        </div>

        <div className="fps-selector">
          <Clock className="meta-icon" />
          <span className="meta-label">Timebase:</span>
          <select
            className="fps-dropdown"
            value={fps}
            onChange={(e) => onFpsChange(Number(e.target.value) as FrameRate)}
          >
            <option value={23.976}>23.976 fps (Film)</option>
            <option value={24}>24 fps (Cinema)</option>
            <option value={25}>25 fps (PAL)</option>
            <option value={29.97}>29.97 fps (NTSC)</option>
            <option value={30}>30 fps (Web)</option>
            <option value={50}>50 fps (High PAL)</option>
            <option value={59.94}>59.94 fps (Broadcast)</option>
            <option value={60}>60 fps (Gaming)</option>
          </select>
        </div>

        <div className="badge-stat">
          <Layers className="stat-icon" />
          <span>{commentCount} Notes</span>
        </div>

        <div className="badge-stat success">
          <CheckCircle2 className="stat-icon" />
          <span>Sync Active</span>
        </div>

        {/* Frame.io-Style Purple Share Action Button */}
        <button
          className="btn-share-header"
          onClick={handleShareClick}
          title="Share passcode-protected review link with client"
        >
          <Share2 className="btn-icon" />
          <span>Share</span>
        </button>

        <button
          className="btn-upload"
          onClick={() => fileInputRef.current?.click()}
          title="Upload local video file from your disk"
        >
          <Upload className="btn-icon" />
          <span>Upload Video</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {isLocalShareOpen && (
          <ShareModal asset={currentAsset} onClose={() => setIsLocalShareOpen(false)} />
        )}
      </div>
    </header>
  );
};
