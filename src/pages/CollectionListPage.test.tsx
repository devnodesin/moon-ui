import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CollectionListPage } from './CollectionListPage';

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
const mockDeleteCollection = vi.fn();
const mockCreateCollection = vi.fn();

vi.mock('../services/collectionService', () => ({
  listCollections: (...args: unknown[]) => mockListCollections(...args),
  deleteCollection: (...args: unknown[]) => mockDeleteCollection(...args),
  createCollection: (...args: unknown[]) => mockCreateCollection(...args),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CollectionListPage />
    </MemoryRouter>,
  );
}

describe('CollectionListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListCollections.mockResolvedValue([]);
  });

  it('should show heading', async () => {
    renderPage();
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });

  it('should fetch and display collections', async () => {
    mockListCollections.mockResolvedValue([
      { name: 'posts', columns: [{ name: 'title', type: 'string' }] },
      { name: 'users', columns: [{ name: 'email', type: 'string' }, { name: 'name', type: 'string' }] },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('posts')).toBeInTheDocument();
      expect(screen.getByText('users')).toBeInTheDocument();
    });
  });

  it('should show backend error message in notification on fetch failure', async () => {
    mockListCollections.mockRejectedValue({
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
    mockListCollections.mockRejectedValue({
      code: 'NETWORK_ERROR',
    });
    renderPage();

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Failed to load collections');
    });
  });

  it('should navigate to collection on row click', async () => {
    mockListCollections.mockResolvedValue([{ name: 'posts', columns: [] }]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('posts')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('datatable-row-0'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/collections/posts');
  });

  it('should show create form when button clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByTestId('create-collection-btn'));
    expect(screen.getByTestId('create-form')).toBeInTheDocument();
  });

  it('should create a collection', async () => {
    mockCreateCollection.mockResolvedValue(undefined);
    mockListCollections.mockResolvedValue([]);

    renderPage();
    await userEvent.click(screen.getByTestId('create-collection-btn'));
    await userEvent.type(screen.getByTestId('create-name-input'), 'newcol');
    
    // Fill in the first field (required)
    await userEvent.type(screen.getByTestId('field-name-0'), 'id');
    
    await userEvent.click(screen.getByTestId('create-submit'));

    await waitFor(() => {
      expect(mockCreateCollection).toHaveBeenCalledWith(
        'https://api.example.com',
        'test-token',
        { 
          name: 'newcol', 
          columns: [{ name: 'id', type: 'string', nullable: false, unique: false }] 
        },
      );
      expect(mockNotify.success).toHaveBeenCalledWith('Collection "newcol" created');
    });
  });

  it('should create a collection with unique field', async () => {
    mockCreateCollection.mockResolvedValue(undefined);
    mockListCollections.mockResolvedValue([]);

    renderPage();
    await userEvent.click(screen.getByTestId('create-collection-btn'));
    await userEvent.type(screen.getByTestId('create-name-input'), 'users');
    
    // Fill in the first field with unique checkbox
    await userEvent.type(screen.getByTestId('field-name-0'), 'email');
    await userEvent.click(screen.getByTestId('field-unique-0'));
    
    await userEvent.click(screen.getByTestId('create-submit'));

    await waitFor(() => {
      expect(mockCreateCollection).toHaveBeenCalledWith(
        'https://api.example.com',
        'test-token',
        { 
          name: 'users', 
          columns: [{ name: 'email', type: 'string', nullable: false, unique: true }] 
        },
      );
    });
  });

  it('should delete a collection after confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockListCollections.mockResolvedValue([{ name: 'posts', columns: [] }]);
    mockDeleteCollection.mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('posts')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('delete-posts'));

    await waitFor(() => {
      expect(mockDeleteCollection).toHaveBeenCalledWith(
        'https://api.example.com',
        'test-token',
        'posts',
      );
      expect(mockNotify.success).toHaveBeenCalledWith('Collection "posts" deleted');
    });
  });
});
