import React from 'react';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

interface AccessDeniedViewProps {
  assetTitle?: string;
  assignedClient?: string;
  currentClientEmail?: string;
  onBackToDashboard: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  assetTitle,
  assignedClient,
  currentClientEmail,
  onBackToDashboard,
}) => {
  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="denied-icon-badge">
          <ShieldAlert className="lock-icon" />
        </div>
        <h2>🔒 Access Restricted</h2>
        <p className="denied-message">
          You are currently signed in as <strong>{currentClientEmail}</strong>. This video asset
          {assetTitle ? ` ("${assetTitle}")` : ''} is restricted to <strong>{assignedClient || 'another client account'}</strong>.
        </p>

        <div className="security-notice-box">
          <Lock className="sec-lock-ic" />
          <span>Client Isolation System: Cross-tenant data access attempts are blocked.</span>
        </div>

        <button className="btn-back-dashboard" onClick={onBackToDashboard}>
          <ArrowLeft className="btn-ic" />
          <span>Return to My Private Workspace</span>
        </button>
      </div>
    </div>
  );
};
