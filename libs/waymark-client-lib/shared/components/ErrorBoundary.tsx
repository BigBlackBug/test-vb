// Vendor
import { Component } from 'react';
import classNames from 'classnames';

import * as styles from './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  containerClass?: string;
  headerComponent?: React.ReactNode | null;
  shouldDisplayFallbackUI?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static defaultProps = {
    children: null,
    containerClass: '',
    headerComponent: null,
    shouldDisplayFallbackUI: true,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({ error });
    console.error('Error caught by error boundary: ', error.toString(), errorInfo.componentStack);
    const { onError } = this.props;
    onError?.(error, errorInfo);
  }

  render() {
    const { error } = this.state;
    const { children, containerClass, headerComponent, shouldDisplayFallbackUI } = this.props;

    return error ? (
      <div className={classNames(styles.ErrorBoundaryContainer, containerClass)}>
        {shouldDisplayFallbackUI ? (
          <>
            <div className={styles.HeaderComponent}>{headerComponent}</div>
            <div className={styles.CaughtErrorFallbackUI}>
              <p>
                Sorry, something went wrong. Please try refreshing the page. If the error persists,
                get in touch and our team will get to the bottom of it.
              </p>
            </div>
          </>
        ) : null}
      </div>
    ) : (
      children
    );
  }
}

export default ErrorBoundary;
