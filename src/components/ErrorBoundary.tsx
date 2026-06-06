import { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/utils/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary. Without this, any error thrown during render
 * unmounts the whole React tree and the user sees a blank white screen.
 * This catches the error, logs it, and shows a recoverable message.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error("Uncaught render error:", { error, componentStack: info.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
          <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <h1 className="text-xl font-bold text-red-700">Something went wrong</h1>
            <p className="mt-2 text-sm text-red-600">
              An unexpected error occurred while rendering this page. Your data is safe.
            </p>
            {this.state.error?.message && (
              <pre className="mt-4 max-h-40 overflow-auto rounded bg-red-100 p-3 text-left text-xs text-red-800">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
