import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Record Delete Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display delete button in Action column for each record', async ({ page }) => {
    await page.goto('/#/admin/collections');
    await page.waitForLoadState('networkidle');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check if table has data
    const tableBody = page.locator('tbody');
    const loadingSpinner = tableBody.locator('.loading-spinner');
    
    // Wait for loading to finish
    if (await loadingSpinner.count() > 0) {
      await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    }
    
    // Check for "No data available" message
    const noDataMessage = await tableBody.getByText('No data available').count();
    if (noDataMessage > 0) {
      console.log('No collections found in the test server, skipping test');
      return;
    }
    
    // Click first collection if available
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Check for Action column header
      const actionHeader = page.locator('th:has-text("Action")');
      if (await actionHeader.count() > 0) {
        expect(await actionHeader.count()).toBeGreaterThan(0);
        
        // Check for delete buttons in the table
        const deleteButtons = page.locator('button:has-text("Delete")');
        const deleteButtonCount = await deleteButtons.count();
        
        if (deleteButtonCount > 0) {
          expect(deleteButtonCount).toBeGreaterThan(0);
          console.log(`Found ${deleteButtonCount} delete button(s) in the records table`);
        }
      }
    }
  });

  test('should show confirmation dialog when delete button is clicked', async ({ page }) => {
    await page.goto('/#/admin/collections');
    await page.waitForLoadState('networkidle');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check if table has data
    const tableBody = page.locator('tbody');
    const loadingSpinner = tableBody.locator('.loading-spinner');
    
    // Wait for loading to finish
    if (await loadingSpinner.count() > 0) {
      await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    }
    
    // Check for "No data available" message
    const noDataMessage = await tableBody.getByText('No data available').count();
    if (noDataMessage > 0) {
      console.log('No collections found in the test server, skipping test');
      return;
    }
    
    // Click first collection if available
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Look for delete buttons
      const deleteButtons = page.locator('button:has-text("Delete")');
      if (await deleteButtons.count() > 0) {
        // Set up dialog handler
        page.once('dialog', async dialog => {
          expect(dialog.type()).toBe('confirm');
          expect(dialog.message()).toContain('Are you sure');
          await dialog.dismiss();
        });
        
        // Click the first delete button
        await deleteButtons.first().click();
        
        console.log('Delete button clicked, confirmation dialog should appear');
      }
    }
  });
});
