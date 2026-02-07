import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ConnectionsPage } from './ConnectionsPage';
import type { ConnectionContextValue } from '../contexts/ConnectionContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockContextValue: ConnectionContextValue = {
  connections: [],
  currentConnectionId: null,
  unsavedChanges: false,
  setUnsavedChanges: vi.fn(),
  switchConnection: vi.fn(() => true),
  removeConnection: vi.fn(),
  refreshConnections: vi.fn(),
  setCurrentConnectionId: vi.fn(),
};

vi.mock('../contexts/ConnectionContext', () => ({
  useConnections: () => mockContextValue,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ConnectionsPage />
    </MemoryRouter>,
  );
}

describe('ConnectionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContextValue.connections = [];
    mockContextValue.currentConnectionId = null;
  });

  it('should show heading', () => {
    renderPage();
    expect(screen.getByText('Manage Connections')).toBeInTheDocument();
  });

  it('should show empty message when no connections', () => {
    renderPage();
    expect(screen.getByText(/no saved connections/i)).toBeInTheDocument();
  });

  it('should list connections in a table', () => {
    mockContextValue.connections = [
      { id: 'c1', label: 'Server 1', baseUrl: 'https://s1.com', lastActive: 1000 },
      { id: 'c2', label: 'Server 2', baseUrl: 'https://s2.com', lastActive: 2000 },
    ];
    renderPage();

    expect(screen.getByText('Server 1')).toBeInTheDocument();
    expect(screen.getByText('Server 2')).toBeInTheDocument();
    expect(screen.getByText('https://s1.com')).toBeInTheDocument();
    expect(screen.getByText('https://s2.com')).toBeInTheDocument();
  });

  it('should show Active badge for current connection', () => {
    mockContextValue.connections = [
      { id: 'c1', label: 'Server 1', baseUrl: 'https://s1.com', lastActive: 1000 },
    ];
    mockContextValue.currentConnectionId = 'c1';
    renderPage();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should call switchConnection and navigate on Connect click', async () => {
    const user = userEvent.setup();
    mockContextValue.connections = [
      { id: 'c1', label: 'Server 1', baseUrl: 'https://s1.com', lastActive: 1000 },
    ];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Connect' }));
    expect(mockContextValue.switchConnection).toHaveBeenCalledWith('c1');
    expect(mockNavigate).toHaveBeenCalledWith('/?baseUrl=https%3A%2F%2Fs1.com');
  });

  it('should call removeConnection on Forget click after confirm', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockContextValue.connections = [
      { id: 'c1', label: 'Server 1', baseUrl: 'https://s1.com', lastActive: 1000 },
    ];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Forget' }));
    expect(window.confirm).toHaveBeenCalled();
    expect(mockContextValue.removeConnection).toHaveBeenCalledWith('c1');
  });

  it('should not remove connection if confirm is cancelled', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockContextValue.connections = [
      { id: 'c1', label: 'Server 1', baseUrl: 'https://s1.com', lastActive: 1000 },
    ];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Forget' }));
    expect(mockContextValue.removeConnection).not.toHaveBeenCalled();
  });
});
