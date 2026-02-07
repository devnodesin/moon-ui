## Overview

- **What is this and why**: Implement the capability to manage and switch between multiple Moon backend connections. This allows an admin to manage different environments (e.g., Staging, Production) or different projects from a single SPA instance.
- **Context**: `SPEC.md` outlines a strict "Connection Switching Flow" that ensures data isolation and security (clearing memory, validating tokens).
- **Goal**: Create a Connection Manager (logic + UI) to store connection details, list available connections, and handle the safe transition between them.

## Requirements

- **Data Structure**:
  - Define `ConnectionProfile`: `{ id, label, baseUrl, lastActive }`.
  - Store list of profiles in `localStorage` (if "Remember" was used) or Memory.

- **Switching Logic (The "Flow")**:
  - **Trigger**: User selects a connection from a dropdown/list.
  - **Pre-check**: Check for "Unsaved Changes" flag (global state). If true, Prompt Confirmation.
  - **Teardown**:
    - Clear all in-memory application data (Collections, Forms, Stores).
    - Clear current `HttpClient` headers.
  - **Setup**:
    - Load target connection details.
    - Retrieve stored tokens (if available).
    - **Validation**:
      - If tokens exist: Call `refreshToken` endpoint to verify validity.
      - If valid: Update `HttpClient` and UI.
      - If invalid/missing: Redirect to `/login` (pre-filling the baseUrl) with a message "Please login to [Connection Name]".

- **UI Components**:
  - **Connection Switcher**: A dropdown or modal in the Sidebar/Settings.
  - **Connection List**: A page or section to "Forget" or "Edit" connections.

## Acceptance

- **Verification Steps**:
  1. Login to Server A (Remember checked).
  2. Login to Server B (Remember checked).
  3. Use Switcher to go back to Server A.
  4. Verify Data from Server B is gone.
  5. Verify Token for Server A is active.
  6. Verify UI updates to show Server A context.

- **Automated Tests**:
  - Test Switching Logic:
    - Assert `clearStore()` is called.
    - Assert `HttpClient` base URL changes.
  - Test Unsaved Changes Prompt (mock state).
  - Test Token Validation flow during switch.

- **Checklist**:
  - [x] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
  - [x] Run all tests and ensure 100% pass rate.
  - [x] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
