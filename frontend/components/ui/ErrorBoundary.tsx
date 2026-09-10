"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * React Error Boundary — catches JS errors in the component tree
 * and renders a styled retry UI instead of a blank screen.
 * Phase 8 requirement: all major sections wrapped with this.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center gap-4 rounded-card border border-red/30 bg-red/5 p-10 text-center"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red/30 bg-bg">
            <AlertTriangle size={18} className="text-red" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Something went wrong</p>
            {this.state.errorMessage && (
              <p className="mt-1 max-w-sm text-xs font-mono text-ink-faint break-words">
                {this.state.errorMessage}
              </p>
            )}
          </div>
          <button
            onClick={this.reset}
            className="flex items-center gap-2 rounded-control border border-border bg-glass px-4 py-2 text-xs font-medium text-ink hover:border-border-strong transition-colors"
          >
            <RefreshCw size={13} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
