import React from 'react';
import type { MediaAsset, AssetStatus } from '../../utils/sampleAssets';
import { X, Film, Layers, HardDrive, Tag } from 'lucide-react';

interface AssetFileInfoDrawerProps {
  asset: MediaAsset;
  commentCount: number;
  onClose: () => void;
  onUpdateStatus?: (assetId: string, status: AssetStatus) => void;
}

export const AssetFileInfoDrawer: React.FC<AssetFileInfoDrawerProps> = ({
  asset,
  commentCount,
  onClose,
  onUpdateStatus,
}) => {
  const currentStatus: AssetStatus = asset.status || 'needs_review';

  return (
    <div className="file-info-drawer-overlay" onClick={onClose}>
      <div className="file-info-drawer-card" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-box">
            <Film className="drawer-ic" />
            <h3>File Inspector</h3>
          </div>
          <button className="btn-close-drawer" onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Media Preview Card */}
        <div className="drawer-preview-box">
          <img src={asset.poster} alt={asset.title} className="drawer-preview-img" />
          <div className="drawer-preview-meta">
            <h4 title={asset.title}>{asset.title}</h4>
            <span className="drawer-filename">{asset.filename}</span>
          </div>
        </div>

        {/* Drawer Content Body */}
        <div className="drawer-body-sections">
          {/* Status Section */}
          <div className="drawer-section">
            <h5 className="section-heading">
              <Tag className="sec-ic" /> Review Status
            </h5>
            <select
              className={`drawer-status-select ${currentStatus}`}
              value={currentStatus}
              onChange={(e) => {
                if (onUpdateStatus) {
                  onUpdateStatus(asset.id, e.target.value as AssetStatus);
                }
              }}
            >
              <option value="needs_review">🟡 Needs Review</option>
              <option value="in_progress">🔵 In Progress</option>
              <option value="approved">🟢 Approved</option>
            </select>
          </div>

          {/* Technical Metadata */}
          <div className="drawer-section">
            <h5 className="section-heading">
              <HardDrive className="sec-ic" /> Technical Metadata
            </h5>
            <div className="meta-grid-table">
              <div className="meta-row">
                <span className="meta-key">Container / Codec</span>
                <span className="meta-val">H.264 / AAC (MP4)</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Resolution</span>
                <span className="meta-val">1920 × 1080 (1080p)</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Timebase / FPS</span>
                <span className="meta-val">{asset.fps} fps</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Estimated Duration</span>
                <span className="meta-val">{Math.floor(asset.duration)} seconds</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Storage Source</span>
                <span className="meta-val">{asset.isCustom ? 'Local User File' : 'S3 / MinIO Storage'}</span>
              </div>
            </div>
          </div>

          {/* Collaboration Activity */}
          <div className="drawer-section">
            <h5 className="section-heading">
              <Layers className="sec-ic" /> Review Activity
            </h5>
            <div className="meta-grid-table">
              <div className="meta-row">
                <span className="meta-key">Timecoded Notes</span>
                <span className="meta-val highlight">{commentCount} Notes Posted</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Uploader</span>
                <span className="meta-val">Alex Producer</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Security Status</span>
                <span className="meta-val success">Passcode & Watermark Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
