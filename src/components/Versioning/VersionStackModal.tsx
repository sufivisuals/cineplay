import React, { useRef } from 'react';
import type { MediaAsset } from '../../utils/sampleAssets';
import { Layers, Upload, X, Check, Clock } from 'lucide-react';

interface VersionStackModalProps {
  asset: MediaAsset;
  assets: MediaAsset[];
  onClose: () => void;
  onUploadNewVersion: (file: File) => void;
  onSelectActiveVersion: (asset: MediaAsset) => void;
}

export const VersionStackModal: React.FC<VersionStackModalProps> = ({
  asset,
  assets,
  onClose,
  onUploadNewVersion,
  onSelectActiveVersion,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadNewVersion(file);
    }
  };

  return (
    <div className="version-modal-overlay">
      <div className="version-modal-card">
        <div className="version-modal-header">
          <div className="header-title-box">
            <Layers className="modal-icon" />
            <div>
              <h3>Version Stack Management</h3>
              <span className="modal-sub">{asset.title}</span>
            </div>
          </div>

          <button className="btn-close-modal" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="version-modal-body">
          <div className="upload-new-ver-box" onClick={() => fileInputRef.current?.click()}>
            <Upload className="up-icon" />
            <div className="up-text-group">
              <span className="up-title">Upload New Revision (V{assets.length + 1})</span>
              <span className="up-desc">Drag & drop new render cut or click to browse</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <h4 className="section-subtitle">Version History ({assets.length} Versions)</h4>

          <div className="versions-list">
            {assets.map((item, idx) => {
              const verNum = assets.length - idx;
              const isActive = item.id === asset.id;

              return (
                <div
                  key={item.id}
                  className={`version-item-row ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectActiveVersion(item)}
                >
                  <div className="ver-badge">V{verNum}</div>
                  <div className="ver-thumb">
                    <img src={item.poster} alt={item.title} />
                  </div>
                  <div className="ver-info">
                    <span className="ver-name">{item.title}</span>
                    <span className="ver-date">
                      <Clock className="ic" /> Uploaded {idx === 0 ? 'Today' : `${idx + 1} days ago`} • {item.fps} fps
                    </span>
                  </div>

                  {isActive ? (
                    <span className="active-tag">
                      <Check className="ic" /> Active Playback
                    </span>
                  ) : (
                    <button className="btn-make-active">Set Active</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
