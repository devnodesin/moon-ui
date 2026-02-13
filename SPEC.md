
## Documentation (MUST REFER)

- **UI Layouts and Components**: refer [SPEC_UI.md](./SPEC_UI.md) for UI design.
- For external Moon backends, see <https://moon.asensar.in/doc/llms-full.txt>
- Moon github repo: <https://github.com/devnodesin/moon>

## BACKEND (MOON SERVER)

- Testing server: `https://moon.asensar.in/`
- Credentials: (username: `admin`, password: `moonadmin12#`)
- If the test server is not accessible, install and run the local Moon server from `https://github.com/devnodesin/moon`

## Objective

Design and implement a secure, mobile-first admin webapp that enables seamless management of collections, users, API keys, and connections across multiple Moon backends, with no data caching.

## Backend Integration

- The UI is responsible for connecting to external Moon API‑compliant backends via standard HTTP requests (use `fetch` or an HTTP client like Axios).
- All `curl` examples in `https://moon.asensar.in/doc/llms-full.txt` are reference snippets for humans and agents only — the application must perform equivalent REST calls from the browser, not by invoking `curl`.
- Implement a reusable HTTP client layer that handles authentication (access + refresh tokens), automatic token refresh, retries/backoff, error normalization, and consistent notification on failures.
- For local development and testing, the app may target a Moon test server, but all interactions must remain standard browser HTTP calls (CORS-aware).

### Error Handling and User Notifications

All API errors must be handled consistently and surfaced to users through notifications:

**Backend Error Message Extraction:**
- When an API call returns an error response with an `"error"` property (e.g., `{"code": 400, "error": "invalid email format", "error_code": "INVALID_EMAIL_FORMAT"}`), the app **MUST** use the value of `"error"` as the message in user-facing notifications/toasters.
- If the response does not have an `"error"` property, use the app's existing/fallback error handling message instead.
- This behavior is implemented via `extractUserMessage()` utility in `src/utils/errorUtils.ts` and applied across all API error handling code paths.

**Error Priority:**
1. Backend error message from `error` field (highest priority)
2. Standard error message from `message` field
3. Context-aware fallback message provided by the caller
4. Generic "An error occurred" message (final fallback)

**Implementation:**
- All API errors are normalized to `AppError` type in `src/services/httpClient.ts`
- The `AppError` interface includes an optional `error` field for backend-provided user messages
- All pages use `extractUserMessage(error, fallbackMessage)` when displaying error notifications
- This ensures consistent, user-friendly error messages across the application

### API Adapter Layer

The app includes an API adapter (`src/services/apiAdapter.ts`) that normalizes Moon API responses and ensures stable behavior:

**Moon API v1.99+ Response Formats:**

| Endpoint | Response Format | Adapter Function |
|----------|----------------|------------------|
| `/collections:list` | `{collections: ["name1", "name2"], count: number}` | `normalizeCollectionListResponse()` |
| `/{collection}:schema` | `{collection: "name", fields: [{name, type, nullable}]}` | `normalizeSchemaResponse()` |

**Adapter Features:**
- Normalizes Moon API responses to match app's internal data model
- Runtime validation with console warnings for debugging
- Defensive checks to prevent calling endpoints with undefined/empty collection identifiers
- Validates API response structure and provides helpful error messages

**Implementation Notes:**
- Collections list endpoint returns simple string array, adapter converts to `{name}` objects
- Schema endpoint wraps response in `{collection, fields}` object, adapter extracts fields array
- All service functions in `src/services/collectionService.ts` use the adapter
- **No backward compatibility**: App only supports Moon API v1.99+

### Collection Field Constraints

The app supports field-level constraints when creating or modifying collections:

**Supported Field Properties:**
- `name`: Field name (lowercase snake_case required)
- `type`: Data type (string, integer, boolean, datetime, decimal, json)
- `nullable`: Whether the field accepts null values (boolean)
- `unique`: Whether the field must have unique values across records (boolean)
- `readonly`: Whether the field is read-only and cannot be modified in the schema editor (boolean)

**Unique Constraint:**
- When creating a collection, fields can be marked as unique by setting `unique: true`
- The backend enforces uniqueness for marked fields
- If a field is `nullable: true`, the API may return a `default_value` in the response schema
- Example: `{name: "email", type: "string", nullable: false, unique: true}`

**Read-Only Fields:**
- Fields marked with `readonly: true` cannot be edited, renamed, or removed in the schema editor
- The `id` field is typically marked as readonly by the backend
- Read-only fields are visually indicated with a "Read-only" badge in the schema editor
- All input controls (name, type, nullable, unique) are disabled for readonly fields
- Example: `{name: "id", type: "string", nullable: false, readonly: true}`

**API Request Example:**
```json
POST /collections:create
{
  "name": "users",
  "columns": [
    {"name": "email", "type": "string", "nullable": false, "unique": true},
    {"name": "name", "type": "string", "nullable": false, "unique": false}
  ]
}
```

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
- Follow session timeout and forced-logout rules from `https://moon.asensar.in/doc/llms-full.txt` when validating/refreshing tokens.

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
- Always fetch fresh data from backend (no caching).
- Support multiple backend connections, each isolated.
- Validate all user input and API responses.
- Provide mobile-first UI.
- Document all security and setup steps.
- Support only the latest major browsers.
- TypeScript is required (strict mode and type-checking enforced).
- Use DaisyUI themes: `autumn` for light mode, `abyss` for dark mode.
- **Notification System:**
  - All errors, API failures, and important events must create user notifications.
  - Success and info notifications auto-dismiss after a short duration (5 seconds).
  - Error and warning notifications remain pinned and require manual dismissal.
  - Provide a "Clear All Notifications" option in the settings dropdown (navbar).
  - No separate notifications page is required—all notification management is handled via the navbar settings.
- Show a smart loading/progress indicator for async operations (global or route-level) to improve UX.
- Support data import and export in CSV and JSON formats for collections and records.
- Follow session timeout and auto-logout rules as specified in `https://moon.asensar.in/doc/llms-full.txt` (enforce via the app HTTP client).
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
