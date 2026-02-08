import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RecordDetailPage } from './RecordDetailPage';
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

describe('RecordDetailPage - New Record Edit Mode', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = new MockAdapter(axios);
  });

  it('should open in edit mode when creating a new record', async () => {
    // Mock schema endpoint
    mock.onGet(`${BASE_URL}/products:schema`).reply(200, {
      collection: 'products',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'price', type: 'decimal' }
      ]
    });

    render(
      <MemoryRouter initialEntries={['/admin/collections/products/new']}>
        <Routes>
          <Route path="/admin/collections/:collectionName/:id" element={<RecordDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('New Record in products')).toBeInTheDocument();
    });

    // Verify the page is in edit mode - input fields should be present and enabled
    await waitFor(() => {
      // Look for input fields (edit mode has inputs, view mode has plain text)
      const nameInput = screen.getByTestId('input-name');
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).not.toBeDisabled();
    });

    // Verify Save and Cancel buttons are visible (only shown in edit mode)
    expect(screen.getByTestId('record-save')).toBeInTheDocument();
    expect(screen.getByTestId('record-cancel')).toBeInTheDocument();

    // Verify Edit button is NOT visible (only shown in view mode)
    expect(screen.queryByTestId('record-edit')).not.toBeInTheDocument();
  });

  it('should open in view mode when viewing an existing record', async () => {
    // Mock schema endpoint
    mock.onGet(`${BASE_URL}/products:schema`).reply(200, {
      collection: 'products',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'price', type: 'decimal' }
      ]
    });

    // Mock record fetch
    mock.onGet(`${BASE_URL}/products:get?id=123`).reply(200, {
      id: '123',
      name: 'Test Product',
      price: 99.99
    });

    render(
      <MemoryRouter initialEntries={['/admin/collections/products/123']}>
        <Routes>
          <Route path="/admin/collections/:collectionName/:id" element={<RecordDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('products / 123')).toBeInTheDocument();
    });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Verify the page is in view mode - Edit button should be present
    await waitFor(() => {
      expect(screen.getByTestId('record-edit')).toBeInTheDocument();
    });

    // Verify Save and Cancel buttons are NOT visible (only shown in edit mode)
    expect(screen.queryByTestId('record-save')).not.toBeInTheDocument();
    expect(screen.queryByTestId('record-cancel')).not.toBeInTheDocument();
  });
});
