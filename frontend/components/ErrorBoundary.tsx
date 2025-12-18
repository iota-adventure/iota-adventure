import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    if (import.meta.env.PROD) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-800 p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/30 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            
            <h1 className="text-xl font-bold text-white mb-2">
              發生了一些問題
            </h1>
            
            <p className="text-slate-400 text-sm mb-4">
              應用程式遇到了意外錯誤。請嘗試重新載入頁面。
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                  錯誤詳情（僅開發模式顯示）
                </summary>
                <div className="mt-2 p-3 bg-slate-800 rounded-lg overflow-auto max-h-40">
                  <p className="text-xs text-red-400 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-slate-500 mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                重試
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 bg-iota-accent text-slate-900 rounded-xl font-semibold hover:brightness-110 transition-all"
              >
                重新載入
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
