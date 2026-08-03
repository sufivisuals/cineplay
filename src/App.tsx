import { useState, useEffect } from 'react';
import { SAMPLE_ASSETS } from './utils/sampleAssets';
import type { MediaAsset, AssetStatus } from './utils/sampleAssets';
import type { FrameRate } from './types/timecode';
import type { FrameComment } from './types/comment';
import type { Shape, DrawingData } from './types/annotation';
import type { Workspace, Project } from './types/workspace';
import {
  getStoredComments,
  saveStoredComments,
  getStoredAssets,
  saveStoredAsset,
  softDeleteAsset,
  restoreStoredAsset,
  deleteAssetPermanently,
} from './utils/storage';
import { Header } from './components/Header/Header';
import { VideoPlayer } from './components/Player/VideoPlayer';
import { CommentSidebar } from './components/Comments/CommentSidebar';
import { WorkspaceSidebar } from './components/Workspace/WorkspaceSidebar';
import { AssetGrid } from './components/Workspace/AssetGrid';
import { SplitComparePlayer } from './components/Versioning/SplitComparePlayer';
import { VersionStackModal } from './components/Versioning/VersionStackModal';
import { ShareModal } from './components/Sharing/ShareModal';
import { CustomContextMenu } from './components/Workspace/CustomContextMenu';
import { AssetFileInfoDrawer } from './components/Workspace/AssetFileInfoDrawer';
import { GlobalDropzoneOverlay } from './components/Workspace/GlobalDropzoneOverlay';
import { secondsToTimecode } from './utils/timecode';
import { generateVideoThumbnail } from './utils/thumbnailGenerator';

