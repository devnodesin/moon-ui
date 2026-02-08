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

describe('Collections Page - API Integration Test', () => {
  let mock: MockAdapter;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = new MockAdapter(axios);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    mock.reset();
    consoleErrorSpy.mockRestore();
  });

  it('should not call any endpoint with "undefined" in the URL', async () => {
    // Mock the collections list endpoint
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: ['products', 'users'],
      count: 2,
    });

    render(
      <MemoryRouter>
        <CollectionListPage />
      </MemoryRouter>
    );

    // Wait for collections to load
    await waitFor(() => {
      expect(screen.getByText('products')).toBeInTheDocument();
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    // Verify no API calls contained "undefined"
    const allRequests = [...mock.history.get, ...mock.history.post];
    const undefinedRequests = allRequests.filter(req => req.url?.includes('undefined'));
    
    expect(undefinedRequests).toHaveLength(0);
  });

  it('should handle missing collection identifier gracefully', async () => {
    // Mock collections list
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: ['products'],
      count: 1,
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

    // Verify the adapter prevents calling endpoints with empty collection names
    // The adapter should throw an error if collection name is empty
    await expect(async () => {
      const { getSchema } = await import('../services/collectionService');
      await getSchema(BASE_URL, 'test-token', '');
    }).rejects.toThrow('Collection identifier is required');
  });

  it('should normalize API responses correctly in end-to-end flow', async () => {
    // Mock collections list with NEW API format (string array)
    mock.onGet(`${BASE_URL}/collections:list`).reply(200, {
      collections: ['products', 'orders'],
      count: 2,
    });

    // Mock schema endpoint with NEW API format (wrapped response)
    mock.onGet(`${BASE_URL}/products:schema`).reply(200, {
      collection: 'products',
      fields: [
        { name: 'id', type: 'string', nullable: false },
        { name: 'name', type: 'string', nullable: false },
        { name: 'price', type: 'decimal', nullable: false },
      ],
    });

    render(
      <MemoryRouter>
        <CollectionListPage />
      </MemoryRouter>
    );

    // Wait for collections to load
    await waitFor(() => {
      expect(screen.getByText('products')).toBeInTheDocument();
      expect(screen.getByText('orders')).toBeInTheDocument();
    });

    // Click Edit Schema for products
    const editButton = screen.getByTestId('edit-schema-products');
    editButton.click();

    // Wait for schema modal to appear
    await waitFor(() => {
      // The modal should display the fields from the normalized response
      expect(screen.getByText('Edit Schema: products')).toBeInTheDocument();
    });

    // Verify the schema request was made correctly
    const schemaRequest = mock.history.get.find(r => r.url?.includes('products:schema'));
    expect(schemaRequest).toBeDefined();
    expect(schemaRequest?.url).toBe(`${BASE_URL}/products:schema`);
    expect(schemaRequest?.url).not.toContain('undefined');
  });
});
