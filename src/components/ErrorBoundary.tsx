import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ABROB application error:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="theme-page flex min-h-screen items-center justify-center bg-[#050816] px-6 text-slate-100">
        <section className="glass-card w-full max-w-md p-8 text-center" role="alert">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <p className="section-kicker mt-5">Recovery mode</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Something interrupted the command center.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">The page hit an unexpected error. Your data is safe. Reload the workspace to continue.</p>
          <button type="button" onClick={this.handleRetry} className="glow-button mt-6 mx-auto">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </section>
      </main>
    );
  }
}
