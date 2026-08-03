export type FrameRate = 23.976 | 24 | 25 | 29.97 | 30 | 50 | 59.94 | 60;

export interface Timecode {
  hours: number;
  minutes: number;
  seconds: number;
  frames: number;
  formatted: string; // "HH:MM:SS:FF"
  totalFrames: number;
  totalSeconds: number;
}
