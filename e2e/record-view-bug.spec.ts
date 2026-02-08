import { test, expect } from '@playwright/test';

/**
 * E2E test to verify the Record View bug fix
 * 
 * Bug: Record fields were showing as "—" (empty)
 * Cause: API returns records wrapped in {"data": {...}} but code expected direct record
 * Fix: Added normalizeRecordGetResponse to extract the data property
 */

test.describe('Record View - Bug Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth:me
    await page.route('**/auth:me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-user-id',
          username: 'mock-user',
          email: 'mock@example.com'
        })
      });
    });

    // Mock collections:list
    await page.route('**/collections:list', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collections: ['products'],
          count: 1
        })
      });
    });

    // Mock products:schema
    await page.route('**/products:schema', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collection: 'products',
          fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'brand', type: 'string' }
          ]
        })
      });
    });

    // Mock products:get with WRAPPED response format (the actual API format)
    // This is the key test - the API returns {"data": {...}} not the record directly
    await page.route('**/products:get?id=01KGYMMW8ZFKRDH5ZVHQJ30RR8', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: '01KGYMMW8ZFKRDH5ZVHQJ30RR8',
            name: 'Chain Link Fence',
            brand: 'Bestfence'
          }
        })
      });
    });

    // Set up localStorage with mock authentication
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
      const connectionProfile = {
        id: 'mock.test.com',
        label: 'Mock Test Server',
        baseUrl: 'https://mock.test.com',
        lastActive: Date.now()
      };
      
      localStorage.setItem('moon-connections', JSON.stringify([connectionProfile]));
      localStorage.setItem('moon-token-mock.test.com-access', 'mock-access-token');
      localStorage.setItem('moon-token-mock.test.com-refresh', 'mock-refresh-token');
      localStorage.setItem('moon-token-mock.test.com-expires', String(Date.now() + 3600000));
    });
    
    await page.reload();
    await page.waitForURL(/\/#\/admin/, { timeout: 5000 }).catch(() => {});
  });

  test('should display record data correctly (not empty)', async ({ page }) => {
    // Navigate directly to the record detail page
    await page.goto('http://localhost:5173/#/admin/collections/products/01KGYMMW8ZFKRDH5ZVHQJ30RR8');
    
    // Wait for the page heading
    await expect(page.getByText('products / 01KGYMMW8ZFKRDH5ZVHQJ30RR8')).toBeVisible();
    
    // Verify that the record fields are populated (not showing "—")
    await expect(page.getByTestId('value-id')).toContainText('01KGYMMW8ZFKRDH5ZVHQJ30RR8');
    await expect(page.getByTestId('value-name')).toContainText('Chain Link Fence');
    await expect(page.getByTestId('value-brand')).toContainText('Bestfence');
    
    // Verify that field values do not show the "—" empty value marker
    await expect(page.getByTestId('value-id')).not.toContainText('—');
    await expect(page.getByTestId('value-name')).not.toContainText('—');
    await expect(page.getByTestId('value-brand')).not.toContainText('—');
  });

  test('should show Edit button in view mode', async ({ page }) => {
    await page.goto('http://localhost:5173/#/admin/collections/products/01KGYMMW8ZFKRDH5ZVHQJ30RR8');
    
    await expect(page.getByTestId('record-edit')).toBeVisible();
  });

  test('should show Back button', async ({ page }) => {
    await page.goto('http://localhost:5173/#/admin/collections/products/01KGYMMW8ZFKRDH5ZVHQJ30RR8');
    
    await expect(page.getByTestId('record-back')).toBeVisible();
  });
});
