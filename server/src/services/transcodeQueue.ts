import { Queue, Worker } from 'bullmq';
import path from 'path';
import fs from 'fs-extra';
import { processVideoTranscode } from './ffmpegService';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = Number(process.env.REDIS_PORT) || 6379;

const connection = {
  host: redisHost,
  port: redisPort,
};

export const transcodeQueue = new Queue('video-transcoding', { connection });

export interface TranscodeJobData {
  assetId: string;
  fileKey: string;
  originalFilePath: string;
}

/**
 * BullMQ Worker processing background transcode jobs.
 */
export const transcodeWorker = new Worker<TranscodeJobData>(
  'video-transcoding',
  async (job) => {
    const { assetId, originalFilePath } = job.data;
    console.log(`[Queue] Processing video transcode for asset ${assetId}...`);

    const outputDir = path.join(process.cwd(), 'temp_transcodes', assetId);

    try {
      const result = await processVideoTranscode({
        assetId,
        inputFilePath: originalFilePath,
        outputDir,
      });

      console.log(`[Queue] Transcode completed successfully for asset ${assetId}`);

      // Clean up temporary files
      await fs.remove(outputDir).catch(() => {});

      return result;
    } catch (err) {
      console.error(`[Queue] Transcode failed for asset ${assetId}:`, err);
      throw err;
    }
  },
  { connection }
);
