## Overview

- Fix bug where viewing an existing user record displays empty field values instead of actual data
- When navigating to a record view URL like `/admin/users/{id}`, all fields show "—" (em dash) or empty values
- The record exists in the backend but the frontend fails to fetch or display the data correctly
- This breaks the core functionality of viewing individual records across all collections

## Requirements

- **Root Cause Investigation**
  - Investigate why the `RecordView` component is not fetching or rendering record data
  - Check if the API request is being made to the correct endpoint (e.g., `GET /admin/users/{id}`)
  - Verify the API response contains valid data and is structured as expected
  - Check if there are data mapping or rendering issues in the component

- **Data Fetching**
  - Ensure the component fetches the record data on mount using the correct collection name and record ID from the URL
  - Handle loading states properly while data is being fetched
  - Display loading indicators during data fetch
  - Handle API errors gracefully with user-friendly error messages

- **Data Rendering**
  - Correctly map fetched record data to field labels and values
  - Render actual field values instead of fallback "—" placeholders
  - Support all field types defined in the collection schema (string, email, date, role, etc.)
  - Format date/timestamp fields appropriately (e.g., "Created" field)
  - Display the record's primary identifier in the page title (e.g., "User: {username}")

- **Error Handling**
  - If the record is not found (404), display a clear error message
  - If the API request fails, show a notification and allow retry
  - If the user lacks permission to view the record, display an appropriate error

- **Validation**
  - Verify the fix works across all collections (users, roles, logs, etc.)
  - Test with various record IDs to ensure consistency
  - Ensure the fix does not break edit mode or other record operations

## Acceptance

- [ ] Navigating to an existing user record URL displays all field values correctly
- [ ] Field values are fetched from the backend API and rendered without empty placeholders
- [ ] The page title shows the record's identifier (e.g., "User: john_doe")
- [ ] All field types (string, email, date, role) are displayed properly
- [ ] Date/timestamp fields are formatted correctly
- [ ] Loading state is shown while data is being fetched
- [ ] API errors are handled gracefully with appropriate user feedback
- [ ] The fix applies to all collections (users, roles, logs, etc.), not just users
- [ ] Edit mode and other record operations remain functional
- [ ] Unit tests cover data fetching, rendering, and error scenarios
- [ ] E2E tests verify the record view workflow with real data
- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
