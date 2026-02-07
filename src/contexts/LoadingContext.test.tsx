import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LoadingProvider, useLoading } from './LoadingContext';

function TestComponent() {
  const { isLoading, startLoading, stopLoading } = useLoading();

  return (
    <div>
      <span data-testid="loading">{isLoading.toString()}</span>
      <button onClick={startLoading}>Start</button>
      <button onClick={stopLoading}>Stop</button>
    </div>
  );
}

describe('LoadingContext', () => {
  it('should start with isLoading false', () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('should set isLoading true when startLoading is called', () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    act(() => {
      screen.getByText('Start').click();
    });

    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('should set isLoading false when stopLoading is called after start', () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    act(() => {
      screen.getByText('Start').click();
    });

    act(() => {
      screen.getByText('Stop').click();
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('should support overlapping loading operations (counter-based)', () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    // Start two overlapping operations
    act(() => {
      screen.getByText('Start').click();
      screen.getByText('Start').click();
    });

    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Stop one — still loading
    act(() => {
      screen.getByText('Stop').click();
    });

    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Stop the second — done
    act(() => {
      screen.getByText('Stop').click();
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('should not go below zero when stopLoading is called without start', () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    act(() => {
      screen.getByText('Stop').click();
      screen.getByText('Stop').click();
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');

    // After extra stops, a single start should still work
    act(() => {
      screen.getByText('Start').click();
    });

    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('should throw when useLoading is used outside provider', () => {
    const consoleError = console.error;
    console.error = () => {};

    expect(() => render(<TestComponent />)).toThrow(
      'useLoading must be used within a LoadingProvider'
    );

    console.error = consoleError;
  });
});
