import React, { useState, useRef, useEffect } from 'react';
import type { Workspace, Project } from '../../types/workspace';
import { Folder, Film, Plus, ChevronRight, ChevronDown, LayoutGrid, Users, Settings, HardDrive, Trash2 } from 'lucide-react';

interface WorkspaceSidebarProps {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  onSelectWorkspace: (ws: Workspace) => void;
  activeProject: Project | null;
  onSelectProject: (proj: Project) => void;
  onNewProject: () => void;
  onDeleteProject?: (projectId: string) => void;
  trashCount?: number;
  onOpenTrash?: () => void;
  onNavigateDashboard?: () => void;
  currentAppMode?: 'grid' | 'player' | 'trash';
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  activeProject,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  trashCount = 0,
  onOpenTrash,
  onNavigateDashboard,
  currentAppMode,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Drag-to-resize sidebar width handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(200, Math.min(e.clientX, 360));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      {isMobileOpen && <div className="sidebar-mobile-backdrop" onClick={onCloseMobile} />}
      <aside
        className={`workspace-sidebar ${isResizing ? 'resizing' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{ width: `${sidebarWidth}px` }}
      >
      {/* Workspace Switcher */}
      <div className="workspace-header">
        <div className="workspace-logo-icon">
          <HardDrive className="w-icon" />
        </div>
        <div className="workspace-info">
          <select
            className="workspace-select"
            value={activeWorkspace.id}
            onChange={(e) => {
              const ws = workspaces.find((w) => w.id === e.target.value);
              if (ws) onSelectWorkspace(ws);
            }}
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
          <span className="workspace-role">Owner Workspace</span>
        </div>
      </div>

      {/* Projects Section */}
      <div className="sidebar-section">
        <div className="section-header" onClick={() => setIsProjectsOpen(!isProjectsOpen)}>
          <div className="section-title-wrap">
            {isProjectsOpen ? <ChevronDown className="sec-arr" /> : <ChevronRight className="sec-arr" />}
            <span className="section-title">Projects ({activeWorkspace.projects.length})</span>
          </div>
          <button
            className="btn-add-project"
            onClick={(e) => {
              e.stopPropagation();
              onNewProject();
            }}
            title="Create New Project"
          >
            <Plus className="add-icon" />
          </button>
        </div>

        {isProjectsOpen && (
          <div className="projects-list">
            {activeWorkspace.projects.length === 0 ? (
              <div className="empty-projects-notice" style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No projects yet. Click + to create one.
              </div>
            ) : (
              activeWorkspace.projects.map((project) => (
                <div
                  key={project.id}
                  className={`project-item ${activeProject && activeProject.id === project.id && currentAppMode !== 'trash' ? 'active' : ''}`}
                  onClick={() => {
                    onSelectProject(project);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
                    <Film className="project-icon" />
                    <span className="project-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="asset-count">{project.assetIds ? project.assetIds.length : 0}</span>
                    {onDeleteProject && (
                      <button
                        className="btn-delete-project-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
                            onDeleteProject(project.id);
                          }
                        }}
                        title={`Delete project "${project.name}"`}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 style={{ width: '13px', height: '13px', color: 'var(--accent-rose)' }} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Folders Navigation */}
      {activeProject && activeProject.folders && activeProject.folders.length > 0 && (
        <div className="sidebar-section">
          <div className="section-header" onClick={() => setIsFoldersOpen(!isFoldersOpen)}>
            <div className="section-title-wrap">
              {isFoldersOpen ? <ChevronDown className="sec-arr" /> : <ChevronRight className="sec-arr" />}
              <span className="section-title">Folders</span>
            </div>
          </div>

          {isFoldersOpen && (
            <div className="folders-list">
              {activeProject.folders.map((folder) => (
                <div key={folder.id} className="folder-item">
                  <ChevronRight className="folder-arrow" />
                  <Folder className="folder-icon" />
                  <span className="folder-name">{folder.name}</span>
                  <span className="folder-count">{folder.assetIds.length}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Footer Actions */}
      <div className="sidebar-footer">
        <button
          className={`footer-nav-btn ${currentAppMode === 'grid' ? 'active' : ''}`}
          onClick={onNavigateDashboard}
        >
          <LayoutGrid className="nav-icon" />
          <span>Dashboard</span>
        </button>

        <button
          className={`footer-nav-btn ${currentAppMode === 'trash' ? 'active' : ''}`}
          onClick={onOpenTrash}
          title="View Soft-Deleted Video Assets in Recycle Bin"
        >
          <Trash2 className="nav-icon danger" />
          <span>Recycle Bin</span>
          {trashCount > 0 && <span className="badge-trash-count">{trashCount}</span>}
        </button>

        <button className="footer-nav-btn">
          <Users className="nav-icon" />
          <span>Team Roles</span>
        </button>
        <button className="footer-nav-btn">
          <Settings className="nav-icon" />
          <span>Settings</span>
        </button>
      </div>

      {/* Drag-to-Resize Handle on Right Border */}
      <div
        ref={resizeRef}
        className="sidebar-resize-handle"
        onMouseDown={handleMouseDown}
        title="Drag to resize sidebar width"
      />
    </aside>
  </>
);
};
