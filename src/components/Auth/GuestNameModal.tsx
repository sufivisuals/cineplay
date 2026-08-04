import React, { useState } from 'react';
import { UserCheck, MessageSquare, X } from 'lucide-react';

interface GuestNameModalProps {
  onSubmitGuestName: (name: string) => void;
  onCancel: () => void;
}

export const GuestNameModal: React.FC<GuestNameModalProps> = ({ onSubmitGuestName, onCancel }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmitGuestName(name.trim());
    }
  };

  return (
    <div className="guest-modal-overlay">
      <div className="guest-modal-card">
        <div className="guest-modal-header">
          <div className="guest-title-box">
            <UserCheck className="guest-ic" />
            <h3>Enter Your Name to Post Feedback</h3>
          </div>
          <button className="btn-close-guest" onClick={onCancel}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="guest-modal-body">
          <p className="guest-prompt-desc">
            Your review feedback will be tagged with your name so the production team knows who posted the note.
          </p>

          <div className="guest-input-wrap">
            <MessageSquare className="input-ic" />
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Sarah Miller (Client Producer)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="guest-name-input"
            />
          </div>

          <button type="submit" className="btn-save-guest">
            <span>Continue & Post Feedback</span>
          </button>
        </form>
      </div>
    </div>
  );
};
