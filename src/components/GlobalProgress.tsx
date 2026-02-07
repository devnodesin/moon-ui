import { useLoading } from '../contexts/LoadingContext';

export function GlobalProgress() {
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50"
      role="progressbar"
      aria-label="Loading"
      data-testid="global-progress"
    >
      <div className="h-1 w-full bg-base-200 overflow-hidden">
        <div className="h-full bg-primary animate-progress-indeterminate" />
      </div>
    </div>
  );
}
