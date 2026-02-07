## Overview

- **What is this and why**: Implement the administrative views for managing System Users (admins) and API Keys. This ensures the security and access control of the Moon backend can be managed via the UI.
- **Context**: `SPEC.md` requires management of Users and API Keys using the standard Table/Record patterns.
- **Goal**: Create views for `/admin/users` and `/admin/keys` to Create, Read, Update, and Delete system credentials.

## Requirements

- **User Management**:
  - Route: `/admin/users`.
  - **Table View**: List users (ID, Email, Role, CreatedAt).
  - **Create**: Add new admin user (Email, Password, Role).
  - **Edit**: Change password or role.
  - **Delete**: Remove user.
  - **Self-Protection**: Prevent deleting the current user (optional but good UX).

- **API Key Management**:
  - Route: `/admin/keys`.
  - **Table View**: List keys (Token/ID, Description, Expiry).
  - **Create**: Generate new API Key (Input: Description, Expiry).
    - *Note*: Show the token ONLY once upon creation.
  - **Revoke/Delete**: Invalidate a key.

- **UI Patterns**:
  - Use the shared `DataTable` component.
  - Use `RecordView` for User details (or a simplified form for Keys since they are usually immutable except for description).

- **Integration**:
  - `GET /api/users`, `POST /api/users`, etc.
  - `GET /api/keys`, `POST /api/keys`, etc.

## Acceptance

- **Verification Steps**:
  1. Navigate to `/admin/users` -> See list.
  2. Create User -> Fill form -> Submit -> User appears in list.
  3. Navigate to `/admin/keys` -> Create Key -> Copy token -> Key appears in list.
  4. Revoke Key -> Key disappears or status changes to "Revoked".

- **Automated Tests**:
  - Test User CRUD flows (mocking API).
  - Test API Key generation flow.
  - Test Error handling (e.g., duplicate email).

- **Checklist**:
  - [x] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
  - [x] Run all tests and ensure 100% pass rate.
  - [x] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
