import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NotificationProvider, useNotifications } from './NotificationContext';

function TestComponent() {
  const { notifications, addNotification, clearNotification, clearAll, markAsRead } =
    useNotifications();

  return (
    <div>
      <div data-testid="count">{notifications.length}</div>
      <button onClick={() => addNotification('success', 'Success message')}>Add Success</button>
      <button onClick={() => addNotification('error', 'Error message')}>Add Error</button>
      <button onClick={() => clearAll()}>Clear All</button>
      {notifications.map((n) => (
        <div key={n.id} data-testid={`notification-${n.id}`}>
          <span>{n.message}</span>
          <span data-testid={`type-${n.id}`}>{n.type}</span>
          <span data-testid={`read-${n.id}`}>{n.read.toString()}</span>
          <button onClick={() => clearNotification(n.id)}>Remove</button>
          <button onClick={() => markAsRead(n.id)}>Mark Read</button>
        </div>
      ))}
    </div>
  );
}

describe('NotificationContext', () => {
  beforeEach(() => {
    // Clear any existing notifications
  });

  it('should start with empty notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('should add a notification', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
    });

    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should add multiple notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
      screen.getByText('Add Error').click();
    });

    expect(screen.getByTestId('count').textContent).toBe('2');
  });

  it('should set correct notification type', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Error').click();
    });

    const notifications = screen.getAllByText(/Error message/);
    expect(notifications).toHaveLength(1);
  });

  it('should remove a notification', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
    });

    expect(screen.getByTestId('count').textContent).toBe('1');

    act(() => {
      screen.getByText('Remove').click();
    });

    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('should clear all notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
      screen.getByText('Add Error').click();
    });

    expect(screen.getByTestId('count').textContent).toBe('2');

    act(() => {
      screen.getByText('Clear All').click();
    });

    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('should mark notification as read', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
    });

    // Should be unread initially
    const notification = screen.getAllByTestId(/^notification-/)[0];
    const fullNotificationId = notification.getAttribute('data-testid')?.replace('notification-', '') || '';
    expect(screen.getByTestId(`read-${fullNotificationId}`).textContent).toBe('false');

    act(() => {
      screen.getByText('Mark Read').click();
    });

    expect(screen.getByTestId(`read-${fullNotificationId}`).textContent).toBe('true');
  });

  it('should assign unique IDs to notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Add Success').click();
      screen.getByText('Add Success').click();
    });

    const notifications = screen.getAllByTestId(/^notification-/);
    expect(notifications).toHaveLength(2);
    expect(notifications[0].getAttribute('data-testid')).not.toBe(
      notifications[1].getAttribute('data-testid')
    );
  });
});
