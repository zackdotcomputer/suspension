import React, { ReactChild } from "react";

interface PropType {
  fallback: ReactChild;
  handleLogError?: (error: any, errorInfo: any) => void;
  shouldRethrow?: (error: any, errorInfo: any) => boolean;
}

export default class ErrorBoundary extends React.PureComponent<PropType, { hasError: boolean }> {
  constructor(props: PropType) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can log the error (or not) by passing in a custom handler.
    if (this.props.handleLogError) {
      this.props.handleLogError(error, errorInfo);
    } else if (process?.env?.NODE_ENV === "development") {
      console.error("Suspension ErrorBoundary caught: ", error, errorInfo);
    }

    if (this.props.shouldRethrow && this.props.shouldRethrow(error, errorInfo)) {
      throw error;
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
