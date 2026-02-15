import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';

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

const mockListCollections = vi.fn();
const mockListUsers = vi.fn();
const mockListApiKeys = vi.fn();

vi.mock('../services/collectionService', () => ({
  listCollections: (...args: unknown[]) => mockListCollections(...args),
}));

vi.mock('../services/userService', () => ({
  listUsers: (...args: unknown[]) => mockListUsers(...args),
}));

vi.mock('../services/apiKeyService', () => ({
  listApiKeys: (...args: unknown[]) => mockListApiKeys(...args),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListCollections.mockResolvedValue([]);
    mockListUsers.mockResolvedValue({ users: [], has_more: false, total: 0 });
    mockListApiKeys.mockResolvedValue({ apikeys: [], has_more: false, total: 0 });
  });

  it('should show dashboard heading', async () => {
    renderPage();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should fetch and display counts', async () => {
    mockListCollections.mockResolvedValue([
      { name: 'products', records: 124 },
      { name: 'users', records: 45 },
    ]);
    mockListUsers.mockResolvedValue({ 
      users: [{ id: '1', username: 'test', email: 'test@example.com', role: 'admin' }],
      has_more: false,
      total: 12
    });
    mockListApiKeys.mockResolvedValue({ 
      apikeys: [{ id: '1', name: 'key1', description: '', role: 'admin', can_write: true }],
      has_more: false,
      total: 8
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Collections count
      expect(screen.getByText('12')).toBeInTheDocument(); // Users count
      expect(screen.getByText('8')).toBeInTheDocument(); // API Keys count
    });
  });

  it('should display collections table', async () => {
    mockListCollections.mockResolvedValue([
      { name: 'products', records: 124 },
      { name: 'orders', records: 892 },
    ]);
    mockListUsers.mockResolvedValue({ users: [], has_more: false, total: 0 });
    mockListApiKeys.mockResolvedValue({ apikeys: [], has_more: false, total: 0 });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('products')).toBeInTheDocument();
      expect(screen.getByText('124')).toBeInTheDocument();
      expect(screen.getByText('orders')).toBeInTheDocument();
      expect(screen.getByText('892')).toBeInTheDocument();
    });
  });

  it('should render stat cards', async () => {
    mockListCollections.mockResolvedValue([]);
    mockListUsers.mockResolvedValue({ users: [], has_more: false, total: 5 });
    mockListApiKeys.mockResolvedValue({ apikeys: [], has_more: false, total: 3 });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('stat-card-collections')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-users')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-api-keys')).toBeInTheDocument();
    });
  });

  it('should navigate to collection records when collection row clicked', async () => {
    mockListCollections.mockResolvedValue([
      { name: 'products', records: 124 },
    ]);
    mockListUsers.mockResolvedValue({ users: [], has_more: false, total: 0 });
    mockListApiKeys.mockResolvedValue({ apikeys: [], has_more: false, total: 0 });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('products')).toBeInTheDocument();
    });

    const row = screen.getByText('products').closest('tr');
    expect(row).toBeInTheDocument();
    
    if (row) {
      await userEvent.click(row);
      expect(mockNavigate).toHaveBeenCalledWith('/admin/collections/products');
    }
  });

  it('should show error notification on fetch failure', async () => {
    mockListCollections.mockRejectedValue({
      code: '500',
      message: 'Server error',
      error: 'Failed to fetch collections',
    });
    mockListUsers.mockResolvedValue({ users: [], has_more: false, total: 0 });
    mockListApiKeys.mockResolvedValue({ apikeys: [], has_more: false, total: 0 });

    renderPage();

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch collections'));
    });
  });

  it('should show empty state when no collections exist', async () => {
    mockListCollections.mockResolvedValue([]);
    mockListUsers.mockResolvedValue({ users: [], has_more: false, total: 0 });
    mockListApiKeys.mockResolvedValue({ apikeys: [], has_more: false, total: 0 });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/No collections found/)).toBeInTheDocument();
      expect(screen.getByText(/Create your first collection/)).toBeInTheDocument();
    });
  });
});
