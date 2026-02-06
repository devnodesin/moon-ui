## Overview

**Purpose**

This PRD defines the authentication and connection management system for the Moon Admin WebApp. The system enables users to securely authenticate against multiple Moon backend servers, manage multiple saved connections, handle JWT token lifecycle (access + refresh), and switch between backend connections with isolated sessions.

**Problem Statement**

Users need to:
- Authenticate to Moon backend servers using username/password credentials
- Manage multiple backend connections with isolated sessions and token storage
- Switch between connections seamlessly without data leakage or forced re-login
- Maintain secure token storage with HTTPS enforcement and opt-in persistence
- Handle automatic token refresh and session expiration gracefully

**Solution Summary**

Implement a comprehensive authentication and connection management layer consisting of:

1. **Login View**: UI for entering credentials (server URL, username, password) with saved connections dropdown and "Remember Connection" toggle
2. **Connection Manager**: UI for adding, editing, and deleting saved connections
3. **JWT Token Storage**: Per-connection storage of access token, refresh token, expiration time, and base URL
4. **HTTP Client Layer**: Reusable client handling authentication headers, automatic token refresh, retry/backoff logic, and error normalization
5. **Connection Switching**: Logic to switch between connections while validating tokens, clearing UI state, and preventing data leakage
6. **Logout Flow**: Clear tokens and session data with proper backend notification
7. **Security Enforcement**: HTTPS requirement, token scoping per baseUrl, and localStorage opt-in via "Remember Connection"

**Context**

- Authentication flow: `Login → API Calls (with token) → Token Refresh → Logout → Clear Tokens`
- Connection switching flow: `Select New Connection → Confirm Switch → Clear In-Memory UI State → Load Stored Session → Validate/Refresh Token → Fetch Fresh Data → Update UI`
- Moon API endpoints: `/auth:login`, `/auth:logout`, `/auth:refresh`, `/auth:me`
- Token types: JWT `access_token` (short-lived, for API calls) and `refresh_token` (long-lived, for renewing access tokens)

---

## Requirements

### Functional Requirements

#### FR-001: Login View UI

- **Login Form**
  - Display logo/title at the top
  - Provide a dropdown to select from saved connections
  - Provide text input for "Server URL" (e.g., `https://moon.asensar.in`)
  - Provide text input for "Username"
  - Provide password input for "Password" (masked)
  - Provide checkbox labeled "Remember Connection" (default: unchecked)
  - Provide "Connect" button to submit credentials
  - Provide "Manage Connections" link to open Connection Manager

- **Saved Connections Dropdown**
  - List all saved connections by name (e.g., "Production", "Staging", "Local Dev")
  - Show placeholder text "Select a saved connection" when no selection
  - When a saved connection is selected:
    - Auto-fill Server URL, Username, and Password (if saved)
    - If the connection has a valid stored session (access token + refresh token), attempt to auto-login without re-entering credentials
    - If tokens are invalid or missing, require manual credential entry

- **Form Behavior**
  - "Server URL" must accept HTTPS URLs only in production builds (must start with `https://`)
  - Allow HTTP URLs only for development/testing environments (must validate URL format)
  - Validate all fields are non-empty before enabling "Connect" button
  - Show validation errors inline (e.g., "Invalid URL format", "Username required")
  - On successful login, redirect authenticated user to `/#/admin/` (or `/#/app/` if configured)
  - On login failure, display error notification with reason (e.g., "Invalid credentials", "Network error")

- **Remember Connection Behavior**
  - When "Remember Connection" is checked:
    - Store connection details (name, baseUrl, username, accessToken, refreshToken, expiresAt) in `localStorage`
    - Persist session across browser restarts
  - When "Remember Connection" is unchecked:
    - Store session data in-memory only (e.g., React state, sessionStorage)
    - Session is cleared on page reload or browser close
  - Document security implications in `INSTALL.md`

- **Navigation**
  - Unauthenticated users visiting any internal route (e.g., `/#/admin/collections`) must be redirected to `/#/` with original target preserved in `next` parameter (e.g., `/#/login?next=%2Fadmin%2Fcollections`)
  - Authenticated users visiting `/#/` must be redirected to `/#/admin/`

#### FR-002: Connection Manager UI

- **Purpose**: Allow users to manage multiple saved backend connections

- **Connection List**
  - Display all saved connections in a table or list
  - Each connection shows: Name, Server URL, Username, Last Used timestamp
  - Provide "Add New Connection" button
  - Provide per-connection actions: Edit, Delete, Test Connection

