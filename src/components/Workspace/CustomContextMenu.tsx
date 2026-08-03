import React, { useState, useEffect, useRef } from 'react';
import type { MediaAsset } from '../../utils/sampleAssets';
import {
  Users,
  Lock,
  Share2,
  Link2,
  ChevronRight,
  Monitor,
  ExternalLink,
  Download,
  Copy,
  FolderOutput,
  CopyPlus,
  Edit3,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface CustomContextMenuProps {
  x: number;
  y: number;
  asset: MediaAsset;
  onClose: () => void;
  onSelectAsset: (asset: MediaAsset) => void;
  onOpenShareModal: (asset: MediaAsset) => void;
  onStackNewVersion: (asset: MediaAsset) => void;
  onOpenComparePlayer: () => void;
  onOpenFileInfo: (asset: MediaAsset) => void;
  onDeleteAsset?: (assetId: string) => void;
  isTrashView?: boolean;
  onRestoreAsset?: (assetId: string) => void;
  onPermanentDeleteAsset?: (assetId: string) => void;
}

export const CustomContextMenu: React.FC<CustomContextMenuProps> = ({
  x,
  y,
  asset,
  onClose,
  onSelectAsset,
  onOpenShareModal,
  onOpenFileInfo,
  onDeleteAsset,
  isTrashView = false,
  onRestoreAsset,
  onPermanentDeleteAsset,
}) => {
  const [isRestricted, setIsRestricted] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click or Esc key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust coordinates so menu fits within viewport
  const adjustedX = Math.max(10, Math.min(x, window.innerWidth - 260));
  const adjustedY = Math.max(10, Math.min(y, window.innerHeight - 540));

  const handleCopyUrl = () => {
    const shareUrl = `${window.location.origin}/?review=${asset.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => {
      setCopiedUrl(false);
      onClose();
    }, 1200);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.filename || asset.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="frame-io-context-menu"
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
    >
      {isTrashView ? (
        /* Recycle Bin Context Menu Mode */
        <>
          <button
            className="ctx-item success"
            onClick={() => {
              if (onRestoreAsset) onRestoreAsset(asset.id);
              onClose();
            }}
          >
            <RotateCcw className="ctx-ic success" />
            <span>Restore Asset</span>
          </button>

          <div className="ctx-divider" />

          <button
            className="ctx-item danger"
            onClick={() => {
              if (window.confirm(`Permanently delete "${asset.title}"? This cannot be undone.`)) {
                if (onPermanentDeleteAsset) onPermanentDeleteAsset(asset.id);
                onClose();
              }
            }}
          >
            <Trash2 className="ctx-ic danger" />
            <span>Permanently Delete</span>
          </button>
        </>
      ) : (
        /* Normal Project Asset Context Menu Mode */
        <>
          {/* Section 1: Access Control */}
          <button className="ctx-item" onClick={() => onOpenFileInfo(asset)}>
            <Users className="ctx-ic" />
            <span>Manage Access</span>
          </button>

          <div className="ctx-item toggle-row" onClick={() => setIsRestricted(!isRestricted)}>
            <div className="label-with-icon">
              <Lock className="ctx-ic" />
              <span>Make Restricted</span>
            </div>
            <div className={`switch-pill ${isRestricted ? 'active' : ''}`}>
              <div className="switch-thumb" />
            </div>
          </div>

          <div className="ctx-divider" />

          {/* Section 2: Share Links */}
          <button
            className="ctx-item"
            onClick={() => {
              onOpenShareModal(asset);
              onClose();
            }}
          >
            <Share2 className="ctx-ic" />
            <span>Create Share Link</span>
          </button>

          <button className="ctx-item with-arrow" onClick={() => onOpenShareModal(asset)}>
            <div className="label-with-icon">
              <Link2 className="ctx-ic" />
              <span>Add to Share Links</span>
            </div>
            <ChevronRight className="arrow-ic" />
          </button>

          <div className="ctx-divider" />

          {/* Section 3: Open Destinations */}
          <button className="ctx-item with-badge" onClick={() => onSelectAsset(asset)}>
            <div className="label-with-icon">
              <Monitor className="ctx-ic" />
              <span>Open on Desktop</span>
            </div>
            <span className="badge-new">New</span>
          </button>

          <button
            className="ctx-item"
            onClick={() => {
              window.open(`/?review=${asset.id}`, '_blank');
              onClose();
            }}
          >
            <ExternalLink className="ctx-ic" />
            <span>Open in New Tab</span>
          </button>

          <div className="ctx-divider" />

          {/* Section 4: File Operations */}
          <button className="ctx-item" onClick={handleDownload}>
            <Download className="ctx-ic" />
            <span>Download</span>
          </button>

          <button className="ctx-item" onClick={handleCopyUrl}>
            <Copy className="ctx-ic" />
            <span>{copiedUrl ? 'Copied URL!' : 'Copy Asset URL'}</span>
          </button>

          <button className="ctx-item" onClick={() => alert(`Copied "${asset.title}" to project`)}>
            <Copy className="ctx-ic" />
            <span>Copy to</span>
          </button>

          <button className="ctx-item" onClick={() => alert(`Moving "${asset.title}"`)}>
            <FolderOutput className="ctx-ic" />
            <span>Move to</span>
          </button>

          <button className="ctx-item" onClick={() => alert(`Duplicated "${asset.title}"`)}>
            <CopyPlus className="ctx-ic" />
            <span>Duplicate</span>
          </button>

          <button
            className="ctx-item"
            onClick={() => {
              const newName = window.prompt('Rename asset:', asset.title);
              if (newName) {
                asset.title = newName;
                onClose();
              }
            }}
          >
            <Edit3 className="ctx-ic" />
            <span>Rename</span>
          </button>

          <div className="ctx-divider" />

          {/* Section 5: Delete (Red) */}
          <button
            className="ctx-item danger"
            onClick={() => {
              if (window.confirm(`Move "${asset.title}" to Recycle Bin?`)) {
                if (onDeleteAsset) {
                  onDeleteAsset(asset.id);
                }
                onClose();
              }
            }}
          >
            <Trash2 className="ctx-ic danger" />
            <span>Delete</span>
          </button>
        </>
      )}
    </div>
  );
};
