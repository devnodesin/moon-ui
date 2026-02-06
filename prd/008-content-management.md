## Overview

- **What is this and why**: Implement the interface for managing Data Collections and their Records. This is the primary function of the CMS, allowing admins to view, search, edit, and create content.
- **Context**: Users need to browse a list of collections, drill down into records, and edit them using the `Table View` and `Record View` patterns defined in `SPEC_UI.md`.
- **Goal**: Create the routing and views for `/admin/collections` (List) and `/admin/collections/:name` (Records), integrating with the backend API.

## Requirements

- **Collection List View**:
  - Route: `/admin/collections`.
  - Fetch list of collections from API.
  - Display in `DataTable`.
  - Actions: Create New Collection (redirect or inline), Delete Collection.

- **Collection Records View**:
  - Route: `/admin/collections/:collectionName`.
  - Fetch records for the collection (paginated).
  - Display in `DataTable`.
  - Features: Search records, Sort, Pagination.
  - Actions: Import/Export (CSV/JSON), Create New Record.

- **Single Record View**:
  - Route: `/admin/collections/:collectionName/:id`.
  - Fetch single record details.
  - Render using `RecordView` component.
  - **View Mode**: Display fields (Text, Number, Boolean, Date, etc.).
  - **Edit Mode**: Input widgets corresponding to field types.
  - **Save**: PATCH update to API.

- **Data Handling**:
  - Use `HttpClient` to interact with `/api/collections/*`.
  - Handle schema validation based on field types (if schema available) or inferred types.
  - **No Caching**: Always fetch fresh data on navigation.

## Acceptance

- **Verification Steps**:
  1. Navigate to `/admin/collections` -> See list.
  2. Click a Collection -> See list of records.
  3. Click a Record -> See details in View Mode.
  4. Click Edit -> Change a value -> Save -> Verify success notification and data update.
  5. Test Pagination on a large collection.

- **Automated Tests**:
  - Test routing to correct views.
  - Test Integration: Mock API returns collection list -> Table renders rows.
  - Test Record Update flow: Mock Patch response -> Verify UI reverts to View Mode with new data.

- **Checklist**:
  - [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
  - [ ] Run all tests and ensure 100% pass rate.
  - [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
