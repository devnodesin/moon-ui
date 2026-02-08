import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CollectionListPage } from './CollectionListPage';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const BASE_URL = 'https://moon.asensar.in';

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

  it('should display correct field count when schema is available', async () => {
    // Mock collections list
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: ['products'],
      count: 1
    });

    // Mock schema endpoint with 3 fields
    mock.onGet(`${BASE_URL}/products:schema`).reply(200, {
      collection: 'products',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'price', type: 'decimal' }
      ]
    });

    // Mock records list endpoint
    mock.onGet(new RegExp(`${BASE_URL}/products:list`)).reply(200, {
      data: [{ id: '1', name: 'Product 1', price: 10.99 }],
      has_more: false
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

    // Verify field count is displayed (should be 3)
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('should display Records column with count', async () => {
    // Mock collections list
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: ['products'],
      count: 1
    });

    // Mock schema endpoint
    mock.onGet(`${BASE_URL}/products:schema`).reply(200, {
      collection: 'products',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string' }
      ]
    });

    // Mock records list endpoint - return 1 record
    mock.onGet(new RegExp(`${BASE_URL}/products:list`)).reply(200, {
      data: [{ id: '1', name: 'Product 1' }],
      has_more: false
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
      // Should show at least 1 record
      const recordCells = screen.getAllByText('1');
      expect(recordCells.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should display 0 when no records exist', async () => {
    // Mock collections list
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: ['empty_collection'],
      count: 1
    });

    // Mock schema endpoint
    mock.onGet(`${BASE_URL}/empty_collection:schema`).reply(200, {
      collection: 'empty_collection',
      fields: [
        { name: 'id', type: 'string' }
      ]
    });

    // Mock records list endpoint - return empty array
    mock.onGet(new RegExp(`${BASE_URL}/empty_collection:list`)).reply(200, {
      data: [],
      has_more: false
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
      const zeroCells = screen.getAllByText('0');
      expect(zeroCells.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should display — when metadata fetch fails', async () => {
    // Mock collections list
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: ['broken_collection'],
      count: 1
    });

    // Mock schema endpoint to fail
    mock.onGet(`${BASE_URL}/broken_collection:schema`).reply(500);

    // Mock records list endpoint to fail
    mock.onGet(new RegExp(`${BASE_URL}/broken_collection:list`)).reply(500);

    render(
      <MemoryRouter>
        <CollectionListPage />
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('broken_collection')).toBeInTheDocument();
    });

    // Verify field count shows 0 and record count shows —
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });
});
