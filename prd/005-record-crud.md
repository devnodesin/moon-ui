## Overview

This PRD defines the implementation requirements for complete CRUD (Create, Read, Update, Delete) operations on collection records in the Moon Admin WebApp. The feature enables users to view, create, edit, and delete individual records within any collection, with support for bulk import/export operations in CSV and JSON formats.

**Problem Statement:**
Users need a streamlined, mobile-first interface to manage individual records within collections. The existing Table View (PRD-004) provides list and navigation capabilities, but users require dedicated functionality to:
- View detailed record data in a read-only format
- Edit records inline without modal dialogs
- Create new records from scratch
- Delete records with confirmation
- Bulk import/export records for data migration and backup

**Context:**
- This feature builds upon PRD-004 (Collections Read) which provides the Table View
- Records are rows within collections (tables in database terminology)
- Moon API provides RESTful endpoints for all CRUD operations: `:get`, `:create`, `:update`, `:destroy`
- The UI must follow the "no modals for records" rule from SPEC_UI.md
- All data must be fetched fresh from the backend (no caching) per SPEC.md
- Mobile-first responsive design is mandatory

**Solution Summary:**
Implement a Record View component with two distinct modes (View Mode and Edit Mode) that operates inline without modals. Add action buttons to the Table View for creating new records and importing data. Provide record-level actions for editing and deletion. Include CSV/JSON import and export functionality accessible from the Table View toolbar. Implement comprehensive validation, error handling, and unsaved changes warnings.

---

## Requirements

### Functional Requirements

#### FR1: Record View Component
- **FR1.1:** Implement a `RecordView` component that displays a single record's data
- **FR1.2:** Support two modes within the same component: View Mode (default) and Edit Mode
- **FR1.3:** Route: Clicking a row in Table View navigates to the Record View for that specific record
- **FR1.4:** Display a "Back" button at the top-left to return to Table View
- **FR1.5:** Preserve Table View state (filters, sort, pagination) when returning via Back button
- **FR1.6:** Render all fields from the collection schema retrieved via `/{collection}:schema`

#### FR2: View Mode (Read-Only Display)
- **FR2.1:** Display all record fields as plain, non-editable text
- **FR2.2:** Field labels must match the field names from the collection schema
- **FR2.3:** Format field values according to their type:
  - `string`: Display as plain text
  - `integer`: Display as numeric value
  - `decimal`: Display with appropriate decimal places (e.g., "29.99")
  - `boolean`: Display as "true" or "false" or use checkmark/cross icons
  - `datetime`: Display in human-readable format (e.g., "Jan 31, 2023 1:45 PM")
  - `json`: Display formatted JSON or a collapsible tree view
- **FR2.4:** Show an "Edit" button in the top-right corner of the view
- **FR2.5:** Clicking "Edit" transitions the same view to Edit Mode (no page reload)
- **FR2.6:** Handle null/empty field values gracefully (display as empty or "N/A")
- **FR2.7:** The `id` field must be visible but never editable

#### FR3: Edit Mode (Inline Editing)
- **FR3.1:** Transform all editable fields into inline input controls when Edit Mode is activated
- **FR3.2:** Use minimal UI for editable fields:
  - Input fields with subtle underline or light border (DaisyUI input styles)
  - No heavy form boxes or prominent borders
  - Focus states should be subtle but visible
- **FR3.3:** The `id` field must remain read-only (display as text, not input)
- **FR3.4:** The "Edit" button becomes disabled or hidden in Edit Mode
- **FR3.5:** Display "Save" and "Cancel" buttons at the bottom of the form
- **FR3.6:** Input field types must match the field data types:
  - `string`: Text input
  - `integer`: Number input (step=1, no decimals)
  - `decimal`: Number input (step=0.01 or appropriate)
  - `boolean`: Checkbox or toggle
  - `datetime`: Date/time picker or text input with format hint
  - `json`: Textarea with JSON validation or JSON editor component
