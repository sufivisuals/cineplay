import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React ErrorBoundary exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0d14', color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <AlertTriangle style={{ width: '32px', height: '32px', color: '#ef4444' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Application State Recovered</h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '460px', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'A transient UI state error occurred. Click below to refresh into a clean state.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            <span>Reload Workspace</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
