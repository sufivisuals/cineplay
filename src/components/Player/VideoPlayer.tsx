import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { MediaAsset } from '../../utils/sampleAssets';
import type { FrameRate } from '../../types/timecode';
import { secondsToTimecode, frameToSeconds } from '../../utils/timecode';
import type { ToolType, Shape } from '../../types/annotation';
import type { FrameComment } from '../../types/comment';
import { DrawingToolbar } from './DrawingToolbar';
import { CanvasOverlay } from './CanvasOverlay';
import { TimelineScrubber } from './TimelineScrubber';
import { PlayerControls } from './PlayerControls';
import { Smartphone, Film } from 'lucide-react';

interface VideoPlayerProps {
  asset: MediaAsset;
  fps: FrameRate;
  comments: FrameComment[];
  activeComment: FrameComment | null;
  onSelectComment: (comment: FrameComment) => void;
  onClearActiveComment: () => void;
  onTimeChange?: (timeSeconds: number) => void;
  onShapesChange?: (shapes: Shape[]) => void;
  watermarkText?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  asset,
  fps,
  comments,
  activeComment,
  onSelectComment,
  onClearActiveComment,
  onTimeChange,
  onShapesChange,
  watermarkText,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(asset.duration || 60);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Canvas Drawing Tool States
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(4);
  const [shapes, setShapes] = useState<Shape[]>([]);

  // Sync shapes state up to parent App component
  useEffect(() => {
    if (onShapesChange) {
      onShapesChange(shapes);
    }
  }, [shapes, onShapesChange]);

  // Native Video Aspect Ratio & Render Bounds State
  const [videoState, setVideoState] = useState({
    videoWidth: 1280,
    videoHeight: 720,
    isPortrait: false,
    aspectRatio: '16:9',
    renderRect: { width: 1280, height: 720, left: 0, top: 0 },
  });

  // Calculate exact pixel dimensions of the rendered video frame inside viewport
  const updateCanvasDimensions = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const viewport = video.parentElement;
    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;
    const isPortrait = vHeight > vWidth;

