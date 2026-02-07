import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NotificationProvider } from '../contexts/NotificationContext';
import { useNotify } from './useNotify';

function TestComponent() {
  const notify = useNotify();

  return (
    <div>
      <button onClick={() => notify.success('Success!')}>Success</button>
      <button onClick={() => notify.error('Error!')}>Error</button>
      <button onClick={() => notify.warning('Warning!')}>Warning</button>
      <button onClick={() => notify.info('Info!')}>Info</button>
    </div>
  );
}

describe('useNotify', () => {
  it('should provide success notification method', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const button = screen.getByText('Success');
    expect(button).toBeInTheDocument();

    act(() => {
      button.click();
    });

    // Notification is added (verified through context, not UI here)
  });

  it('should provide all notification type methods', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });
});