- **FR3.7:** Pre-populate all input fields with current record values
- **FR3.8:** Clicking "Cancel" reverts all changes and returns to View Mode without saving
- **FR3.9:** Clicking "Save" validates input and submits via `POST /{collection}:update`

#### FR4: Create New Record
- **FR4.1:** Add a "+ New Record" button in the Table View toolbar (top-right, next to search)
- **FR4.2:** Clicking "+ New Record" navigates to a new Record View in Edit Mode with empty fields
- **FR4.3:** Pre-populate fields with default values if defined in schema (or leave empty)
- **FR4.4:** Do not display the `id` field during creation (server generates it)
- **FR4.5:** Display "Save" and "Cancel" buttons
- **FR4.6:** Clicking "Save" validates input and submits via `POST /{collection}:create`
- **FR4.7:** On successful creation, display success notification and navigate to the newly created record in View Mode
- **FR4.8:** Clicking "Cancel" discards the new record and returns to Table View

#### FR5: Update Record (Edit Mode Save)
- **FR5.1:** Collect all field values from input controls
- **FR5.2:** Validate all fields according to requirements (see FR7)
- **FR5.3:** On validation failure, display inline error messages below invalid fields and block submission
- **FR5.4:** On validation success, submit `POST /{collection}:update` with:
  ```json
  {
    "id": "<RECORD_ID>",
    "data": {
      "field1": "value1",
      "field2": "value2"
    }
  }
  ```
- **FR5.5:** Show a loading indicator during the request
- **FR5.6:** On success (200/201):
  - Display success notification: "Record updated successfully"
  - Transition to View Mode with the updated data
  - Fetch fresh data from backend (no local caching)
- **FR5.7:** On failure (4xx/5xx):
  - Display error notification with the API error message
  - Keep the user in Edit Mode with their input preserved
  - Allow retry after correcting errors

#### FR6: Delete Record
- **FR6.1:** Add a "Delete" button in the Record View (top-right, next to Edit button)
- **FR6.2:** Clicking "Delete" shows a confirmation dialog (use DaisyUI modal):
  - Message: "Are you sure you want to delete this record? This action cannot be undone."
  - Buttons: "Cancel" and "Delete" (danger style)
- **FR6.3:** Clicking "Cancel" in confirmation closes the dialog, no action taken
- **FR6.4:** Clicking "Delete" in confirmation submits `POST /{collection}:destroy` with:
  ```json
  {
    "id": "<RECORD_ID>"
  }
  ```
- **FR6.5:** Show a loading indicator during the request
- **FR6.6:** On success (200/201):
  - Display success notification: "Record deleted successfully"
  - Navigate back to Table View
  - Table View must refresh to reflect the deletion
- **FR6.7:** On failure (4xx/5xx):
  - Display error notification with the API error message
  - Close confirmation dialog
  - Keep user on Record View

#### FR7: Form Validation
- **FR7.1:** Validate all required fields (based on schema `nullable: false`)
- **FR7.2:** Required field validation:
  - Display error message "This field is required" below empty required fields on blur or submit
  - Highlight invalid fields with error border color (DaisyUI error styles)
- **FR7.3:** Type validation:
  - `integer`: Must be a whole number, no decimals
  - `decimal`: Must be a valid number with decimals
  - `boolean`: Must be true/false or checked/unchecked
  - `datetime`: Must be valid RFC3339 or ISO 8601 format if entered manually
  - `json`: Must be valid JSON syntax
- **FR7.4:** Display inline validation errors immediately on field blur
- **FR7.5:** Block form submission if any validation errors exist
- **FR7.6:** Clear validation errors when user corrects the input
- **FR7.7:** Display a summary error notification if submission fails due to validation: "Please correct the errors below"

#### FR8: Unsaved Changes Warning
- **FR8.1:** Track all field changes in Edit Mode using component state
- **FR8.2:** Detect unsaved changes by comparing current field values with original values
- **FR8.3:** When user attempts to navigate away (Back button, browser back, route change) while unsaved changes exist:
  - Show a confirmation dialog (use browser native `beforeunload` and React router prompt)
  - Message: "You have unsaved changes. Are you sure you want to leave?"
  - Buttons: "Stay" and "Leave"
