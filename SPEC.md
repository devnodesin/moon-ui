
## Documentation (MUST REFER)
- **UI Layouts and Components**: refer [SPEC_UI.md](./SPEC_UI.md) for UI design.
- For external Moon backends, see https://moon.asensar.in/doc/md or the local `MOON_API.md`.
- Moon github repo: https://github.com/devnodesin/moon

## BACKEND (MOON SERVER)

- Testing server: `https://moon.asensar.in/`
- Credentials: 
    - `username`: `admin`
    - `password`: `moonadmin12#`


## Quick Start
- Project setup (Bun.js):
  ```bash
  bun create vite moon-ui --template react-ts
  bun add -D daisyui@latest
  ```

### Application Flows

#### Authentication Flow

```
Login → API Calls (with token) →
Token Refresh → Logout → Clear Tokens
```

#### Connection Switching Flow

```
Select New Connection → Confirm Switch → Logout from Current →
Clear In-Memory Data → Load New Credentials → Login to New Backend →
Fetch Fresh Data → Update UI
```

## Objective

Design and implement a secure, mobile-first admin webapp that enables seamless management of collections, users, API keys, and connections across multiple Moon backends, with no data caching.

### Backend Integration

- The UI is responsible for connecting to external Moon API‑compliant backends via standard HTTP requests (use `fetch` or an HTTP client like Axios). 
- All `curl` examples in `MOON_API.md` are reference snippets for humans and agents only — the application must perform equivalent REST calls from the browser, not by invoking `curl`.
- Implement a reusable HTTP client layer that handles authentication (access + refresh tokens), automatic token refresh, retries/backoff, error normalization, and consistent notification on failures.
- For local development and testing, the app may target a Moon test server, but all interactions must remain standard browser HTTP calls (CORS-aware).

## Instructions

1. TypeScript is required (strict mode and type-checking enforced).
2. Use DaisyUI themes: `autumn` for light mode, `abyss` for dark mode.

3. Extract backend connection, authentication, and schema-driven UI requirements from the context.
4. Generate a React-based admin app using DaisyUI for all UI components and Tailwind for layout.
5. Ensure all data (collections, users, API keys, schemas) is always fetched fresh from the backend.
6. Support multiple backend connections with stored credentials and tokens.
7. Provide mobile-first, responsive layouts for all views.
8. Use Bun.js for project setup, dev server, and builds.
9. Validate all user input and API responses.
10. Explicitly require robust error handling for network/API failures in the UI. Show user notifications for errors, auto-dismiss them, and provide a separate Notification page to view all previous notifications with a 'clear all notifications' option. Specify if notifications should persist only in-session or across reloads (recommend in-session only for now).
11. All errors, API failures, and important events must be handled using the notification system. Show a smart loading/progress bar for best UX/UI during async operations. Any API failure must trigger a notification to the user.
12. Support data import and export features using CSV and JSON formats.
13. Follow session timeout and auto-logout rules as specified in `MOON_API.md`. Implement these flows in the UI using the app's HTTP client (token validation, refresh, and forced logout); do not rely on command-line `curl` usage — `MOON_API.md`'s examples are references for the REST contract.
14. Notifications are in-session only and stored completely locally (not persisted across reloads).
15. No need for i18n or translation support; all UI and messages will be in English only.
16. Storing sensitive data in in-memory (JS variables) is acceptable during the session.
17. Document setup, configuration, and security model in the repo.
18. **UI Layouts and Components**: refer [SPEC_UI.md](./SPEC_UI.md) for UI design.

### Routes Requirements

- Root route (`/`)
  - Must be a clear public entrypoint: either a public landing page or a 302 redirect to `/login`.
  - Do not implicitly serve the authenticated UI at `/`.

- Login and logout
  - `/login`: explicit login page. Support `next` query param for post-login redirect.
  - `/logout`: terminates session (clear tokens) and redirects to `/login`.

