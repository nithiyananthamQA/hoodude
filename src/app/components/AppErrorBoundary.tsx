import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[AppErrorBoundary]", error, info);
    }
    // In production, hook this to your error reporter (Sentry, LogRocket, etc.).
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center">
          <div className="flex flex-col items-center gap-5 max-w-[440px]">
            <div className="size-16 rounded-full bg-black/5 flex items-center justify-center text-[24px]">
              ⚠
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight">
              Something just snapped.
            </h1>
            <p className="text-[14px] text-black/55 leading-relaxed">
              The page hit an unexpected error. Try a fresh load — if it keeps
              happening, your bag and wishlist are saved locally.
            </p>
            <button
              onClick={() => window.location.assign("/")}
              className="mt-2 h-12 px-6 bg-black text-white rounded-full text-[13px] font-semibold uppercase tracking-[0.15em] hover:bg-brand transition-colors"
            >
              Take me home
            </button>
            {this.state.error && (
              <details className="mt-4 text-[11px] text-black/35 max-w-full overflow-x-auto">
                <summary className="cursor-pointer">Technical detail</summary>
                <pre className="mt-2 text-left whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
