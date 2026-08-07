import React, { useState } from 'react';
import type { FrameComment } from '../../types/comment';
import { Clock, CheckCircle2, Circle, MessageSquare, PenTool, Send, Trash2, Pencil } from 'lucide-react';

interface CommentItemProps {
  comment: FrameComment;
  isActive: boolean;
  onSelect: (comment: FrameComment) => void;
  onToggleResolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onAddReply: (commentId: string, replyText: string) => void;
  onEdit?: (commentId: string, newText: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isActive,
  onSelect,
  onToggleResolve,
  onDelete,
  onAddReply,
  onEdit,
}) => {
  const [replyInput, setReplyInput] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;
    onAddReply(comment.id, replyInput.trim());
    setReplyInput('');
    setShowReplyForm(false);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    if (onEdit) {
      onEdit(comment.id, editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`comment-card ${isActive ? 'active' : ''} ${comment.resolved ? 'resolved' : ''}`}
      onClick={() => onSelect(comment)}
    >
      <div className="comment-card-header">
        <div className="author-info">
          {comment.authorAvatar ? (
            <img src={comment.authorAvatar} alt={comment.authorName} className="author-avatar" />
          ) : (
            <div className="author-avatar-fallback">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="author-meta">
            <span className="author-name">{comment.authorName}</span>
            <span className="comment-time-ago">
              {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <button
          className="btn-resolve-check"
          onClick={(e) => {
            e.stopPropagation();
            onToggleResolve(comment.id);
          }}
          title={comment.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
        >
          {comment.resolved ? (
            <CheckCircle2 className="resolve-icon success" />
          ) : (
            <Circle className="resolve-icon muted" />
          )}
        </button>
      </div>

      <div className="comment-card-body">
        {isEditing ? (
          <div className="comment-edit-box" onClick={(e) => e.stopPropagation()}>
            <textarea
              className="comment-edit-input"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSaveEdit();
                }
              }}
              rows={2}
              autoFocus
              style={{ width: '100%', background: 'var(--bg-input, #1e293b)', color: '#ffffff', border: '1px solid var(--accent-cyan, #38bdf8)', borderRadius: '6px', padding: '0.5rem', fontSize: '0.85rem', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.text);
                }}
                style={{ background: 'transparent', border: '1px solid var(--border-color, #334155)', color: '#94a3b8', borderRadius: '4px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                style={{ background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0284c7 100%)', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-text">{comment.text}</p>
        )}
      </div>

      <div className="comment-card-footer">
        <div className="badges-group">
          {/* Timecode / Range Badge */}
          <span
            className="timecode-badge"
            style={comment.endTimecodeFormatted ? { background: 'rgba(234, 179, 8, 0.15)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.35)' } : undefined}
            title={comment.endTimecodeFormatted ? `Range Comment: ${comment.timecodeFormatted} to ${comment.endTimecodeFormatted}` : `Single Point Comment: ${comment.timecodeFormatted}`}
          >
            <Clock className="badge-icon" />
            {comment.endTimecodeFormatted
              ? `${comment.timecodeFormatted} - ${comment.endTimecodeFormatted}`
              : `${comment.timecodeFormatted} (FR ${comment.frameNumber})`}
          </span>

          {/* Canvas Vector Drawing Badge */}
          {comment.drawingData && comment.drawingData.shapes.length > 0 && (
            <span className="drawing-badge" title="Attached Canvas Drawing">
              <PenTool className="badge-icon" />
              {comment.drawingData.shapes.length} Markup{comment.drawingData.shapes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="comment-actions">
          <button
            className="action-link"
            onClick={(e) => {
              e.stopPropagation();
              setShowReplyForm(!showReplyForm);
            }}
          >
            <MessageSquare className="action-icon" />
            Reply ({comment.replies.length})
          </button>

          {onEdit && (
            <button
              className="action-link"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(!isEditing);
                setEditText(comment.text);
              }}
              title="Edit comment"
            >
              <Pencil className="action-icon" />
              Edit
            </button>
          )}

          <button
            className="action-link danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(comment.id);
            }}
            title="Delete comment"
          >
            <Trash2 className="action-icon" />
          </button>
        </div>
      </div>

      {/* Threaded Replies List */}
      {comment.replies.length > 0 && (
        <div className="reply-list">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="reply-item">
              <div className="reply-header">
                <span className="reply-author">{reply.authorName}</span>
                <span className="reply-time">
                  {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="reply-text">{reply.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Input Form */}
      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="reply-form" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            className="reply-input"
            placeholder="Write a reply..."
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-send-reply">
            <Send className="send-icon" />
          </button>
        </form>
      )}
    </div>
  );
};