- **Add/Edit Connection Form**
  - Fields: Connection Name (required), Server URL (required, HTTPS only in production), Username (required), Password (optional, for convenience only)
  - Validate Server URL format (must be valid HTTPS URL)
  - Validate unique Connection Name (no duplicates)
  - Allow saving password (warn user about security risk in UI)
  - On save, store connection details in `localStorage` under `savedConnections` key

- **Delete Connection**
  - Prompt for confirmation: "Are you sure you want to delete [Connection Name]? This will remove saved credentials and session tokens."
  - On confirm, remove connection from `localStorage`
  - If deleting the currently active connection, log out user and redirect to login

- **Test Connection**
  - Send test request to backend `/health` endpoint (public, no auth required)
  - Display result: "Connection successful" or "Connection failed: [reason]"
  - Do not store tokens or modify active session

- **Access**
  - Provide link from Login View ("Manage Connections")
  - Provide access from authenticated Header/Sidebar ("Connection Settings")

#### FR-003: JWT Token Storage

- **Per-Connection Session Model**
  - Each connection must have its own isolated session stored under a unique `connectionId` (generated UUID or hashed baseUrl)
  - Session structure:
    ```typescript
    interface ConnectionSession {
      connectionId: string;
      name: string;
      baseUrl: string;
      username: string;
      accessToken: string;
      refreshToken: string;
      expiresAt: number; // Unix timestamp (milliseconds)
      lastUsed: number; // Unix timestamp (milliseconds)
    }
    ```

- **Storage Strategy**
  - **Remember Connection = true**: Persist session in `localStorage` under key `moon_session_[connectionId]`
  - **Remember Connection = false**: Store session in-memory only (React state or sessionStorage)
  - Never reuse tokens between different backends (tokens are strictly scoped to their issuing `baseUrl`)

- **Token Lifecycle**
  - On successful login (`/auth:login`), store both `access_token` and `refresh_token` with `expiresAt` timestamp
  - Before each API call, check if `accessToken` is expired (compare `expiresAt` with current time)
  - If expired, automatically refresh token using `/auth:refresh` before making the original API call
  - If refresh fails (e.g., refresh token expired or revoked), force logout and redirect to login with notification: "Session expired. Please log in again."

- **Security**
  - Tokens must never be logged to console or sent to third-party services
  - Tokens are scoped to `baseUrl` (e.g., token from `https://moon.asensar.in` cannot be used for `https://staging.example.com`)
  - Enforce HTTPS in production builds (reject HTTP URLs)
  - Sanitize and validate all stored data on load (handle corrupted localStorage gracefully)

#### FR-004: HTTP Client Layer

- **Purpose**: Provide a reusable HTTP client for all Moon API calls with built-in authentication, token refresh, retry logic, and error handling

- **Implementation**
  - Use `fetch` API or Axios for HTTP requests
  - Create a singleton or context-based HTTP client instance
  - All Moon API calls must go through this client (no direct `fetch` calls outside client layer)

- **Features**

  **F1: Automatic Authentication Header Injection**
  - For all requests (except public endpoints like `/health`, `/auth:login`, `/auth:refresh`):
    - Automatically inject `Authorization: Bearer <access_token>` header
    - Use access token from currently active connection's session

  **F2: Token Expiration Check**
  - Before each request, check if `accessToken` is expired:
    - If `expiresAt` > current time: proceed with request
    - If `expiresAt` <= current time: trigger token refresh flow

  **F3: Automatic Token Refresh**
  - On token expiration detection or `401 Unauthorized` response:
    - Call `/auth:refresh` endpoint with `refresh_token` from session
    - Request body: `{ "refresh_token": "<refresh_token>" }`
    - Expected response: `{ "access_token": "...", "refresh_token": "...", "expires_in": 3600 }`
    - Update session with new tokens and `expiresAt` (current time + `expires_in` seconds)
    - Retry original request with new `access_token`
  - If refresh fails (e.g., `401` response or network error):
    - Clear session tokens
    - Show notification: "Session expired. Please log in again."
    - Redirect to login view with `next` parameter preserving current route

  **F4: Retry and Backoff Logic**
  - For transient network errors (e.g., timeout, 5xx server errors):
    - Retry request up to 3 times with exponential backoff (1s, 2s, 4s)
    - If all retries fail, show error notification: "Network error. Please try again."
  - For `401 Unauthorized`:
    - Attempt token refresh once
    - If refresh fails, do not retry; force logout
  - For `403 Forbidden`, `404 Not Found`, `409 Conflict`:
    - Do not retry; show error notification with message from response

  **F5: Error Normalization and Notification**
  - All API errors must be normalized to a consistent structure:
    ```typescript
    interface ApiError {
      status: number; // HTTP status code
      code: string; // Error code (e.g., "INVALID_INPUT", "UNAUTHORIZED")
      message: string; // User-friendly error message
      details?: any; // Optional detailed error info from backend
    }
    ```
  - On error, trigger notification system with error message
  - Distinguish between network errors (no response) and API errors (response with error)

  **F6: Request Cancellation**
  - Support request cancellation via AbortController
  - Cancel in-flight requests when user navigates away or switches connections

  **F7: Base URL Configuration**
  - HTTP client must use `baseUrl` from currently active connection session
  - Construct full URL: `${baseUrl}${endpoint}` (e.g., `https://moon.asensar.in/collections:list`)

