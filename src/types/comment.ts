import type { DrawingData } from './annotation';

export interface CommentReply {
  id: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export interface FrameComment {
  id: string;
  assetId: string;
  authorName: string;
  authorAvatar?: string;
  frameNumber: number;
  timeSeconds: number;
  timecodeFormatted: string; // "HH:MM:SS:FF"
  endTimeSeconds?: number;
  endTimecodeFormatted?: string; // "HH:MM:SS:FF"
  fps: number;
  text: string;
  drawingData?: DrawingData;
  resolved: boolean;
  replies: CommentReply[];
  createdAt: string;
}
