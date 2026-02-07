import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ConnectionProvider, useConnections } from './ConnectionContext';
import * as connectionManager from '../services/connectionManager';

function TestConsumer() {
  const ctx = useConnections();
  return (
    <div>
      <span data-testid="count">{ctx.connections.length}</span>
      <span data-testid="current">{ctx.currentConnectionId ?? 'none'}</span>
      <span data-testid="unsaved">{String(ctx.unsavedChanges)}</span>
      <button onClick={() => ctx.setUnsavedChanges(true)}>setUnsaved</button>
      <button onClick={() => ctx.setCurrentConnectionId('test-id')}>setCurrent</button>
    </div>
  );
}

describe('ConnectionContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide connections from localStorage', () => {
    connectionManager.saveConnection({
      id: 'c1',
      label: 'Server 1',
      baseUrl: 'https://s1.com',
      lastActive: 1000,
    });
    render(
      <ConnectionProvider>
        <TestConsumer />
      </ConnectionProvider>,
    );
    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  it('should default to no current connection', () => {
    render(
      <ConnectionProvider>
        <TestConsumer />
      </ConnectionProvider>,
    );
    expect(screen.getByTestId('current').textContent).toBe('none');
  });

  it('should allow setting unsaved changes', async () => {
    render(
      <ConnectionProvider>
        <TestConsumer />
      </ConnectionProvider>,
    );
    expect(screen.getByTestId('unsaved').textContent).toBe('false');
    await act(async () => {
      screen.getByText('setUnsaved').click();
    });
    expect(screen.getByTestId('unsaved').textContent).toBe('true');
  });

  it('should throw when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useConnections must be used within a ConnectionProvider',
    );
    spy.mockRestore();
  });
});
