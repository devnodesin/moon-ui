import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ApiKeysPage } from './ApiKeysPage';

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

const mockListApiKeys = vi.fn();
const mockCreateApiKey = vi.fn();
const mockDeleteApiKey = vi.fn();

vi.mock('../services/apiKeyService', () => ({
  listApiKeys: (...args: unknown[]) => mockListApiKeys(...args),
  createApiKey: (...args: unknown[]) => mockCreateApiKey(...args),
  deleteApiKey: (...args: unknown[]) => mockDeleteApiKey(...args),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ApiKeysPage />
    </MemoryRouter>,
  );
}

describe('ApiKeysPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListApiKeys.mockResolvedValue([]);
  });

  it('should show heading', async () => {
    renderPage();
    expect(screen.getByText('API Keys')).toBeInTheDocument();
  });

  it('should fetch and display keys', async () => {
    mockListApiKeys.mockResolvedValue([
      { id: '1', name: 'key1', description: 'My key', role: 'admin', can_write: true, created_at: '2024-01-01' },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('key1')).toBeInTheDocument();
      expect(screen.getByText('My key')).toBeInTheDocument();
    });
  });

  it('should show error notification on fetch failure', async () => {
    mockListApiKeys.mockRejectedValue(new Error('fail'));
    renderPage();

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Failed to load API keys');
    });
  });

  it('should show create form when button clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByTestId('create-key-btn'));
    expect(screen.getByTestId('create-key-form')).toBeInTheDocument();
  });

  it('should create an API key and show the generated key', async () => {
    mockCreateApiKey.mockResolvedValue({
      id: '2',
      name: 'newkey',
      description: 'test',
      role: 'user',
      can_write: false,
      key: 'generated-secret-key',
    });

    renderPage();
    await userEvent.click(screen.getByTestId('create-key-btn'));
    await userEvent.type(screen.getByTestId('key-name-input'), 'newkey');
    await userEvent.type(screen.getByTestId('key-description-input'), 'test');
    await userEvent.click(screen.getByTestId('key-create-submit'));

    await waitFor(() => {
      expect(mockCreateApiKey).toHaveBeenCalledWith(
        'https://api.example.com',
        'test-token',
        { name: 'newkey', description: 'test', role: 'user', can_write: false },
      );
      expect(mockNotify.success).toHaveBeenCalledWith('API key "newkey" created');
    });

    expect(screen.getByTestId('created-key-alert')).toBeInTheDocument();
    expect(screen.getByTestId('created-key-value')).toHaveTextContent('generated-secret-key');
  });

  it('should dismiss the created key alert', async () => {
    mockCreateApiKey.mockResolvedValue({
      id: '2',
      name: 'newkey',
      description: 'test',
      role: 'user',
      can_write: false,
      key: 'generated-secret-key',
    });

    renderPage();
    await userEvent.click(screen.getByTestId('create-key-btn'));
    await userEvent.type(screen.getByTestId('key-name-input'), 'newkey');
    await userEvent.click(screen.getByTestId('key-create-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('created-key-alert')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('dismiss-key-alert'));
    expect(screen.queryByTestId('created-key-alert')).not.toBeInTheDocument();
  });

  it('should delete an API key after confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockListApiKeys.mockResolvedValue([
      { id: '1', name: 'key1', description: 'desc', role: 'admin', can_write: true },
    ]);
    mockDeleteApiKey.mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('key1')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('delete-key1'));

    await waitFor(() => {
      expect(mockDeleteApiKey).toHaveBeenCalledWith(
        'https://api.example.com',
        'test-token',
        '1',
      );
      expect(mockNotify.success).toHaveBeenCalledWith('API key "key1" deleted');
    });
  });

  it('should display can_write as Yes/No', async () => {
    mockListApiKeys.mockResolvedValue([
      { id: '1', name: 'key1', description: 'desc', role: 'admin', can_write: true },
      { id: '2', name: 'key2', description: 'desc2', role: 'user', can_write: false },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('key1')).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    // Row 1 (index 1 due to header) should show Yes, row 2 should show No
    expect(rows[1]).toHaveTextContent('Yes');
    expect(rows[2]).toHaveTextContent('No');
  });
});
