import React from 'react';
import { Upload, Film, FolderUp } from 'lucide-react';

interface GlobalDropzoneOverlayProps {
  onDropFiles: (files: FileList) => void;
  onCancel: () => void;
}

export const GlobalDropzoneOverlay: React.FC<GlobalDropzoneOverlayProps> = ({
  onDropFiles,
  onCancel,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="global-dropzone-overlay"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onCancel}
    >
      <div className="dropzone-target-box" onClick={(e) => e.stopPropagation()}>
        <div className="dropzone-icon-badge">
          <Upload className="drop-ic" />
        </div>

        <h3>Drop Video Files to Upload</h3>
        <p>Drop your MP4, MOV, or WEBM media files directly into CinePlay Pro</p>

        <div className="dropzone-hints">
          <div className="hint-pill">
            <Film className="h-ic" />
            <span>High-Speed Multipart S3 Chunk Upload</span>
          </div>
          <div className="hint-pill">
            <FolderUp className="h-ic" />
            <span>FFmpeg 720p H.264 Proxy & Sprite Grid Generation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
