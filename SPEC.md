# Moon Admin WebApp — Specification

A secure, mobile-first, single-page admin interface for managing Moon API backends. Built exclusively with **Vue 3 + Vite + TypeScript + Bootstrap 5.3**.

> **API Reference**: All Moon API endpoints, request/response formats, query options, and error codes are in **[moon-llms.md](moon-llms.md)**.

## Table of Contents

1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Authentication & Session](#authentication--session)
5. [Multi-Backend Connections](#multi-backend-connections)
6. [HTTP Client Layer](#http-client-layer)
7. [State Management](#state-management)
8. [Routing](#routing)
9. [Component Architecture](#component-architecture)
10. [Pages & Views](#pages--views)
11. [Notifications (Toast)](#notifications-toast)
12. [Progress Indicators](#progress-indicators)
13. [Data Tables & Pagination](#data-tables--pagination)
14. [Data Import / Export](#data-import--export)
15. [Form Validation](#form-validation)
16. [Error Handling](#error-handling)
17. [Testing Strategy](#testing-strategy)
18. [Security](#security)
19. [Design Constraints](#design-constraints)

---

## System Overview

### Goals

- Manage one or more Moon API backends from a single interface.
- Provide full CRUD for: collections, records, users, API keys, and backend connections.
- Never cache backend data between sessions or across connections.
- Mobile-first, responsive UI using Bootstrap 5.3 only.
- 100% TypeScript strict mode.

### What This App Does NOT Do

- Does not implement a backend — it is a pure frontend calling external Moon API servers.
- Does not use server-side rendering (SSR).
- Does not support accessibility (a11y) or SEO.
- Does not cache backend data.
- Does not use any UI library other than Bootstrap 5.3 + Bootstrap Icons.

---

## Tech Stack

| Concern          | Technology                                    |
| ---------------- | --------------------------------------------- |
| Framework        | Vue 3 (Composition API, `<script setup>`)     |
| Build Tool       | Vite (latest)                                 |
| Language         | TypeScript (strict mode)                      |
| UI               | Bootstrap 5.3 + Bootstrap Icons               |
| HTTP             | Native `fetch` API                            |
| Routing          | Vue Router 4                                  |
| State            | Pinia                                         |
| Testing (unit)   | Vitest + Vue Test Utils                       |
| Testing (E2E)    | Playwright                                    |
| Linting          | ESLint + Prettier                             |

No other frameworks, CSS libraries, or UI component libraries are permitted.

---

## Project Structure

```
webapp/
├── index.html
├── vite.config.ts               # Vite + Vitest config (@ alias, jsdom env)
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── package.json
├── .eslintrc.cjs
├── .prettierrc
├── src/
│   ├── main.ts                  # App entry point (Vue + Pinia + Router + Bootstrap)
│   ├── App.vue                  # Root: ProgressBar + RouterView + ToastContainer + ConfirmModal
│   ├── test-setup.ts            # Vitest global setup
│   ├── router/
│   │   └── index.ts             # Vue Router 4 — all routes, auth guards, progress integration
│   ├── stores/                  # Pinia stores
│   │   ├── auth.ts              # AuthState: user, tokens, setSession, loadFromStorage, clearSession
│   │   ├── connections.ts       # ConnectionsState: CRUD, localStorage persistence
│   │   ├── toast.ts             # ToastState: show, dismiss, clear (auto-dismiss support)
│   │   └── progress.ts          # ProgressState: smart progress bar (start/finish/tick)
│   ├── services/                # HTTP client and API services
│   │   ├── http.ts              # Core HTTP client: fetch wrapper, token refresh queue, X-Request-ID, error normalization
│   │   ├── auth.ts              # Auth service: authLogin, authLogout, authRefresh, authMe, getHealth
│   │   ├── users.ts             # Users API service (future)
│   │   ├── apikeys.ts           # API Keys service (future)
│   │   ├── collections.ts       # Collections service
│   │   └── records.ts           # Records service (future)
│   ├── composables/             # Reusable Vue composables
│   │   ├── useAsync.ts          # Async operation: loading, error, data, execute
│   │   ├── usePagination.ts     # Cursor-based pagination: after, limit, goNext, goPrev, reset
│   │   ├── useImportExport.ts   # CSV/JSON export + import (FileReader-based)
│   │   └── useConfirm.ts        # Singleton confirm modal: confirm(msg, opts) → Promise<boolean>
│   ├── components/              # Reusable UI components
│   │   ├── layout/
│   │   │   ├── AppHeader.vue    # Navbar: logo, connection name, user dropdown, logout
│   │   │   ├── AppSidebar.vue   # Sidebar: Bootstrap Icons nav links, admin-only filtering
│   │   │   └── AppLayout.vue    # Layout wrapper: header + collapsible sidebar + main slot
│   │   ├── ui/
│   │   │   ├── ToastContainer.vue  # Bootstrap 5.3 toasts (fixed bottom-right, max 5)
│   │   │   ├── ProgressBar.vue     # Global top progress bar (moon:progress event-driven)
│   │   │   ├── ConfirmModal.vue    # Bootstrap modal via useConfirm composable
│   │   │   ├── EmptyState.vue      # Empty state display with icon + message
│   │   │   ├── DataTable.vue       # (future) Sortable, selectable data table
│   │   │   ├── Pagination.vue      # (future) Cursor-based pagination controls
│   │   │   ├── SearchBar.vue       # (future) Full-text search input
│   │   │   ├── FilterBar.vue       # (future) Field filter with operator selection
│   │   │   ├── SortControl.vue     # (future) Sort field/direction control
│   │   │   ├── FieldBadge.vue      # (future) Field type badge
│   │   │   └── EmptyState.vue      # Empty state display
│   │   └── forms/
│   │       ├── FieldInput.vue      # (future) Dynamic field input by type
│   │       └── FormErrors.vue      # (future) Form error display
│   ├── views/                   # Page-level components (route targets)
│   │   ├── LoginView.vue        # Login: URL + connection name + username + password + Remember Me
│   │   ├── DashboardView.vue    # Dashboard: health status card, connection info, quick-access cards
│   │   ├── ConnectionsView.vue  # Connections: list, add (with /health validation), switch, delete
│   │   ├── users/
│   │   │   ├── UsersView.vue       # (stub) Users list
│   │   │   └── UserFormView.vue    # (future) Create/edit user
│   │   ├── apikeys/
│   │   │   ├── ApiKeysView.vue     # (stub) API Keys list
│   │   │   └── ApiKeyFormView.vue  # (future) Create/edit API key
│   │   ├── collections/
│   │   │   ├── CollectionsView.vue    # Collections list with create/schema modals
│   │   │   ├── CollectionFormView.vue # (future) Create/edit collection
│   │   │   └── CollectionSchemaView.vue # (future) Schema management
│   │   └── records/
│   │       ├── RecordsView.vue     # (future) Records list with full features
│   │       └── RecordFormView.vue  # (future) Dynamic record form
│   ├── types/                   # TypeScript interfaces
│   │   ├── api.ts               # ApiError, ApiListResponse, AuthTokens, AuthUser, HealthData, etc.
│   │   ├── connection.ts        # Connection interface
│   │   └── ui.ts                # Toast, ToastType interfaces
│   └── utils/
│       ├── validators.ts        # isValidUrl, isValidCollectionName, isValidFieldName, etc.
│       ├── formatters.ts        # formatDate, formatBytes, toRfc3339, collectionFilename
│       └── csv.ts               # parseCsv, serializeCsv
└── tests/
    ├── unit/                    # Vitest unit tests (mirrors src/)
    │   ├── stores/              # toast.spec.ts, connections.spec.ts
    │   ├── composables/         # useAsync.spec.ts, usePagination.spec.ts
    │   ├── services/            # auth.spec.ts
    │   └── utils/               # validators.spec.ts
    └── e2e/                     # Playwright E2E tests (future)
```

### Implementation Status

| Module | Status |
|--------|--------|
| Project scaffold + config | ✅ Done |
| Types (api, connection, ui) | ✅ Done |
| HTTP client (http.ts) | ✅ Done |
| Auth service | ✅ Done |
| Pinia stores (auth, connections, toast, progress) | ✅ Done |
| Composables (useAsync, usePagination, useImportExport, useConfirm) | ✅ Done |
| Layout components (AppHeader, AppSidebar, AppLayout) | ✅ Done |
| UI components (ToastContainer, ProgressBar, ConfirmModal, EmptyState) | ✅ Done |
| Router with auth/admin guards | ✅ Done |
| LoginView (URL + username + password form) | ✅ Done |
| DashboardView (health status + quick access) | ✅ Done |
| ConnectionsView (list, add, switch, delete) | ✅ Done |
| UsersView (list, create, edit, delete) | ✅ Done |
| ApiKeysView (list, create, edit, rotate, delete) | ✅ Done |
| CollectionsView (list, create, schema view/edit, delete, view records) | ✅ Done |
| Unit tests (73 passing) | ✅ Done |
| E2E tests | 🔲 Future |

---

## Authentication & Session

### Flow

```
Login Page
  → POST /auth:login
  → Store access_token + refresh_token + user in localStorage
  → Redirect to Dashboard

API Request
  → Attach Authorization: Bearer <access_token>
  → On 401: attempt token refresh (if refresh_token exists)
    → POST /auth:refresh with refresh_token
    → Store new access_token + refresh_token
    → Retry original request
    → On refresh failure: clear tokens, redirect to Login

Logout
  → POST /auth:logout with refresh_token
  → Clear all tokens from localStorage
  → Redirect to Login

Session Timeout
  → If access_token is expired and no refresh_token: auto-logout
  → If Remember Me enabled: use refresh_token to silently refresh
```

### Token Storage

All tokens and session data are stored in `localStorage` under the active connection's key namespace.

| Key                          | Value                              |
| ---------------------------- | ---------------------------------- |
| `moon_{connId}_access_token` | JWT access token string            |
| `moon_{connId}_refresh_token`| Refresh token string               |
| `moon_{connId}_user`         | Serialized user object (JSON)      |
| `moon_{connId}_expires_at`   | ISO 8601 expiry timestamp          |
| `moon_connections`           | Array of saved backend connections |
| `moon_active_connection`     | ID of the currently active connection |

### Remember Me

- If "Remember Me" is checked at login: persist refresh_token and enable automatic token refresh.
- If not checked: clear session on browser close (use `sessionStorage` for tokens instead).

### Auto Token Refresh

- The HTTP client checks token expiry before each request.
- If the access token is within 60 seconds of expiry, proactively refresh before the request.
- If refresh fails (401 from `/auth:refresh`): clear all tokens and redirect to Login.
- Concurrent requests during refresh must queue and wait for the refresh to complete.

### Session Timeout

- Display a warning toast when access token has less than 2 minutes remaining (if no refresh_token).
- Auto-logout when access token expires and no refresh token is available.
- On auto-logout, show a toast: "Your session has expired. Please log in again."

---

## Multi-Backend Connections

The app supports multiple independent Moon backend connections. Each connection is fully isolated.

### Connection Model

```typescript
interface Connection {
  id: string           // UUID generated client-side
  name: string         // User-defined label (e.g., "Production", "Dev")
  baseUrl: string      // Moon server base URL (e.g., "https://moon.devnodes.in")
  isActive: boolean    // Whether this is the currently selected connection
  createdAt: string    // ISO 8601 timestamp
}
```

### Behavior

- All connections are stored in `localStorage` (`moon_connections`).
- Each connection maintains its own auth tokens and session state in `localStorage` under its `id`-namespaced keys.
- Switching connections clears the current active context and loads the new one.
- Deleting a connection removes its tokens and session data from `localStorage`.
- The active connection is persisted across page refreshes.
- Never share or mix authentication tokens between connections.
- Always fetch fresh data from the backend when switching connections — do not restore cached data.

### Connection Validation

Before saving a connection, validate the `baseUrl` by calling `GET {baseUrl}/health`. Show success/error toast based on the result.

---

## HTTP Client Layer

All communication with Moon API backends goes through a centralized HTTP client. No component or service may call `fetch` directly; always use the client layer.

### Core HTTP Client (`src/services/http.ts`)

The client is a per-connection instance that encapsulates:

1. **Base URL** — the Moon server base URL for this connection.
2. **Authentication** — automatically attaches `Authorization: Bearer <access_token>`.
3. **Token Refresh** — on 401, attempts token refresh (see [Authentication](#authentication--session)). Queues concurrent requests during refresh.
4. **Error Normalization** — extracts `message` from error responses; falls back to HTTP status text.
5. **Request Correlation** — attaches `X-Request-ID` header to every request.
6. **Rate Limit Handling** — on 429, surface the error with `Retry-After` info.
7. **Progress Integration** — notifies the progress store on request start/end.

```typescript
interface HttpClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
}
```

### Error Normalization

All HTTP errors are normalized to:

```typescript
interface ApiError {
  message: string     // From API response body, or fallback
  status: number      // HTTP status code
  requestId?: string  // X-Request-ID from response headers
}
```

Always throw `ApiError` from the HTTP client. Never swallow errors. Callers surface the `message` to the user via a toast notification.

### API Services

Each resource has a dedicated service module (`src/services/*.ts`) built on top of the HTTP client. Services are thin wrappers that:

- Accept typed inputs.
- Call the HTTP client.
- Return typed outputs.
- Never perform UI operations (no toast calls inside services).

---

## State Management

Using **Pinia** for all global state.

### Auth Store (`stores/auth.ts`)

```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt: string | null
  rememberMe: boolean
  isAuthenticated: boolean
}
```

Actions: `login`, `logout`, `refresh`, `loadFromStorage`, `clearSession`

### Connections Store (`stores/connections.ts`)

```typescript
interface ConnectionsState {
  connections: Connection[]
  activeConnectionId: string | null
}
```

Actions: `addConnection`, `removeConnection`, `setActive`, `loadFromStorage`

### Toast Store (`stores/toast.ts`)

```typescript
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  autoDismiss: boolean   // default: true (5s for success/info, 8s for error/warning)
}

interface ToastState {
  toasts: Toast[]
}
```

Actions: `show`, `dismiss`, `clear`

---

## Routing

Vue Router 4 with HTML5 history mode.

### Route Structure

```
/login                         LoginView (public)
/                              Redirect → /dashboard (requires auth)
/dashboard                     DashboardView
/connections                   ConnectionsView
/users                         UsersView (admin only)
/users/new                     UserFormView (admin only)
/users/:id/edit                UserFormView (admin only)
/apikeys                       ApiKeysView (admin only)
/apikeys/new                   ApiKeyFormView (admin only)
/apikeys/:id/edit              ApiKeyFormView (admin only)
/collections                   CollectionsView
/collections/new               CollectionFormView
/collections/:name/schema      CollectionSchemaView
/collections/:name/records     RecordsView
/collections/:name/records/new RecordFormView
/collections/:name/records/:id/edit RecordFormView
```

### Navigation Guards

- All routes except `/login` require authentication. Unauthenticated users are redirected to `/login`.
- Routes marked "admin only" redirect non-admin users to `/dashboard` with an error toast.
- On route change: trigger the global progress bar.

---

## Component Architecture

### Principles

- All components use `<script setup lang="ts">`.
- Props are typed with TypeScript interfaces; emit events are typed.
- All async operations go through the `useAsync` composable (provides `loading`, `error`, `execute`).
- All notifications go through the toast store.
- Components never call the HTTP client or services directly — views call services, pass data as props.
- Always use Bootstrap 5.3 classes; no inline styles unless absolutely unavoidable.

### Key Composables

#### `useAsync`

```typescript
function useAsync<T>(fn: () => Promise<T>): {
  loading: Ref<boolean>
  error: Ref<string | null>
  data: Ref<T | null>
  execute: () => Promise<void>
}
```

Wraps any async operation: sets `loading`, catches errors, extracts `message` from `ApiError`.

#### `usePagination`

Manages cursor-based pagination state:
- `after` cursor, `limit`, `hasPrev`, `hasNext`
- `goNext(nextCursor)`, `goPrev(prevCursor)`, `reset()`

#### `useImportExport`

- `exportCsv(records, fields)` — downloads records as CSV.
- `exportJson(records)` — downloads records as JSON.
- `importCsv(file)` → `Promise<Record[]>` — parses CSV file.
- `importJson(file)` → `Promise<Record[]>` — parses JSON file.

#### `useConfirm`

Provides a reusable confirmation modal pattern:
- `confirm(message, options)` → `Promise<boolean>`

---

## Pages & Views

### Login (`/login`)

- Form: username, password, "Remember Me" checkbox.
- On submit: call auth service login → store tokens → redirect to dashboard.
- Show error toast with API `message` on failure.
- Disable submit button and show spinner while loading.
- If already authenticated, redirect to dashboard.

### Dashboard (`/dashboard`)

- Shows summary stats for the active connection: connection name, user info, collection count.
- Quick-access cards to: Collections, Users, API Keys.
- Shows current backend health status (via `GET /health`).

### Connections (`/connections`)

- List all saved connections with: name, URL, active indicator, created date.
- Add connection: name + base URL fields. Validate URL by calling `/health` before saving.
- Switch active connection: button to set as active (reloads auth state).
- Delete connection: confirm modal → remove from store + localStorage.
- Show which connection is currently active.

### Users (`/users`, admin only)

- Paginated list table: username, email, role, can_write, last login, actions.
- Search by username/email (`?q=`).
- Actions per row: Edit, Reset Password, Revoke Sessions, Delete (with confirm).
- Create/Edit form: username, email, role, can_write, password (create only).
- Admin action "Reset Password": shows form for a replacement password and submits `POST /data/users:mutate` with `op: "action"`, `action: "reset_password"`, and `data: [{ id, password }]`.
- Admin action "Revoke Sessions": confirm modal → call `action: revoke_sessions`.

### API Keys (`/apikeys`, admin only)

- Paginated list table: name, description, role, can_write, created date, actions.
- Create form: name, description, role, can_write.
- On create: display the key value once in a modal with a "Copy" button and security warning. Never show again.
- Rotate key: confirm modal → show new key once in modal.
- Edit: name, description, can_write (key itself is not editable).
- Delete: confirm modal.

### Collections (`/collections`)

- Paginated list table: name, record count, actions.
- Actions per row: View Records (navigates to `/collections/:name/records`), Edit Schema (opens schema modal), Delete (confirm then delete).
- **Create Collection modal** (inline in CollectionsView): collection name input + dynamic column builder (add/remove columns with name, type, nullable, unique). Triggered by "Add Collection" header button.
- **Schema modal** (inline in CollectionsView): shows current columns table (name, type, nullable, unique, default). "Edit Schema" button enters edit mode: mark existing columns for removal, add new columns, then save. Uses `/collections:update` with `add_columns` and/or `remove_columns` payloads.
- All notifications use Bootstrap toasts with API error messages.
- `ApiListMeta.total` is optional (collections list does not include it). `Pagination` component handles missing total gracefully.

### Collection Schema (`/collections/:name/schema`)

- Display full schema: collection name + all fields in a table.
- Edit schema operations (inline or via forms):
  - Add columns: name, type, nullable, unique.
  - Rename columns: old name → new name.
  - Modify columns: change type or nullable.
  - Remove columns: select column → confirm → remove.
- All schema operations are sent to `/collections:update`.

### Records (`/collections/:name/records`)

- Full-featured data table for the collection's records.
- Features:
  - Paginated list (cursor-based).
  - Column visibility toggle.
  - Sort by any field (click column header).
  - Filter by any field (filter bar with operator selection).
  - Full-text search (`?q=`).
  - Field selection (`?fields=`).
  - Batch select + delete.
  - Import CSV / JSON.
  - Export CSV / JSON.
- Create / Edit record forms: dynamic fields rendered per schema type (see `FieldInput`).
- Delete record: confirm modal (single or batch).

### Record Form (`/collections/:name/records/new`, `/edit`)

- Dynamic form generated from the collection's schema.
- Required fields (nullable: false) are marked and enforced.
- Uses `FieldInput` component per field type:
  - `string` → text input
  - `integer` → number input (integer validation)
  - `decimal` → text input (decimal string validation)
  - `boolean` → checkbox / toggle
  - `datetime` → datetime-local input (formatted to RFC3339 on submit)
  - `json` → textarea with JSON validation
- Show validation errors inline.
- Submit: create or update record → success toast → navigate back to records list.

---

## Notifications (Toast)

All user notifications use **Bootstrap 5.3 toasts** via the global `ToastContainer` component.

### Rules

1. Always display the `message` field from the API error response.
2. Only use a generic fallback message if the API provides no `message`.
3. Show a success toast after every successful mutation (create, update, delete).
4. Show an error toast on every API error.
5. Toasts auto-dismiss after 5 seconds (success/info) or 8 seconds (error/warning).
6. Users can manually dismiss any toast.
7. Multiple toasts stack vertically (max 5 visible at once).

### Toast Types

| Type      | Color     | Use case                            |
| --------- | --------- | ----------------------------------- |
| `success` | `success` | Successful create, update, delete   |
| `error`   | `danger`  | API errors, validation failures     |
| `warning` | `warning` | Partial success, key rotation, etc. |
| `info`    | `info`    | Informational messages              |

---

## Progress Indicators

Show a **global progress bar** (Bootstrap `progress` component at the top of the viewport) for all async operations. This applies at the route level and per-request level.

### Rules

1. Start progress bar on route navigation begin; complete on navigation end.
2. Start progress bar on every HTTP request; complete on response (success or error).
3. The progress bar is "smart": increment in small random steps to simulate progress, then jump to 100% on completion.
4. Concurrent requests: progress bar remains active until all in-flight requests complete.
5. Show a spinner inside buttons while their associated async action is loading.
6. Disable interactive elements (submit buttons, action buttons) while an async operation is in progress.

---

## Data Tables & Pagination

All list views use the shared `DataTable` component with cursor-based pagination.

### DataTable Features

- Column headers (sortable — click to toggle asc/desc).
- Row selection checkboxes (single and bulk select-all).
- Empty state with `EmptyState` component.
- Loading skeleton rows while fetching.
- Configurable visible columns.
- Responsive: horizontal scroll on mobile; sticky first column.

### Pagination

- Previous / Next buttons using `meta.prev` and `meta.next` cursors.
- Show current page info: "Showing N of M total".
- Page size selector: 15, 30, 50, 100 (maps to `?limit=`).
- Reset to first page when filters or sort change.

---

## Data Import / Export

### Export

- **CSV**: all visible columns (or all columns if none selected), comma-separated, UTF-8.
- **JSON**: full record objects as a JSON array.
- File download triggered client-side via `<a download>`.
- File naming convention: `{collection}_{timestamp}.csv` / `.json`.

### Import

- **CSV**: parse file, validate headers against collection schema, batch-create records.
- **JSON**: parse file (expect array of objects), validate keys, batch-create records.
- Show a preview table (first 10 rows) before confirming import.
- After import: show a result toast with succeeded/failed counts (using `meta.succeeded` and `meta.failed` from the API).
- Validate all fields client-side before sending. Show inline errors in the preview.

---

## Form Validation

All forms must validate inputs both client-side (before submission) and surface server-side errors from the API response.

### Client-Side Rules

- Required fields (non-nullable): must not be empty.
- `integer`: must be a whole number.
- `decimal`: must match pattern `^-?\d+(\.\d{1,10})?$`; no scientific notation; no trailing/leading dots.
- `datetime`: must be valid ISO 8601; convert to RFC3339 on submit.
- `json`: must be valid JSON (parsed with `JSON.parse`).
- `string`: no specific format, but trimmed before submission.
- Collection/field names: lowercase, snake_case, `^[a-z][a-z0-9_]*$`.
- URL fields (connection base URL): must be a valid HTTP/HTTPS URL.

### Server-Side Errors

- Display the API `message` as a form-level error (not in a toast for form submissions — show inline or above the form).
- Field-level errors: if the API provides field-specific information in `message`, parse and display accordingly.

---

## Error Handling

### Rules

1. All errors from the HTTP client are typed `ApiError` with `message` and `status`.
2. **Never** swallow errors silently. Always surface them to the user.
3. Always show the API `message` in a toast (or inline for forms).
4. On 401 not caused by token refresh: redirect to login with error toast.
5. On 429: show toast with retry guidance.
6. On 500: show generic toast ("Server error. Please try again.") plus the API message if available.
7. On network failure (no response): show toast "Unable to connect to the server. Check your connection."
8. Log all errors to the browser console for debugging.

---

## Testing Strategy

### Principles

- **TDD**: write a failing test before implementing any feature.
- Target **90%+ unit test coverage**.
- **100% test pass rate** — fix any failing test regardless of origin.

### Unit Tests (Vitest + Vue Test Utils)

Every module in `src/` has a corresponding test file in `tests/unit/` mirroring the directory structure.

| Module Type   | What to Test                                                      |
| ------------- | ----------------------------------------------------------------- |
| Services      | HTTP calls (mock fetch), correct params, error normalization      |
| Stores        | State mutations, actions, localStorage persistence               |
| Composables   | Logic, loading/error states, edge cases                          |
| Components    | Rendering, prop handling, emits, user interaction, slot content  |
| Views         | Integration of components, route params, service calls (mocked)  |
| Utils         | All utility functions with valid/invalid inputs                  |

### E2E Tests (Playwright)

Cover critical user flows end-to-end against a running Moon test server:

1. Login / Logout flow.
2. Add, switch, and delete backend connections.
3. Full CRUD for users (admin).
4. Full CRUD for API keys with key display/copy.
5. Create collection with schema, add/remove columns.
6. CRUD for records including all field types.
7. Import/Export CSV and JSON.
8. Pagination, filtering, sorting, search.
9. Token refresh (access token expiry simulation).
10. Session timeout and auto-logout.

---

## Security

1. **HTTPS required in production.** The app must warn the user if the backend connection uses HTTP (not HTTPS) except for `localhost`.
2. **Never log tokens** (access_token, refresh_token) to the console.
3. **Never include tokens in URLs** or URL parameters.
4. Clear all tokens from `localStorage` on logout and on connection deletion.
5. Sanitize all user input before sending to the API.
6. Validate all API responses against expected types before use in the UI.
7. The `key` field in API key responses is shown only once (at creation/rotation) and never stored in state beyond the single display event.
8. Use `X-Request-ID` header on all requests for traceability.

---

## Design Constraints

- **Mobile-first**: all layouts must be usable on screens ≥ 375px wide.
- **Responsive**: use Bootstrap 5.3 grid and responsive utilities.
- **Bootstrap only**: no custom CSS frameworks. Minimal custom CSS; prefer Bootstrap utilities.
- **Bootstrap Icons only**: no other icon library.
- **No backend caching**: always fetch fresh data. Do not persist collection data or records in localStorage.
- **Strict TypeScript**: no implicit `any`. All API responses must be typed.
- **Composable-first**: extract all reusable logic into composables.
- **Latest major browsers only**: Chrome, Firefox, Safari, Edge (latest versions).
- **No accessibility requirements** (a11y not required).
- **No SEO requirements**.
