## Overview

- Fix bug where navigating to the "new record" route opens in view mode instead of edit mode
- When users navigate to `/admin/users/new` (or any collection's "new" route), the page displays in read-only view mode with an "Edit" button
- New record creation should immediately open in edit mode with input fields, allowing users to enter data directly
- This affects user experience across all collections and prevents efficient record creation

## Requirements

- **Route Detection**
  - Detect when the route contains `/new` as the record identifier (e.g., `/admin/{collection}/new`)
  - Distinguish between viewing an existing record and creating a new record based on the URL path

- **Initial State**
  - When the record ID is `"new"`, the component should initialize in edit mode by default
  - Pre-populate form fields with default values from the collection schema (if defined)
  - Do not show the "Edit" button when in new record creation mode
  - Replace "Edit" button with "Save" and "Cancel" buttons

- **Form Rendering**
  - Display editable input fields for all required and optional schema properties
  - Use appropriate input types for each field (text, email, password, select, date, etc.)
  - Show validation constraints and required field indicators
  - Apply any default values defined in the schema

- **User Workflow**
  - Users should see a form immediately upon navigating to the "new" route
  - "Save" button should create the new record via POST request to the backend
  - "Cancel" button should navigate back to the collection list
  - Show validation errors inline as users fill out the form
  - Display success notification after record creation and navigate to the new record's view page

- **Title and UI**
  - Page title should reflect the creation intent (e.g., "New User" instead of "User: ")
  - Breadcrumb or back button should navigate to the collection list
  - UI should clearly indicate the user is creating a new record

- **Edge Cases**
  - If the user navigates away without saving, prompt for confirmation (optional)
  - If required fields are missing, prevent form submission and highlight errors
  - If the API request fails, show error notification and allow retry

- **Cross-Collection Consistency**
  - The fix must apply to all collections (users, roles, logs, etc.)
  - Ensure the behavior is consistent across all "new record" routes

## Acceptance

- [ ] Navigating to `/admin/users/new` opens the page in edit mode by default
- [ ] No "Edit" button is shown; instead, "Save" and "Cancel" buttons are visible
- [ ] All form fields are rendered as editable inputs (text, email, password, select, etc.)
- [ ] Default values from the schema are pre-populated in the form
- [ ] Required fields are clearly indicated with validation constraints
- [ ] Clicking "Save" creates a new record and navigates to the record's view page
- [ ] Clicking "Cancel" navigates back to the collection list without creating a record
- [ ] Validation errors are displayed inline when users submit incomplete or invalid data
- [ ] Success notification is shown after successful record creation
- [ ] API errors are handled gracefully with user-friendly error messages
- [ ] The fix applies consistently to all collections (not just users)
- [ ] Page title displays "New {Collection}" (e.g., "New User")
- [ ] Unit tests cover the "new record" route, form rendering, and submission logic
- [ ] E2E tests verify the new record creation workflow end-to-end
- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
