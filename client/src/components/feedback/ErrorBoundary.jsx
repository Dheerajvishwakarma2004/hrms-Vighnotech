import { Component } from 'react';
import Button from '@/components/ui/Button';
import ErrorState from './ErrorState';

/**
 * Catches render errors outside the router (the router uses RouteErrorBoundary).
 * @param {(props: { error: Error, reset: () => void }) => import('react').ReactNode} [fallback]
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('Uncaught UI error:', error, info.componentStack);
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    const { fallback, children } = this.props;
    if (!error) return children;
    if (fallback) return fallback({ error, reset: this.reset });

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <ErrorState
          title="The application crashed"
          message="An unexpected error occurred. Reloading the page usually fixes it."
          action={<Button onClick={() => window.location.reload()}>Reload page</Button>}
        />
      </div>
    );
  }
}