- **API Methods**
  - `client.get(endpoint, params?)`: GET request with query params
  - `client.post(endpoint, body)`: POST request with JSON body
  - `client.put(endpoint, body)`: PUT request with JSON body
  - `client.delete(endpoint)`: DELETE request
  - `client.setActiveConnection(connectionId)`: Switch active connection
  - `client.logout()`: Clear tokens and session

- **Testing Requirements**
  - Unit tests for token expiration check logic
  - Unit tests for automatic token refresh flow
  - Unit tests for retry/backoff logic with mocked fetch
  - Unit tests for error normalization
  - Integration tests for login, API call with valid token, API call with expired token (auto-refresh), and logout

#### FR-005: Connection Switching

- **Purpose**: Allow users to switch between multiple saved backend connections without losing session state or causing data leakage

- **Switching Flow**

  **Step 1: User Initiates Switch**
  - User selects a different connection from connection dropdown in Header/Sidebar
  - OR user selects a saved connection from Login View dropdown

  **Step 2: Unsaved Changes Check**
  - If there are unsaved changes in the current view (e.g., editing a record):
    - Show confirmation dialog: "You have unsaved changes. Switching connections will discard them. Continue?"
    - Options: "Cancel" (abort switch), "Continue" (proceed with switch)
  - If no unsaved changes, proceed immediately

  **Step 3: Clear In-Memory UI State**
  - Clear all in-memory application data:
    - Collections list
    - Record data
    - Form state
    - Notification history (session-only)
  - Cancel all in-flight API requests for current connection

  **Step 4: Load Target Connection Session**
  - Retrieve session for target connection from `localStorage` or in-memory storage
  - If no session exists, proceed to Step 6 (force login)
  - Set target connection as active connection in HTTP client

  **Step 5: Validate/Refresh Token**
  - Check if `accessToken` is expired:
    - If valid (not expired), proceed to Step 7
    - If expired, attempt token refresh:
      - Call `/auth:refresh` with `refresh_token`
      - If refresh succeeds, update session and proceed to Step 7
      - If refresh fails, proceed to Step 6 (force login)

  **Step 6: Prompt Login for Target Connection (if needed)**
  - If no valid session exists or token refresh failed:
    - Show notification: "Session expired for [Connection Name]. Please log in."
    - Redirect to Login View with target connection pre-selected
    - After successful login, resume switch to target connection

  **Step 7: Fetch Fresh Data**
  - Fetch initial data for target connection (e.g., collections list)
  - Update UI with fetched data

  **Step 8: Update UI**
  - Display current connection name in Header/Sidebar
  - Navigate to default authenticated route (`/#/admin/`)

- **Isolation Requirements**
  - Tokens from Connection A must never be used for API calls to Connection B
  - UI state (collections, records, forms) must be fully cleared when switching
  - Notification history (in-session) is cleared on switch
  - No cross-connection data leakage (validate in tests)

- **Error Handling**
  - If target connection backend is unreachable:
    - Show notification: "Failed to connect to [Connection Name]. Please check server status."
    - Allow user to select a different connection or return to login
  - If token refresh fails for target connection:
    - Clear invalid session
    - Prompt user to log in with credentials

#### FR-006: Logout Flow

- **User-Initiated Logout**
  - Provide "Logout" button/link in Header/Sidebar
  - On click, prompt for confirmation: "Are you sure you want to log out?"
  - Options: "Cancel", "Logout"

