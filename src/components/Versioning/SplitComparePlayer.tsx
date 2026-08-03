import React, { useRef, useState, useCallback } from 'react';
import type { MediaAsset } from '../../utils/sampleAssets';
import type { FrameRate } from '../../types/timecode';
import { secondsToTimecode, frameToSeconds } from '../../utils/timecode';
import { Play, Pause, SkipBack, SkipForward, X, SplitSquareVertical, Sliders, Layers } from 'lucide-react';

interface SplitComparePlayerProps {
  v1Asset: MediaAsset;
  v2Asset: MediaAsset;
  onClose: () => void;
  fps?: FrameRate;
}

export const SplitComparePlayer: React.FC<SplitComparePlayerProps> = ({
  v1Asset,
  v2Asset,
  onClose,
  fps = 24,
}) => {
  const v1Ref = useRef<HTMLVideoElement>(null);
  const v2Ref = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [splitPos, setSplitPos] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const [compareMode, setCompareMode] = useState<'split' | 'sideBySide' | 'onionSkin'>('split');

  // Synchronized Play / Pause
  const togglePlay = useCallback(() => {
    const v1 = v1Ref.current;
    const v2 = v2Ref.current;
    if (!v1 || !v2) return;

    if (v1.paused) {
      v2.currentTime = v1.currentTime;
      Promise.all([v1.play(), v2.play()]).then(() => setIsPlaying(true)).catch(console.error);
    } else {
      v1.pause();
      v2.pause();
      setIsPlaying(false);
    }
  }, []);

  // Synchronized Frame Stepping (+1 / -1 frame)
  const stepFrame = useCallback((delta: number) => {
    const v1 = v1Ref.current;
    const v2 = v2Ref.current;
    if (!v1 || !v2) return;

    v1.pause();
    v2.pause();
    setIsPlaying(false);

    const currentFrame = Math.round(v1.currentTime * fps);
    const targetFrame = Math.max(0, currentFrame + delta);
    const targetSeconds = frameToSeconds(targetFrame, fps);

    v1.currentTime = targetSeconds;
    v2.currentTime = targetSeconds;
    setCurrentTime(targetSeconds);
  }, [fps]);

  // Synchronized Seek
  const handleSeek = (time: number) => {
    const v1 = v1Ref.current;
    const v2 = v2Ref.current;
    if (!v1 || !v2) return;

    v1.currentTime = time;
    v2.currentTime = time;
    setCurrentTime(time);
  };

  const handleTimeUpdate = () => {
    if (v1Ref.current) {
      setCurrentTime(v1Ref.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (v1Ref.current) {
      setDuration(v1Ref.current.duration || 60);
    }
  };

  // Draggable comparison slider math
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (offsetX / rect.width) * 100;
    setSplitPos(percent);
  };

  const handleMouseUp = () => setIsDragging(false);

  const tcV1 = secondsToTimecode(currentTime, fps);

  return (
    <div className="compare-modal-overlay">
      <div className="compare-modal-container">
        {/* Header Bar */}
        <div className="compare-header">
          <div className="header-titles">
            <SplitSquareVertical className="comp-icon" />
            <h3>Version Comparison Engine</h3>
            <span className="version-compare-tag">
              {v1Asset.title} (V1) vs {v2Asset.title} (V2)
            </span>
          </div>

          <div className="mode-tabs">
            <button
              className={`mode-btn ${compareMode === 'split' ? 'active' : ''}`}
              onClick={() => setCompareMode('split')}
            >
              <Sliders className="btn-ic" /> Split Slider
            </button>
            <button
              className={`mode-btn ${compareMode === 'sideBySide' ? 'active' : ''}`}
              onClick={() => setCompareMode('sideBySide')}
            >
              <SplitSquareVertical className="btn-ic" /> Side by Side
            </button>
            <button
              className={`mode-btn ${compareMode === 'onionSkin' ? 'active' : ''}`}
              onClick={() => setCompareMode('onionSkin')}
            >
              <Layers className="btn-ic" /> Onion Skin
            </button>
          </div>

          <button className="btn-close-compare" onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Comparison Viewport */}
        <div
          ref={containerRef}
          className={`compare-viewport mode-${compareMode}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {compareMode === 'split' && (
            <>
              {/* Bottom Video (V1) */}
              <video
                ref={v1Ref}
                src={v1Asset.url}
                className="video-layer v1-layer"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                muted
              />

              {/* Top Clipped Video (V2) */}
              <div className="video-clip-wrapper" style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}>
                <video ref={v2Ref} src={v2Asset.url} className="video-layer v2-layer" muted />
              </div>

              {/* Interactive Divider Handle */}
              <div
                className="split-divider-line"
                style={{ left: `${splitPos}%` }}
                onMouseDown={() => setIsDragging(true)}
              >
                <div className="divider-handle">
                  <span>V1</span>
                  <div className="handle-line" />
                  <span>V2</span>
                </div>
              </div>
            </>
          )}

          {compareMode === 'sideBySide' && (
            <div className="side-by-side-grid">
              <div className="side-video-box">
                <span className="side-label">Version 1 (Original)</span>
                <video
                  ref={v1Ref}
                  src={v1Asset.url}
                  className="video-side"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  muted
                />
              </div>
              <div className="side-video-box">
                <span className="side-label highlight">Version 2 (Revision)</span>
                <video ref={v2Ref} src={v2Asset.url} className="video-side" muted />
              </div>
            </div>
          )}

          {compareMode === 'onionSkin' && (
            <div className="onion-skin-wrapper">
              <video
                ref={v1Ref}
                src={v1Asset.url}
                className="video-layer v1-layer"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                muted
              />
              <video
                ref={v2Ref}
                src={v2Asset.url}
                className="video-layer v2-layer onion-opacity"
                muted
              />
            </div>
          )}
        </div>

        {/* Sync Timeline & Controls */}
        <div className="compare-footer-controls">
          <div className="controls-left">
            <button className="btn-control primary-play" onClick={togglePlay}>
              {isPlaying ? <Pause /> : <Play className="play-offset" />}
            </button>
            <button className="btn-control" onClick={() => stepFrame(-1)} title="Step 1 frame back">
              <SkipBack />
            </button>
            <button className="btn-control" onClick={() => stepFrame(1)} title="Step 1 frame forward">
              <SkipForward />
            </button>
          </div>

          <div className="controls-center">
            <input
              type="range"
              min="0"
              max={duration}
              step="0.01"
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="compare-seek-bar"
            />
            <div className="tc-sync-badge">
              <span>SYNC TIME:</span>
              <strong className="tc-val">{tcV1.formatted}</strong>
              <span className="fr-val">(FR {tcV1.totalFrames})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
