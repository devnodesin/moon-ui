## Overview

- **What is this and why**: This task implements the ability to modify data within collections. Users need to Create new records, Update existing ones, and Delete obsolete data.
- **Overview**: We will implement a generic Form interface that adapts to the schema of the collection (or allows free-form JSON editing if schema is flexible). We will also add "Delete" actions with confirmation dialogs.
- **Overview**: This completes the full management cycle (CRUD) for collection records.

## Requirements

- **What must it do?**
  - **Create Record**:
    - Route: `/admin/collections/:collectionName/create`.
    - Form to input field values.
    - Submit sends POST request.
    - On success, redirect to List View or stay on Create (configurable).
  - **Edit Record**:
    - Route: `/admin/collections/:collectionName/:id`.
    - Fetch existing record data.
    - Populate form.
    - Submit sends PUT/PATCH request.
  - **Delete Record**:
    - accessible from List View (row action) or Edit View.
    - **Confirmation**: Must prompt user "Are you sure?" before deleting.
    - On success, refresh list or redirect to List View.
  
- **Requirements**
  - **Form Handling**:
    - Support basic field types (Text, Number, Boolean).
    - Support JSON editor for complex/nested fields.
  - **Validation**: Client-side validation for required fields (if schema known).
  - **Feedback**: Success toasts on completion; Error alerts on failure.
  - **Unsaved Changes**: Warn user if they try to navigate away with dirty form.

## Acceptance

- **How do we know it’s done?**
  - User can create a new record and see it appear in the list.
  - User can edit a record, save, and see the changes.
  - User can delete a record, and it disappears from the list.
  - Cancel button returns to List View.
  - Delete dialog prevents accidental deletions.

- **Acceptance Checklist**
  - [ ] `RecordForm` component created (reused for Create/Edit).
  - [ ] Create Record page implemented.
  - [ ] Edit Record page implemented.
  - [ ] Delete logic and Confirmation Modal implemented.
  - [ ] API integration for `createRecord`, `updateRecord`, `deleteRecord`.
  - [ ] "Unsaved Changes" route guard implemented.

## Documentation Checklist

- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
