/**
 * Dynamic HTML5 Video First-Frame Thumbnail Generator
 * Captures the actual first video frame of an uploaded file and converts it into a Data URL JPEG.
 */
export function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.autoplay = false;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadeddata = () => {
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        } else {
          resolve(objectUrl);
        }
      } catch (err) {
        console.error('Failed to capture frame thumbnail canvas:', err);
        resolve(objectUrl);
      }
    };

    video.onerror = () => {
      resolve(objectUrl);
    };
  });
}
