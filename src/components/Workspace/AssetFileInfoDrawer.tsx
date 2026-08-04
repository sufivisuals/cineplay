import React from 'react';
import type { MediaAsset, AssetStatus } from '../../utils/sampleAssets';
import { PRESET_USERS } from '../../types/auth';
import { X, Film, Layers, HardDrive, Tag, UserCheck } from 'lucide-react';

interface AssetFileInfoDrawerProps {
  asset: MediaAsset;
  commentCount: number;
  onClose: () => void;
  onUpdateStatus?: (assetId: string, status: AssetStatus) => void;
  onAssignClient?: (assetId: string, clientEmail: string) => void;
}

export const AssetFileInfoDrawer: React.FC<AssetFileInfoDrawerProps> = ({
  asset,
  commentCount,
  onClose,
  onUpdateStatus,
  onAssignClient,
}) => {
  const currentStatus: AssetStatus = asset.status || 'needs_review';
  const assignedClient = asset.assignedClient || 'all';

  const clientsList = PRESET_USERS.filter((u) => u.role === 'client');

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

          {/* Client Privacy & Assignment */}
          <div className="drawer-section">
            <h5 className="section-heading">
              <UserCheck className="sec-ic" /> Client Access Assignment
            </h5>
            <select
              className="drawer-status-select"
              style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-cyan)' }}
              value={assignedClient}
              onChange={(e) => {
                if (onAssignClient) {
                  onAssignClient(asset.id, e.target.value);
                }
              }}
            >
              <option value="all">🌐 All Clients & Everyone</option>
              {clientsList.map((c) => (
                <option key={c.email} value={c.email}>
                  🔒 Restricted to: {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Technical Metadata */}
          <div className="drawer-section">
            <h5 className="section-heading">
              <HardDrive className="sec-ic" /> Technical Metadata
            </h5>
            <div className="meta-grid-table">
              <div className="meta-row">
                <span className="meta-key">Timebase FPS:</span>
                <span className="meta-val highlight">{asset.fps} fps</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Frame Count:</span>
                <span className="meta-val">{Math.round(asset.duration * asset.fps)} frames</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Comment Notes:</span>
                <span className="meta-val">
                  <Layers className="row-ic" /> {commentCount} annotations
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Source Type:</span>
                <span className="meta-val">{asset.isCustom ? 'Local Upload' : 'Cloud Master'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