    if (viewport && viewport.clientWidth > 0 && viewport.clientHeight > 0) {
      const containerWidth = viewport.clientWidth;
      const containerHeight = viewport.clientHeight;
      const videoAspect = vWidth / vHeight;
      const containerAspect = containerWidth / containerHeight;

      let width: number;
      let height: number;

      if (videoAspect > containerAspect) {
        // Letterboxed top & bottom
        width = containerWidth;
        height = containerWidth / videoAspect;
      } else {
        // Pillarboxed left & right
        height = containerHeight;
        width = containerHeight * videoAspect;
      }

      const left = (containerWidth - width) / 2;
      const top = (containerHeight - height) / 2;

      const formattedAspect = isPortrait
        ? `9:16 (${vWidth}x${vHeight})`
        : `16:9 (${vWidth}x${vHeight})`;

      setVideoState({
        videoWidth: vWidth,
        videoHeight: vHeight,
        isPortrait,
        aspectRatio: formattedAspect,
        renderRect: { width, height, left, top },
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateCanvasDimensions);
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, [updateCanvasDimensions]);

  // Reset player state and load actual first frame whenever selected asset changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.currentTime = 0;
    }
    if (ambientVideoRef.current) {
      ambientVideoRef.current.load();
      ambientVideoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setShapes([]);
  }, [asset.id, asset.url]);

  // When active comment changes, jump to comment time and render vector drawings
  useEffect(() => {
    if (activeComment && videoRef.current) {
      videoRef.current.pause();
      if (ambientVideoRef.current) ambientVideoRef.current.pause();
      setIsPlaying(false);
      videoRef.current.currentTime = activeComment.timeSeconds;
      if (ambientVideoRef.current) ambientVideoRef.current.currentTime = activeComment.timeSeconds;
      if (activeComment.drawingData) {
        setShapes(activeComment.drawingData.shapes);
      } else {
        setShapes([]);
      }
      if (onTimeChange) onTimeChange(activeComment.timeSeconds);
    }
  }, [activeComment, onTimeChange]);

  // Video time update handler
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      if (onTimeChange) onTimeChange(video.currentTime);

      // Sync ambient video background time
      if (ambientVideoRef.current && Math.abs(ambientVideoRef.current.currentTime - video.currentTime) > 0.1) {
        ambientVideoRef.current.currentTime = video.currentTime;
      }

      // Clear drawings if video is playing and time moves away from active comment frame
      if (isPlaying && shapes.length > 0 && !activeComment) {
        setShapes([]);
      }
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration || asset.duration);
      updateCanvasDimensions();
    }
  };

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    const ambient = ambientVideoRef.current;
    if (!video) return;

    if (video.paused) {
      if (ambient) ambient.currentTime = video.currentTime;
      Promise.all([
        video.play(),
        ambient ? ambient.play().catch(() => {}) : Promise.resolve(),
      ]).then(() => setIsPlaying(true)).catch(console.error);
    } else {
      video.pause();
      if (ambient) ambient.pause();
      setIsPlaying(false);
    }
  }, []);

  // Frame stepping logic (+1 / -1 / +10 / -10 frames)
  const stepFrame = useCallback((frameDelta: number) => {
    const video = videoRef.current;
    const ambient = ambientVideoRef.current;
    if (!video) return;

    video.pause();
    if (ambient) ambient.pause();
    setIsPlaying(false);

    const currentFrame = Math.round(video.currentTime * fps);
    const targetFrame = Math.max(0, currentFrame + frameDelta);
    const targetSeconds = Math.min(frameToSeconds(targetFrame, fps), duration);
    video.currentTime = targetSeconds;
    if (ambient) ambient.currentTime = targetSeconds;
    if (onTimeChange) onTimeChange(targetSeconds);
  }, [fps, duration, onTimeChange]);

  // Seek handler
  const handleSeek = (time: number) => {
    const video = videoRef.current;
    const ambient = ambientVideoRef.current;
    if (!video) return;

    const safeTime = Math.max(0, Math.min(time, duration));
    video.currentTime = safeTime;
    if (ambient) ambient.currentTime = safeTime;
    setCurrentTime(safeTime);
    if (onTimeChange) onTimeChange(safeTime);
  };

  // Volume & Mute handlers
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const handleRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
    if (ambientVideoRef.current) {
      ambientVideoRef.current.playbackRate = newRate;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  // Undo & Clear drawing
  const handleUndoShape = () => {
    setShapes((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClearShapes = () => {
    setShapes([]);
  };

  // Keyboard shortcut listeners (Space, J, K, L, Left, Right Arrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepFrame(e.shiftKey ? -10 : -1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepFrame(e.shiftKey ? 10 : 1);
      } else if (e.code === 'KeyJ') {
        e.preventDefault();
        stepFrame(-10);
      } else if (e.code === 'KeyK') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        stepFrame(10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepFrame]);

  const currentTc = secondsToTimecode(currentTime, fps);

  return (
    <div ref={containerRef} className="video-player-container">
      {/* Top Drawing Toolbar & Aspect Ratio Indicator */}
      <div className="player-top-bar-wrapper">
        <DrawingToolbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          activeColor={activeColor}
          onSelectColor={setActiveColor}
          lineWidth={lineWidth}
          onChangeLineWidth={setLineWidth}
          onUndo={handleUndoShape}
          onClear={handleClearShapes}
          hasShapes={shapes.length > 0}
        />

        {/* Aspect Ratio Badge */}
        <div className={`aspect-badge ${videoState.isPortrait ? 'portrait' : 'landscape'}`}>
          {videoState.isPortrait ? (
            <Smartphone className="asp-icon" />
          ) : (
            <Film className="asp-icon" />
          )}
          <span>{videoState.isPortrait ? '9:16 Portrait' : '16:9 Landscape'}</span>
        </div>
      </div>

      {/* Main Video Screen with Canvas Overlay */}
      <div
        className={`media-viewport ${videoState.isPortrait ? 'portrait-layout' : 'landscape-layout'}`}
        onClick={() => activeTool === 'select' && togglePlay()}
      >
        {/* Ambient Blur Video Fill Background for Portrait Videos */}
        {videoState.isPortrait && (
          <video
            ref={ambientVideoRef}
            src={asset.url}
            className="ambient-blur-bg"
            preload="metadata"
            muted
            playsInline
          />
        )}

        {/* Primary Main Video Element */}
        <video
          ref={videoRef}
          src={asset.url}
          className="video-element"
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          playsInline
        />

        {/* Dynamic Client Watermark Overlay */}
        {watermarkText && (
          <div className="video-watermark-overlay">
            <span>{watermarkText}</span>
          </div>
        )}

        {/* Pixel-Aligned HTML5 Vector Drawing Canvas Overlay */}
        <CanvasOverlay
          activeTool={activeTool}
          color={activeColor}
          lineWidth={lineWidth}
          shapes={shapes}
          onShapesChange={(newShapes) => {
            setShapes(newShapes);
            if (activeComment) onClearActiveComment();
          }}
          onPauseVideo={() => {
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
              if (ambientVideoRef.current) ambientVideoRef.current.pause();
              setIsPlaying(false);
            }
          }}
          width={videoState.renderRect.width}
          height={videoState.renderRect.height}
          left={videoState.renderRect.left}
          top={videoState.renderRect.top}
        />
      </div>

      {/* Timeline Scrubber Track */}
      <TimelineScrubber
        currentTime={currentTime}
        duration={duration}
        fps={fps}
        comments={comments}
        onSeek={handleSeek}
        onSelectComment={onSelectComment}
      />

      {/* Playback Controls Footer */}
      <PlayerControls
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onStepFrame={stepFrame}
        timecodeFormatted={currentTc.formatted}
        currentFrame={currentTc.totalFrames}
        totalFrames={Math.floor(duration * fps)}
        playbackRate={playbackRate}
        onChangeRate={handleRateChange}
        volume={volume}
        onChangeVolume={handleVolumeChange}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onToggleFullscreen={toggleFullscreen}
        fps={fps}
      />
    </div>
  );
};
