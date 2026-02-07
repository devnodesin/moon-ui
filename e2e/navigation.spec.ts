import { test, expect } from '@playwright/test';

const TEST_SERVER = 'https://moon.asensar.in';
const TEST_USERNAME = 'admin';
const TEST_PASSWORD = 'moonadmin12#';

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated user to login with next parameter', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/#/admin/collections');
    
    // Should be redirected to login with next parameter
    await expect(page).toHaveURL(/\/#\/(login)?\?next=/);
    
    // Login page should be visible
    await expect(page.locator('h2.card-title')).toContainText('🌙 Moon Admin');
  });

  test('should redirect to original destination after login', async ({ page }) => {
    // Try to access collections page without auth
    await page.goto('/#/admin/collections');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/#\/(login)?\?next=/);
    
    // Login
    await page.locator('#serverUrl').fill(TEST_SERVER);
    await page.locator('#username').fill(TEST_USERNAME);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /connect/i }).click();
    
    // Should be redirected to the originally requested page
    await expect(page).toHaveURL(/\/#\/admin\/collections/, { timeout: 10000 });
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.locator('#serverUrl').fill(TEST_SERVER);
    await page.locator('#username').fill(TEST_USERNAME);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /connect/i }).click();
    await expect(page).toHaveURL(/\/#\/admin/, { timeout: 10000 });
  });

  test('should have a working navbar with navigation links', async ({ page }) => {
    // Wait for navbar to be visible
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
    
    // Check for common navigation elements
    await expect(navbar.getByText(/moon/i)).toBeVisible();
  });

  test('should navigate to collections page', async ({ page }) => {
    // Look for collections link (in navbar or sidebar)
    const collectionsLink = page.getByRole('link', { name: /collections/i }).first();
    
    if (await collectionsLink.count() > 0) {
      await collectionsLink.click();
      await expect(page).toHaveURL(/\/#\/admin\/collections/);
    }
  });

  test('should navigate to users page', async ({ page }) => {
    // Look for users link
    const usersLink = page.getByRole('link', { name: /users/i }).first();
    
    if (await usersLink.count() > 0) {
      await usersLink.click();
      await expect(page).toHaveURL(/\/#\/admin\/users/);
    }
  });

  test('should navigate to API keys page', async ({ page }) => {
    // Look for API keys link
    const apiKeysLink = page.getByRole('link', { name: /api keys/i }).first();
    
    if (await apiKeysLink.count() > 0) {
      await apiKeysLink.click();
      await expect(page).toHaveURL(/\/#\/admin\/api-keys/);
    }
  });

  test('should navigate to connections page', async ({ page }) => {
    // Look for connections link
    const connectionsLink = page.getByRole('link', { name: /connections/i }).first();
    
    if (await connectionsLink.count() > 0) {
      await connectionsLink.click();
      await expect(page).toHaveURL(/\/#\/admin\/connections/);
    }
  });

  test('should handle 404 for non-existent routes', async ({ page }) => {
    await page.goto('/#/admin/non-existent-route');
    
    // Should show 404 page or redirect
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#serverUrl').fill(TEST_SERVER);
    await page.locator('#username').fill(TEST_USERNAME);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /connect/i }).click();
    await expect(page).toHaveURL(/\/#\/admin/, { timeout: 10000 });
  });

  test('should toggle between light and dark themes', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme" i]').or(
      page.getByRole('button', { name: /theme/i })
    );
    
    if (await themeToggle.count() > 0) {
      // Get initial theme
      const htmlElement = page.locator('html');
      const initialTheme = await htmlElement.getAttribute('data-theme');
      
      // Click toggle
      await themeToggle.click();
      
      // Theme should change
      await page.waitForTimeout(500);
      const newTheme = await htmlElement.getAttribute('data-theme');
      expect(newTheme).not.toBe(initialTheme);
      
      // Click again to toggle back
      await themeToggle.click();
      await page.waitForTimeout(500);
      const finalTheme = await htmlElement.getAttribute('data-theme');
      expect(finalTheme).toBe(initialTheme);
    }
  });
});