- **Logout Actions**

  **Step 1: Notify Backend**
  - Call `/auth:logout` endpoint with current `access_token` and `refresh_token`
  - Request headers: `Authorization: Bearer <access_token>`
  - Request body: `{ "refresh_token": "<refresh_token>" }`
  - Expected response: `200 OK` or `204 No Content`
  - If backend call fails (e.g., network error), proceed with client-side logout anyway (tokens should still be cleared locally)

  **Step 2: Clear Session Tokens**
  - Remove `accessToken` and `refreshToken` from active connection session
  - If "Remember Connection" was enabled:
    - Remove tokens but keep connection details (name, baseUrl, username) in `localStorage` for future logins
  - If "Remember Connection" was disabled:
    - Clear entire session from in-memory storage

  **Step 3: Clear UI State**
  - Clear all in-memory application data (collections, records, forms, notifications)
  - Cancel all in-flight API requests

  **Step 4: Redirect to Login**
  - Navigate to `/#/` (Login View)
  - Show notification: "Logged out successfully"

- **Forced Logout (Session Expiration)**
  - Triggered when token refresh fails or backend returns `401 Unauthorized` after refresh attempt
  - Automatically execute logout actions (Steps 2-4 above)
  - Show notification: "Session expired. Please log in again."
  - Preserve original route in `next` parameter for post-login redirect

#### FR-007: Security Requirements

- **HTTPS Enforcement**
  - Production builds must reject HTTP URLs for server connections
  - Validate Server URL starts with `https://` before allowing login or saving connection
  - Display error: "HTTPS is required for production. HTTP connections are not allowed."
  - Allow HTTP URLs only in development/testing environments (controlled via environment variable, e.g., `VITE_ALLOW_HTTP=true`)

- **Token Scoping**
  - Each token is strictly scoped to its issuing `baseUrl`
  - HTTP client must validate that `baseUrl` of active connection matches the origin of the token before making API calls
  - Reject any attempt to use a token from Connection A for API calls to Connection B

- **Token Storage Security**
  - Tokens in `localStorage` are accessible only to the app's origin (same-origin policy enforced by browser)
  - Document security risk of "Remember Connection" feature in `INSTALL.md`:
    - Tokens stored in `localStorage` persist across sessions
    - Risk: If device is compromised, tokens may be accessible
    - Recommendation: Use "Remember Connection" only on trusted devices
  - In-memory storage (React state or sessionStorage) is cleared on page reload or browser close (more secure)

- **Input Validation**
  - Sanitize all user inputs (Server URL, Username, Password) before sending to backend
  - Validate Server URL format (must be valid URL with protocol)
  - Reject URLs with special characters that could cause injection attacks

- **CORS Handling**
  - Moon backend must be configured with explicit allowed origins for CORS
  - Frontend must handle CORS errors gracefully:
    - Show notification: "Connection blocked by CORS policy. Please contact server administrator."
  - Document CORS configuration requirements in `INSTALL.md`

- **Password Handling**
  - Passwords must never be logged or stored in plain text (except in `localStorage` when user explicitly saves connection for convenience)
  - When saving connection with password, warn user: "Warning: Saving your password stores it in plain text on this device. Only use this feature on trusted devices."
  - Provide option to save connection without password (user must re-enter password on each login)

### Technical Requirements

#### TR-001: Technology Stack

- React 18+ with TypeScript (strict mode)
- DaisyUI + Tailwind CSS for UI components
- Bun.js for package management and build
- React Router (HashRouter) for client-side routing
- `fetch` API or Axios for HTTP requests
- `localStorage` for persistent session storage (opt-in)
- React Context API or Zustand for global state management (authentication state, active connection)

#### TR-002: State Management

- **Authentication Context**
  - Provide `AuthContext` with:
    - `currentUser`: Current authenticated user info (from `/auth:me`)
    - `activeConnection`: Currently active connection session
    - `savedConnections`: List of all saved connections
    - `isAuthenticated`: Boolean flag
    - `login(credentials)`: Login function
    - `logout()`: Logout function
    - `switchConnection(connectionId)`: Connection switch function
    - `addConnection(connection)`: Add new saved connection
    - `updateConnection(connectionId, updates)`: Update saved connection
    - `deleteConnection(connectionId)`: Delete saved connection

- **HTTP Client Context**
  - Provide `HttpClientContext` with configured HTTP client instance
  - HTTP client must have access to `AuthContext` for token management

#### TR-003: File Structure

```
src/
├── auth/
│   ├── AuthContext.tsx         # Authentication context provider
│   ├── LoginView.tsx           # Login page component
│   ├── ConnectionManager.tsx   # Connection manager UI
│   ├── useAuth.ts              # Authentication hook
│   └── authService.ts          # Auth API calls (login, logout, refresh)
├── http/
│   ├── HttpClient.ts           # HTTP client class with token management
│   ├── HttpClientContext.tsx   # HTTP client context provider
│   └── apiErrors.ts            # Error types and normalization
├── storage/
│   ├── sessionStorage.ts       # Session storage utilities (localStorage + in-memory)
│   └── types.ts                # Session and connection types
├── utils/
│   ├── validation.ts           # URL and input validation
│   └── security.ts             # Security utilities (HTTPS check, token scoping)
└── types/
    └── auth.ts                 # Authentication types
```

