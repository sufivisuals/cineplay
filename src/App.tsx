import { useState, useEffect } from 'react';
import type { MediaAsset, AssetStatus } from './utils/sampleAssets';
import type { FrameRate } from './types/timecode';
import type { FrameComment } from './types/comment';
import type { Shape, DrawingData } from './types/annotation';
import type { Workspace, Project } from './types/workspace';
import { PRESET_USERS, type UserProfile } from './types/auth';
import {
  getStoredComments,
  saveStoredComments,
  getStoredAssets,
  saveStoredAsset,
  softDeleteAsset,
  restoreStoredAsset,
  deleteAssetPermanently,
  getStoredWorkspaces,
  saveStoredWorkspaces,
} from './utils/storage';
import { storeVideoBlob, getStoredVideoUrl } from './utils/mediaStore';
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
import { AccessDeniedView } from './components/Auth/AccessDeniedView';
import { GuestNameModal } from './components/Auth/GuestNameModal';
import { secondsToTimecode } from './utils/timecode';
import { generateVideoThumbnail } from './utils/thumbnailGenerator';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(PRESET_USERS[0]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => getStoredWorkspaces());
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(() => {
    const ws = getStoredWorkspaces();
    return ws[0] || { id: 'ws-1', name: 'CinePlay Main Studio', slug: 'cineplay-main', projects: [] };
  });
  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    const ws = getStoredWorkspaces();
    return ws[0] && ws[0].projects && ws[0].projects.length > 0 ? ws[0].projects[0] : null;
  });

  const [assets, setAssets] = useState<MediaAsset[]>(() => getStoredAssets());
  const [currentAsset, setCurrentAsset] = useState<MediaAsset | null>(() => {
    const all = getStoredAssets();
    return all.find((a) => !a.isDeleted) || null;
  });
  const [fps, setFps] = useState<FrameRate>((currentAsset?.fps || 24) as FrameRate);
  const [comments, setComments] = useState<FrameComment[]>([]);
  const [activeComment, setActiveComment] = useState<FrameComment | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [liveCurrentTime, setLiveCurrentTime] = useState(0);
  const [activeShapes, setActiveShapes] = useState<Shape[]>([]);

  // App View Modes: 'grid' dashboard vs 'player' workspace vs 'trash' recycle bin
  const [appMode, setAppMode] = useState<'grid' | 'player' | 'trash'>('grid');

  // Guest Review Mode & Identity Prompt States
  const [isGuestReviewMode, setIsGuestReviewMode] = useState(false);
  const [guestName, setGuestName] = useState<string | null>(() => localStorage.getItem('cineplay_guest_name'));
  const [isGuestNameModalOpen, setIsGuestNameModalOpen] = useState(false);
  const [pendingComment, setPendingComment] = useState<{ text: string; timeSeconds: number; drawingData?: DrawingData } | null>(null);

  // Modal & Drawer States
  const [compareAssets, setCompareAssets] = useState<{ v1: MediaAsset; v2: MediaAsset } | null>(null);
  const [versionModalAsset, setVersionModalAsset] = useState<MediaAsset | null>(null);
  const [shareModalAsset, setShareModalAsset] = useState<MediaAsset | null>(null);
  const [contextMenuState, setContextMenuState] = useState<{ x: number; y: number; asset: MediaAsset } | null>(null);
  const [fileInfoAsset, setFileInfoAsset] = useState<MediaAsset | null>(null);
  const [isDraggingGlobalFiles, setIsDraggingGlobalFiles] = useState(false);

  // RBAC Client Access Control & Workspace Isolation Filtering (Scoped to active project)
  const activeAssets = assets.filter((a) => {
    if (a.isDeleted) return false;
    if (isGuestReviewMode && currentAsset && a.id === currentAsset.id) return true;

    // Scope assets strictly to active project to prevent state bleeding
    if (activeProject && a.projectId && a.projectId !== activeProject.id) return false;
    if (activeProject && activeProject.assetIds && activeProject.assetIds.length > 0) {
      if (!activeProject.assetIds.includes(a.id)) return false;
    }

    if (currentUser.role === 'admin') return true;
    return !a.assignedClient || a.assignedClient === 'all' || a.assignedClient === currentUser.email;
  });

  const deletedAssets = assets.filter((a) => a.isDeleted);

  // Check if active video asset is locked/restricted for current user (bypassed for valid public share review links)
  const isAccessRestricted =
    !isGuestReviewMode &&
    currentUser.role === 'client' &&
    currentAsset &&
    currentAsset.assignedClient &&
    currentAsset.assignedClient !== 'all' &&
    currentAsset.assignedClient !== currentUser.email;

  const handleUpdateAssetStatus = (assetId: string, status: AssetStatus) => {
    const updated = assets.map((a) => (a.id === assetId ? { ...a, status } : a));
    setAssets(updated);
    const target = updated.find((a) => a.id === assetId);
    if (target) saveStoredAsset(target);

    if (currentAsset && currentAsset.id === assetId) {
      setCurrentAsset((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleAssignClient = (assetId: string, clientEmail: string) => {
    const updated = assets.map((a) => (a.id === assetId ? { ...a, assignedClient: clientEmail } : a));
    setAssets(updated);
    const target = updated.find((a) => a.id === assetId);
    if (target) saveStoredAsset(target);

    if (currentAsset && currentAsset.id === assetId) {
      setCurrentAsset((prev) => (prev ? { ...prev, assignedClient: clientEmail } : null));
    }
  };

  const activeTimeSeconds = activeComment ? activeComment.timeSeconds : liveCurrentTime;

  const [watermarkText, setWatermarkText] = useState<string | undefined>(undefined);

  // Handle incoming Share Review URLs (e.g. ?review=demo-asset-1&guest=1&passcode=review2026&watermark=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reviewId = params.get('review') || params.get('asset');
    const isGuest = params.get('guest') === '1' || Boolean(params.get('review'));
    const isWatermark = params.get('watermark') === '1';

    if (reviewId) {
      const allAssets = getStoredAssets();
      let found = allAssets.find(
        (a) =>
          a.id === reviewId ||
          a.id.replace(/[^a-zA-Z0-9]/g, '') === reviewId.replace(/[^a-zA-Z0-9]/g, '')
      );

      if (!found) {
        found = {
          id: reviewId,
          title: 'Shared Video Review Asset',
          filename: 'shared_video.mp4',
          fps: 24,
          duration: 59.6,
          url: `http://localhost:4000/api/v1/assets/stream/${reviewId}?guest=1`,
          poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop',
          status: 'needs_review',
          isDeleted: false,
          assignedClient: 'all',
        };
        saveStoredAsset(found);
        setAssets((prev) => [found!, ...prev]);
      } else if (found.url && found.url.startsWith('blob:')) {
        // Tab 2 Client Guest mode cannot read Tab 1's private blob: URL.
        // Replace with public streaming proxy URL for guest playback!
        found = {
          ...found,
          url: `http://localhost:4000/api/v1/assets/stream/${found.id}?guest=1`,
        };
        saveStoredAsset(found);
      }

      setCurrentAsset(found);
      setAppMode('player');
      if (isGuest) {
        setIsGuestReviewMode(true);
      }
    }

    if (isWatermark) {
      setWatermarkText('CONFIDENTIAL REVIEW - PROTECTED');
    }
  }, []);

  // Global drag-and-drop file listener
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer && e.dataTransfer.types.includes('Files') && !isGuestReviewMode) {
        e.preventDefault();
        setIsDraggingGlobalFiles(true);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    return () => window.removeEventListener('dragenter', handleDragEnter);
  }, [isGuestReviewMode]);

  // Load comments whenever current asset changes
  useEffect(() => {
    if (currentAsset) {
      setFps(currentAsset.fps as FrameRate);
      const loaded = getStoredComments(currentAsset.id);
      setComments(loaded);
    } else {
      setComments([]);
    }
    setActiveComment(null);
  }, [currentAsset]);

  // Re-hydrate custom uploaded video files from persistent IndexedDB storage on page reload (F5 / Refresh)
  useEffect(() => {
    async function restoreCustomVideos() {
      const stored = getStoredAssets();
      let updatedAny = false;
      const restored = await Promise.all(
        stored.map(async (asset) => {
          if (asset.isCustom || (asset.url && asset.url.startsWith('blob:'))) {
            const freshUrl = await getStoredVideoUrl(asset.id);
            if (freshUrl) {
              updatedAny = true;
              return { ...asset, url: freshUrl };
            }
          }
          return asset;
        })
      );

      if (updatedAny) {
        setAssets(restored);
        if (currentAsset) {
          const matching = restored.find((a) => a.id === currentAsset.id);
          if (matching) setCurrentAsset(matching);
        }
      }
    }

    restoreCustomVideos();
  }, []);

  // Handle local user video file uploads
  const handleUploadCustomVideo = async (file: File) => {
    const videoUrl = URL.createObjectURL(file);
    const posterUrl = await generateVideoThumbnail(file);

    const assetId = `custom-${Date.now()}`;
    await storeVideoBlob(assetId, file);

    const customAsset: MediaAsset = {
      id: assetId,
      projectId: activeProject ? activeProject.id : undefined,
      title: file.name,
      filename: file.name,
      fps: 24,
      duration: 60,
      url: videoUrl,
      poster: posterUrl,
      isCustom: true,
      status: 'needs_review',
      isDeleted: false,
      assignedClient: 'all',
    };

    saveStoredAsset(customAsset);

    // Sync asset metadata with backend Express API for cross-session and guest streaming
    fetch('http://localhost:4000/api/v1/assets/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customAsset),
    }).catch(() => {});

    if (activeProject) {
      const updatedProj = {
        ...activeProject,
        assetIds: [...activeProject.assetIds, assetId],
      };
      setActiveProject(updatedProj);
      const updatedProjects = activeWorkspace.projects.map((p) => (p.id === activeProject.id ? updatedProj : p));
      const updatedWs = { ...activeWorkspace, projects: updatedProjects };
      const updatedWorkspaces = workspaces.map((w) => (w.id === activeWorkspace.id ? updatedWs : w));
      setWorkspaces(updatedWorkspaces);
      saveStoredWorkspaces(updatedWorkspaces);
      setActiveWorkspace(updatedWs);
    }

    setAssets((prev) => [customAsset, ...prev]);
    setCurrentAsset(customAsset);
    setAppMode('player');
  };

  // Soft delete asset (Move to Recycle Bin)
  const handleSoftDeleteAsset = (assetId: string) => {
    const updated = softDeleteAsset(assetId);
    setAssets(updated);

    if (currentAsset && currentAsset.id === assetId) {
      const remaining = updated.filter((a) => !a.isDeleted);
      setCurrentAsset(remaining.length > 0 ? remaining[0] : null);
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

  // Add new frame comment (with Guest Identity modal prompt if unauthenticated)
  const handleAddComment = (text: string, timeSeconds: number, drawingData?: DrawingData) => {
    if (!currentAsset) return;
    if (isGuestReviewMode && !guestName) {
      setPendingComment({ text, timeSeconds, drawingData });
      setIsGuestNameModalOpen(true);
      return;
    }

    const tc = secondsToTimecode(timeSeconds, fps);
    const authorName = isGuestReviewMode ? `${guestName || 'Guest Reviewer'} (Client)` : currentUser.name;
    const authorAvatar = isGuestReviewMode
      ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
      : currentUser.avatar;

    const newComment: FrameComment = {
      id: `comment-${Date.now()}`,
      assetId: currentAsset.id,
      authorName,
      authorAvatar,
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

  const handleSaveGuestName = (name: string) => {
    localStorage.setItem('cineplay_guest_name', name);
    setGuestName(name);
    setIsGuestNameModalOpen(false);

    if (pendingComment) {
      handleAddComment(pendingComment.text, pendingComment.timeSeconds, pendingComment.drawingData);
      setPendingComment(null);
    }
  };

  // Toggle resolved status for comment
  const handleToggleResolveComment = (commentId: string) => {
    const updated = comments.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c));
    setComments(updated);
    if (currentAsset) saveStoredComments(currentAsset.id, updated);
  };

  // Add reply to comment thread
  const handleAddReply = (commentId: string, replyText: string) => {
    const authorName = isGuestReviewMode ? `${guestName || 'Guest Reviewer'} (Client)` : currentUser.name;
    const authorAvatar = isGuestReviewMode
      ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
      : currentUser.avatar;

    const updated = comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [
            ...c.replies,
            {
              id: `reply-${Date.now()}`,
              authorName,
              authorAvatar,
              text: replyText,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
      return c;
    });

    setComments(updated);
    if (currentAsset) saveStoredComments(currentAsset.id, updated);
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

    const updatedWorkspaces = workspaces.map((w) => (w.id === activeWorkspace.id ? updatedWs : w));
    setWorkspaces(updatedWorkspaces);
    saveStoredWorkspaces(updatedWorkspaces);
    setActiveWorkspace(updatedWs);
    setActiveProject(newProject);
    setAppMode('grid');
    setCurrentAsset(null);
  };

  const handleDeleteProject = (projectId: string) => {
    const targetProject = activeWorkspace.projects.find((p) => p.id === projectId);
    const assetIdsToDelete = targetProject ? targetProject.assetIds : [];

    // 1. Cascading delete all associated video files, folders, and comment records
    let updatedAssets = assets;
    assetIdsToDelete.forEach((assetId) => {
      updatedAssets = deleteAssetPermanently(assetId);
    });
    const extraAssets = assets.filter((a) => a.projectId === projectId);
    extraAssets.forEach((a) => {
      updatedAssets = deleteAssetPermanently(a.id);
    });

    setAssets(updatedAssets);

    // 2. Remove project from active workspace
    const updatedProjects = activeWorkspace.projects.filter((p) => p.id !== projectId);
    const updatedWs = {
      ...activeWorkspace,
      projects: updatedProjects,
    };

    const updatedWorkspaces = workspaces.map((w) => (w.id === activeWorkspace.id ? updatedWs : w));
    setWorkspaces(updatedWorkspaces);
    saveStoredWorkspaces(updatedWorkspaces);
    setActiveWorkspace(updatedWs);

    const nextProject = updatedProjects[0] || null;
    if (nextProject) {
      setActiveProject(nextProject);
      const nextAssets = updatedAssets.filter((a) => !a.isDeleted && (nextProject.assetIds.includes(a.id) || a.projectId === nextProject.id));
      setCurrentAsset(nextAssets[0] || null);
    } else {
      setActiveProject({ id: 'proj-empty', workspaceId: activeWorkspace.id, name: 'Untitled Project', assetIds: [], folders: [], createdAt: new Date().toISOString() });
      setCurrentAsset(null);
    }

    // 3. Notify backend API controller of cascading deletion
    fetch(`http://localhost:4000/api/v1/projects/${projectId}`, { method: 'DELETE' }).catch(() => {});
  };

  return (
    <div className="app-root">
      {/* Top Header Navbar with Frame.io Breadcrumb Trail & RBAC Switcher */}
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
        workspaceName={isGuestReviewMode ? 'Guest Review Mode' : activeWorkspace.name}
        projectName={isGuestReviewMode ? 'Restricted Client Review' : activeProject ? activeProject.name : 'No Active Project'}
        onNavigateGrid={isGuestReviewMode ? undefined : () => setAppMode('grid')}
        onOpenShareModal={isGuestReviewMode ? undefined : (asset) => setShareModalAsset(asset)}
        currentUser={currentUser}
        onChangeUser={setCurrentUser}
        isGuestReviewMode={isGuestReviewMode}
      />

      {/* Main 3-Column Workspace Layout */}
      <main className="workspace-main">
        {/* Left Column: Navigation Sidebar (Hidden completely in Guest Review Mode) */}
        {!isGuestReviewMode && (
          <WorkspaceSidebar
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            onSelectWorkspace={setActiveWorkspace}
            activeProject={activeProject}
            onSelectProject={(p) => {
              setActiveProject(p);
              setAppMode('grid');
              const pAssets = assets.filter((a) => !a.isDeleted && (p.assetIds.includes(a.id) || a.projectId === p.id));
              setCurrentAsset(pAssets[0] || null);
            }}
            onNewProject={handleCreateNewProject}
            onDeleteProject={handleDeleteProject}
            trashCount={deletedAssets.length}
            onOpenTrash={() => setAppMode('trash')}
            onNavigateDashboard={() => setAppMode('grid')}
            currentAppMode={appMode}
          />
        )}

        {appMode === 'grid' || appMode === 'trash' || !currentAsset ? (
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
        ) : isAccessRestricted ? (
          /* Security Lockdown Screen when a client attempts to view another client's video */
          <AccessDeniedView
            assetTitle={currentAsset.title}
            assignedClient={currentAsset.assignedClient}
            currentClientEmail={currentUser.email}
            onBackToDashboard={() => setAppMode('grid')}
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
                if (currentAsset) saveStoredComments(currentAsset.id, updated);
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

      {/* Guest Name Prompt Modal */}
      {isGuestNameModalOpen && (
        <GuestNameModal
          onSubmitGuestName={handleSaveGuestName}
          onCancel={() => setIsGuestNameModalOpen(false)}
        />
      )}

      {/* Global Drag & Drop File Target Overlay */}
      {isDraggingGlobalFiles && currentUser.role === 'admin' && !isGuestReviewMode && (
        <GlobalDropzoneOverlay
          onDropFiles={(files) => {
            setIsDraggingGlobalFiles(false);
            if (files.length > 0) handleUploadCustomVideo(files[0]);
          }}
          onCancel={() => setIsDraggingGlobalFiles(false)}
        />
      )}

      {/* Side-by-Side Version Split Compare View */}
      {compareAssets && !isGuestReviewMode && (
        <SplitComparePlayer
          v1Asset={compareAssets.v1}
          v2Asset={compareAssets.v2}
          onClose={() => setCompareAssets(null)}
        />
      )}

      {/* Version Stack Management Modal */}
      {versionModalAsset && !isGuestReviewMode && (
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
      {shareModalAsset && !isGuestReviewMode && (
        <ShareModal asset={shareModalAsset} onClose={() => setShareModalAsset(null)} />
      )}

      {/* Frame.io V4 Custom Right-Click Context Menu */}
      {contextMenuState && !isGuestReviewMode && (
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
      {fileInfoAsset && !isGuestReviewMode && (
        <AssetFileInfoDrawer
          asset={fileInfoAsset}
          commentCount={comments.length}
          onClose={() => setFileInfoAsset(null)}
          onUpdateStatus={handleUpdateAssetStatus}
          onAssignClient={handleAssignClient}
        />
      )}
    </div>
  );
}

export { App };
