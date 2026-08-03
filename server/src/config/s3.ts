import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
const s3Bucket = process.env.S3_BUCKET || 'cineplay-media';
const s3AccessKey = process.env.S3_ACCESS_KEY || 'minio_admin';
const s3SecretKey = process.env.S3_SECRET_KEY || 'minio_secret_password';

export const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: s3Endpoint,
  credentials: {
    accessKeyId: s3AccessKey,
    secretAccessKey: s3SecretKey,
  },
  forcePathStyle: true, // Required for MinIO
});

export const BUCKET_NAME = s3Bucket;

/**
 * Initiates a S3 Multipart upload for large video files.
 */
export async function initiateMultipartUpload(fileKey: string, contentType: string) {
  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });
  const res = await s3Client.send(command);
  return { uploadId: res.UploadId, key: fileKey };
}

/**
 * Generates a pre-signed URL for uploading a 10MB-50MB chunk part.
 */
export async function getPresignedPartUrl(fileKey: string, uploadId: string, partNumber: number) {
  const command = new UploadPartCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Completes a S3 Multipart upload.
 */
export async function completeMultipartUpload(
  fileKey: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[]
) {
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });
  return s3Client.send(command);
}

/**
 * Generates a read signed URL for video playback.
 */
export async function getPresignedReadUrl(fileKey: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 86400 });
}
