import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NotificationProvider } from '../contexts/NotificationContext';
import { useNotify } from '../hooks/useNotify';
import { NotificationsPage } from './NotificationsPage';

function TestWrapper() {
  const notify = useNotify();

  return (
    <div>
      <button onClick={() => notify.success('Test success')}>Add Success</button>
      <button onClick={() => notify.error('Test error')}>Add Error</button>
      <NotificationsPage />
    </div>
  );
}

describe('NotificationsPage', () => {
  it('should show empty state when no notifications', () => {
    render(
      <NotificationProvider>
        <NotificationsPage />
      </NotificationProvider>
    );

    expect(screen.getByText('No notifications yet.')).toBeInTheDocument();
  });

  it('should display notifications', () => {
    render(
      <NotificationProvider>
        <TestWrapper />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
    });

    expect(screen.getByText('Test success')).toBeInTheDocument();
  });

  it('should display multiple notifications', () => {
    render(
      <NotificationProvider>
        <TestWrapper />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
      screen.getByText('Add Error').click();
    });

    expect(screen.getByText('Test success')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should show Clear All button when notifications exist', () => {
    render(
      <NotificationProvider>
        <TestWrapper />
      </NotificationProvider>
    );

    // Initially no Clear All button
    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();

    act(() => {
      screen.getByText('Add Success').click();
    });

    // Now Clear All button appears
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('should clear all notifications when Clear All is clicked', () => {
    render(
      <NotificationProvider>
        <TestWrapper />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
      screen.getByText('Add Error').click();
    });

    expect(screen.getByText('Test success')).toBeInTheDocument();

    act(() => {
      screen.getByText('Clear All').click();
    });

    expect(screen.queryByText('Test success')).not.toBeInTheDocument();
    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    expect(screen.getByText('No notifications yet.')).toBeInTheDocument();
  });

  it('should display notification type icons', () => {
    render(
      <NotificationProvider>
        <TestWrapper />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
    });

    const successIcon = screen.getByLabelText('success notification');
    expect(successIcon).toBeInTheDocument();
  });
});