#### TR-004: API Endpoints

- **Login**: `POST /auth:login`
  - Request body: `{ "username": "admin", "password": "moonadmin12#" }`
  - Response: `{ "access_token": "...", "refresh_token": "...", "expires_in": 3600 }`

- **Logout**: `POST /auth:logout`
  - Headers: `Authorization: Bearer <access_token>`
  - Request body: `{ "refresh_token": "..." }`
  - Response: `200 OK` or `204 No Content`

- **Refresh Token**: `POST /auth:refresh`
  - Request body: `{ "refresh_token": "..." }`
  - Response: `{ "access_token": "...", "refresh_token": "...", "expires_in": 3600 }`

- **Get Current User**: `GET /auth:me`
  - Headers: `Authorization: Bearer <access_token>`
  - Response: `{ "id": "...", "username": "admin", "email": "...", "role": "admin" }`

- **Health Check**: `GET /health` (public, no auth required)
  - Response: `{ "status": "ok" }`

#### TR-005: Error Handling

- **Network Errors**
  - Detect when `fetch` throws (e.g., network timeout, DNS failure)
  - Show notification: "Network error. Please check your connection and try again."
  - Do not retry indefinitely (max 3 retries with backoff)

- **API Errors**
  - Parse error response body: `{ "error": { "code": "...", "message": "..." } }`
  - Normalize to `ApiError` type
  - Show notification with user-friendly message

- **Token Errors**
  - `401 Unauthorized` after refresh attempt: Force logout
  - `401 Unauthorized` before refresh: Attempt token refresh, then retry original request
  - `403 Forbidden`: Show notification: "Access denied. You do not have permission to perform this action."

- **Validation Errors**
  - `400 Bad Request`: Parse validation errors from response and display inline or in notification
  - Example response: `{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": { "username": "Required" } } }`

#### TR-006: Testing Requirements

- **Unit Tests**
  - Token expiration check logic
  - Token refresh flow
  - Connection switching state transitions
  - Error normalization
  - Retry/backoff logic

- **Integration Tests**
  - Full login flow (valid credentials, invalid credentials)
  - API call with valid token
  - API call with expired token (triggers auto-refresh)
  - Logout flow (notify backend, clear tokens, redirect)
  - Connection switching (clear state, load new session, validate token)

- **E2E Tests** (optional but recommended)
  - Login → Navigate to collections → Logout
  - Login to Connection A → Switch to Connection B → Verify data isolation
  - Login → Close tab → Reopen (with/without "Remember Connection")

- **Coverage Goal**: 90%+ code coverage with 100% test pass rate

#### TR-007: Performance Requirements

- Login request must complete within 3 seconds (under normal network conditions)
- Token refresh must complete within 2 seconds
- Connection switching must complete within 3 seconds (including token validation and data fetch)
- HTTP client must cancel requests within 100ms when connection is switched
- UI must remain responsive during async operations (show loading indicator)

### Constraints and Dependencies

- Must use Moon API v1.99 authentication endpoints (no other auth systems supported)
- Frontend must be CORS-aware (backend CORS configuration is out of scope)
- Token expiration time is determined by backend (`expires_in` in response); frontend must respect it
- No support for OAuth, SAML, or other federated auth (username/password only)
- No support for multi-factor authentication (MFA) in this PRD (may be added in future)
- Browser localStorage availability is required for "Remember Connection" feature
- Must support latest versions of Chrome, Firefox, Safari, Edge (no IE11 support)

---

## Acceptance

### Acceptance Criteria

#### AC-001: Login View

- **Given** a user visits the Login View
- **When** they select a saved connection from the dropdown
- **Then** the Server URL, Username, and Password fields are auto-filled with saved values
- **And** if the saved connection has valid stored tokens, the user is automatically logged in without re-entering credentials

- **Given** a user enters valid credentials (Server URL, Username, Password)
- **When** they click "Connect" with "Remember Connection" checked
- **Then** the credentials and tokens are stored in `localStorage`
- **And** the user is redirected to `/#/admin/`
- **And** the user remains logged in after closing and reopening the browser

