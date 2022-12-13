import React, { Component, ErrorInfo, ReactNode } from "react";

type ErrorComponent = (error: Error) => ReactNode;

interface Props {
  fallback: ErrorComponent;
  children?: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { error: error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }

    return this.props.children;
  }
}
