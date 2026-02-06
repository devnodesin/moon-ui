## Overview

- **What is this and why**: This task implements the core data viewing functionality of the Admin Dashboard. Users need to browse their available data collections and view records within them.
- **Overview**: We will create the Dashboard landing page and the dynamic Collections browsing interface. This involves fetching the list of collections from the Moon backend and creating a dynamic route to display records in a list/table format.
- **Overview**: Emphasis is on "fresh data" (no caching) and handling pagination and loading states gracefully.

## Requirements

- **What must it do?**
  - **Dashboard Home**:
    - Display a welcome message.
    - (Optional) Show a summary of available collections if the API supports it efficiently.
  - **Collections Navigation**:
    - Sidebar should dynamically list available collections (fetched from backend).
  - **Collection List View**:
    - Route: `/admin/collections/:collectionName`.
    - Fetch records for the selected collection.
    - Display records in a responsive Table or List view.
    - **Pagination**: Implement Next/Prev or Page Number navigation using API cursors/offsets.
    - **Loading State**: Show a progress indicator while fetching.
    - **Empty State**: Show a friendly message if the collection has no records.
    - **Error State**: Handle API errors (e.g., 404, 500) gracefully.

- **Requirements**
  - **Dynamic Routing**: The UI must handle any collection name without hardcoding.
  - **No Caching**: Every navigation to a collection must fetch fresh data.
  - **Responsiveness**: Tables must be scrollable or collapse into card views on mobile.
  - **Data Display**: Handle standard JSON types (Text, Number, Boolean, Date) in the table cells.

## Acceptance

- **How do we know it’s done?**
  - Clicking a collection in the sidebar loads the list view for that collection.
  - The list displays the correct records from the backend.
  - Pagination works: Clicking "Next" loads the next set of records.
  - Browser Back/Forward buttons work correctly with the list state.
  - Mobile view is usable (no broken tables).
  - "Loading..." is shown during network requests.

- **Acceptance Checklist**
  - [ ] Dashboard page created.
  - [ ] Sidebar dynamically populated with collections (or a "Collections" index page).
  - [ ] `CollectionList` page implemented.
  - [ ] API integration for `listCollections` and `listRecords`.
  - [ ] Pagination logic implemented.
  - [ ] Responsive Table component created.
  - [ ] Loading and Error states implemented.

## Documentation Checklist

- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
