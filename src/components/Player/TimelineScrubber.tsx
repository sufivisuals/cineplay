import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { FrameComment } from '../../types/comment';
import type { FrameRate } from '../../types/timecode';
import { secondsToTimecode } from '../../utils/timecode';
import { MessageSquare, Check } from 'lucide-react';

interface TimelineScrubberProps {
  currentTime: number;
  duration: number;
  fps: FrameRate;
  comments: FrameComment[];
  onSeek: (time: number) => void;
  onSelectComment: (comment: FrameComment) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentTime,
  duration,
  fps,
  comments,
  onSeek,
  onSelectComment,
}) => {
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [activeHoverComment, setActiveHoverComment] = useState<FrameComment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rafRef = useRef<number | null>(null);

  const safeDuration = duration > 0 ? duration : 1;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));

  const calculateTimeFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!scrubberRef.current) return { time: 0, offsetX: 0 };
    const rect = scrubberRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = offsetX / rect.width;
    return { time: ratio * safeDuration, offsetX };
  }, [safeDuration]);

  // Smooth 60FPS Drag Scrubbing with requestAnimationFrame
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const { time, offsetX } = calculateTimeFromEvent(e);
    setHoverPosition(offsetX);
    setHoverTime(time);
    onSeek(time);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!scrubberRef.current) return;
      const { time, offsetX } = calculateTimeFromEvent(e);
      setHoverPosition(offsetX);
      setHoverTime(time);

      if (isDragging) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          onSeek(time);
        });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isDragging, calculateTimeFromEvent, onSeek]);

  const handleHoverMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    const { time, offsetX } = calculateTimeFromEvent(e);
    setHoverPosition(offsetX);
    setHoverTime(time);
  };

  const handleMouseLeave = () => {
    if (!isDragging) {
      setHoverTime(null);
      setActiveHoverComment(null);
    }
  };

  const hoverTimecode = hoverTime !== null ? secondsToTimecode(hoverTime, fps) : null;

  return (
    <div className="timeline-scrubber-container">
      <div
        ref={scrubberRef}
        className={`timeline-track ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleHoverMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Buffered / Played Track Progress */}
        <div className="timeline-progress-fill" style={{ width: `${progressPercent}%` }} />

        {/* Hover Time Indicator Line */}
        {hoverTime !== null && (
          <div className="timeline-hover-line" style={{ left: `${hoverPosition}px` }} />
        )}

        {/* Playhead Marker */}
        <div className="timeline-playhead" style={{ left: `${progressPercent}%` }} />

        {/* Comment Pin Markers on Timeline Track */}
        {comments.map((comment) => {
          const pinPercent = (comment.timeSeconds / safeDuration) * 100;
          return (
            <button
              key={comment.id}
              className={`comment-timeline-pin ${comment.resolved ? 'resolved' : ''} ${
                comment.drawingData ? 'has-drawing' : ''
              }`}
              style={{ left: `${pinPercent}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectComment(comment);
              }}
              onMouseEnter={() => setActiveHoverComment(comment)}
              onMouseLeave={() => setActiveHoverComment(null)}
              title={`Frame ${comment.frameNumber}: ${comment.authorName}`}
            >
              {comment.resolved ? (
                <Check className="pin-icon" />
              ) : (
                <MessageSquare className="pin-icon" />
              )}
            </button>
          );
        })}
      </div>

      {/* Hover Tooltip Popup (SMPTE Timecode + Comment Preview) */}
      {hoverTime !== null && hoverTimecode && (
        <div
          className="timeline-tooltip"
          style={{
            left: `${Math.min(Math.max(hoverPosition, 60), (scrubberRef.current?.clientWidth || 800) - 60)}px`,
          }}
        >
          {activeHoverComment ? (
            <div className="tooltip-comment-preview">
              <span className="tooltip-author">{activeHoverComment.authorName}</span>
              <span className="tooltip-text">"{activeHoverComment.text}"</span>
              <span className="tooltip-tc">{activeHoverComment.timecodeFormatted}</span>
            </div>
          ) : (
            <div className="tooltip-time-preview">
              <span className="tc-popup">{hoverTimecode.formatted}</span>
              <span className="frame-popup">FR {hoverTimecode.totalFrames}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
