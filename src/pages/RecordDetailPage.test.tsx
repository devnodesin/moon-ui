import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RecordDetailPage } from './RecordDetailPage';

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
const mockGetRecord = vi.fn();
const mockUpdateRecord = vi.fn();
const mockCreateRecord = vi.fn();

vi.mock('../services/collectionService', () => ({
  getSchema: (...args: unknown[]) => mockGetSchema(...args),
  getRecord: (...args: unknown[]) => mockGetRecord(...args),
  updateRecord: (...args: unknown[]) => mockUpdateRecord(...args),
  createRecord: (...args: unknown[]) => mockCreateRecord(...args),
}));

function renderPage(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/admin/collections/posts/${id}`]}>
      <Routes>
        <Route path="/admin/collections/:collectionName/:id" element={<RecordDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RecordDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSchema.mockResolvedValue([
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'views', type: 'integer' },
    ]);
    mockGetRecord.mockResolvedValue({ id: '1', title: 'Hello', views: 42 });
  });

  it('should show record heading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('posts / 1')).toBeInTheDocument();
    });
  });

  it('should fetch schema and record data', async () => {
    renderPage();

    await waitFor(() => {
      expect(mockGetSchema).toHaveBeenCalledWith(
        'https://api.example.com',
        'test-token',
        'posts',
      );
      expect(mockGetRecord).toHaveBeenCalledWith(
        'https://api.example.com',
        'test-token',
        'posts',
        '1',
      );
    });
  });

  it('should render record fields', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  it('should show backend error message in notification on fetch failure', async () => {
    mockGetSchema.mockRejectedValue({
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
    mockGetSchema.mockRejectedValue({
      code: 'NETWORK_ERROR',
    });
    renderPage();

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Failed to load record');
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

  it('should show new record heading for id=new', async () => {
    mockGetSchema.mockResolvedValue([
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
    ]);

    renderPage('new');

    await waitFor(() => {
      expect(screen.getByText('New Record in posts')).toBeInTheDocument();
    });
  });

  it('should not call getRecord when creating new record', async () => {
    mockGetSchema.mockResolvedValue([
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
    ]);

    renderPage('new');

    await waitFor(() => {
      expect(mockGetSchema).toHaveBeenCalled();
    });

    expect(mockGetRecord).not.toHaveBeenCalled();
  });
});
