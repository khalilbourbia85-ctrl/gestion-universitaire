import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.errorContainer}>
          <div style={styles.errorContent}>
            <h1 style={styles.title}>Une erreur s'est produite</h1>
            <p style={styles.message}>
              {this.state.error?.toString()}
            </p>
            {this.state.errorInfo && (
              <details style={styles.details}>
                <summary style={styles.summary}>Détails techniques</summary>
                <pre style={styles.stackTrace}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div style={styles.actions}>
              <button
                onClick={this.resetError}
                style={styles.button}
              >
                Réessayer
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{ ...styles.button, marginLeft: '10px' }}
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  errorContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
  },
  title: {
    color: '#d32f2f',
    margin: '0 0 16px 0',
    fontSize: '24px',
  },
  message: {
    color: '#666',
    marginBottom: '20px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  details: {
    marginBottom: '20px',
    cursor: 'pointer',
  },
  summary: {
    color: '#1976d2',
    marginBottom: '10px',
    userSelect: 'none',
  },
  stackTrace: {
    backgroundColor: '#f5f5f5',
    padding: '12px',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '12px',
    maxHeight: '200px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default ErrorBoundary;