- **FR8.4:** Clicking "Stay" cancels navigation, keeps user in Edit Mode
- **FR8.5:** Clicking "Leave" discards unsaved changes and proceeds with navigation
- **FR8.6:** After successful save or explicit cancel, clear the unsaved changes flag
- **FR8.7:** Do not show warning when navigating from View Mode (no edits)

#### FR9: CSV Import (Bulk Record Creation)
- **FR9.1:** Add an "Import" button in the Table View toolbar (next to Export button)
- **FR9.2:** Clicking "Import" opens a modal with file format selection: "CSV" or "JSON"
- **FR9.3:** CSV Import Requirements:
  - Allow user to select a CSV file via file input
  - Parse CSV with first row as header (field names)
  - Map CSV columns to collection fields by matching header names (case-insensitive)
  - Validate CSV structure: headers must match existing collection fields
  - Display preview of first 5 rows before import
  - Show "Cancel" and "Import" buttons
- **FR9.4:** On "Import" click:
  - Validate each row according to FR7 validation rules
  - For each valid row, submit `POST /{collection}:create`
  - Show progress indicator: "Importing X of Y records..."
  - Collect success and failure counts
- **FR9.5:** After import completion:
  - Display summary notification: "Successfully imported X records. Y failures."
  - If failures exist, offer to download error log (CSV with failed rows and error messages)
  - Close modal and refresh Table View to show imported records
- **FR9.6:** CSV format example:
  ```csv
  title,price,quantity,brand
  Wireless Mouse,29.99,10,Wow
  USB Keyboard,19.99,25,Wow
  ```

#### FR10: JSON Import (Bulk Record Creation)
- **FR10.1:** JSON Import Requirements:
  - Allow user to select a JSON file via file input
  - JSON must be an array of objects: `[{...}, {...}]`
  - Each object represents one record with field-value pairs
  - Validate JSON syntax and structure
  - Display preview of first 5 records before import
- **FR10.2:** On "Import" click:
  - Validate each object according to FR7 validation rules
  - For each valid object, submit `POST /{collection}:create`
  - Show progress indicator: "Importing X of Y records..."
  - Collect success and failure counts
- **FR10.3:** After import completion:
  - Display summary notification: "Successfully imported X records. Y failures."
  - If failures exist, offer to download error log (JSON array with failed records and error messages)
  - Close modal and refresh Table View to show imported records
- **FR10.4:** JSON format example:
  ```json
  [
    {"title": "Wireless Mouse", "price": "29.99", "quantity": 10, "brand": "Wow"},
    {"title": "USB Keyboard", "price": "19.99", "quantity": 25, "brand": "Wow"}
  ]
  ```

#### FR11: CSV Export (Bulk Record Download)
- **FR11.1:** Add an "Export" button with dropdown in the Table View toolbar: "Export as CSV" and "Export as JSON"
- **FR11.2:** Clicking "Export as CSV":
  - Fetch all records from `GET /{collection}:list` (handle pagination if needed)
  - Convert records to CSV format with first row as headers (field names)
  - Include all fields from the collection schema
  - Trigger browser download with filename: `{collection}_export_{timestamp}.csv`
- **FR11.3:** CSV export format:
  - First row: field names (headers)
  - Subsequent rows: record values
  - Escape special characters (commas, quotes) per CSV standard (RFC 4180)
  - Use UTF-8 encoding
- **FR11.4:** Show loading indicator: "Exporting records..."
- **FR11.5:** On success, display notification: "Exported X records to CSV"
- **FR11.6:** On failure, display error notification with API error message

#### FR12: JSON Export (Bulk Record Download)
- **FR12.1:** Clicking "Export as JSON":
  - Fetch all records from `GET /{collection}:list` (handle pagination if needed)
  - Convert records to JSON array format: `[{...}, {...}]`
  - Include all fields and preserve data types
  - Trigger browser download with filename: `{collection}_export_{timestamp}.json`
