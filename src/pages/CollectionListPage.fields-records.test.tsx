import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CollectionListPage } from './CollectionListPage';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const BASE_URL = 'https://moon.devnodes.in';

// Mock auth and loading contexts
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { username: 'admin' },
    currentConnection: {
      connectionId: 'test',
      baseUrl: BASE_URL,
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

describe('Collections Page - Fields and Records Count', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  it('should display correct records count from API', async () => {
    // Mock collections list with records count
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: [
        { name: 'products', records: 10 }
      ],
      count: 1
    });

    render(
      <MemoryRouter>
        <CollectionListPage />
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('products')).toBeInTheDocument();
    });

    // Verify records count is displayed
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('should display Records column header', async () => {
    // Mock collections list
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: [
        { name: 'products', records: 5 }
      ],
      count: 1
    });

    render(
      <MemoryRouter>
        <CollectionListPage />
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('products')).toBeInTheDocument();
    });

    // Verify Records column header exists
    expect(screen.getByText('Records')).toBeInTheDocument();

    // Verify record count is displayed
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should display 0 when no records exist', async () => {
    // Mock collections list
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: [
        { name: 'empty_collection', records: 0 }
      ],
      count: 1
    });

    render(
      <MemoryRouter>
        <CollectionListPage />
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('empty_collection')).toBeInTheDocument();
    });

    // Verify record count shows 0
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('should handle multiple collections with different record counts', async () => {
    // Mock collections list
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: [
        { name: 'users', records: 100 },
        { name: 'products', records: 25 },
        { name: 'orders', records: 0 }
      ],
      count: 3
    });

    render(
      <MemoryRouter>
        <CollectionListPage />
      </MemoryRouter>
    );

    // Wait for all collections to load
    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
      expect(screen.getByText('products')).toBeInTheDocument();
      expect(screen.getByText('orders')).toBeInTheDocument();
    });

    // Verify all record counts are displayed
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});
