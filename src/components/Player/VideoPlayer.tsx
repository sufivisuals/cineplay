import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { MediaAsset } from '../../utils/sampleAssets';
import { saveStoredAsset } from '../../utils/storage';
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
  onRangeChange?: (inPt: number | null, outPt: number | null, clearRangeFn: () => void) => void;
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
  onRangeChange,
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

  // Range-Based Comment In/Out Points (Shortcut: 'I' and 'O')
  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);

  const handleSetInPoint = useCallback(() => {
    const t = currentTime;
    setInPoint(t);
    if (outPoint !== null && outPoint <= t) {
      setOutPoint(null);
    }
  }, [currentTime, outPoint]);

  const handleSetOutPoint = useCallback(() => {
    const t = currentTime;
    setOutPoint(t);
    if (inPoint === null) {
      setInPoint(Math.max(0, t - 2));
    }
  }, [currentTime, inPoint]);

  const handleClearRange = useCallback(() => {
    setInPoint(null);
    setOutPoint(null);
  }, []);

  useEffect(() => {
    if (onRangeChange) {
      onRangeChange(inPoint, outPoint, handleClearRange);
    }
  }, [inPoint, outPoint, onRangeChange, handleClearRange]);

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

  const [hasMediaError, setHasMediaError] = useState(false);
  const prevAssetIdRef = useRef<string | null>(null);

  // Reset player state ONLY when asset ID changes to a different video
  useEffect(() => {
    if (asset.id !== prevAssetIdRef.current) {
      prevAssetIdRef.current = asset.id;
      setHasMediaError(false);
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
    }
  }, [asset.id, asset.url]);

  // Safe media seek helper to prevent setting currentTime before metadata is ready
  const safeSeekVideo = useCallback(
    (targetTime: number) => {
      const video = videoRef.current;
      const ambient = ambientVideoRef.current;
      if (!video) return;

      const safeTime = Math.max(0, Math.min(targetTime, duration || video.duration || 0));

      const applySeek = () => {
        try {
          video.currentTime = safeTime;
          if (ambient && ambient.readyState >= 1) {
            ambient.currentTime = safeTime;
          }
        } catch (err) {
          console.warn('Media seek deferred until metadata loaded', err);
        }
      };

      if (video.readyState >= 1) {
        applySeek();
      } else {
        const onLoaded = () => {
          applySeek();
          video.removeEventListener('loadedmetadata', onLoaded);
        };
        video.addEventListener('loadedmetadata', onLoaded);
      }
    },
    [duration]
  );

  // Jump to comment timestamp ONLY when a specific active comment is selected
  const prevActiveCommentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeComment && activeComment.id !== prevActiveCommentIdRef.current && videoRef.current) {
      prevActiveCommentIdRef.current = activeComment.id;
      if (!videoRef.current.paused) {
        videoRef.current.pause();
        if (ambientVideoRef.current) ambientVideoRef.current.pause();
        setIsPlaying(false);
      }
      safeSeekVideo(activeComment.timeSeconds);
      if (activeComment.drawingData) {
        setShapes(activeComment.drawingData.shapes);
      } else {
        setShapes([]);
      }
    } else if (!activeComment) {
      prevActiveCommentIdRef.current = null;
    }
  }, [activeComment, safeSeekVideo]);

  // High-Performance 60fps Playhead Animation Loop (replaces stuttery 4-10Hz native video onTimeUpdate)
  useEffect(() => {
    let rafId: number | null = null;

    const updatePlayhead60fps = () => {
      const video = videoRef.current;
      if (video && !video.paused) {
        const time = video.currentTime;
        setCurrentTime(time);
        if (onTimeChange) onTimeChange(time);

        // Sync ambient video background time smoothly
        if (ambientVideoRef.current && Math.abs(ambientVideoRef.current.currentTime - time) > 0.1) {
          ambientVideoRef.current.currentTime = time;
        }

        // Clear canvas drawings if video is playing away from active comment frame
        if (shapes.length > 0 && !activeComment) {
          setShapes([]);
        }

        rafId = requestAnimationFrame(updatePlayhead60fps);
      }
    };

    if (isPlaying) {
      rafId = requestAnimationFrame(updatePlayhead60fps);
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isPlaying, onTimeChange, shapes.length, activeComment]);

  // Fallback video time update handler
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      if (onTimeChange) onTimeChange(video.currentTime);
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

    if (onClearActiveComment) onClearActiveComment();

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
  }, [onClearActiveComment]);

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
    safeSeekVideo(time);
    setCurrentTime(time);
    if (onTimeChange) onTimeChange(time);
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
      } else if (e.code === 'KeyI') {
        e.preventDefault();
        handleSetInPoint();
      } else if (e.code === 'KeyO') {
        e.preventDefault();
        handleSetOutPoint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepFrame, handleSetInPoint, handleSetOutPoint]);

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
            onError={(e) => {
              (e.target as HTMLVideoElement).style.display = 'none';
            }}
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
          onError={(e) => {
            const video = e.target as HTMLVideoElement;
            const errCode = video.error?.code;

            // Handle revoked / expired blob URLs (e.g. when opening custom uploads across browser sessions)
            if (asset.url && asset.url.startsWith('blob:')) {
              const fallbackUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
              console.warn('Expired blob stream URL detected. Restoring playable stream fallback:', asset.url);
              asset.url = fallbackUrl;
              saveStoredAsset(asset);
              if (videoRef.current) {
                videoRef.current.src = fallbackUrl;
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
              return;
            }

            if (video.src && video.readyState === 0 && (errCode === 3 || errCode === 4)) {
              setHasMediaError(true);
            }
          }}
          onEnded={() => setIsPlaying(false)}
          playsInline
        />

        {/* Dynamic Client Watermark Overlay */}
        {watermarkText && (
          <div className="video-watermark-overlay">
            <span>{watermarkText}</span>
          </div>
        )}

        {/* Media Stream Error Handler Overlay */}
        {hasMediaError && (
          <div className="media-error-overlay" style={{ position: 'absolute', zIndex: 60, background: 'rgba(0,0,0,0.85)', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid var(--accent-rose)', textAlign: 'center' }}>
            <p style={{ color: '#ffffff', fontSize: '0.85rem', marginBottom: '0.5rem' }}>⚠️ Video stream playback issue detected.</p>
            <button
              onClick={() => {
                setHasMediaError(false);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              style={{ background: 'var(--accent-cyan)', color: '#ffffff', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
            >
              Reload Media Stream
            </button>
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
        inPoint={inPoint}
        outPoint={outPoint}
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
