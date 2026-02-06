## Overview

- **What is this and why**: Develop a set of reusable, high-order UI components defined in `SPEC_UI.md`. These components (Table, Record View, Loading Bar) are the building blocks for all data management pages (Collections, Users, Keys).
- **Context**: The UI spec demands specific behaviors: inline editing (no modals), global progress indication, and consistent table layouts with search/pagination.
- **Goal**: Implement generic, testable components for `LoadingBar`, `DataTable`, and `RecordView` that can be reused across different data domains.

## Requirements

- **Global Loading Indicator**:
  - Component: `GlobalProgress`.
  - Behavior: Thin animated bar at the top of the screen.
  - Integration: Export a hook `useLoading()` or integrate with `HttpClient` to auto-trigger on requests.
  - Styles: Smooth animation, non-blocking.

- **Data Table Component**:
  - Component: `DataTable<T>`.
  - Props: `columns`, `data`, `pagination`, `onRowClick`, `onSearch`, `onPageChange`, `actions` (Import/Export).
  - Layout: Search bar top-left, Action buttons top-right, Sortable headers, Pagination footer.
  - Style: DaisyUI Table.

- **Record View Component**:
  - Component: `RecordView<T>`.
  - Props: `data`, `fields`, `onSave`, `onCancel`.
  - Internal State: `mode` ('view' | 'edit').
  - **View Mode**: Render values as plain text. Show "Edit" button.
  - **Edit Mode**: Render values as inputs (based on field type). Show "Save" / "Cancel".
  - Behavior: "Cancel" reverts changes and exits Edit Mode. "Save" calls prop and waits for resolution.

## Acceptance

- **Verification Steps**:
  1. **Loading Bar**: Trigger a fake async action -> Bar appears -> Disappears on finish.
  2. **Table**:
     - Render table with dummy data.
     - Click "Next" -> `onPageChange` called.
     - Type in Search -> `onSearch` called.
     - Click Row -> `onRowClick` called.
  3. **Record View**:
     - Render in View Mode.
     - Click Edit -> Input fields appear.
     - Change value -> Click Cancel -> Reverts to original text.
     - Click Save -> `onSave` called with new data.

- **Automated Tests**:
  - Test `DataTable` renders correct number of rows.
  - Test `RecordView` switches modes and handles Save/Cancel events correctly.
  - Test `useLoading` hook updates the progress bar state.

- **Checklist**:
  - [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
  - [ ] Run all tests and ensure 100% pass rate.
  - [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