- **Given** a user enters valid credentials
- **When** they click "Connect" without checking "Remember Connection"
- **Then** the session is stored in-memory only
- **And** the user is logged out when the page is reloaded

- **Given** a user enters invalid credentials
- **When** they click "Connect"
- **Then** an error notification is displayed: "Invalid credentials. Please try again."
- **And** the user remains on the Login View

- **Given** a user enters an HTTP URL in production mode
- **When** they try to connect
- **Then** an error notification is displayed: "HTTPS is required for production. HTTP connections are not allowed."
- **And** the connection attempt is blocked

#### AC-002: Connection Manager

- **Given** a user opens the Connection Manager
- **When** they view the connection list
- **Then** all saved connections are displayed with Name, Server URL, Username, and Last Used timestamp

- **Given** a user clicks "Add New Connection"
- **When** they enter valid details (Name, Server URL, Username) and save
- **Then** the new connection is added to the list
- **And** the connection is stored in `localStorage`

- **Given** a user clicks "Delete" on a connection
- **When** they confirm the deletion
- **Then** the connection is removed from the list and `localStorage`
- **And** if it was the active connection, the user is logged out and redirected to Login View

- **Given** a user clicks "Test Connection" on a connection
- **When** the backend `/health` endpoint responds successfully
- **Then** a success message is displayed: "Connection successful"

- **Given** a user clicks "Test Connection" on a connection
- **When** the backend is unreachable
- **Then** an error message is displayed: "Connection failed: [reason]"

#### AC-003: JWT Token Storage

- **Given** a user logs in successfully
- **When** the backend returns `access_token`, `refresh_token`, and `expires_in`
- **Then** the tokens are stored in the connection session with calculated `expiresAt` timestamp
- **And** tokens are stored in `localStorage` if "Remember Connection" is enabled, or in-memory if disabled

- **Given** a user has multiple saved connections
- **When** they view stored sessions
- **Then** each connection has its own isolated session with unique tokens
- **And** tokens from Connection A are never used for Connection B

- **Given** a stored session exists in `localStorage`
- **When** the user reopens the browser
- **Then** the session is loaded and the user can access the backend without re-entering credentials (if tokens are still valid)

#### AC-004: HTTP Client Layer

- **Given** the HTTP client is configured with a valid access token
- **When** a GET request is made to `/collections:list`
- **Then** the `Authorization: Bearer <access_token>` header is automatically included
- **And** the request is sent to the `baseUrl` of the active connection

- **Given** the access token is expired
- **When** an API request is made
- **Then** the HTTP client automatically calls `/auth:refresh` with the refresh token
- **And** the new access token is stored in the session
- **And** the original API request is retried with the new access token

- **Given** the refresh token is expired or invalid
- **When** a token refresh is attempted
- **Then** the user is logged out
- **And** a notification is displayed: "Session expired. Please log in again."
- **And** the user is redirected to Login View

- **Given** a network error occurs (e.g., timeout)
- **When** an API request is made
- **Then** the HTTP client retries the request up to 3 times with exponential backoff
- **And** if all retries fail, a notification is displayed: "Network error. Please try again."

- **Given** an API returns a `400 Bad Request` error
- **When** the response is received
- **Then** the error is normalized to an `ApiError` object
- **And** a notification is displayed with the error message from the response

#### AC-005: Connection Switching

- **Given** a user is logged into Connection A and has unsaved changes
- **When** they select Connection B from the dropdown
- **Then** a confirmation dialog is displayed: "You have unsaved changes. Switching connections will discard them. Continue?"
- **And** if they click "Cancel", the switch is aborted and they remain on Connection A
- **And** if they click "Continue", the switch proceeds

- **Given** a user switches from Connection A to Connection B
- **When** the switch is completed
- **Then** all in-memory UI state (collections, records, forms) is cleared
- **And** Connection B's session is loaded
- **And** if Connection B's access token is valid, the user is logged into Connection B without re-entering credentials
- **And** fresh data is fetched from Connection B's backend
- **And** the UI displays Connection B's data

- **Given** a user switches to Connection B
- **When** Connection B's access token is expired but refresh token is valid
- **Then** the HTTP client automatically refreshes the access token
- **And** the user is logged into Connection B without re-entering credentials

- **Given** a user switches to Connection B
- **When** Connection B has no valid session or token refresh fails
- **Then** the user is redirected to Login View with Connection B pre-selected
- **And** a notification is displayed: "Session expired for [Connection Name]. Please log in."

- **Given** a user switches connections
- **When** the new connection's backend is unreachable
- **Then** a notification is displayed: "Failed to connect to [Connection Name]. Please check server status."
- **And** the user can select a different connection or return to Login View