- **FR12.2:** JSON export format:
  - Array of objects
  - Pretty-printed with 2-space indentation for readability
  - Use UTF-8 encoding
- **FR12.3:** Show loading indicator: "Exporting records..."
- **FR12.4:** On success, display notification: "Exported X records to JSON"
- **FR12.5:** On failure, display error notification with API error message

### Technical Requirements

#### TR1: API Integration
- **TR1.1:** Use the HTTP client layer from PRD-002 for all API requests (with token refresh and error handling)
- **TR1.2:** Moon API endpoints for records:
  - `GET /{collection}:get?id=<RECORD_ID>` - Get single record
  - `POST /{collection}:create` - Create new record
  - `POST /{collection}:update` - Update existing record
  - `POST /{collection}:destroy` - Delete record
  - `GET /{collection}:schema` - Get collection schema (for field metadata)
  - `GET /{collection}:list` - List records (for export)
- **TR1.3:** All requests must include `Authorization: Bearer <ACCESS_TOKEN>` header
- **TR1.4:** Handle token expiration and auto-refresh per PRD-002 requirements
- **TR1.5:** Always fetch fresh data from backend (no client-side caching)

#### TR2: Component Architecture
- **TR2.1:** Create `RecordView.tsx` component with props:
  - `collectionName: string` - Name of the collection
  - `recordId?: string` - ID of record to view/edit (undefined for new record)
  - `mode?: 'view' | 'edit'` - Initial mode (default: 'view')
- **TR2.2:** Create `RecordForm.tsx` component for Edit Mode rendering
- **TR2.3:** Create `ImportModal.tsx` component for CSV/JSON import
- **TR2.4:** Create `useRecordCRUD` custom hook to encapsulate CRUD logic and API calls
- **TR2.5:** Use React Context or props for passing collection schema to child components
- **TR2.6:** Implement proper TypeScript interfaces for record data and API responses

#### TR3: Routing
- **TR3.1:** Route pattern: `/#/admin/collections/{collection}/records/{recordId}` for viewing/editing existing record
- **TR3.2:** Route pattern: `/#/admin/collections/{collection}/records/new` for creating new record
- **TR3.3:** Use React Router's `useNavigate` for programmatic navigation
- **TR3.4:** Use React Router's `useBlocker` or `Prompt` for unsaved changes warning
- **TR3.5:** Pass collection name and recordId as route params
- **TR3.6:** Preserve Table View state in location state when navigating to Record View

#### TR4: State Management
- **TR4.1:** Use React `useState` for component-local state (field values, validation errors, loading states)
- **TR4.2:** Track original record data separately from edited values for unsaved changes detection
- **TR4.3:** Use `useEffect` to fetch record data on component mount or when recordId changes
- **TR4.4:** Use `useEffect` to fetch collection schema on component mount
- **TR4.5:** Clear state on mode change (View ↔ Edit) and on successful save/cancel

#### TR5: Loading and Error States
- **TR5.1:** Display a loading spinner or skeleton screen while fetching record data
- **TR5.2:** Display loading indicator on buttons during save/delete operations (disable button, show spinner)
- **TR5.3:** Display error state if record fetch fails (404 or other errors)
- **TR5.4:** Provide "Retry" button on fetch errors to re-attempt loading
- **TR5.5:** Use the global notification system (from SPEC.md) for all error and success messages
- **TR5.6:** Follow notification UX from SPEC_UI.md: auto-dismiss after 4-6 seconds

#### TR6: Mobile-First Responsive Design
- **TR6.1:** Record View layout must be single-column on mobile (< 768px)
- **TR6.2:** Stack fields vertically with full-width inputs
- **TR6.3:** Action buttons (Edit, Save, Cancel, Delete) must be touch-friendly (min 44x44px tap targets)
- **TR6.4:** Use DaisyUI responsive classes (e.g., `btn-sm md:btn-md`)
- **TR6.5:** Ensure form inputs are easily tappable and zoom-appropriate on mobile devices
- **TR6.6:** Import/Export modals must be responsive and scrollable on small screens

