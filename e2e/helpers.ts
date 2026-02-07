import { Page } from '@playwright/test';

export const TEST_SERVER = 'https://moon.asensar.in';
export const TEST_USERNAME = 'admin';
export const TEST_PASSWORD = 'moonadmin12#';

/**
 * Helper function to login and return to a specific page
 */
export async function login(
  page: Page,
  serverUrl: string = TEST_SERVER,
  username: string = TEST_USERNAME,
  password: string = TEST_PASSWORD
): Promise<void> {
  await page.goto('/');
  await page.locator('#serverUrl').fill(serverUrl);
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /connect/i }).click();
  await page.waitForURL(/\/#\/admin/, { timeout: 10000 });
}

/**
 * Helper function to logout
 */
export async function logout(page: Page): Promise<void> {
  const logoutButton = page.getByRole('button', { name: /logout/i }).or(
    page.getByRole('link', { name: /logout/i })
  );
  
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
    await page.waitForURL(/\/#\/?$/);
  }
}

/**
 * Clear all localStorage data
 */
export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 5000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}