- Authenticated UI prefix
  - All authenticated admin routes MUST be under a single prefix for route guards, middleware, and telemetry.
  - Default prefix: `/app` (configurable to `/admin` if project-wide semantics prefer `admin`).
  - Example root: `/app` → authenticated admin root (enforces auth).

- Core admin routes (under authenticated prefix)
  - `/app/dashboard` — admin dashboard / home.
  - `/app/collections` — collections list.
  - `/app/collections/:collectionId` — collection detail / records list.
  - `/app/collections/:collectionId/records/:recordId` — record view.
  - `/app/collections/:collectionId/records/:recordId/edit` — inline edit route.
  - `/app/settings` — admin settings.

- Routing behavior & UX
  - Deep-linking: every internal page must be directly addressable (support bookmarks).
  - Post-login redirect: if an unauthenticated request targets an authenticated route, redirect to `/login?next=<originalPath>` and after successful auth return to `<originalPath>`.
  - Route guards: middleware must validate JWT on protected routes; invalid/expired tokens redirect to `/login`.

- Security & storage
  - Do not cache sensitive data in plain storage. Sensitive localStorage values should be protected following platform best-practices; explicit AES-GCM encryption requirement removed for this private app.
  - Token handling must follow backend JWT/refresh conventions (short-lived access token + refresh flow).

- Developer ergonomics
  - Prefer descriptive path names (`/admin` vs `/app`) consistently across docs and code. If switching to `/admin`, update all references in `SPEC.md`.
  - Keep the authenticated prefix stable to simplify guard and telemetry implementation.

- Acceptance criteria (tests)
  - Unit tests for route-guard logic (redirects, token expiry).
  - Integration/E2E tests validating:
    - `/` redirects or serves landing as specified.
    - `/login?next=...` redirects correctly after login.
    - Protected routes return 302 to `/login` when unauthenticated and render when authenticated.
    - Deep links land on expected pages and route params parse correctly.


## Constraints

### MUST

- **Test Driven Development:** All features and implementations must follow TDD—first write a failing test, then implement to pass. Aim for 90%+ test coverage and 100% test pass rate. Fix any failing test, even if unrelated to your implementation.
- Use React + DaisyUI (Tailwind) for all UI.
- Use Bun.js for all scripts and builds.
- Always fetch fresh data from backend (no caching).
- Support multiple backend connections, each isolated.
- Validate all user input and API responses.
- Provide mobile-first UI.
- Document all security and setup steps.
- Support only the latest major browsers.

### MUST NOT

- Must not cache backend data between sessions or connections.
- Must not use any UI/component library other than DaisyUI/Tailwind.
- Must not use any backend except Moon API-compliant servers.
- Must require HTTPS in production.
- DO NOT need accessiblity or SEO features

## Output Format

- All code and documentation must be in markdown or code files as appropriate.
- UI code must use React function components, DaisyUI classes, and Tailwind for layout.
- Setup and security documentation must be in INSTALL.md and README.md.

## Success Criteria

- ✅ No backend data is cached between sessions or connections.
- ✅ All UI is mobile-first, responsive.
- ✅ Switching connections never leaks or reuses data.
- ✅ All code and docs follow the specified stack and security model.

## Edge Cases

- Switching connections with unsaved changes: Prompt user to confirm, warn about data loss.
- Token expiration or refresh failure: Force logout and require re-authentication.
- Corrupted or missing stored data: Prompt user to re-enter credentials and reset localStorage.

## Examples

### Example 1: Simple Login & Connection

Input: User enters server URL, username, password, checks "Remember Connection", clicks Connect.
Output: Credentials are validated, JWT tokens are received, all sensitive data is stored in localStorage, user is logged in and redirected to Admin view.
Explanation: Connection is isolated.

### Example 2: Connection Switch & Data Isolation

Input: User switches from "Production" to "Staging" backend.
Output: All in-memory data is cleared, tokens for new backend are loaded, user is authenticated, fresh data is fetched from new backend, UI updates to reflect new connection.
Explanation: No data is shared or cached between backends.
