## Overview

- **What is this and why**: Implement the reusable HTTP client layer that acts as the backbone for all data fetching. It handles the complexity of authentication, token lifecycle, error normalization, and networking resilience.
- **Context**: The app is a frontend-only SPA connecting to external Moon APIs. It must manage connection credentials securely and reliably without backend code.
- **Goal**: Create a robust `HttpClient` class/module that wraps `fetch` (or Axios), manages Access/Refresh tokens, handles 401 retries automatically, and normalizes errors for the UI.

## Requirements

- **Core Networking**:
  - Use `axios` (preferred for interceptors) or a wrapper around `fetch`.
  - Configurable `baseUrl` (per connection).
  - Default timeout (e.g., 30s).
  - Standard headers (`Content-Type: application/json`).

- **Authentication Logic**:
  - **Token Storage**: Implement an interface for retrieving tokens. Tokens are stored in Memory by default, or `localStorage` if "Remember Connection" is active.
  - **Request Interceptor**: Automatically attach `Authorization: Bearer <token>` to requests if a token exists.
  - **Response Interceptor (401 Handling)**:
    - Detect 401 Unauthorized responses.
    - Attempt to refresh the token using the `refreshToken`.
    - If refresh succeeds: Retry the original request transparently.
    - If refresh fails: Queue a "Session Expired" event/callback and reject the promise.
    - Prevent infinite refresh loops.

- **Error Handling**:
  - Normalize API errors into a standard `AppError` format `{ code, message, details }`.
  - Implement a Global Error Handler hook/callback that can be connected to the Notification System (in a later task).

- **Resilience**:
  - Implement simple retry logic for network errors (5xx or connection refused) with exponential backoff.

## Acceptance

- **Verification Steps**:
  1. Unit tests mocking the network adapter (e.g., `axios-mock-adapter` or `msw`).
  2. Verify correct headers are sent.
  3. Verify 401 triggers a refresh call, updates the token, and retries the original call.
  4. Verify 401 failure triggers a logout/error signal.

- **Automated Tests**:
  - Test `HttpClient.get/post` methods.
  - Test Interceptor logic:
    - Case: Valid token -> Request succeeds.
    - Case: Expired token (401) -> Refresh API called -> Retry succeeds.
    - Case: Refresh fails -> Error returned, Logout signal fired.
  - Test Error Normalization matches spec.

- **Checklist**:
  - [x] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
  - [x] Run all tests and ensure 100% pass rate.
  - [x] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
