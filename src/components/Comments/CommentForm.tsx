import React, { useState } from 'react';
import { Clock, PenTool, Send } from 'lucide-react';

interface CommentFormProps {
  timecodeFormatted: string;
  frameNumber: number;
  hasDrawings: boolean;
  onSubmitComment: (text: string) => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  timecodeFormatted,
  frameNumber,
  hasDrawings,
  onSubmitComment,
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
      <div className="form-timestamp-bar">
        <div className="tc-stamp">
          <Clock className="stamp-icon" />
          <span>At {timecodeFormatted} (Frame {frameNumber})</span>
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
          placeholder="Leave a comment at current frame..."
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
