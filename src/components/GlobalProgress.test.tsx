import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LoadingProvider, useLoading } from '../contexts/LoadingContext';
import { GlobalProgress } from './GlobalProgress';

function Trigger() {
  const { startLoading, stopLoading } = useLoading();
  return (
    <>
      <button onClick={startLoading}>Start</button>
      <button onClick={stopLoading}>Stop</button>
    </>
  );
}

function renderWithProvider() {
  return render(
    <LoadingProvider>
      <GlobalProgress />
      <Trigger />
    </LoadingProvider>
  );
}

describe('GlobalProgress', () => {
  it('should not render when not loading', () => {
    renderWithProvider();
    expect(screen.queryByTestId('global-progress')).not.toBeInTheDocument();
  });

  it('should render when loading', () => {
    renderWithProvider();

    act(() => {
      screen.getByText('Start').click();
    });

    expect(screen.getByTestId('global-progress')).toBeInTheDocument();
  });

  it('should disappear when loading stops', () => {
    renderWithProvider();

    act(() => {
      screen.getByText('Start').click();
    });

    expect(screen.getByTestId('global-progress')).toBeInTheDocument();

    act(() => {
      screen.getByText('Stop').click();
    });

    expect(screen.queryByTestId('global-progress')).not.toBeInTheDocument();
  });

  it('should have progressbar role', () => {
    renderWithProvider();

    act(() => {
      screen.getByText('Start').click();
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
