import { Router, Request, Response } from 'express';

export const commentRouter = Router();

// In-Memory store fallback
const memoryCommentStore = new Map<string, any[]>();

/**
 * Fetch all timecoded comments for a video asset.
 */
commentRouter.get('/asset/:assetId', (req: Request, res: Response): void => {
  const { assetId } = req.params;
  const comments = memoryCommentStore.get(assetId) || [];
  res.json({ comments });
});

/**
 * Create a new timestamped frame comment (with optional attached vector drawings).
 */
commentRouter.post('/asset/:assetId', (req: Request, res: Response): void => {
  const { assetId } = req.params;
  const { frameNumber, timeSeconds, timecodeFormatted, text, drawingJson, authorName = 'Guest Reviewer' } = req.body;

  const newComment = {
    id: `comment_${Date.now()}`,
    assetId,
    authorName,
    frameNumber: frameNumber || 0,
    timeSeconds: timeSeconds || 0,
    timecodeFormatted: timecodeFormatted || '00:00:00:00',
    text,
    drawingJson: drawingJson || null,
    resolved: false,
    replies: [],
    createdAt: new Date().toISOString(),
  };

  const existing = memoryCommentStore.get(assetId) || [];
  const updated = [newComment, ...existing];
  memoryCommentStore.set(assetId, updated);

  res.status(201).json({ comment: newComment });
});

/**
 * Toggle resolved state of a frame comment.
 */
commentRouter.patch('/:commentId/resolve', (req: Request, res: Response): void => {
  const { commentId } = req.params;
  let targetComment: any = null;

  for (const [assetId, list] of memoryCommentStore.entries()) {
    const updated = list.map((c) => {
      if (c.id === commentId) {
        c.resolved = !c.resolved;
        targetComment = c;
      }
      return c;
    });
    memoryCommentStore.set(assetId, updated);
  }

  res.json({ success: true, comment: targetComment });
});

/**
 * Delete a comment with Guest permission security check.
 */
commentRouter.delete('/:commentId', (req: Request, res: Response): void => {
  const isGuest = req.headers['x-guest-mode'] === '1';
  if (isGuest) {
    res.status(403).json({
      error: 'Forbidden',
      message: '🔒 Guest Review Links are strictly restricted to view and comment operations.',
    });
    return;
  }

  const { commentId } = req.params;

  for (const [assetId, list] of memoryCommentStore.entries()) {
    const updated = list.filter((c) => c.id !== commentId);
    memoryCommentStore.set(assetId, updated);
  }

  res.json({ success: true, deletedId: commentId });
});
