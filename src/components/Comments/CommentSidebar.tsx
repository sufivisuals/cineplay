import React, { useState } from 'react';
import type { FrameComment } from '../../types/comment';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { MessageSquare, Search, Filter, ChevronRight, ChevronLeft, PenTool } from 'lucide-react';

interface CommentSidebarProps {
  comments: FrameComment[];
  activeComment: FrameComment | null;
  onSelectComment: (comment: FrameComment) => void;
  onToggleResolve: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onAddReply: (commentId: string, replyText: string) => void;
  onSubmitNewComment: (text: string) => void;
  timecodeFormatted: string;
  frameNumber: number;
  hasDrawings?: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const CommentSidebar: React.FC<CommentSidebarProps> = ({
  comments,
  activeComment,
  onSelectComment,
  onToggleResolve,
  onDeleteComment,
  onAddReply,
  onSubmitNewComment,
  timecodeFormatted,
  frameNumber,
  hasDrawings = false,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unresolved' | 'resolved' | 'markups'>('all');

  const filteredComments = comments
    .filter((c) => {
      if (filterMode === 'unresolved') return !c.resolved;
      if (filterMode === 'resolved') return c.resolved;
      if (filterMode === 'markups') return c.drawingData && c.drawingData.shapes.length > 0;
      return true;
    })
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return c.text.toLowerCase().includes(q) || c.authorName?.toLowerCase().includes(q);
    })
    .sort((a, b) => a.frameNumber - b.frameNumber);

  return (
    <aside className={`comment-sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <button className="sidebar-toggle-btn" onClick={onToggleOpen} title="Toggle Sidebar">
        {isOpen ? <ChevronRight /> : <ChevronLeft />}
      </button>

      {isOpen && (
        <div className="sidebar-content">
          <div className="sidebar-header">
            <div className="sidebar-title">
              <MessageSquare className="header-icon" />
              <h3>Frame Notes ({comments.length})</h3>
            </div>

            <div className="filter-tabs">
              <button
                className={`tab-btn ${filterMode === 'all' ? 'active' : ''}`}
                onClick={() => setFilterMode('all')}
              >
                All
              </button>
              <button
                className={`tab-btn ${filterMode === 'unresolved' ? 'active' : ''}`}
                onClick={() => setFilterMode('unresolved')}
              >
                Open ({comments.filter((c) => !c.resolved).length})
              </button>
              <button
                className={`tab-btn ${filterMode === 'resolved' ? 'active' : ''}`}
                onClick={() => setFilterMode('resolved')}
              >
                Resolved
              </button>
              <button
                className={`tab-btn ${filterMode === 'markups' ? 'active' : ''}`}
                onClick={() => setFilterMode('markups')}
                title="Notes with Canvas Drawings"
              >
                <PenTool className="tab-ic" /> Markups
              </button>
            </div>

            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search notes or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="sidebar-comments-list">
            {filteredComments.length === 0 ? (
              <div className="empty-state">
                <Filter className="empty-icon" />
                <p>No comments found</p>
                <span className="empty-sub">Pause video and start typing below to post a note.</span>
              </div>
            ) : (
              filteredComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isActive={activeComment?.id === comment.id}
                  onSelect={onSelectComment}
                  onToggleResolve={onToggleResolve}
                  onDelete={onDeleteComment}
                  onAddReply={onAddReply}
                />
              ))
            )}
          </div>

          {/* Unified Comment Composer inside Sidebar Footer */}
          <div className="sidebar-composer-wrapper">
            <CommentForm
              timecodeFormatted={timecodeFormatted}
              frameNumber={frameNumber}
              hasDrawings={hasDrawings}
              onSubmitComment={onSubmitNewComment}
            />
          </div>
        </div>
      )}
    </aside>
  );
};