const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: 'CinePlay Main Studio',
    slug: 'cineplay-main',
    projects: [
      {
        id: 'proj-1',
        workspaceId: 'ws-1',
        name: 'Commercial Reel 2026',
        assetIds: ['demo-asset-1', 'demo-asset-2', 'demo-asset-3'],
        folders: [
          { id: 'f-1', name: 'Raw Edits', assetIds: ['demo-asset-1'] },
          { id: 'f-2', name: 'Color Passes', assetIds: ['demo-asset-2', 'demo-asset-3'] },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'proj-2',
        workspaceId: 'ws-1',
        name: 'Sci-Fi Feature Film',
        assetIds: ['demo-asset-3'],
        folders: [],
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

export default function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(INITIAL_WORKSPACES[0]);
  const [activeProject, setActiveProject] = useState<Project>(INITIAL_WORKSPACES[0].projects[0]);

  const [assets, setAssets] = useState<MediaAsset[]>(() => getStoredAssets());
  const [currentAsset, setCurrentAsset] = useState<MediaAsset>(() => {
    const all = getStoredAssets();
    return all.find((a) => !a.isDeleted) || all[0];
  });
  const [fps, setFps] = useState<FrameRate>(SAMPLE_ASSETS[0].fps as FrameRate);
  const [comments, setComments] = useState<FrameComment[]>([]);
  const [activeComment, setActiveComment] = useState<FrameComment | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [liveCurrentTime, setLiveCurrentTime] = useState(0);
  const [activeShapes, setActiveShapes] = useState<Shape[]>([]);

  // App View Modes: 'grid' dashboard vs 'player' workspace vs 'trash' recycle bin
  const [appMode, setAppMode] = useState<'grid' | 'player' | 'trash'>('grid');

  // Modal & Drawer States
  const [compareAssets, setCompareAssets] = useState<{ v1: MediaAsset; v2: MediaAsset } | null>(null);
  const [versionModalAsset, setVersionModalAsset] = useState<MediaAsset | null>(null);
  const [shareModalAsset, setShareModalAsset] = useState<MediaAsset | null>(null);
  const [contextMenuState, setContextMenuState] = useState<{ x: number; y: number; asset: MediaAsset } | null>(null);
  const [fileInfoAsset, setFileInfoAsset] = useState<MediaAsset | null>(null);
  const [isDraggingGlobalFiles, setIsDraggingGlobalFiles] = useState(false);

  const activeAssets = assets.filter((a) => !a.isDeleted);
  const deletedAssets = assets.filter((a) => a.isDeleted);

  const handleUpdateAssetStatus = (assetId: string, status: AssetStatus) => {
    const updated = assets.map((a) => (a.id === assetId ? { ...a, status } : a));
    setAssets(updated);
    const target = updated.find((a) => a.id === assetId);
    if (target) saveStoredAsset(target);

    if (currentAsset.id === assetId) {
      setCurrentAsset((prev) => ({ ...prev, status }));
    }
  };

  const activeTimeSeconds = activeComment ? activeComment.timeSeconds : liveCurrentTime;

  const [watermarkText, setWatermarkText] = useState<string | undefined>(undefined);

  // Handle incoming Share Review URLs (e.g. ?review=demo-asset-1&passcode=review2026&watermark=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reviewId = params.get('review') || params.get('asset');
    const isWatermark = params.get('watermark') === '1';

    if (reviewId) {
      const allAssets = getStoredAssets();
      const found = allAssets.find(
        (a) =>
          a.id === reviewId ||
          a.id.replace(/[^a-zA-Z0-9]/g, '') === reviewId.replace(/[^a-zA-Z0-9]/g, '')
      );
      if (found) {
        setCurrentAsset(found);
        setAppMode('player');
      }
    }

    if (isWatermark) {
      setWatermarkText('CONFIDENTIAL REVIEW - PROTECTED');
    }
  }, []);

  // Global drag-and-drop file listener
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        e.preventDefault();
        setIsDraggingGlobalFiles(true);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    return () => window.removeEventListener('dragenter', handleDragEnter);
  }, []);

  // Load comments whenever current asset changes
  useEffect(() => {
    setFps(currentAsset.fps as FrameRate);
    const loaded = getStoredComments(currentAsset.id);
    setComments(loaded);
    setActiveComment(null);
  }, [currentAsset]);

  // Handle local user video file uploads
  const handleUploadCustomVideo = async (file: File) => {
    const videoUrl = URL.createObjectURL(file);
    const posterUrl = await generateVideoThumbnail(file);

    const customAsset: MediaAsset = {
      id: `custom-${Date.now()}`,
      title: file.name,
      filename: file.name,
      fps: 24,
      duration: 60,
      url: videoUrl,
      poster: posterUrl,
      isCustom: true,
      status: 'needs_review',
      isDeleted: false,
    };

    saveStoredAsset(customAsset);
    setAssets((prev) => [customAsset, ...prev]);
    setCurrentAsset(customAsset);
    setAppMode('player');
  };

  // Soft delete asset (Move to Recycle Bin)
  const handleSoftDeleteAsset = (assetId: string) => {
    const updated = softDeleteAsset(assetId);
    setAssets(updated);

    if (currentAsset.id === assetId) {
      const remaining = updated.filter((a) => !a.isDeleted);
      if (remaining.length > 0) setCurrentAsset(remaining[0]);
    }
    setContextMenuState(null);
  };

  // Restore asset from Recycle Bin
  const handleRestoreAsset = (assetId: string) => {
    const updated = restoreStoredAsset(assetId);
    setAssets(updated);
    setContextMenuState(null);
  };

  // Permanently delete asset from storage
  const handlePermanentDeleteAsset = (assetId: string) => {
    const updated = deleteAssetPermanently(assetId);
    setAssets(updated);
    setContextMenuState(null);
  };

  // Add new frame comment
  const handleAddComment = (text: string, timeSeconds: number, drawingData?: DrawingData) => {
    const tc = secondsToTimecode(timeSeconds, fps);
    const newComment: FrameComment = {
      id: `comment-${Date.now()}`,
      assetId: currentAsset.id,
      authorName: 'Alex Producer (You)',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      frameNumber: tc.totalFrames,
      timeSeconds,
      timecodeFormatted: tc.formatted,
      fps,
      text,
      resolved: false,
      replies: [],
      drawingData,
      createdAt: new Date().toISOString(),
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    saveStoredComments(currentAsset.id, updated);
    setActiveComment(newComment);
  };

  // Toggle resolved status for comment
  const handleToggleResolveComment = (commentId: string) => {
    const updated = comments.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c));
    setComments(updated);
    saveStoredComments(currentAsset.id, updated);
  };

  // Add reply to comment thread
  const handleAddReply = (commentId: string, replyText: string) => {
    const updated = comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [
            ...c.replies,
            {
              id: `reply-${Date.now()}`,
              authorName: 'Alex Producer (You)',
              authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              text: replyText,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
      return c;
    });

    setComments(updated);
    saveStoredComments(currentAsset.id, updated);
  };

  const handleCreateNewProject = () => {
    const name = window.prompt('Enter new project name:', 'Feature Edit 2026');
    if (!name) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      workspaceId: activeWorkspace.id,
      name,
      assetIds: [],
      folders: [],
      createdAt: new Date().toISOString(),
    };

    const updatedWs = {
      ...activeWorkspace,
      projects: [...activeWorkspace.projects, newProject],
    };

    setWorkspaces((prev) => prev.map((w) => (w.id === activeWorkspace.id ? updatedWs : w)));
    setActiveWorkspace(updatedWs);
    setActiveProject(newProject);
  };

  return (
    <div className="app-root">
      {/* Top Header Navbar with Frame.io Breadcrumb Trail */}
      <Header
        currentAsset={currentAsset}
        assets={activeAssets}
        onSelectAsset={(a) => {
          setCurrentAsset(a);
          setAppMode('player');
        }}
        onUploadCustomVideo={handleUploadCustomVideo}
        fps={fps}
        onFpsChange={setFps}
        commentCount={comments.length}
        workspaceName={activeWorkspace.name}
        projectName={activeProject.name}
        onNavigateGrid={() => setAppMode('grid')}
        onOpenShareModal={(asset) => setShareModalAsset(asset)}
      />

      {/* Main 3-Column Workspace Layout */}
      <main className="workspace-main">
        {/* Left Column: Navigation Sidebar */}
        <WorkspaceSidebar
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          onSelectWorkspace={setActiveWorkspace}
          activeProject={activeProject}
          onSelectProject={(p) => {
            setActiveProject(p);
            setAppMode('grid');
          }}
          onNewProject={handleCreateNewProject}
          trashCount={deletedAssets.length}
          onOpenTrash={() => setAppMode('trash')}
          onNavigateDashboard={() => setAppMode('grid')}
          currentAppMode={appMode}
        />

        {appMode === 'grid' || appMode === 'trash' ? (
          /* Center Column: Project Asset Grid / Recycle Bin Dashboard */
          <AssetGrid
            project={activeProject}
            assets={appMode === 'trash' ? deletedAssets : activeAssets}
            activeAsset={currentAsset}
            isTrashView={appMode === 'trash'}
            onSelectAsset={(a) => {
              setCurrentAsset(a);
              setAppMode('player');
            }}
            onOpenComparePlayer={(v1, v2) => setCompareAssets({ v1, v2 })}
            onStackNewVersion={(asset) => setVersionModalAsset(asset)}
            onUploadClick={() => {
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.click();
            }}
            onUpdateAssetStatus={handleUpdateAssetStatus}
            onOpenShareModal={(asset) => setShareModalAsset(asset)}
            onRightClickCard={(e, asset) =>
              setContextMenuState({ x: e.clientX, y: e.clientY, asset })
            }
          />
        ) : (
          /* Center Column: Video Review Stage */
          <div className="workspace-stage">
            <VideoPlayer
              asset={currentAsset}
              fps={fps}
              comments={comments}
              activeComment={activeComment}
              onSelectComment={setActiveComment}
              onClearActiveComment={() => setActiveComment(null)}
              onTimeChange={(t) => setLiveCurrentTime(t)}
              onShapesChange={(s) => setActiveShapes(s)}
              watermarkText={watermarkText}
            />

            {/* Collapsible Right Sidebar: Frame Notes & Drawings */}
            <CommentSidebar
              isOpen={isSidebarOpen}
              onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
              comments={comments}
              activeComment={activeComment}
              onSelectComment={setActiveComment}
              onToggleResolve={handleToggleResolveComment}
              onDeleteComment={(id) => {
                const updated = comments.filter((c) => c.id !== id);
                setComments(updated);
                saveStoredComments(currentAsset.id, updated);
              }}
              onAddReply={handleAddReply}
              onSubmitNewComment={(text) =>
                handleAddComment(
                  text,
                  liveCurrentTime,
                  activeShapes.length > 0
                    ? { version: '1.0', canvasWidth: 1280, canvasHeight: 720, shapes: activeShapes }
                    : undefined
                )
              }
              timecodeFormatted={secondsToTimecode(activeTimeSeconds, fps).formatted}
              frameNumber={secondsToTimecode(activeTimeSeconds, fps).totalFrames}
              hasDrawings={activeShapes.length > 0}
            />
          </div>
        )}
      </main>

      {/* Global Drag & Drop File Target Overlay */}
      {isDraggingGlobalFiles && (
        <GlobalDropzoneOverlay
          onDropFiles={(files) => {
            setIsDraggingGlobalFiles(false);
            if (files.length > 0) handleUploadCustomVideo(files[0]);
          }}
          onCancel={() => setIsDraggingGlobalFiles(false)}
        />
      )}

      {/* Side-by-Side Version Split Compare View */}
      {compareAssets && (
        <SplitComparePlayer
          v1Asset={compareAssets.v1}
          v2Asset={compareAssets.v2}
          onClose={() => setCompareAssets(null)}
        />
      )}

      {/* Version Stack Management Modal */}
      {versionModalAsset && (
        <VersionStackModal
          asset={versionModalAsset}
          assets={assets}
          onClose={() => setVersionModalAsset(null)}
          onUploadNewVersion={handleUploadCustomVideo}
          onSelectActiveVersion={(a) => {
            setCurrentAsset(a);
            setVersionModalAsset(null);
            setAppMode('player');
          }}
        />
      )}

      {/* Share Review Settings Modal */}
      {shareModalAsset && (
        <ShareModal asset={shareModalAsset} onClose={() => setShareModalAsset(null)} />
      )}

      {/* Frame.io V4 Custom Right-Click Context Menu */}
      {contextMenuState && (
        <CustomContextMenu
          x={contextMenuState.x}
          y={contextMenuState.y}
          asset={contextMenuState.asset}
          onClose={() => setContextMenuState(null)}
          onSelectAsset={(a) => {
            setCurrentAsset(a);
            setAppMode('player');
          }}
          onOpenShareModal={(a) => setShareModalAsset(a)}
          onStackNewVersion={(a) => setVersionModalAsset(a)}
          onOpenComparePlayer={() => setCompareAssets({ v1: assets[0], v2: contextMenuState.asset })}
          onOpenFileInfo={(a) => setFileInfoAsset(a)}
          onDeleteAsset={handleSoftDeleteAsset}
          isTrashView={appMode === 'trash'}
          onRestoreAsset={handleRestoreAsset}
          onPermanentDeleteAsset={handlePermanentDeleteAsset}
        />
      )}

      {/* Slide-Over File Inspector Panel */}
      {fileInfoAsset && (
        <AssetFileInfoDrawer
          asset={fileInfoAsset}
          commentCount={comments.length}
          onClose={() => setFileInfoAsset(null)}
          onUpdateStatus={handleUpdateAssetStatus}
        />
      )}
    </div>
  );
}

export { App };
