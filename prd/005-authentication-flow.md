## Overview

- **What is this and why**: Implement the user interface and logic for the initial authentication. This is the gateway to the application, allowing users to connect to a Moon backend server.
- **Context**: The application starts at `/` (Login). Users must provide credentials and a server URL to establish a session.
- **Goal**: Create a secure, validated Login Form that integrates with the HTTP Client to obtain tokens and redirect the user to the private admin area.

## Requirements

- **UI Components (Login Page)**:
  - Route: `/` (Public).
  - Form Fields:
    - **Server URL**: Input for the Moon Backend API URL (valid URL format).
    - **Username/Email**: Required.
    - **Password**: Required, masked.
    - **Remember Connection**: Checkbox (Toggle persistence of tokens).
  - Actions: "Connect" / "Login" button.
  - Feedback: Loading spinner during request, Inline error messages for validation/API failures.

- **Interaction Logic**:
  - On Submit:
    1. Validate inputs.
    2. Call `AuthService.login({ baseUrl, username, password })`.
    3. On Success:
       - Initialize Session (store tokens in Memory or LocalStorage based on checkbox).
       - Redirect to `/admin` (or `?next` parameter if present).
    4. On Failure:
       - Show error notification/toast.
       - Reset sensitive fields if needed.

- **Session Handling**:
  - Upon successful login, the application state must be updated with the `currentConnection` details.
  - Ensure the `HttpClient` is updated with the new `baseUrl` and `accessToken`.

## Acceptance

- **Verification Steps**:
  1. Navigate to `/`.
  2. Enter valid credentials and URL.
  3. Click Login -> Redirects to `/admin`.
  4. Verify tokens are stored (check DevTools Application tab if "Remember" checked, else verify memory state).
  5. Enter invalid credentials -> Show error message.

- **Automated Tests**:
  - Test Form Validation (empty fields, invalid URL).
  - Test Submission logic (mock API call).
  - Test "Remember Connection" logic (verify storage calls).
  - Test Redirect logic.

- **Checklist**:
  - [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
  - [ ] Run all tests and ensure 100% pass rate.
  - [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
