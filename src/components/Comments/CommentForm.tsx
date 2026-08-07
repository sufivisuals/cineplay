import React, { useState } from 'react';
import { Clock, PenTool, Send } from 'lucide-react';

interface CommentFormProps {
  timecodeFormatted: string;
  frameNumber: number;
  hasDrawings: boolean;
  onSubmitComment: (text: string) => void;
  inPointTimecode?: string | null;
  outPointTimecode?: string | null;
  onClearRange?: () => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  timecodeFormatted,
  frameNumber,
  hasDrawings,
  onSubmitComment,
  inPointTimecode,
  outPointTimecode,
  onClearRange,
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmitComment(text.trim());
    setText('');
  };

  return (
    <form className="comment-form-container" onSubmit={handleSubmit}>
      <div className="form-timestamp-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <div className="tc-stamp" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600 }}>
          <Clock className="stamp-icon" style={{ width: '14px', height: '14px' }} />
          {inPointTimecode ? (
            <span style={{ color: '#fde047', background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '0.15rem 0.45rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>{inPointTimecode} - {outPointTimecode || 'MARK OUT'}</span>
              {onClearRange && (
                <button
                  type="button"
                  onClick={onClearRange}
                  title="Clear In/Out Range"
                  style={{ background: 'transparent', border: 'none', color: '#fde047', cursor: 'pointer', padding: 0, fontWeight: 700, lineHeight: 1 }}
                >
                  ✕
                </button>
              )}
            </span>
          ) : (
            <span>At {timecodeFormatted} (Frame {frameNumber})</span>
          )}
        </div>

        {hasDrawings && (
          <div className="drawing-attached-badge">
            <PenTool className="stamp-icon" />
            <span>Canvas Drawing Attached</span>
          </div>
        )}
      </div>

      <div className="input-row">
        <textarea
          className="comment-textarea"
          rows={2}
          placeholder={inPointTimecode ? "Leave a range comment..." : "Leave a comment at current frame..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleSubmit(e);
            }
          }}
        />

        <button type="submit" className="btn-post-comment" disabled={!text.trim()}>
          <Send className="post-icon" />
          <span>Post</span>
        </button>
      </div>

      <span className="form-hint">Press Ctrl + Enter to post note</span>
    </form>
  );
};
