import React, { useState } from 'react';
import type { MediaAsset } from '../../utils/sampleAssets';
import { Share2, Copy, Check, Lock, Shield, Link, Calendar, X, Droplet, Download, MessageSquare } from 'lucide-react';

interface ShareModalProps {
  asset: MediaAsset;
  onClose: () => void;
  onUpdatePermissions?: (perms: {
    allowComments: boolean;
    allowDownload: boolean;
    enableWatermark: boolean;
    passcode: string;
    expiration: string;
  }) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ asset, onClose, onUpdatePermissions }) => {
  const [copied, setCopied] = useState(false);
  const [passcode, setPasscode] = useState('review2026');
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [enableWatermark, setEnableWatermark] = useState(true);
  const [expiration, setExpiration] = useState('7d');

  const shareUrl = `${window.location.origin}/?review=${asset.id}&guest=1&passcode=${passcode}&watermark=${enableWatermark ? '1' : '0'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    if (onUpdatePermissions) {
      onUpdatePermissions({
        allowComments,
        allowDownload,
        enableWatermark,
        passcode,
        expiration,
      });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-modal-overlay">
      <div className="share-modal-card">
        <div className="share-modal-header">
          <div className="header-title-box">
            <Share2 className="share-icon" />
            <div>
              <h3>Share Review Link & Permissions</h3>
              <span className="modal-sub">{asset.title}</span>
            </div>
          </div>

          <button className="btn-close-modal" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="share-modal-body">
          {/* Generated Shareable Link Field */}
          <div className="link-input-group">
            <Link className="field-icon" />
            <input type="text" readOnly value={shareUrl} className="share-url-field" />
            <button className={`btn-copy-link ${copied ? 'copied' : ''}`} onClick={handleCopy}>
              {copied ? <Check className="btn-ic" /> : <Copy className="btn-ic" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Security & Passcode Settings */}
          <div className="security-options-box">
            <h4 className="sec-subtitle">
              <Shield className="sec-ic" /> Client Protection & Review Permissions
            </h4>

            <div className="option-row">
              <div className="option-label-group">
                <Lock className="opt-ic" />
                <div className="opt-texts">
                  <span className="opt-title">Passcode Protection</span>
                  <span className="opt-desc">Clients must enter passcode to view & review</span>
                </div>
              </div>
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="passcode-input"
              />
            </div>

            <div className="option-row">
              <div className="option-label-group">
                <Calendar className="opt-ic" />
                <div className="opt-texts">
                  <span className="opt-title">Link Expiration</span>
                  <span className="opt-desc">Link automatically revokes after time limit</span>
                </div>
              </div>
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                className="expiration-select"
              >
                <option value="1d">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="never">Never Expires</option>
              </select>
            </div>

            {/* Permission Toggles */}
            <div className="option-toggle-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                />
                <MessageSquare className="chk-icon" />
                <span>Allow Guests to Post Timecoded Comments</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                />
                <Download className="chk-icon" />
                <span>Allow Video Download</span>
              </label>

              <label className="checkbox-label highlight">
                <input
                  type="checkbox"
                  checked={enableWatermark}
                  onChange={(e) => setEnableWatermark(e.target.checked)}
                />
                <Droplet className="chk-icon amber" />
                <span>Add Dynamic Client Watermark (Protection)</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
