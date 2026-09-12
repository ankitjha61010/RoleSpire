import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level safety net. Without this, any uncaught render-time exception
 * anywhere in the tree blanks the entire page with no recovery and no
 * visible error — this catches it, shows what actually broke, and offers a
 * reload instead of a dead white screen.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('RoleSpire crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full glass-panel rounded-3xl p-6 sm:p-8 border border-rose-500/30 space-y-4 text-center">
            <h1 className="text-lg font-bold text-white">Something went wrong</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The page hit an unexpected error and had to stop. Reloading usually fixes it — if it keeps
              happening, the error below tells us exactly what broke.
            </p>
            <pre className="text-left text-[11px] text-rose-300 bg-slate-900/80 border border-slate-800 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="brand-gradient-btn text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