#### TR7: Theme and Styling
- **TR7.1:** Use DaisyUI components and Tailwind CSS for all styling
- **TR7.2:** Support both light (`autumn`) and dark (`abyss`) themes
- **TR7.3:** Apply DaisyUI form control classes: `input`, `input-bordered`, `label`, `form-control`
- **TR7.4:** Use DaisyUI button classes: `btn`, `btn-primary`, `btn-error`, `btn-ghost`
- **TR7.5:** Style validation errors with DaisyUI error classes: `input-error`, `label-text-alt text-error`
- **TR7.6:** Ensure sufficient contrast for accessibility in both themes

#### TR8: CSV/JSON Parsing and Generation
- **TR8.1:** Use a reliable CSV parsing library (e.g., `papaparse`, `csv-parse`)
- **TR8.2:** Use native `JSON.parse()` and `JSON.stringify()` for JSON handling
- **TR8.3:** Implement CSV generation following RFC 4180 standard
- **TR8.4:** Handle encoding issues (UTF-8 BOM for Excel compatibility if needed)
- **TR8.5:** Validate file size limits (e.g., max 10MB) before processing
- **TR8.6:** Stream large files if possible, or process in batches to avoid memory issues

### Constraints

#### C1: Moon API Constraints
- **C1.1:** Moon API only supports `GET`, `POST`, and `OPTIONS` methods (no PUT, PATCH, DELETE methods)
- **C1.2:** Update and delete operations use `POST` method
- **C1.3:** Record IDs are server-generated ULIDs (e.g., `01KGD5E74RYS0WTNARQC92S1P7`)
- **C1.4:** The `id` field is read-only and cannot be modified or set by client
- **C1.5:** Field types are limited to: `string`, `integer`, `decimal`, `boolean`, `datetime`, `json`
- **C1.6:** No transaction support; each create/update/delete is independent

#### C2: UI Constraints
- **C2.1:** No modals for viewing or editing records (inline only, per SPEC_UI.md)
- **C2.2:** Modals are allowed only for: delete confirmation, import dialogs
- **C2.3:** All record operations must be within the Record View component
- **C2.4:** Must support touch interactions on mobile devices
- **C2.5:** Must work in latest versions of Chrome, Firefox, Safari, Edge

#### C3: Performance Constraints
- **C3.1:** Record View must load and render within 2 seconds on typical network
- **C3.2:** Save/update operations must provide immediate feedback (loading indicator)
- **C3.3:** Import operations should process at least 100 records per second
- **C3.4:** Export operations must handle at least 10,000 records without freezing UI
- **C3.5:** Use Web Workers for large import/export processing if necessary

#### C4: Security Constraints
- **C4.1:** All API requests must include valid authentication token
- **C4.2:** Validate and sanitize all user input before submission
- **C4.3:** Do not store sensitive record data in localStorage (in-memory only)
- **C4.4:** Escape user-generated content when rendering to prevent XSS
- **C4.5:** Follow CORS policies; do not bypass browser security

---

## Acceptance

### AC1: Record View - View Mode
- ✅ User can click a row in Table View and navigate to Record View
- ✅ Record View displays all fields as read-only plain text
- ✅ Field values are formatted correctly according to data type
- ✅ "Back" button navigates back to Table View with preserved state
- ✅ "Edit" button is visible at the top-right
- ✅ `id` field is displayed but not editable
- ✅ Null/empty fields display gracefully (empty or "N/A")

### AC2: Record View - Edit Mode
- ✅ Clicking "Edit" button transitions to Edit Mode without page reload
- ✅ All editable fields become inline input controls with subtle styling
- ✅ `id` field remains read-only (displayed as text)
- ✅ Input fields are pre-populated with current record values
- ✅ "Edit" button is disabled in Edit Mode
- ✅ "Save" and "Cancel" buttons are displayed at the bottom
- ✅ Input types match field data types (text, number, checkbox, date, etc.)

