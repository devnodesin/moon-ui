import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ConnectionSwitcher } from './ConnectionSwitcher';
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

function renderSwitcher() {
  return render(
    <MemoryRouter>
      <ConnectionSwitcher />
    </MemoryRouter>,
  );
}

describe('ConnectionSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContextValue.connections = [];
    mockContextValue.currentConnectionId = null;
  });

  it('should render nothing when no connections', () => {
    const { container } = renderSwitcher();
    expect(container.innerHTML).toBe('');
  });

  it('should render dropdown when connections exist', () => {
    mockContextValue.connections = [
      { id: 'c1', label: 'Server 1', baseUrl: 'https://s1.com', lastActive: 1000 },
    ];
    renderSwitcher();
    expect(screen.getByLabelText(/switch connection/i)).toBeInTheDocument();
  });

  it('should show connection labels in dropdown', () => {
    mockContextValue.connections = [
      { id: 'c1', label: 'Server 1', baseUrl: 'https://s1.com', lastActive: 1000 },
      { id: 'c2', label: 'Server 2', baseUrl: 'https://s2.com', lastActive: 2000 },
    ];
    renderSwitcher();
    expect(screen.getByText('Server 1')).toBeInTheDocument();
    expect(screen.getByText('Server 2')).toBeInTheDocument();
  });

  it('should call switchConnection when clicking a different connection', async () => {
    const user = userEvent.setup();
    mockContextValue.connections = [
      { id: 'c1', label: 'Server 1', baseUrl: 'https://s1.com', lastActive: 1000 },
      { id: 'c2', label: 'Server 2', baseUrl: 'https://s2.com', lastActive: 2000 },
    ];
    mockContextValue.currentConnectionId = 'c1';
    renderSwitcher();

    await user.click(screen.getByText('Server 2'));
    expect(mockContextValue.switchConnection).toHaveBeenCalledWith('c2');
    expect(mockNavigate).toHaveBeenCalledWith('/?baseUrl=https%3A%2F%2Fs2.com');
  });

  it('should not switch when clicking the already active connection', async () => {
    const user = userEvent.setup();
    mockContextValue.connections = [
      { id: 'c1', label: 'Server 1', baseUrl: 'https://s1.com', lastActive: 1000 },
    ];
    mockContextValue.currentConnectionId = 'c1';
    renderSwitcher();

    const buttons = screen.getAllByText('Server 1');
    // Click the one inside the dropdown list (not the label in the button)
    await user.click(buttons[buttons.length - 1]);
    expect(mockContextValue.switchConnection).not.toHaveBeenCalled();
  });

  it('should show Manage Connections link', () => {
    mockContextValue.connections = [
      { id: 'c1', label: 'Server 1', baseUrl: 'https://s1.com', lastActive: 1000 },
    ];
    renderSwitcher();
    expect(screen.getByText('Manage Connections')).toBeInTheDocument();
  });

  it('should navigate to connections page on Manage click', async () => {
    const user = userEvent.setup();
    mockContextValue.connections = [
      { id: 'c1', label: 'Server 1', baseUrl: 'https://s1.com', lastActive: 1000 },
    ];
    renderSwitcher();
    await user.click(screen.getByText('Manage Connections'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/connections');
  });
});
