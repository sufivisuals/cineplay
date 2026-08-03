import React, { useState } from 'react';
import type { FrameComment } from '../../types/comment';
import { Clock, CheckCircle2, Circle, MessageSquare, PenTool, Send, Trash2 } from 'lucide-react';

interface CommentItemProps {
  comment: FrameComment;
  isActive: boolean;
  onSelect: (comment: FrameComment) => void;
  onToggleResolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onAddReply: (commentId: string, replyText: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isActive,
  onSelect,
  onToggleResolve,
  onDelete,
  onAddReply,
}) => {
  const [replyInput, setReplyInput] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;
    onAddReply(comment.id, replyInput.trim());
    setReplyInput('');
    setShowReplyForm(false);
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
        <p className="comment-text">{comment.text}</p>
      </div>

      <div className="comment-card-footer">
        <div className="badges-group">
          {/* Timecode Badge */}
          <span className="timecode-badge">
            <Clock className="badge-icon" />
            {comment.timecodeFormatted} (FR {comment.frameNumber})
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
