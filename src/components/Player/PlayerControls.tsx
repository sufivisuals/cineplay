import React from 'react';
import type { FrameRate } from '../../types/timecode';
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward, Volume2, VolumeX, Maximize } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepFrame: (delta: number) => void;
  timecodeFormatted: string;
  currentFrame: number;
  totalFrames: number;
  playbackRate: number;
  onChangeRate: (rate: number) => void;
  volume: number;
  onChangeVolume: (volume: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  fps: FrameRate;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onStepFrame,
  timecodeFormatted,
  currentFrame,
  totalFrames,
  playbackRate,
  onChangeRate,
  volume,
  onChangeVolume,
  isMuted,
  onToggleMute,
  onToggleFullscreen,
}) => {

  return (
    <div className="player-controls-bar">
      <div className="controls-left">
        {/* Play / Pause */}
        <button
          className="btn-control primary-play"
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <Pause className="ctrl-icon" /> : <Play className="ctrl-icon play-offset" />}
        </button>

        {/* Step 10 frames back */}
        <button
          className="btn-control"
          onClick={() => onStepFrame(-10)}
          title="Jump back 10 frames (J)"
        >
          <Rewind className="ctrl-icon" />
        </button>

        {/* Step 1 frame back */}
        <button
          className="btn-control"
          onClick={() => onStepFrame(-1)}
          title="Step back 1 frame (Left Arrow)"
        >
          <SkipBack className="ctrl-icon" />
        </button>

        {/* Step 1 frame forward */}
        <button
          className="btn-control"
          onClick={() => onStepFrame(1)}
          title="Step forward 1 frame (Right Arrow)"
        >
          <SkipForward className="ctrl-icon" />
        </button>

        {/* Step 10 frames forward */}
        <button
          className="btn-control"
          onClick={() => onStepFrame(10)}
          title="Jump forward 10 frames (L)"
        >
          <FastForward className="ctrl-icon" />
        </button>
      </div>

      <div className="controls-center">
        <div className="timecode-display" title="SMPTE Timecode (HH:MM:SS:FF)">
          <span className="tc-label">SMPTE</span>
          <span className="tc-value">{timecodeFormatted}</span>
        </div>

        <div className="frame-display" title="Exact Frame Counter">
          <span className="frame-label">FRAME</span>
          <span className="frame-value">
            {currentFrame} <span className="frame-total">/ {totalFrames}</span>
          </span>
        </div>
      </div>

      <div className="controls-right">
        {/* Playback Rate */}
        <div className="rate-selector">
          <select
            value={playbackRate}
            onChange={(e) => onChangeRate(Number(e.target.value))}
            className="rate-dropdown"
            title="Playback Speed"
          >
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1.0x (Normal)</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2.0x</option>
          </select>
        </div>

        {/* Volume & Mute */}
        <div className="volume-control">
          <button className="btn-control icon-only" onClick={onToggleMute} title="Mute/Unmute">
            {isMuted || volume === 0 ? (
              <VolumeX className="ctrl-icon danger-text" />
            ) : (
              <Volume2 className="ctrl-icon" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onChangeVolume(Number(e.target.value))}
            className="volume-slider"
          />
        </div>

        {/* Fullscreen */}
        <button className="btn-control icon-only" onClick={onToggleFullscreen} title="Fullscreen">
          <Maximize className="ctrl-icon" />
        </button>
      </div>
    </div>
  );
};
