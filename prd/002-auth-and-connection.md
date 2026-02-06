## Overview

- **What is this and why**: This module manages the connection lifecycle between the Moon Admin WebApp and external Moon API backends. It handles user authentication, session management, and the security constraints defined in `SPEC.md` (e.g., no caching, isolated connections).
- **Overview**: We will implement a robust Authentication and Connection Manager. This includes the logic for logging in, storing session tokens (in-memory or localStorage based on user preference), handling token refreshes, and switching between multiple backend connections without data leakage.
- **Overview**: A core component will be a custom HTTP Client wrapper that intercepts requests to inject tokens, handles 401/403 errors, and manages the "Login → API Calls → Token Refresh → Logout" flow.

## Requirements

- **What must it do?**
  - **Connection Management**:
    - Allow users to define multiple Moon backend connections (URL + Credentials).
    - Support switching between connections.
    - **Context Switching**: When switching, clear all in-memory data (collections, forms) to prevent leaks.
    - **Persistence**: If "Remember Connection" is OFF, store tokens in-memory only. If ON, persist session in `localStorage`.
  
  - **Authentication**:
    - Implement Login flow (Email/Password).
    - Handle Access Token and Refresh Token lifecycle.
    - Implement auto-logout on session expiration.
    - **Token Scope**: Tokens must be scoped to their specific `baseUrl`.

  - **HTTP Client**:
    - Create a reusable wrapper (e.g., using `axios` or `fetch`).
    - **Interceptors**:
      - Request: Inject `Authorization: Bearer <token>`.
      - Response: Intercept 401 to trigger Token Refresh.
      - Error: Normalize errors and trigger global notifications.
    - **Retry Logic**: Implement backoff/retries for transient failures.

- **Requirements**
  - **State Management**: Use React Context or a lightweight store (e.g., Zustand) to manage the current connection and session state.
  - **Security**:
    - Never share tokens across connections.
    - HTTPS required in production.
    - Handle "unsaved changes" warning before switching connections.
  - **UI**:
    - Login Screen (Connect to Server).
    - Connection Switcher component.
    - "Remember Me" checkbox.

## Acceptance

- **How do we know it’s done?**
  - User can connect to a Moon backend URL with credentials.
  - Upon success, the app transitions to the authenticated state.
  - **In-Memory Test**: Reloading the page clears the session if "Remember Me" was unchecked.
  - **Persistence Test**: Reloading the page restores the session if "Remember Me" was checked.
  - **Switching Test**: Switching from Connection A to Connection B clears data from A and authenticates B.
  - **Refresh Test**: Simulate an expired access token; the client automatically refreshes it without user interruption.
  - **Failure Test**: Simulate an invalid refresh token; the user is logged out and redirected to login.
  - **Unit Tests**:
    - HTTP Client correctly appends headers.
    - Token storage logic respects the "Remember" flag.
    - Context switch clears state.

- **Acceptance Checklist**
  - [ ] `AuthContext` or Store created.
  - [ ] HTTP Client wrapper implemented with interceptors.
  - [ ] Login UI implemented with "Remember Connection" toggle.
  - [ ] Token refresh logic works (mocked or integration tested).
  - [ ] Connection switching logic clears previous state.
  - [ ] LocalStorage usage is strictly opted-in.
  - [ ] 100% Test pass rate for auth logic.

- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