### AC3: Create New Record
- ✅ "+ New Record" button is visible in Table View toolbar
- ✅ Clicking "+ New Record" navigates to Record View in Edit Mode with empty fields
- ✅ `id` field is not displayed during creation
- ✅ Fields are empty or have default values
- ✅ "Save" button submits `POST /{collection}:create` with all field values
- ✅ On success, user sees success notification and navigates to new record in View Mode
- ✅ "Cancel" button returns to Table View without creating record

### AC4: Update Record
- ✅ User can edit field values in Edit Mode
- ✅ Clicking "Save" validates all fields
- ✅ Validation errors prevent submission and display inline error messages
- ✅ On validation success, `POST /{collection}:update` is submitted with `id` and `data`
- ✅ Loading indicator is shown during save operation
- ✅ On success, user sees "Record updated successfully" notification and returns to View Mode
- ✅ On failure, error notification is shown and user remains in Edit Mode with data preserved
- ✅ Fresh data is fetched from backend after successful save (no caching)

### AC5: Cancel Editing
- ✅ Clicking "Cancel" in Edit Mode reverts all changes
- ✅ User returns to View Mode with original data displayed
- ✅ No API call is made on cancel

### AC6: Delete Record
- ✅ "Delete" button is visible in Record View (View Mode)
- ✅ Clicking "Delete" opens confirmation modal: "Are you sure you want to delete this record?"
- ✅ Modal has "Cancel" and "Delete" buttons
- ✅ Clicking "Cancel" closes modal, no action taken
- ✅ Clicking "Delete" submits `POST /{collection}:destroy` with record `id`
- ✅ Loading indicator is shown during delete operation
- ✅ On success, user sees "Record deleted successfully" notification and navigates to Table View
- ✅ Table View refreshes to reflect the deletion
- ✅ On failure, error notification is shown and user remains on Record View

### AC7: Form Validation
- ✅ Required fields (schema `nullable: false`) cannot be empty
- ✅ Empty required fields show error message "This field is required" on blur or submit
- ✅ Invalid fields are highlighted with error border color
- ✅ Type validation is enforced:
  - Integer fields reject decimal input
  - Decimal fields accept numeric values with decimals
  - JSON fields reject invalid JSON syntax
  - Datetime fields reject invalid date formats
- ✅ Validation errors appear inline below the field
- ✅ Validation errors clear when user corrects the input
- ✅ Form submission is blocked if any validation errors exist
- ✅ Summary error notification appears if submission fails: "Please correct the errors below"

### AC8: Unsaved Changes Warning
- ✅ Editing any field value sets "unsaved changes" flag
- ✅ Attempting to navigate away (Back, browser back, route change) with unsaved changes triggers confirmation
- ✅ Confirmation dialog shows: "You have unsaved changes. Are you sure you want to leave?"
- ✅ Clicking "Stay" cancels navigation and keeps user in Edit Mode
- ✅ Clicking "Leave" discards changes and proceeds with navigation
- ✅ After successful save or cancel, no warning is shown on navigation
- ✅ No warning is shown when navigating from View Mode

### AC9: CSV Import
- ✅ "Import" button is visible in Table View toolbar
- ✅ Clicking "Import" opens modal with "CSV" and "JSON" format options
- ✅ Selecting "CSV" allows user to choose a CSV file
- ✅ CSV file is parsed with first row as headers
- ✅ Headers are mapped to collection fields (case-insensitive matching)
- ✅ Preview of first 5 rows is displayed before import
- ✅ Clicking "Import" validates each row and submits `POST /{collection}:create` for valid rows
- ✅ Progress indicator shows: "Importing X of Y records..."
- ✅ After completion, summary notification appears: "Successfully imported X records. Y failures."
- ✅ If failures exist, user can download error log CSV
- ✅ Table View refreshes to show imported records

### AC10: JSON Import
- ✅ Selecting "JSON" allows user to choose a JSON file
- ✅ JSON file is parsed as array of objects: `[{...}, {...}]`
- ✅ Preview of first 5 records is displayed before import
- ✅ Clicking "Import" validates each object and submits `POST /{collection}:create` for valid objects
- ✅ Progress indicator shows: "Importing X of Y records..."
- ✅ After completion, summary notification appears: "Successfully imported X records. Y failures."
- ✅ If failures exist, user can download error log JSON
- ✅ Table View refreshes to show imported records

