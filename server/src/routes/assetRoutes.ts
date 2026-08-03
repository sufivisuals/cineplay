import { Router, Request, Response } from 'express';
import { initiateMultipartUpload, getPresignedPartUrl, completeMultipartUpload, getPresignedReadUrl } from '../config/s3';
import { transcodeQueue } from '../services/transcodeQueue';

export const assetRouter = Router();

// In-Memory store fallback when database is starting up
const memoryAssetStore = new Map<string, any>();

/**
 * Initiate Direct S3 Multipart Upload for Large Videos.
 */
assetRouter.post('/upload/initiate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, fileSize, mimeType, projectId, chunkCount = 5 } = req.body;
    const assetId = `asset_${Date.now()}`;
    const fileKey = `uploads/${projectId || 'default'}/${assetId}_${filename}`;

    let uploadId = `upload_${Date.now()}`;
    let chunkUrls: string[] = [];

    try {
      const res = await initiateMultipartUpload(fileKey, mimeType || 'video/mp4');
      uploadId = res.uploadId || uploadId;
      for (let partNumber = 1; partNumber <= chunkCount; partNumber++) {
        const url = await getPresignedPartUrl(fileKey, uploadId, partNumber);
        chunkUrls.push(url);
      }
    } catch (_s3Err) {
      // Fallback local chunk endpoints when MinIO S3 container is not running
      for (let partNumber = 1; partNumber <= chunkCount; partNumber++) {
        chunkUrls.push(`http://localhost:4000/api/v1/assets/upload/chunk_fallback?key=${fileKey}&part=${partNumber}`);
      }
    }

    const assetData = {
      id: assetId,
      name: filename,
      fileKey,
      fileSize,
      mimeType,
      fps: 24,
      transcodeStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    memoryAssetStore.set(assetId, assetData);

    res.json({
      success: true,
      assetId,
      uploadId,
      fileKey,
      chunkUrls,
    });
  } catch (err: any) {
    console.error('Error initiating upload:', err);
    res.status(500).json({ error: 'Failed to initiate multipart upload', details: err.message });
  }
});

/**
 * Complete Direct S3 Multipart Upload & Enqueue Transcode Job.
 */
assetRouter.post('/upload/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { assetId, uploadId, fileKey, parts } = req.body;

    await completeMultipartUpload(fileKey, uploadId, parts || []);

    // Update asset status
    const asset = memoryAssetStore.get(assetId);
    if (asset) {
      asset.transcodeStatus = 'PROCESSING';
      memoryAssetStore.set(assetId, asset);
    }

    // Add job to BullMQ transcode queue
    await transcodeQueue.add('transcode-video', {
      assetId,
      fileKey,
      originalFilePath: fileKey,
    });

    res.json({
      success: true,
      assetId,
      status: 'PROCESSING',
      message: 'Upload completed. Background transcoding queued.',
    });
  } catch (err: any) {
    console.error('Error completing upload:', err);
    res.status(500).json({ error: 'Failed to complete upload', details: err.message });
  }
});

/**
 * Fetch Asset Metadata & Presigned Playback URLs.
 */
assetRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const asset = memoryAssetStore.get(id);

    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    const playUrl = await getPresignedReadUrl(asset.fileKey).catch(() => null);

    res.json({
      asset: {
        ...asset,
        playUrl,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch asset', details: err.message });
  }
});

/**
 * Check Asset Transcode Status.
 */
assetRouter.get('/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params;
  const asset = memoryAssetStore.get(id);
  res.json({
    assetId: id,
    status: asset ? asset.transcodeStatus : 'UNKNOWN',
  });
});
