import type { FrameRate, Timecode } from '../types/timecode';

/**
 * Calculates SMPTE timecode from seconds and target frame rate.
 */
export function secondsToTimecode(seconds: number, fps: FrameRate): Timecode {
  const safeSeconds = Math.max(0, seconds);
  
  // Calculate total frames accurately
  const totalFrames = Math.floor(safeSeconds * fps);
  
  const framesPerSecond = Math.round(fps);
  const framesPerMinute = framesPerSecond * 60;
  const framesPerHour = framesPerMinute * 60;

  const hours = Math.floor(totalFrames / framesPerHour);
  const minutes = Math.floor((totalFrames % framesPerHour) / framesPerMinute);
  const secs = Math.floor((totalFrames % framesPerMinute) / framesPerSecond);
  const frames = Math.floor(totalFrames % framesPerSecond);

  const pad = (num: number) => num.toString().padStart(2, '0');
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(secs)}:${pad(frames)}`;

  return {
    hours,
    minutes,
    seconds: secs,
    frames,
    formatted,
    totalFrames,
    totalSeconds: safeSeconds,
  };
}

/**
 * Converts a frame number to time in seconds.
 */
export function frameToSeconds(frameNumber: number, fps: FrameRate): number {
  return frameNumber / fps;
}

/**
 * Converts seconds to total frame count.
 */
export function secondsToFrame(seconds: number, fps: FrameRate): number {
  return Math.floor(seconds * fps);
}
