import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserDetailPage } from './UserDetailPage';

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

const mockGetUser = vi.fn();
const mockCreateUser = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('../services/userService', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  updateUser: (...args: unknown[]) => mockUpdateUser(...args),
}));

function renderPage(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/admin/users/${id}`]}>
      <Routes>
        <Route path="/admin/users/:id" element={<UserDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('UserDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      id: '1',
      username: 'alice',
      email: 'alice@test.com',
      role: 'admin',
      created_at: '2024-01-01',
    });
  });

  it('should show user heading for existing user', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('User: alice')).toBeInTheDocument();
    });
  });

  it('should fetch user data', async () => {
    renderPage();

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledWith(
        'https://api.example.com',
        'test-token',
        '1',
      );
    });
  });

  it('should render user fields', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('alice@test.com')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
  });

  it('should show backend error message in notification on fetch failure', async () => {
    mockGetUser.mockRejectedValue({
      code: 'BACKEND_ERROR',
      message: 'Request failed',
      error: 'specific backend error message',
    });
    renderPage();

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith(expect.stringContaining('specific backend error message'));
    });
  });

  it('should show fallback error message when backend error field missing', async () => {
    mockGetUser.mockRejectedValue({
      code: 'NETWORK_ERROR',
    });
    renderPage();

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Failed to load user');
    });
  });

  it('should show back button', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('record-back')).toBeInTheDocument();
    });
  });

  it('should show edit button', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('record-edit')).toBeInTheDocument();
    });
  });

  it('should show new user heading for id=new', async () => {
    renderPage('new');

    await waitFor(() => {
      expect(screen.getByText('New User')).toBeInTheDocument();
    });
  });

  it('should not call getUser when creating new user', async () => {
    renderPage('new');

    await waitFor(() => {
      expect(screen.getByText('New User')).toBeInTheDocument();
    });

    expect(mockGetUser).not.toHaveBeenCalled();
  });
});
