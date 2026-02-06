
## Documentation (MUST REFER)

- **UI Layouts and Components**: refer [SPEC_UI.md](./SPEC_UI.md) for UI design.
- For external Moon backends, see <https://moon.asensar.in/doc/md> or the local `llms/moon-llms-full.txt`.
- Moon github repo: <https://github.com/devnodesin/moon>

## BACKEND (MOON SERVER)

- Testing server: `https://moon.asensar.in/`
- Credentials: (username: `admin`, password: `moonadmin12#`)

## Quick Start

- Project setup (Bun.js):

```bash
bun create vite moon-ui --template react-ts
bun add -D daisyui@latest
```

## Objective

Design and implement a secure, mobile-first admin webapp that enables seamless management of collections, users, API keys, and connections across multiple Moon backends, with no data caching.

## Backend Integration

- The UI is responsible for connecting to external Moon API‑compliant backends via standard HTTP requests (use `fetch` or an HTTP client like Axios).
- All `curl` examples in `llms/moon-llms-full.txt` are reference snippets for humans and agents only — the application must perform equivalent REST calls from the browser, not by invoking `curl`.
- Implement a reusable HTTP client layer that handles authentication (access + refresh tokens), automatic token refresh, retries/backoff, error normalization, and consistent notification on failures.
- For local development and testing, the app may target a Moon test server, but all interactions must remain standard browser HTTP calls (CORS-aware).

## Application Flows

**Authentication Flow**

```
Login → API Calls (with token) → Token Refresh → Logout → Clear Tokens
```

**Connection Switching Flow**

```
Select New Connection → Confirm Switch → (If unsaved changes: prompt) →
Clear In-Memory UI State → Load Stored Session for Target Connection →
Validate/Refresh Token if needed → If no valid session: prompt Login for Target →
Fetch Fresh Data → Update UI
```

**Notes for Quick Switch (no mandatory re-login):**

- Per-connection sessions: store `accessToken`, `refreshToken`, `expiresAt`, and `baseUrl` keyed by `connectionId`.
- `Remember Connection` toggle: when enabled, persist the per-connection session in `localStorage`; otherwise keep in-memory only.
- On switch, the app must load the target connection's session (if present), validate the access token, and attempt a refresh before prompting for credentials.
- Always clear in-memory application data (collections, records, forms) when switching to avoid cross-connection data leaks.
- If token refresh fails, require explicit login for that connection and surface a notification explaining the reason.
- Follow session timeout and forced-logout rules from `llms/moon-llms-full.txt` when validating/refreshing tokens.

**Security & UX constraints:**

- Do not reuse tokens between different backends; tokens are strictly scoped to their issuing `baseUrl`.
- Persisted session tokens are allowed only with explicit `Remember Connection` opt-in; otherwise tokens must remain in-memory only. Document the risk and behavior in `INSTALL.md`.
- Prompt the user if there are unsaved changes before switching.
- The notification system must handle refresh failures and expired-session events (see `### MUST` — notification system for canonical rules).

## Routes Requirements

- Minimal hash-routing requirements
 	- Use `HashRouter` for client-side routing (recommended for this SPA).
 	- Authenticated prefix is configurable; default is `/admin` (alternative `/app` supported).
 	- Root `/` is the public login entrypoint. Unauthenticated users visiting any internal route MUST be redirected to `/` and the original target preserved as a `next` parameter inside the hash. Example: `https://example.com/#/admin/collections` → redirect to `https://example.com/#/login?next=%2Fadmin%2Fcollections`.
 	- Authenticated users visiting `/` MUST be redirected to `/#/admin/` (or `/#/app/` when configured).
 	- Servers only need to serve the SPA base path (e.g., `/` or `/admin/`); all route guards, token validation, and redirects are enforced client-side.

## MUST

- **Test Driven Development:** All features and implementations must follow TDD—first write a failing test, then implement to pass. Aim for 90%+ test coverage and 100% test pass rate. Fix any failing test, even if unrelated to your implementation.
- Use React + DaisyUI (Tailwind) for all UI.
- Use Bun.js for all scripts and builds.
- Always fetch fresh data from backend (no caching).
- Support multiple backend connections, each isolated.
- Validate all user input and API responses.
- Provide mobile-first UI.
- Document all security and setup steps.
- Support only the latest major browsers.
- TypeScript is required (strict mode and type-checking enforced).
- Use DaisyUI themes: `autumn` for light mode, `abyss` for dark mode.
- Require a robust notification system: all errors, API failures, and important events must create user notifications (auto-dismiss) and there must be a Notifications page with a 'clear all' option.
- Show a smart loading/progress indicator for async operations (global or route-level) to improve UX.
- Support data import and export in CSV and JSON formats for collections and records.
- Follow session timeout and auto-logout rules as specified in `llms/moon-llms-full.txt` (enforce via the app HTTP client).
- Notifications are in-session only and must not persist across full page reloads.
- Storing sensitive session data in-memory (JS variables) during an active session is acceptable; persisted tokens require explicit `Remember Connection` opt-in.

- Prefer reuse: always check for existing, well-maintained libraries (npm, GitHub) and DaisyUI component patterns before implementing new functionality or custom components. Document the evaluation and rationale when choosing to implement a custom solution.
- Must require HTTPS in production.

## MUST NOT

- Must not cache backend data between sessions or connections.
- Must not use any UI/component library other than DaisyUI/Tailwind.
- Must not use any backend except Moon API-compliant servers.
- Accessibility and SEO are not required for this project.

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

refer `SPEC_UI.md`
