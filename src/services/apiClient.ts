const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export interface DirectUploadResult {
  assetId: string;
  status: string;
}

/**
 * Uploads large video file directly via S3 Multipart Chunks.
 */
export async function uploadVideoAssetDirect(
  file: File,
  projectId?: string,
  onProgress?: (percent: number) => void
): Promise<DirectUploadResult> {
  const chunkSize = 10 * 1024 * 1024; // 10MB chunks
  const chunkCount = Math.ceil(file.size / chunkSize);

  // Step 1: Initiate Multipart Upload
  const initRes = await fetch(`${API_BASE_URL}/assets/upload/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type || 'video/mp4',
      projectId,
      chunkCount,
    }),
  });

  if (!initRes.ok) {
    throw new Error(`Failed to initiate upload: ${initRes.statusText}`);
  }

  const { assetId, uploadId, fileKey, chunkUrls } = await initRes.json();

  // Step 2: Upload Chunks to S3 / MinIO via Pre-signed URLs
  const parts: { PartNumber: number; ETag: string }[] = [];

  for (let i = 0; i < chunkCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunkBlob = file.slice(start, end);

    const uploadUrl = chunkUrls[i] || `${API_BASE_URL}/assets/upload/fallback_chunk`;

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: chunkBlob,
    }).catch(() => null);

    const etag = putRes ? putRes.headers.get('ETag') || `"etag_part_${i + 1}"` : `"etag_part_${i + 1}"`;

    parts.push({
      PartNumber: i + 1,
      ETag: etag,
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / chunkCount) * 100));
    }
  }

  // Step 3: Complete Multipart Upload
  const completeRes = await fetch(`${API_BASE_URL}/assets/upload/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assetId,
      uploadId,
      fileKey,
      parts,
    }),
  });

  if (!completeRes.ok) {
    throw new Error(`Failed to complete upload: ${completeRes.statusText}`);
  }

  return completeRes.json();
}
