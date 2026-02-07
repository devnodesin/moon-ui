import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { UsersPage } from './UsersPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { username: 'admin' },
    currentConnection: {
      connectionId: 'test',
      baseUrl: 'https://api.example.com',
      accessToken: 'test-token',
      refreshToken: 'refresh',
      expiresAt: Date.now() + 3600000,
      remember: false,
    },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), notify: vi.fn() };
vi.mock('../hooks/useNotify', () => ({
  useNotify: () => mockNotify,
}));

vi.mock('../contexts/LoadingContext', () => ({
  useLoading: () => ({ isLoading: false, startLoading: vi.fn(), stopLoading: vi.fn() }),
}));

const mockListUsers = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock('../services/userService', () => ({
  listUsers: (...args: unknown[]) => mockListUsers(...args),
  deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>,
  );
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListUsers.mockResolvedValue([]);
  });

  it('should show heading', async () => {
    renderPage();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('should fetch and display users', async () => {
    mockListUsers.mockResolvedValue([
      { id: '1', username: 'alice', email: 'alice@test.com', role: 'admin', created_at: '2024-01-01' },
      { id: '2', username: 'bob', email: 'bob@test.com', role: 'user', created_at: '2024-01-02' },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
      expect(screen.getByText('bob')).toBeInTheDocument();
    });
  });

  it('should show error notification on fetch failure', async () => {
    mockListUsers.mockRejectedValue(new Error('fail'));
    renderPage();

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Failed to load users');
    });
  });

  it('should navigate to user detail on row click', async () => {
    mockListUsers.mockResolvedValue([
      { id: '1', username: 'alice', email: 'alice@test.com', role: 'admin' },
    ]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('datatable-row-0'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/users/1');
  });

  it('should navigate to new user on create button click', async () => {
    renderPage();
    await userEvent.click(screen.getByTestId('create-user-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/users/new');
  });

  it('should delete a user after confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockListUsers.mockResolvedValue([
      { id: '2', username: 'bob', email: 'bob@test.com', role: 'user' },
    ]);
    mockDeleteUser.mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('bob')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('delete-bob'));

    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith(
        'https://api.example.com',
        'test-token',
        '2',
      );
      expect(mockNotify.success).toHaveBeenCalledWith('User "bob" deleted');
    });
  });

  it('should prevent deleting the current user', async () => {
    mockListUsers.mockResolvedValue([
      { id: '1', username: 'admin', email: 'admin@test.com', role: 'admin' },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    });

    // Button is disabled, so click should not trigger delete
    expect(screen.getByTestId('delete-admin')).toBeDisabled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('should show delete button disabled for current user', async () => {
    mockListUsers.mockResolvedValue([
      { id: '1', username: 'admin', email: 'admin@test.com', role: 'admin' },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('delete-admin')).toBeDisabled();
    });
  });
});
