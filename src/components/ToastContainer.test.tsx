import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NotificationProvider } from '../contexts/NotificationContext';
import { useNotify } from '../hooks/useNotify';
import { ToastContainer } from './ToastContainer';

function TestWrapper() {
  const notify = useNotify();

  return (
    <div>
      <button onClick={() => notify.success('Success message')}>Add Success</button>
      <button onClick={() => notify.error('Error message')}>Add Error</button>
      <ToastContainer />
    </div>
  );
}

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when there are no notifications', () => {
    render(
      <NotificationProvider>
        <ToastContainer />
      </NotificationProvider>
    );

    expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument();
  });

  it('should render toast when notification is added', () => {
    render(
      <NotificationProvider>
        <TestWrapper />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
    });

    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should render multiple toasts', () => {
    render(
      <NotificationProvider>
        <TestWrapper />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
      screen.getByText('Add Error').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should auto-dismiss toast after delay', () => {
    render(
      <NotificationProvider>
        <TestWrapper />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Fast-forward 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('should allow manual dismissal', () => {
    render(
      <NotificationProvider>
        <TestWrapper />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
    });

    const dismissButton = screen.getByLabelText('Dismiss notification');
    
    act(() => {
      dismissButton.click();
    });

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('should limit to 3 toasts', () => {
    render(
      <NotificationProvider>
        <TestWrapper />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
      screen.getByText('Add Success').click();
      screen.getByText('Add Success').click();
      screen.getByText('Add Success').click(); // 4th notification
    });

    const toasts = screen.getAllByRole('alert');
    expect(toasts).toHaveLength(3); // Should only show 3
  });
});
