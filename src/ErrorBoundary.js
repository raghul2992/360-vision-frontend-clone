import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error }; // Store the error object
  }

  componentDidCatch(error, errorInfo) {
    // THIS IS WHERE YOU LOG ERRORS
    console.error("Uncaught error:", error, errorInfo);
    
    // Set errorInfo into state as well
    this.setState({ errorInfo: errorInfo });

    // OPTIONAL: If you have a logging service (like Sentry), you send it here.
    // logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff', color: '#000', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <h1 style={{ color: '#e74c3c', marginBottom: '1rem' }}>Oops! Something went wrong.</h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            Please take a screenshot of this error and send it to support at <a href="mailto:contact@sst.vision" style={{ color: '#3498db', textDecoration: 'none' }}>contact@sst.vision</a>
          </p>

          <div style={{ border: '1px solid #e74c3c', borderRadius: '4px', background: '#fdeded', padding: '1rem', marginBottom: '1.5rem', overflowWrap: 'break-word', textAlign: 'left' }}>
            <h3 style={{ color: '#e74c3c', marginBottom: '0.5rem' }}>Error Message:</h3>
            <p style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#c0392b' }}>
              {this.state.error ? this.state.error.toString() : 'No error message available.'}
            </p>
          </div>
          
          {/* Ensure the 'details' tag is open by default */}
          <details open style={{ whiteSpace: 'pre-wrap', textAlign: 'left', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', padding: '1rem', marginBottom: '1.5rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#333', marginBottom: '0.5rem' }}>Click for More Details (Component Stack)</summary>
            <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5', color: '#555' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack
                ? this.state.errorInfo.componentStack
                : 'No component stack information available.'}
            </p>
          </details>
          
          <button 
            style={{ 
              padding: '12px 25px', 
              fontSize: '17px', 
              cursor: 'pointer', 
              backgroundColor: '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
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