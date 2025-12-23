import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // THIS IS WHERE YOU LOG ERRORS
    console.error("Uncaught error:", error, errorInfo);
    
    // OPTIONAL: If you have a logging service (like Sentry), you send it here.
    // logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff', color: '#000' }}>
          <h1>Something went wrong.</h1>
          <p>Please take a screenshot of this error and send it to support at contact@sst.vision</p>
          <div style={{ color: 'red', background: '#f0f0f0', padding: '1rem', overflow: 'auto', marginTop: '10px' }}>
            {this.state.error && this.state.error.toString()}
          </div>
          <details open style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <br />
          <button 
            style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;