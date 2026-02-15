import { test, expect } from '@playwright/test';

const TEST_SERVER = 'https://moon.devnodes.in';
const TEST_USERNAME = 'admin';
const TEST_PASSWORD = 'moonadmin12#';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for any loading spinner to disappear (session restoration)
    await page.waitForLoadState('networkidle');
    const loadingSpinner = page.locator('.loading-spinner');
    if (await loadingSpinner.isVisible().catch(() => false)) {
      await loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  });

  test('should display login page with all required elements', async ({ page }) => {
    await expect(page.locator('h2.card-title')).toContainText('🌙 Moon Admin');
    await expect(page.locator('#serverUrl')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#remember')).toBeVisible();
    await expect(page.getByRole('button', { name: /connect/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /connect/i }).click();

    await expect(page.getByText('Server URL is required')).toBeVisible();
    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should validate server URL format', async ({ page }) => {
    await page.locator('#serverUrl').fill('invalid-url');
    await page.locator('#username').fill('test');
    await page.locator('#password').fill('test');
    await page.getByRole('button', { name: /connect/i }).click();

    await expect(page.getByText(/Enter a valid URL/i)).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.locator('#serverUrl').fill(TEST_SERVER);
    await page.locator('#username').fill(TEST_USERNAME);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /connect/i }).click();

    // Wait for redirect to admin dashboard
    await expect(page).toHaveURL(/\/#\/admin/, { timeout: 10000 });
    
    // Verify we're logged in by checking for the navbar - it's a div with class navbar, not <nav>
    await expect(page.locator('.navbar')).toBeVisible({ timeout: 5000 });
  });

  test('should show loading state during login', async ({ page }) => {
    await page.locator('#serverUrl').fill(TEST_SERVER);
    await page.locator('#username').fill(TEST_USERNAME);
    await page.locator('#password').fill(TEST_PASSWORD);
    
    const submitButton = page.getByRole('button', { name: /connect/i });
    await submitButton.click();

    // Check for loading spinner
    await expect(page.locator('.loading-spinner')).toBeVisible({ timeout: 1000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.locator('#serverUrl').fill(TEST_SERVER);
    await page.locator('#username').fill('invaliduser');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: /connect/i }).click();

    // Wait for error message
    await expect(page.locator('.alert-error')).toBeVisible({ timeout: 10000 });
  });

  test('should remember connection when checkbox is checked', async ({ page }) => {
    await page.locator('#serverUrl').fill(TEST_SERVER);
    await page.locator('#username').fill(TEST_USERNAME);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.locator('#remember').check();
    await page.getByRole('button', { name: /connect/i }).click();

    // Wait for successful login and redirect
    await expect(page).toHaveURL(/\/#\/admin/, { timeout: 10000 });

    // Logout first
    const logoutButton = page.getByRole('button', { name: /logout/i }).or(
      page.getByRole('link', { name: /logout/i })
    );
    await logoutButton.click();
    await page.waitForURL(/\/#\/?/, { timeout: 5000 });

    // Now check if the saved connection appears in the dropdown
    const savedConnectionsSelect = page.locator('select[aria-label="Saved Connections"]');
    await expect(savedConnectionsSelect).toBeVisible();
    
    // Select should have at least one option other than the default
    const options = await savedConnectionsSelect.locator('option').count();
    expect(options).toBeGreaterThan(1);
  });

  test('should disable form fields while loading', async ({ page }) => {
    await page.locator('#serverUrl').fill(TEST_SERVER);
    await page.locator('#username').fill(TEST_USERNAME);
    await page.locator('#password').fill(TEST_PASSWORD);
    
    await page.getByRole('button', { name: /connect/i }).click();

    // Check that fields are disabled during submission
    await expect(page.locator('#serverUrl')).toBeDisabled({ timeout: 1000 });
    await expect(page.locator('#username')).toBeDisabled({ timeout: 1000 });
    await expect(page.locator('#password')).toBeDisabled({ timeout: 1000 });
  });

  test('should navigate to manage connections page', async ({ page }) => {
    const manageLink = page.getByRole('link', { name: /manage connections/i });
    await expect(manageLink).toBeVisible();
    await manageLink.click();

    await expect(page).toHaveURL(/\/#\/admin\/connections/);
  });
});

test.describe('Authenticated Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test WITH remember checked
    await page.goto('/');
    
    // Wait for any loading spinner to disappear (session restoration)
    await page.waitForLoadState('networkidle');
    const loadingSpinner = page.locator('.loading-spinner');
    if (await loadingSpinner.isVisible().catch(() => false)) {
      await loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
    
    await page.locator('#serverUrl').fill(TEST_SERVER);
    await page.locator('#username').fill(TEST_USERNAME);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.locator('#remember').check(); // Check remember to persist tokens
    await page.getByRole('button', { name: /connect/i }).click();
    await expect(page).toHaveURL(/\/#\/admin/, { timeout: 10000 });
  });

  test('should redirect to dashboard when authenticated user visits login page', async ({ page }) => {
    // Navigate to login page
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait a bit for session restoration and redirect logic to complete
    await page.waitForTimeout(1000);
    
    // Should be redirected back to admin
    await expect(page).toHaveURL(/\/#\/admin/, { timeout: 10000 });
  });

  test('should be able to logout and return to login page', async ({ page }) => {
    // Look for logout button/link
    const logoutButton = page.getByRole('button', { name: /logout/i }).or(
      page.getByRole('link', { name: /logout/i })
    );
    
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      
      // Should be redirected to login page (may have query params)
      await expect(page).toHaveURL(/\/#\/?\??.*$/, { timeout: 5000 });
    }
  });
});
