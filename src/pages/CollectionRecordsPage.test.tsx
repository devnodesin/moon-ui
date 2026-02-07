import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CollectionRecordsPage } from './CollectionRecordsPage';

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

const mockGetSchema = vi.fn();
const mockListRecords = vi.fn();
const mockCreateRecord = vi.fn();

vi.mock('../services/collectionService', () => ({
  getSchema: (...args: unknown[]) => mockGetSchema(...args),
  listRecords: (...args: unknown[]) => mockListRecords(...args),
  createRecord: (...args: unknown[]) => mockCreateRecord(...args),
}));

function renderPage(collectionName = 'posts') {
  return render(
    <MemoryRouter initialEntries={[`/admin/collections/${collectionName}`]}>
      <Routes>
        <Route path="/admin/collections/:collectionName" element={<CollectionRecordsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CollectionRecordsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSchema.mockResolvedValue([
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
    ]);
    mockListRecords.mockResolvedValue({
      data: [{ id: '1', title: 'Hello World' }],
      has_more: false,
    });
  });

  it('should show collection name', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('posts')).toBeInTheDocument();
    });
  });

  it('should fetch and display records', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    expect(mockGetSchema).toHaveBeenCalledWith(
      'https://api.example.com',
      'test-token',
      'posts',
    );
    expect(mockListRecords).toHaveBeenCalledWith(
      'https://api.example.com',
      'test-token',
      'posts',
      expect.objectContaining({ limit: 20 }),
    );
  });

  it('should show error notification on fetch failure', async () => {
    mockGetSchema.mockRejectedValue(new Error('fail'));
    renderPage();

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Failed to load records');
    });
  });

  it('should navigate to record detail on row click', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('datatable-row-0'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/collections/posts/1');
  });

  it('should show action buttons', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('create-record-btn')).toBeInTheDocument();
      expect(screen.getByTestId('export-json-btn')).toBeInTheDocument();
      expect(screen.getByTestId('export-csv-btn')).toBeInTheDocument();
      expect(screen.getByTestId('import-btn')).toBeInTheDocument();
    });
  });

  it('should navigate to new record page', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('create-record-btn')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('create-record-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/collections/posts/new');
  });

  it('should have search input', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('datatable-search')).toBeInTheDocument();
    });
  });

  it('should show back link to collections', async () => {
    renderPage();
    expect(screen.getByText('← Collections')).toBeInTheDocument();
  });
});
