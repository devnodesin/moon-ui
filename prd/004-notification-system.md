## Overview

- **What is this and why**: Implement a centralized notification system to inform users of system state, errors, and successful actions. This is critical for UX in an async, remote-data application.
- **Context**: `SPEC.md` requires a robust system that shows auto-dismissing toasts AND maintains a history accessible via a "Notifications Page".
- **Goal**: Create a Global Notification Store and UI components (Toast container + History View) that can be triggered from anywhere in the app.

## Requirements

- **State Management**:
  - Store notifications in a global state (e.g., React Context or Zustand).
  - Structure: `{ id, type: 'info'|'success'|'warning'|'error', message, timestamp, read: boolean }`.
  - In-memory only (cleared on reload).

- **Toast UI**:
  - Fixed position container (e.g., bottom-right or top-right).
  - Render active/recent notifications using DaisyUI `alert` or `toast` components.
  - Auto-dismiss logic (e.g., 5 seconds) for the *Toast*, but keep the record in *History*.
  - Manual close button on toasts.

- **Notification History Page**:
  - A dedicated route (`/admin/notifications`).
  - Lists all session notifications in reverse chronological order.
  - "Clear All" button to empty the history.
  - Visual distinction by type (colors/icons).

- **Integration API**:
  - Export a hook `useNotify()` with methods: `notify.success()`, `notify.error()`, etc.
  - Ability to programmatically add notifications (used by HTTP Client later).

## Acceptance

- **Verification Steps**:
  1. Trigger a notification -> Toast appears -> Disappears after N seconds.
  2. Navigate to `/admin/notifications` -> See the notification in the list.
  3. Click "Clear All" -> List is empty.
  4. Verify styling for different types (Green for success, Red for error, etc.).

- **Automated Tests**:
  - Test adding a notification updates the store.
  - Test auto-dismiss timer removes it from "active toasts" but keeps it in store.
  - Test "Clear All" resets the store.

- **Checklist**:
  - [x] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
  - [x] Run all tests and ensure 100% pass rate.
  - [x] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
