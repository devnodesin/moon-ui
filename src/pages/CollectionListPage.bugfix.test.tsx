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

describe('Collections Page - Bug Fix Verification', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  it('should display collection names correctly when API returns collection objects', async () => {
    // Mock the new API response structure (collection objects with records count)
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: [
        { name: 'products', records: 10 },
        { name: 'users', records: 5 },
        { name: 'orders', records: 0 }
      ],
      count: 3
    });

    render(
      <MemoryRouter>
        <CollectionListPage />
      </MemoryRouter>
    );

    // Wait for collections to load
    await waitFor(() => {
      expect(screen.getByText('products')).toBeInTheDocument();
    });

    // Verify all collection names are displayed
    expect(screen.getByText('products')).toBeInTheDocument();
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('orders')).toBeInTheDocument();
  });

  it('should create action buttons with correct collection names (not undefined)', async () => {
    // Mock the new API response structure
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: [
        { name: 'products', records: 0 }
      ],
      count: 1
    });

    render(
      <MemoryRouter>
        <CollectionListPage />
      </MemoryRouter>
    );

    // Wait for collections to load
    await waitFor(() => {
      expect(screen.getByText('products')).toBeInTheDocument();
    });

    // Verify Edit Schema button has correct data-testid (NOT "edit-schema-undefined")
    const editButton = screen.getByTestId('edit-schema-products');
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveTextContent('Edit Schema');

    // Verify Delete button has correct data-testid (NOT "delete-undefined")
    const deleteButton = screen.getByTestId('delete-products');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveTextContent('Delete');
  });

  it('should make API calls with correct collection names (not undefined)', async () => {
    // Mock the new API response structure
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: [
        { name: 'products', records: 0 }
      ],
      count: 1
    });

    // Mock getSchema endpoint with REAL API structure (wrapped with collection and fields)
    mock.onGet(`${BASE_URL}/products:schema`).reply(200, {
      collection: 'products',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string' }
      ]
    });

    render(
      <MemoryRouter>
        <CollectionListPage />
      </MemoryRouter>
    );

    // Wait for collections to load
    await waitFor(() => {
      expect(screen.getByText('products')).toBeInTheDocument();
    });

    // Click Edit Schema button
    const editButton = screen.getByTestId('edit-schema-products');
    editButton.click();

    // Verify the API was called with correct collection name (NOT "undefined")
    await waitFor(() => {
      const requests = mock.history.get;
      const schemaRequest = requests.find(r => r.url?.includes(':schema'));
      expect(schemaRequest).toBeDefined();
      expect(schemaRequest?.url).toBe(`${BASE_URL}/products:schema`);
      // Ensure it's NOT calling "undefined:schema"
      expect(schemaRequest?.url).not.toContain('undefined');
    });
  });

  it('should display records count correctly', async () => {
    // Mock the new API response structure
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: [
        { name: 'products', records: 10 },
        { name: 'users', records: 5 }
      ],
      count: 2
    });

    render(
      <MemoryRouter>
        <CollectionListPage />
      </MemoryRouter>
    );

    // Wait for collections to load
    await waitFor(() => {
      expect(screen.getByText('products')).toBeInTheDocument();
    });

    // Verify records count is displayed
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