### AC11: CSV Export
- ✅ "Export" button with dropdown is visible in Table View toolbar
- ✅ Clicking "Export as CSV" fetches all records via `GET /{collection}:list`
- ✅ Loading indicator shows: "Exporting records..."
- ✅ CSV file is generated with first row as headers and subsequent rows as data
- ✅ Special characters are escaped per RFC 4180 standard
- ✅ File is downloaded with filename: `{collection}_export_{timestamp}.csv`
- ✅ Success notification appears: "Exported X records to CSV"
- ✅ On failure, error notification is shown

### AC12: JSON Export
- ✅ Clicking "Export as JSON" fetches all records via `GET /{collection}:list`
- ✅ Loading indicator shows: "Exporting records..."
- ✅ JSON file is generated as array of objects with pretty-printing
- ✅ File is downloaded with filename: `{collection}_export_{timestamp}.json`
- ✅ Success notification appears: "Exported X records to JSON"
- ✅ On failure, error notification is shown

### AC13: Error Handling
- ✅ All API errors trigger user notifications with error message
- ✅ Network failures show notification: "Network error. Please check your connection."
- ✅ Token expiration triggers auto-refresh per PRD-002
- ✅ If token refresh fails, user is redirected to login with notification
- ✅ 404 errors (record not found) show notification: "Record not found"
- ✅ 400 errors (validation) show notification with validation details
- ✅ 500 errors (server error) show notification: "Server error. Please try again later."
- ✅ All notifications auto-dismiss after 4-6 seconds

### AC14: Mobile Responsiveness
- ✅ Record View displays correctly on mobile devices (< 768px width)
- ✅ Fields stack vertically with full-width inputs
- ✅ Action buttons are touch-friendly (min 44x44px)
- ✅ Import/Export modals are responsive and scrollable on small screens
- ✅ Forms are zoom-appropriate and do not require horizontal scrolling

### AC15: Theme Support
- ✅ Record View renders correctly in light theme (`autumn`)
- ✅ Record View renders correctly in dark theme (`abyss`)
- ✅ Form inputs and buttons follow DaisyUI theme styles
- ✅ Validation error colors are visible in both themes

### AC16: Edge Cases
- ✅ Viewing a record with all null fields displays empty or "N/A" values without errors
- ✅ Editing a record and immediately navigating away (unsaved) triggers warning
- ✅ Deleting the current record navigates back to Table View without errors
- ✅ Creating a record with only required fields (optional fields empty) succeeds
- ✅ Importing CSV with empty rows skips those rows without errors
- ✅ Importing CSV with invalid field names shows validation error
- ✅ Exporting 0 records produces valid empty CSV/JSON file
- ✅ Exporting 10,000+ records completes without freezing UI
- ✅ Network timeout during save/delete shows error notification and allows retry
- ✅ Token expiration during CRUD operation triggers auto-refresh and retries request

### AC17: Integration with Existing Features
- ✅ Record View integrates seamlessly with Table View from PRD-004
- ✅ Back button preserves Table View state (filters, sort, pagination)
- ✅ Authentication tokens from PRD-002 are used for all API requests
- ✅ Notifications appear in the global notification system
- ✅ Loading indicators use the global progress bar (if implemented)
- ✅ Connection switching (PRD-002) clears in-memory record data

### AC18: Testing and Documentation
- ✅ All components have unit tests with >= 90% coverage
- ✅ Integration tests cover full CRUD flow (create, read, update, delete)
- ✅ E2E tests verify user workflows on desktop and mobile viewports
- ✅ CSV/JSON import/export functions have dedicated test suites
- ✅ Validation logic has comprehensive test coverage
- ✅ All tests pass (100% pass rate)
- ✅ README.md includes usage instructions for record management
- ✅ SPEC.md and SPEC_UI.md remain consistent with implementation

---

## Checklist

- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