#### AC-006: Logout Flow

- **Given** a user clicks "Logout"
- **When** they confirm the logout
- **Then** a request is sent to `/auth:logout` with the current access token and refresh token
- **And** the session tokens are cleared from storage
- **And** the user is redirected to Login View
- **And** a notification is displayed: "Logged out successfully"

- **Given** a user logs out and "Remember Connection" was enabled
- **When** they view saved connections
- **Then** the connection details (Name, Server URL, Username) are still saved
- **And** the tokens are removed (user must re-authenticate to get new tokens)

- **Given** a user's session expires (forced logout)
- **When** a token refresh fails
- **Then** the user is automatically logged out
- **And** a notification is displayed: "Session expired. Please log in again."
- **And** the original route is preserved in the `next` parameter for post-login redirect

#### AC-007: Security

- **Given** a user tries to save a connection with an HTTP URL in production mode
- **When** they submit the form
- **Then** the save is blocked
- **And** an error is displayed: "HTTPS is required for production. HTTP connections are not allowed."

- **Given** a token is issued by `https://moon.asensar.in`
- **When** a user switches to a connection with `baseUrl` = `https://staging.example.com`
- **Then** the token from the first connection is never used for the second connection
- **And** each connection uses its own scoped tokens

- **Given** a user saves a connection with "Remember Connection" enabled
- **When** they view `localStorage` in browser dev tools
- **Then** the tokens are visible (document this risk in `INSTALL.md`)

- **Given** a user saves a connection without "Remember Connection"
- **When** they reload the page
- **Then** the tokens are cleared (more secure, no persistence)

### Test Scenarios

#### TS-001: Successful Login with Remember Connection

1. Navigate to Login View
2. Enter valid Server URL (HTTPS), Username, Password
3. Check "Remember Connection"
4. Click "Connect"
5. **Verify**: User is redirected to `/#/admin/`
6. **Verify**: Tokens are stored in `localStorage`
7. Close browser and reopen
8. Navigate to app
9. **Verify**: User is automatically logged in without re-entering credentials

#### TS-002: Login without Remember Connection

1. Navigate to Login View
2. Enter valid credentials
3. Do NOT check "Remember Connection"
4. Click "Connect"
5. **Verify**: User is logged in
6. Reload page
7. **Verify**: User is logged out and redirected to Login View

#### TS-003: Login with Invalid Credentials

1. Navigate to Login View
2. Enter invalid Username or Password
3. Click "Connect"
4. **Verify**: Error notification is displayed: "Invalid credentials. Please try again."
5. **Verify**: User remains on Login View

#### TS-004: Automatic Token Refresh

1. Log in successfully
2. Wait for access token to expire (or mock expired token)
3. Make an API call (e.g., fetch collections list)
4. **Verify**: HTTP client detects token expiration
5. **Verify**: HTTP client calls `/auth:refresh` automatically
6. **Verify**: New access token is stored
7. **Verify**: Original API call is retried with new token
8. **Verify**: API call succeeds

#### TS-005: Token Refresh Failure (Forced Logout)

1. Log in successfully
2. Wait for refresh token to expire (or mock expired refresh token)
3. Make an API call
4. **Verify**: HTTP client attempts token refresh
5. **Verify**: Refresh fails with `401 Unauthorized`
6. **Verify**: User is logged out
7. **Verify**: Notification is displayed: "Session expired. Please log in again."
8. **Verify**: User is redirected to Login View

#### TS-006: Connection Switching with Valid Session

1. Log in to Connection A
2. Select Connection B from dropdown
3. **Verify**: Confirmation dialog is shown (if unsaved changes)
4. Confirm switch
5. **Verify**: UI state is cleared
6. **Verify**: Connection B's session is loaded
7. **Verify**: User is logged into Connection B without re-entering credentials
8. **Verify**: Fresh data from Connection B is displayed

#### TS-007: Connection Switching with Expired Session

1. Log in to Connection A
2. Manually expire tokens for Connection B (or wait for expiration)
3. Select Connection B from dropdown
4. **Verify**: User is redirected to Login View with Connection B pre-selected
5. **Verify**: Notification is displayed: "Session expired for [Connection Name]. Please log in."
6. Enter credentials for Connection B
7. **Verify**: User is logged into Connection B

#### TS-008: Logout Flow

1. Log in successfully
2. Click "Logout"
3. Confirm logout
4. **Verify**: `/auth:logout` request is sent to backend
5. **Verify**: Tokens are cleared from storage
6. **Verify**: User is redirected to Login View
7. **Verify**: Notification is displayed: "Logged out successfully"

