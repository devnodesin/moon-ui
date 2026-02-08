import { test, expect } from '@playwright/test';

/**
 * E2E test to verify the Collection List table bug fixes
 * 
 * This test demonstrates:
 * 1. Fields column showing correct count (not 0)
 * 2. Records column showing record count
 * 3. New Record page opening in edit mode
 */

test.describe('Collection List - Bug Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/collections:list', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collections: ['products', 'users', 'orders'],
          count: 3
        })
      });
    });

    await page.route('**/products:schema', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collection: 'products',
          fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'price', type: 'decimal' },
            { name: 'description', type: 'string' }
          ]
        })
      });
    });

    await page.route('**/users:schema', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collection: 'users',
          fields: [
            { name: 'id', type: 'string' },
            { name: 'username', type: 'string' },
            { name: 'email', type: 'string' }
          ]
        })
      });
    });

    await page.route('**/orders:schema', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collection: 'orders',
          fields: [
            { name: 'id', type: 'string' },
            { name: 'user_id', type: 'string' },
            { name: 'total', type: 'decimal' },
            { name: 'status', type: 'string' },
            { name: 'created_at', type: 'datetime' }
          ]
        })
      });
    });

    await page.route('**/products:list*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: '1', name: 'Product 1', price: 10.99 }],
          has_more: true
        })
      });
    });

    await page.route('**/users:list*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: '1', username: 'user1', email: 'user1@example.com' }],
          has_more: false
        })
      });
    });

    await page.route('**/orders:list*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          has_more: false
        })
      });
    });

    // Set up localStorage with mock authentication
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
      const mockConnection = {
        connectionId: 'mock-test',
        baseUrl: 'https://mock.test.com',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Date.now() + 3600000,
        remember: true
      };
      
      localStorage.setItem('moon-connections', JSON.stringify({
        currentConnectionId: 'mock-test',
        connections: {
          'mock-test': mockConnection
        }
      }));
      
      localStorage.setItem('moon-token-mock-test-access', 'mock-access-token');
      localStorage.setItem('moon-token-mock-test-refresh', 'mock-refresh-token');
      localStorage.setItem('moon-token-mock-test-expires', String(Date.now() + 3600000));
    });
  });

  test('should display correct field count in Collections table', async ({ page }) => {
    await page.goto('http://localhost:5173/#/admin/collections');
    
    // Wait for collections to load
    await expect(page.getByText('products')).toBeVisible();
    
    // Verify Fields column header exists
    await expect(page.getByText('Fields')).toBeVisible();
    
    // Verify correct field counts are displayed
    // products has 4 fields, users has 3 fields, orders has 5 fields
    await expect(page.getByText('4')).toBeVisible(); // products
    await expect(page.getByText('3')).toBeVisible(); // users
    await expect(page.getByText('5')).toBeVisible(); // orders
  });

  test('should display Records column with correct counts', async ({ page }) => {
    await page.goto('http://localhost:5173/#/admin/collections');
    
    // Wait for collections to load
    await expect(page.getByText('products')).toBeVisible();
    
    // Verify Records column header exists
    await expect(page.getByText('Records')).toBeVisible();
    
    // Verify record counts
    // products: 1 record, users: 1 record, orders: 0 records
    const recordCounts = page.locator('tbody tr').filter({ hasText: 'products' }).locator('td');
    await expect(recordCounts.nth(2)).toContainText('1'); // Records column for products
  });

  test('should open New Record page in edit mode', async ({ page }) => {
    // Mock schema for products
    await page.route('**/products:schema', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collection: 'products',
          fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'price', type: 'decimal' }
          ]
        })
      });
    });
    
    await page.goto('http://localhost:5173/#/admin/collections/products/new');
    
    // Wait for page to load
    await expect(page.getByText('New Record in products')).toBeVisible();
    
    // Verify the page is in edit mode:
    // 1. Input fields should be enabled (not disabled)
    const nameInput = page.getByTestId('input-name');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEnabled();
    
    // 2. Save and Cancel buttons should be visible
    await expect(page.getByTestId('record-save')).toBeVisible();
    await expect(page.getByTestId('record-cancel')).toBeVisible();
    
    // 3. Edit button should NOT be visible (only shown in view mode)
    await expect(page.getByTestId('record-edit')).not.toBeVisible();
  });

  test('should open existing record in view mode', async ({ page }) => {
    // Mock schema and record fetch
    await page.route('**/products:schema', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collection: 'products',
          fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'price', type: 'decimal' }
          ]
        })
      });
    });
    
    await page.route('**/products:get?id=123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          name: 'Test Product',
          price: 99.99
        })
      });
    });
    
    await page.goto('http://localhost:5173/#/admin/collections/products/123');
    
    // Wait for page to load
    await expect(page.getByText('products / 123')).toBeVisible();
    await expect(page.getByText('Test Product')).toBeVisible();
    
    // Verify the page is in view mode:
    // 1. Edit button should be visible
    await expect(page.getByTestId('record-edit')).toBeVisible();
    
    // 2. Save and Cancel buttons should NOT be visible
    await expect(page.getByTestId('record-save')).not.toBeVisible();
    await expect(page.getByTestId('record-cancel')).not.toBeVisible();
  });
});
