# End-to-End (E2E) Tests with Playwright

This directory contains E2E tests for Moon UI using Playwright.

## Setup

Playwright is already installed. If you need to reinstall browsers:

```bash
npx playwright install
```

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Structure

- `login.spec.ts` - Login functionality and authentication flow
- `navigation.spec.ts` - Protected routes, navigation, and theme toggle
- `collections.spec.ts` - Collections and records management
- `helpers.ts` - Shared test utilities and helper functions

## Configuration

Tests are configured in `playwright.config.ts` at the project root.

- **Base URL**: http://localhost:5173 (dev server)
- **Browser**: Chromium (Desktop Chrome)
- **Auto-start**: Dev server starts automatically before tests
- **Retries**: 2 retries in CI, 0 in local development

## Test Credentials

Tests use the Moon test server by default:

- **Server**: https://moon.devnodes.in/
- **Username**: admin
- **Password**: moonadmin12#

To test against a different server, update the constants in test files or use environment variables.

## Writing Tests

### Best Practices

1. **Use semantic selectors**: Prefer `getByRole()`, `getByLabel()`, `getByText()` over CSS selectors
2. **Wait for elements**: Use `expect().toBeVisible()` instead of hard waits
3. **Reuse helpers**: Import login/logout helpers from `helpers.ts`
4. **Test isolation**: Each test should be independent and clean up after itself
5. **Meaningful assertions**: Test actual functionality, not implementation details

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('should do something', async ({ page }) => {
  await login(page);
  await page.goto('/#/admin/collections');
  
  await expect(page.getByRole('heading', { name: /collections/i })).toBeVisible();
});
```

## Debugging

1. **UI Mode** (`npm run test:e2e:ui`): Interactive test runner with time-travel debugging
2. **Debug Mode** (`npm run test:e2e:debug`): Run tests with Playwright Inspector
3. **Screenshots**: Automatically captured on test failure
4. **Traces**: Recorded on first retry for detailed debugging

## CI Integration

Tests run automatically in CI with:
- 2 retries on failure
- Single worker for stability
- HTML report generation

## Coverage

E2E tests cover:
- ✅ Authentication and login flow
- ✅ Protected route guards and redirects
- ✅ Navigation between pages
- ✅ Theme switching
- ✅ Collections listing and filtering
- ✅ Record viewing and pagination
- ✅ Form validation
- ✅ Error handling and notifications

## Troubleshooting

**Tests fail with "Cannot connect to server. This might be a CORS issue"**:
- The Moon API server must be configured to allow CORS requests from `http://localhost:5173`
- Server needs these CORS headers:
  ```
  Access-Control-Allow-Origin: http://localhost:5173
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Allow-Credentials: true
  ```
- For development/testing, you can use: `Access-Control-Allow-Origin: *`
- This is a server-side configuration, not an application issue
- The app correctly detects and displays CORS errors

**Tests fail with "Timeout"**: 
- Ensure dev server is running (`npm run dev`)
- Check network connectivity to test server
- Increase timeout in test if needed

**Browser not found**:
```bash
npx playwright install chromium
```

**Port already in use**:
- Stop existing dev servers on port 5173
- Or change `webServer.url` in `playwright.config.ts`