#### TS-009: HTTPS Enforcement (Production)

1. Set environment to production mode
2. Navigate to Login View
3. Enter HTTP URL (e.g., `http://localhost:6006`)
4. Try to connect
5. **Verify**: Error is displayed: "HTTPS is required for production. HTTP connections are not allowed."
6. **Verify**: Connection is blocked

#### TS-010: Token Scoping (No Cross-Connection Token Reuse)

1. Log in to Connection A (`https://moon.asensar.in`)
2. Store tokens for Connection A
3. Switch to Connection B (`https://staging.example.com`)
4. **Verify**: Tokens from Connection A are not used for API calls to Connection B
5. **Verify**: Each connection uses its own tokens scoped to its `baseUrl`

#### TS-011: Connection Manager - Add, Edit, Delete

1. Open Connection Manager
2. Click "Add New Connection"
3. Enter Name, Server URL, Username
4. Save
5. **Verify**: New connection appears in list
6. Edit connection (change name)
7. **Verify**: Changes are saved
8. Delete connection
9. Confirm deletion
10. **Verify**: Connection is removed from list

#### TS-012: Network Error Retry

1. Log in successfully
2. Disconnect network (or mock network error)
3. Make an API call
4. **Verify**: HTTP client retries request 3 times with exponential backoff
5. **Verify**: After all retries fail, error notification is displayed: "Network error. Please try again."

### Edge Cases

#### E-001: Corrupted localStorage

- **Scenario**: User's `localStorage` contains invalid JSON or corrupted session data
- **Expected**: App gracefully handles error, clears corrupted data, and prompts user to log in
- **Verification**: No app crash; user can log in successfully after clearing corrupted data

#### E-002: Token Expiration During Connection Switch

- **Scenario**: User switches connections, and the target connection's access token expires during the switch
- **Expected**: HTTP client detects expiration and attempts token refresh before completing the switch
- **Verification**: User is logged into target connection without manual intervention (if refresh succeeds)

#### E-003: Backend Returns 500 Error During Token Refresh

- **Scenario**: User makes an API call, token expires, HTTP client attempts refresh, backend returns `500 Internal Server Error`
- **Expected**: HTTP client retries refresh up to 3 times; if all fail, user is logged out with error notification
- **Verification**: User is logged out after retries exhausted; notification displayed

#### E-004: Multiple Rapid Connection Switches

- **Scenario**: User rapidly switches between Connection A, B, C
- **Expected**: Each switch cancels in-flight requests from previous connection and loads new connection's session
- **Verification**: No data leakage; only data from final selected connection is displayed

#### E-005: User Closes Browser During Token Refresh

- **Scenario**: Token refresh is in progress, user closes browser
- **Expected**: On next browser open, if session was persisted, token refresh is re-attempted
- **Verification**: User is either logged in (if refresh succeeds) or prompted to log in (if refresh fails)

#### E-006: Backend Logout Endpoint Fails

- **Scenario**: User logs out, but `/auth:logout` request fails (e.g., network error, backend down)
- **Expected**: Frontend still clears tokens locally and redirects to Login View
- **Verification**: User is logged out client-side; notification displayed; backend may still consider session active (acceptable degradation)

#### E-007: Saved Connection with Expired Password

- **Scenario**: User saved a connection with password, but password was changed on backend
- **Expected**: Login attempt fails; user is prompted to enter new password
- **Verification**: Error notification displayed: "Invalid credentials"; user can update password in Connection Manager

#### E-008: CORS Error

- **Scenario**: User tries to connect to a backend that does not allow the app's origin in CORS policy
- **Expected**: Login request fails with CORS error; user sees notification
- **Verification**: Notification displayed: "Connection blocked by CORS policy. Please contact server administrator."

### Performance Benchmarks

- Login request completes in < 3 seconds (95th percentile)
- Token refresh completes in < 2 seconds (95th percentile)
- Connection switch completes in < 3 seconds (95th percentile)
- HTTP client cancels requests in < 100ms when connection is switched
- UI remains responsive (no blocking) during all async operations

### Documentation Requirements

- **INSTALL.md**: Document HTTPS requirement, CORS configuration, "Remember Connection" security implications, token storage behavior
- **README.md**: Provide overview of authentication system, connection management features, and security model
- **Code Comments**: Document all public methods in `HttpClient`, `AuthContext`, and `authService` with JSDoc comments

---

## Checklist

- [ ] Ensure all documentation (`SPEC.md`, `README.md`, `INSTALL.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
