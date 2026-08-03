import React, { useState, useRef } from 'react';
import type { MediaAsset, AssetStatus } from '../../utils/sampleAssets';
import type { Project } from '../../types/workspace';
import {
  Play,
  Clock,
  Grid,
  List,
  Search,
  Plus,
  FileVideo,
  FolderPlus,
  FolderUp,
  SplitSquareVertical,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';

interface AssetGridProps {
  project: Project;
  assets: MediaAsset[];
  activeAsset: MediaAsset;
  onSelectAsset: (asset: MediaAsset) => void;
  onOpenComparePlayer: (v1Asset: MediaAsset, v2Asset: MediaAsset) => void;
  onStackNewVersion: (asset: MediaAsset) => void;
  onUploadClick: () => void;
  onUpdateAssetStatus?: (assetId: string, status: AssetStatus) => void;
  onOpenShareModal?: (asset: MediaAsset) => void;
  onRightClickCard?: (e: React.MouseEvent, asset: MediaAsset) => void;
  isTrashView?: boolean;
  onEmptyTrash?: () => void;
}

interface AssetCardItemProps {
  asset: MediaAsset;
  versionNumber: number;
  isSelected: boolean;
  isFirst: boolean;
  onSelectAsset: (asset: MediaAsset) => void;
  onStackNewVersion: (asset: MediaAsset) => void;
  onOpenComparePlayer: () => void;
  onUpdateAssetStatus?: (assetId: string, status: AssetStatus) => void;
  onRightClickCard?: (e: React.MouseEvent, asset: MediaAsset) => void;
}

const AssetCardItem: React.FC<AssetCardItemProps> = ({
  asset,
  versionNumber,
  isSelected,
  isFirst,
  onSelectAsset,
  onStackNewVersion,
  onOpenComparePlayer,
  onUpdateAssetStatus,
  onRightClickCard,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(0);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentStatus: AssetStatus = asset.status || 'needs_review';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapperRef.current || !previewVideoRef.current || !asset.duration) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const scrubTime = percentage * asset.duration;

    setHoverProgress(percentage * 100);
    previewVideoRef.current.currentTime = scrubTime;
  };

  return (
    <div
      className={`asset-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelectAsset(asset)}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onRightClickCard) onRightClickCard(e, asset);
      }}
    >
      <div
        ref={wrapperRef}
        className="card-thumbnail-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Dynamic First-Frame Video Thumbnail / Poster */}
        {asset.poster && (asset.poster.startsWith('data:image') || asset.poster.includes('unsplash') && !asset.isCustom) ? (
          <img src={asset.poster} alt={asset.title} className={`card-thumbnail ${isHovered ? 'hidden' : ''}`} />
        ) : (
          <video
            src={`${asset.url}#t=0.001`}
            className={`card-thumbnail ${isHovered ? 'hidden' : ''}`}
            preload="metadata"
            muted
            playsInline
            onLoadedData={(e) => {
              (e.target as HTMLVideoElement).currentTime = 0.001;
            }}
          />
        )}

        {/* Hover Frame Scrubbing Preview Video */}
        <video
          ref={previewVideoRef}
          src={asset.url}
          className={`card-hover-video ${isHovered ? 'active' : ''}`}
          muted
          playsInline
        />

        {/* Hover Scrubbing Track Progress Bar */}
        {isHovered && (
          <div className="hover-scrub-track">
            <div className="hover-scrub-fill" style={{ width: `${hoverProgress}%` }} />
          </div>
        )}

        <div className="card-overlay-play">
          <Play className="play-icon" />
        </div>

        {/* Version Badge Overlay */}
        <div className="card-version-badge">V{versionNumber}</div>

        {/* Framerate & Duration Badges */}
        <div className="card-top-badges">
          <span className="badge-fps">{asset.fps} fps</span>
        </div>

        {asset.duration > 0 && (
          <div className="card-duration-badge">
            <Clock className="dur-icon" />
            <span>{Math.round(asset.duration)}s</span>
          </div>
        )}

        {/* Review Status Tag Pill Selector */}
        <div className="card-status-badge-wrap" onClick={(e) => e.stopPropagation()}>
          <select
            className={`card-status-select ${currentStatus}`}
            value={currentStatus}
            onChange={(e) => {
              if (onUpdateAssetStatus) {
                onUpdateAssetStatus(asset.id, e.target.value as AssetStatus);
              }
            }}
          >
            <option value="needs_review">🟡 Needs Review</option>
            <option value="in_progress">🔵 In Progress</option>
            <option value="approved">🟢 Approved</option>
          </select>
        </div>
      </div>

      <div className="card-meta">
        <div className="card-title-row">
          <h4 className="asset-title" title={asset.title}>
            {asset.title}
          </h4>

          {/* 3-Dots Context Menu Button */}
          <div className="card-menu-wrapper" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn-card-menu"
              onClick={(e) => {
                if (onRightClickCard) onRightClickCard(e, asset);
              }}
              title="More Actions"
            >
              <MoreVertical className="menu-ic" />
            </button>
          </div>
        </div>

        <div className="card-actions-row">
          <button
            className="btn-stack"
            onClick={(e) => {
              e.stopPropagation();
              onStackNewVersion(asset);
            }}
            title="Upload new version onto this stack"
          >
            <RefreshCw className="btn-ic" />
            <span>Stack V{versionNumber + 1}</span>
          </button>

          {!isFirst && (
            <button
              className="btn-compare"
              onClick={(e) => {
                e.stopPropagation();
                onOpenComparePlayer();
              }}
              title="Compare side-by-side with V1"
            >
              <SplitSquareVertical className="btn-ic" />
              <span>Compare V1 vs V{versionNumber}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const AssetGrid: React.FC<AssetGridProps> = ({
  project,
  assets,
  activeAsset,
  onSelectAsset,
  onOpenComparePlayer,
  onStackNewVersion,
  onUploadClick,
  onUpdateAssetStatus,
  onRightClickCard,
  isTrashView = false,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const filteredAssets = assets.filter((asset) =>
    asset.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="asset-grid-container">
      {/* Top Action Header */}
      <div className="grid-header-bar">
        <div className="project-title-meta">
          <h2>{isTrashView ? '🗑️ Recycle Bin (Trash)' : project.name}</h2>
          <span className="project-subtitle">
            {isTrashView
              ? `${filteredAssets.length} Soft-deleted Video Asset${filteredAssets.length !== 1 ? 's' : ''}`
              : `${filteredAssets.length} Video Asset${filteredAssets.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="grid-controls">
          <div className="search-bar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid className="toggle-icon" />
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List className="toggle-icon" />
            </button>
          </div>

          {/* Frame.io-Style Primary "+ New" Dropdown Button */}
          <div className="add-dropdown-wrapper">
            <button
              className="btn-primary-action"
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            >
              <Plus className="btn-icon" />
              <span>New</span>
            </button>

            {isAddMenuOpen && (
              <div className="add-context-menu">
                <button
                  className="ctx-item"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    onUploadClick();
                  }}
                >
                  <FileVideo className="ctx-ic" />
                  <span>Upload File</span>
                </button>
                <button
                  className="ctx-item"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    folderInputRef.current?.click();
                  }}
                >
                  <FolderUp className="ctx-ic" />
                  <span>Upload Folder</span>
                </button>
                <button
                  className="ctx-item"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    const folderName = window.prompt('Enter new folder name:');
                    if (folderName) {
                      alert(`Folder "${folderName}" created successfully!`);
                    }
                  }}
                >
                  <FolderPlus className="ctx-ic" />
                  <span>New Folder</span>
                </button>
              </div>
            )}
          </div>

          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory attribute
            webkitdirectory=""
            directory=""
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                alert(`Uploading folder containing ${files.length} items...`);
              }
            }}
          />
        </div>
      </div>

      {/* Main Asset Grid View */}
      <div className={`assets-layout ${viewMode}`}>
        {filteredAssets.map((asset, idx) => {
          const isSelected = activeAsset.id === asset.id;
          const versionNumber = idx === 0 ? 3 : idx === 1 ? 2 : 1;

          return (
            <AssetCardItem
              key={asset.id}
              asset={asset}
              versionNumber={versionNumber}
              isSelected={isSelected}
              isFirst={idx === 0}
              onSelectAsset={onSelectAsset}
              onStackNewVersion={onStackNewVersion}
              onOpenComparePlayer={() => onOpenComparePlayer(assets[0], asset)}
              onUpdateAssetStatus={onUpdateAssetStatus}
              onRightClickCard={onRightClickCard}
            />
          );
        })}
      </div>
    </div>
  );
};
