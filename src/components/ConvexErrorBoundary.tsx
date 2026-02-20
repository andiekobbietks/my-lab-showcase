import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary for Convex query errors. When a useQuery throws
 * (e.g., server unavailable), this renders the fallback instead of crashing.
 */
export class ConvexErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (error.message?.includes('CONVEX')) {
      console.warn('Convex unavailable, showing fallback');
    } else {
      console.error('Error in section:', error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
