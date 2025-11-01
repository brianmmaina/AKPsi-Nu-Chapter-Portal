import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the app
    if (this.props.resetOnError) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center royal-bg"
          style={{
            padding: 'var(--space-6)',
          }}
        >
          <div
            className="glass-panel-elevated rounded-lg max-w-md w-full"
            style={{
              padding: 'var(--space-8)',
            }}
          >
            <h2
              className="font-bold mb-4"
              style={{
                fontSize: 'var(--text-2xl)',
                fontFamily: 'var(--font-display)',
                color: 'var(--danger)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Something went wrong
            </h2>
            <p
              className="mb-6"
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text)',
                marginBottom: 'var(--space-6)',
              }}
            >
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                className="mb-4 p-3 rounded"
                style={{
                  marginBottom: 'var(--space-4)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--surface)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                <summary style={{ cursor: 'pointer', marginBottom: 'var(--space-2)' }}>
                  Error Details (Development Only)
                </summary>
                <pre
                  style={{
                    overflow: 'auto',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button onClick={this.handleReset} className="btn btn-primary">
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="btn btn-secondary"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

