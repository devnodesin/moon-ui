## Overview

### Purpose
Implement a comprehensive Collections Read View that displays all database collections (tables) from the connected Moon backend in a sortable, searchable, and paginated table interface, enabling users to discover, filter, and navigate to individual collection management views.

### Context
The Collections Read View serves as the primary entry point for managing database collections in the Moon Admin WebApp. Users need to view all available collections at a glance, search and filter them efficiently, sort by various attributes, and perform bulk operations like import/export. This view must always fetch fresh data from the backend with no caching, display smart loading indicators during data fetches, and provide comprehensive error notifications for any API failures. The interface must be mobile-first and responsive, adapting seamlessly between desktop and mobile viewports.

### Solution
Create a full-featured Collections list view component that fetches data from the Moon API `/collections:list` endpoint, renders it in a DaisyUI-styled responsive table with 5-6 sortable columns (Name, Column Count, Created Date, Updated Date, Actions), provides real-time search filtering, pagination controls, row-level action menus (⋮), toolbar with Add Collection button, and Import/Export buttons for CSV and JSON formats. All API calls trigger smart loading indicators, and all failures generate user notifications. Clicking any table row navigates to a detailed single-collection view. The component ensures no data caching and always fetches fresh data on mount and after any data-modifying operations.

---

## Requirements

### 1. Collections Table View

#### 1.1 Table Structure and Columns

**Required Columns (5-6 columns):**
- **Name** (string, sortable)
  - Display: Collection name in `snake_case` format
  - Truncate long names with ellipsis if width constrained
  - Show full name on hover via tooltip
  
- **Column Count** (integer, sortable)
  - Display: Number of columns (fields) in the collection
  - Format: Integer number (e.g., "5", "12")
  
- **Record Count** (integer, sortable, optional)
  - Display: Total number of records (rows) in the collection
  - Format: Integer with thousand separators (e.g., "1,234")
  - Note: May require separate API call or be unavailable; handle gracefully
  
- **Created Date** (timestamp, sortable)
  - Display: Date the collection was created
  - Format: `YYYY-MM-DD HH:mm` or relative time (e.g., "2 days ago")
  - Sort: Chronological order
  
- **Updated Date** (timestamp, sortable)
  - Display: Date the collection was last modified
  - Format: `YYYY-MM-DD HH:mm` or relative time
  - Sort: Chronological order (most recent first by default)
  
- **Actions** (non-sortable)
  - Display: Three-dot vertical menu button (⋮)
  - Triggers dropdown menu with actions: View, Edit Schema, Export, Delete
  - Actions dropdown appears on click/tap

**Table Behavior:**
- Must use DaisyUI table component classes (`table`, `table-zebra`, `table-pin-rows`)
- Must be responsive: horizontal scroll on mobile if content overflows
- Must support row hover states (highlight row on hover)
- Must support row click: clicking anywhere on a row (except actions menu) navigates to single collection view
- Header row must be sticky/pinned during scroll
- Must handle empty state: display "No collections found" message with icon when table is empty
- Must handle zero results from search: display "No collections match your search" message

#### 1.2 Column Sorting

**Sort Interaction:**
- Each sortable column header must display a sort indicator icon (↑/↓ arrows)
- Default sort: Updated Date descending (most recently updated first)
- Clicking a column header toggles sort order: ascending → descending → unsorted → ascending
- Only one column can be sorted at a time (single-column sort)
- Sort indicator must be visible on the active sorted column
- Sort state must be maintained during search/filter operations

**Sort Implementation:**
- Must sort data client-side if backend does not support sorting
- If backend supports sorting via query parameters, use backend sorting
- Must preserve sort state when paginating
- Must reset sort to default when switching connections or refreshing data

**Sort States:**
- Unsorted: No arrow or neutral icon
- Ascending: ↑ arrow
- Descending: ↓ arrow

#### 1.3 Row Actions Menu (⋮)

**Menu Trigger:**
- Three-dot vertical menu icon (⋮) in the Actions column
- Must be clickable/tappable
- Must have hover state (background highlight)
- Must stop click event propagation (prevent row click navigation)

**Menu Dropdown:**
- Must appear on click/tap
- Must use DaisyUI dropdown component
- Must position intelligently (above or below trigger based on available space)
- Must close when:
  - User clicks outside the menu
  - User selects a menu action
  - User presses Escape key

**Menu Actions:**
- **View** — Navigate to single collection detail view (same as row click)
- **Edit Schema** — Navigate to collection schema editor (future PRD, may show "Coming Soon" notification)
- **Export Collection** — Trigger collection data export (CSV/JSON format selection dialog)
- **Delete Collection** — Show confirmation dialog, then call `/collections:destroy` API endpoint
  - Must display confirmation dialog: "Are you sure you want to delete collection '{name}'? This action cannot be undone."
  - Confirmation dialog buttons: Cancel (default focus), Delete (danger style)
  - On confirm: call API, show loading indicator, handle success/error, refresh table
  - On success: show success notification, remove collection from table
  - On error: show error notification with error message

### 2. Search and Filter

#### 2.1 Search Box

**Location:** Top-left of the toolbar, above the table

**UI Components:**
- Text input field with search icon prefix
- Placeholder text: "Search collections..."
- Clear button (✕) appears when input has text
- Must use DaisyUI input component classes

**Search Behavior:**
- Must filter collections in real-time as user types (debounced by 300ms)
- Must search across collection name field only (primary search target)
- Must be case-insensitive
- Must support partial matching (substring search)
- Must update table immediately with filtered results
- Must preserve pagination (reset to page 1 on new search)
- Must maintain sort order during search
- Must show "No collections match your search" when no results found

**Search Implementation:**
- Must perform client-side filtering of fetched data (no backend search API required)
- If backend supports search query parameters in the future, may implement server-side search
- Must clear search when user clicks clear button (✕)
- Must clear search when user deletes all text

#### 2.2 Filter Persistence

- Search query must NOT persist across page refreshes or navigation
- Search query must be cleared when switching connections
- Search state must be maintained during pagination and sorting within the same session

### 3. Pagination Controls

#### 3.1 Pagination UI

**Location:** Bottom of the table, centered or left-aligned

**Components:**
- **Previous Button** (`← Prev` or `← Previous`)
  - Disabled when on first page (visual indication: grayed out, no hover state)
  - Enabled when not on first page
  - Clicking navigates to previous page
  
- **Page Indicator** (`Page X of Y`)
  - Display: Current page number and total page count
  - Example: "Page 1 of 5" or "1 / 5"
  - Must update dynamically as user navigates
  
- **Next Button** (`Next →` or `Next →`)
  - Disabled when on last page
  - Enabled when not on last page
  - Clicking navigates to next page

**Pagination Behavior:**
- Must use DaisyUI button group or pagination component classes
- Page size: Configurable, default 25 records per page (10, 25, 50, 100 options)
- Page size selector: Optional dropdown to change records per page (enhancement)
- Must preserve sort order when paginating
- Must preserve search filter when paginating
- Must reset to page 1 when:
  - Search query changes
  - Sort column/order changes
  - Data is refreshed
  - Connection is switched
- Must handle edge cases:
  - Empty table: Show "Page 0 of 0" or hide pagination controls
  - Single page: Disable both Previous and Next buttons
  - Last page with fewer records: Display correctly

#### 3.2 Pagination Implementation

- Must implement client-side pagination of fetched data
- Must calculate total pages based on total records and page size
- Must slice data array to show only current page records
- Must update page indicator text dynamically
- Must handle keyboard navigation (Tab to buttons, Enter to activate)

### 4. Toolbar Actions

#### 4.1 Add Collection Button

**Location:** Top-right of the toolbar, above the table

**UI:**
- Primary button with "+" icon and "Add Collection" label
- Must use DaisyUI `btn btn-primary` classes
- Must have hover and focus states
- Responsive: On mobile, may show icon only with tooltip

**Behavior:**
- On click: Navigate to Add Collection form view or open inline form (future PRD)
- For this PRD: May navigate to placeholder route `/admin/collections/new` or show "Coming Soon" notification

#### 4.2 Import Data Button

**Location:** Top-right of toolbar, adjacent to Add Collection button

**UI:**
- Secondary button with upload icon and "Import" label
- Must use DaisyUI `btn btn-secondary` classes
- Responsive: On mobile, may show icon only with tooltip

**Behavior:**
- On click: Open file picker dialog or show import options modal
- Must support CSV and JSON file formats
- File picker must accept only `.csv` and `.json` file extensions
- On file selection:
  - Parse file content
  - Validate data format
  - Show preview or confirmation dialog
  - On confirm: call appropriate API endpoint to import data
  - Show smart loading indicator during import
  - Show success notification on completion
  - Show error notification on failure with descriptive message
  - Refresh table data on successful import

**Import Validation:**
- Must validate file format before processing
- Must validate file size (max 10MB)
- Must handle parse errors gracefully with user-friendly error messages
- Must not import if validation fails

#### 4.3 Export Data Button

**Location:** Top-right of toolbar, adjacent to Import button

**UI:**
- Secondary button with download icon and "Export" label
- Must use DaisyUI `btn btn-secondary` classes
- Responsive: On mobile, may show icon only with tooltip

**Behavior:**
- On click: Show format selection dialog or dropdown (CSV or JSON)
- On format selection:
  - Fetch full collection data if not already loaded
  - Generate file content in selected format
  - Trigger browser download with appropriate filename (e.g., `collections-export-2024-01-15.csv`)
  - Show smart loading indicator during export
  - Show success notification on completion
  - Show error notification on failure

**Export Formats:**
- **CSV:** Comma-separated values with header row (columns: Name, Column Count, Created Date, Updated Date)
- **JSON:** Array of collection objects with all available fields

**Export Behavior:**
- Must export all collections (not just current page)
- Must respect current search filter: export only visible/filtered collections
- Filename must include timestamp for uniqueness
- Must handle large datasets (may need chunked export or pagination for very large collections)

### 5. Navigation and Routing

#### 5.1 Row Click Navigation

**Behavior:**
- Clicking anywhere on a table row (except the Actions menu) navigates to the single collection detail view
- Must use React Router `useNavigate` hook or `Link` component wrapped around row
- Must navigate to route: `/admin/collections/:name` (where `:name` is the collection name)
- Must provide visual feedback on row hover (background highlight, cursor pointer)
- Must preserve current page URL in browser history for back navigation

**Implementation:**
- Must stop event propagation on Actions menu click to prevent row navigation
- Must handle keyboard navigation: pressing Enter on a focused row navigates to detail view
- Must be accessible: row must be focusable with Tab key

#### 5.2 Single Collection View Route

**Route:** `/admin/collections/:name`

**Parameters:**
- `:name` — Collection name (URL parameter)

**Behavior:**
- Must render single collection detail view component (defined in future PRD)
- For this PRD: May render placeholder component showing collection name and "Detail view coming soon" message
- Must fetch collection schema from `/collections:get?name=:name` API endpoint
- Must handle 404 error if collection not found
- Must provide back navigation to collections list

### 6. Data Fetching and API Integration

#### 6.1 API Endpoint

**Endpoint:** `GET /collections:list`

**Authentication:** Bearer token in `Authorization` header or API key in `X-API-Key` header

**Request Format:**
```
GET /collections:list
Authorization: Bearer <access_token>
```

**Response Format (Success):**
```json
{
  "collections": [
    {
      "name": "products",
      "columns": [
        {"name": "id", "type": "string", "nullable": false},
        {"name": "title", "type": "string", "nullable": false},
        {"name": "price", "type": "integer", "nullable": false}
      ],
      "created_at": "2024-01-10T10:30:00Z",
      "updated_at": "2024-01-15T14:22:00Z"
    },
    {
      "name": "users",
      "columns": [
        {"name": "id", "type": "string", "nullable": false},
        {"name": "username", "type": "string", "nullable": false},
        {"name": "email", "type": "string", "nullable": false}
      ],
      "created_at": "2024-01-08T09:15:00Z",
      "updated_at": "2024-01-14T16:45:00Z"
    }
  ]
}
```

**Response Format (Error):**
```json
{
  "error": "Unauthorized",
  "code": 401
}
```

**Assumptions:**
- If `created_at` and `updated_at` fields are not available, handle gracefully (show "N/A" or hide columns)
- If `columns` array is missing, calculate column count as 0
- Record count is not provided by `/collections:list`; may require separate API call or omit from table

#### 6.2 Fetch Behavior

**When to Fetch:**
- On component mount (initial load)
- After successful Add Collection operation (if triggered from this view)
- After successful Delete Collection operation
- After successful Import operation
- When user manually triggers refresh (optional refresh button in toolbar)
- When switching connections (must clear data and re-fetch)

**No Caching:**
- Must always fetch fresh data from backend
- Must NOT cache collections data in localStorage, sessionStorage, or any persistent store
- Must NOT reuse previous fetch results across component unmounts/mounts
- In-memory caching within the component lifecycle is acceptable (until component unmounts)
- Must clear in-memory data when switching connections

**Fetch Implementation:**
- Must use reusable HTTP client layer with authentication token injection
- Must handle token refresh automatically if access token is expired
- Must show smart loading indicator during fetch (progress bar at top of viewport)
- Must handle network errors, timeouts, and API errors gracefully
- Must trigger user notification for all API failures

#### 6.3 Error Handling

**Network Errors:**
- Timeout: Show notification "Request timed out. Please check your connection and try again."
- No internet: Show notification "Network error. Please check your internet connection."
- Server unavailable: Show notification "Unable to connect to server. Please try again later."

**API Errors:**
- 401 Unauthorized: Attempt token refresh; if fails, force logout and redirect to login
- 403 Forbidden: Show notification "You do not have permission to view collections."
- 404 Not Found: Show notification "Collections endpoint not found. Please contact support."
- 500 Internal Server Error: Show notification "Server error occurred. Please try again later."
- 429 Too Many Requests: Show notification "Rate limit exceeded. Please wait and try again."

**Error State UI:**
- Display error message in place of table: "Failed to load collections. [Retry] button"
- Retry button: On click, re-fetch data
- Must not show partial/stale data on error
- Must clear loading indicator on error

### 7. Smart Loading Indicator

#### 7.1 Loading Bar Requirements

**Location:** Fixed at the very top of the viewport (above header, z-index higher than all other elements)

**Visual Design:**
- Thin horizontal bar (2-4px height)
- Accent color from active DaisyUI theme
- Smooth indeterminate animation (sliding or shimmer)
- Must not block user interaction

**Trigger Conditions:**
- Must appear when `/collections:list` API call starts
- Must remain visible for entire duration of API call
- Must disappear immediately when API call completes (success or failure)
- Must handle concurrent API calls (if multiple requests in flight, bar stays visible until all complete)

**Implementation:**
- Use global loading state managed by context or state management
- HTTP client must automatically trigger loading state for all API calls
- May use library like `nprogress`, `react-top-loading-bar`, or custom implementation
- Must be tested with slow network conditions (throttled network in DevTools)

#### 7.2 Loading State During Fetch

**Initial Load:**
- Show loading bar at top
- Content area may show skeleton loader or empty state with spinner
- Table must not render until data is available
- Must not show flickering or layout shift during load

**Subsequent Fetches (Refresh, Delete, etc.):**
- Show loading bar at top
- Table may remain visible with slight opacity or overlay spinner
- Must prevent user interaction during delete operation (disable action buttons)

### 8. Notification System

#### 8.1 Notification Requirements

**When to Trigger Notifications:**
- All API failures (network errors, server errors, validation errors)
- Successful delete operation: "Collection '{name}' deleted successfully."
- Successful import operation: "Data imported successfully."
- Successful export operation: "Data exported successfully."
- Session expiration: "Session expired. Please log in again."
- Rate limit exceeded: "Too many requests. Please try again later."
- Permission errors: "You do not have permission to perform this action."

**Notification UI:**
- Display as non-blocking banners or toasts at the top or bottom of the screen
- Must use DaisyUI alert component classes
- Must be styled by type:
  - Error: Red background, error icon (❌ or ⚠️)
  - Success: Green background, success icon (✓)
  - Warning: Yellow background, warning icon (⚠️)
  - Info: Blue background, info icon (ℹ️)
- Must include close button (✕) for manual dismissal
- Must auto-dismiss after 4-6 seconds
- Must not block user interaction with main UI
- Must stack vertically if multiple notifications appear

**Notification Behavior:**
- Notifications are in-session only (do not persist across page reloads)
- All notifications from current session are stored in memory
- Must be accessible from Notifications page (`/admin/notifications`)
- Notifications page must have "Clear All" button to remove all notifications

#### 8.2 Notification Page Integration

- Must send all triggered notifications to global notification store (context or state management)
- Notification store must be accessible by Notifications page component
- Each notification must include:
  - Type (error, success, warning, info)
  - Message text
  - Timestamp (ISO 8601 format or JavaScript Date object)
- Notifications page must display all notifications with newest first
- Notifications page must have "Clear All Notifications" button

### 9. Mobile Responsiveness

#### 9.1 Mobile Layout Adjustments

**Table on Mobile:**
- Must use horizontal scroll if table width exceeds viewport
- Alternatively: Use card-based layout instead of table on mobile (enhancement)
- Must maintain readability: font sizes must be legible on small screens
- Actions menu must be easy to tap (minimum 44x44px touch target)

**Toolbar on Mobile:**
- Search box: Full width on mobile, stacked above action buttons
- Action buttons: May display icon-only with tooltips
- Must wrap buttons to new line if needed (avoid horizontal overflow)

**Pagination on Mobile:**
- Pagination controls must be touch-friendly (larger buttons)
- Page indicator text must be concise (e.g., "1 / 5" instead of "Page 1 of 5")
- Must not overflow viewport width

**Responsive Breakpoints:**
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `≥ 1024px`

#### 9.2 Touch Interactions

- Row click must be tap-friendly (minimum 44x44px height per row)
- Actions menu must open on tap (no hover-based interactions on mobile)
- Search input must trigger mobile keyboard with appropriate input type
- Dropdowns and modals must be optimized for touch (larger tap targets, full-screen on small devices)

### 10. Accessibility and Usability

#### 10.1 Keyboard Navigation

- All interactive elements must be keyboard accessible (Tab, Enter, Escape)
- Table rows must be focusable and activatable with Enter key
- Actions menu must open with Enter key and close with Escape key
- Search input must be focusable and clearable with keyboard
- Pagination buttons must be focusable and activatable with Enter/Space

#### 10.2 Visual Feedback

- Hover states for all interactive elements (rows, buttons, links)
- Focus indicators for keyboard navigation (visible outline or background highlight)
- Active state for buttons during click
- Disabled state for pagination buttons when unavailable (grayed out, no hover)

#### 10.3 Screen Reader Support (Optional, not required)

- While accessibility is not a strict requirement per SPEC.md, basic semantic HTML is recommended:
  - Use semantic table elements (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`)
  - Use button elements for clickable actions
  - Use labels for form inputs

### 11. Technical Constraints

- Must use React 18+ function components with hooks
- Must use TypeScript with strict mode enabled
- Must use DaisyUI components and Tailwind CSS exclusively for styling
- Must use reusable HTTP client layer for API calls (with auth, error handling, retry logic)
- Must use React Router for navigation
- Must be compatible with Bun.js build pipeline
- Must work in latest versions of Chrome, Firefox, Safari, and Edge
- Must not use any other UI library or CSS framework
- Must not cache data between sessions or connections
- Must follow project folder structure (`src/pages/`, `src/components/`, `src/services/`, etc.)

### 12. Performance Requirements

- Table must render within 200ms for datasets up to 100 collections
- Search filtering must feel instantaneous (debounced by 300ms, but results update within 50ms)
- Pagination navigation must be instantaneous (no delay)
- Sorting must complete within 100ms for datasets up to 100 collections
- Smart loading indicator must appear within 50ms of API call start
- No layout shift during data load or interaction

### 13. Security Requirements

- Must include authentication token in all API requests (Bearer token or API key)
- Must validate API responses before rendering (type checking, null checks)
- Must not expose sensitive data in error messages (e.g., full stack traces)
- Must sanitize user input in search box (prevent XSS)
- Must handle CORS correctly (rely on backend CORS configuration)
- Must force logout and redirect to login if 401 error occurs and token refresh fails

---

## Acceptance

### 1. Table Rendering and Structure

- [ ] Collections table renders with 5-6 columns: Name, Column Count, Created Date, Updated Date, Actions
- [ ] Table uses DaisyUI table component classes and is styled correctly
- [ ] Table header row is sticky/pinned during scroll
- [ ] Table rows display collection data correctly (name, column count, timestamps)
- [ ] Table handles empty state: displays "No collections found" message when no data
- [ ] Table handles zero search results: displays "No collections match your search" message
- [ ] Table is responsive: horizontal scroll on mobile if content overflows

### 2. Column Sorting

- [ ] All sortable columns (Name, Column Count, Created Date, Updated Date) display sort indicators (↑/↓ arrows)
- [ ] Default sort is Updated Date descending (most recent first)
- [ ] Clicking a column header toggles sort order: ascending → descending → unsorted → ascending
- [ ] Active sorted column displays visible sort indicator
- [ ] Sort state persists during search and pagination
- [ ] Sort state resets to default when switching connections or refreshing data

### 3. Search and Filter

- [ ] Search box is visible in toolbar above the table (top-left)
- [ ] Search box has placeholder text "Search collections..."
- [ ] Search box includes clear button (✕) when input has text
- [ ] Typing in search box filters collections in real-time (debounced by 300ms)
- [ ] Search is case-insensitive and supports partial matching
- [ ] Search updates table immediately with filtered results
- [ ] Search resets pagination to page 1 when query changes
- [ ] Clicking clear button or deleting all text clears search filter
- [ ] Search query does not persist across page refreshes or connection switches

### 4. Pagination

- [ ] Pagination controls are visible at the bottom of the table
- [ ] Pagination includes Previous button, page indicator ("Page X of Y"), and Next button
- [ ] Previous button is disabled on first page (grayed out, no hover state)
- [ ] Next button is disabled on last page
- [ ] Clicking Previous navigates to previous page
- [ ] Clicking Next navigates to next page
- [ ] Page indicator displays current page and total page count correctly
- [ ] Pagination resets to page 1 when search query or sort changes
- [ ] Pagination handles edge cases: empty table, single page, last page with fewer records

### 5. Row Actions Menu

- [ ] Actions column displays three-dot vertical menu icon (⋮) for each row
- [ ] Actions menu icon is clickable and has hover state
- [ ] Clicking actions menu opens dropdown with options: View, Edit Schema, Export, Delete
- [ ] Actions menu dropdown closes when clicking outside, selecting an action, or pressing Escape
- [ ] View action navigates to single collection detail view
- [ ] Edit Schema action shows "Coming Soon" notification or navigates to placeholder route
- [ ] Export action triggers collection data export with format selection (CSV/JSON)
- [ ] Delete action shows confirmation dialog before deleting collection
- [ ] Delete confirmation dialog has Cancel and Delete buttons
- [ ] Successful delete triggers API call, shows success notification, and refreshes table
- [ ] Failed delete shows error notification with error message
- [ ] Clicking actions menu does not trigger row click navigation (event propagation stopped)

### 6. Row Click Navigation

- [ ] Clicking anywhere on a table row (except actions menu) navigates to `/admin/collections/:name`
- [ ] Row has visual feedback on hover (background highlight, cursor pointer)
- [ ] Row is keyboard accessible: pressing Enter on focused row navigates to detail view
- [ ] Navigation preserves current page URL in browser history
- [ ] Navigating to single collection view renders placeholder or detail component (future PRD)

### 7. Toolbar Actions

- [ ] Add Collection button is visible in toolbar (top-right)
- [ ] Add Collection button has "+" icon and "Add Collection" label (icon-only on mobile with tooltip)
- [ ] Clicking Add Collection navigates to `/admin/collections/new` or shows "Coming Soon" notification
- [ ] Import button is visible in toolbar (top-right, adjacent to Add Collection)
- [ ] Clicking Import button opens file picker accepting `.csv` and `.json` files
- [ ] Import validates file format and size (max 10MB) before processing
- [ ] Successful import shows preview/confirmation dialog, triggers API call, and refreshes table
- [ ] Failed import shows error notification with descriptive message
- [ ] Export button is visible in toolbar (top-right, adjacent to Import)
- [ ] Clicking Export button shows format selection dialog (CSV or JSON)
- [ ] Export generates file in selected format and triggers browser download
- [ ] Export filename includes timestamp (e.g., `collections-export-2024-01-15.csv`)
- [ ] Export respects current search filter (exports only visible/filtered collections)
- [ ] Successful export shows success notification
- [ ] Failed export shows error notification

### 8. Data Fetching and API Integration

- [ ] On component mount, app fetches collections from `GET /collections:list` API endpoint
- [ ] API request includes Bearer token in `Authorization` header or API key in `X-API-Key` header
- [ ] Successful API response populates table with collection data
- [ ] Failed API response triggers error notification and displays error state with Retry button
- [ ] Retry button re-fetches data when clicked
- [ ] App always fetches fresh data (no caching between sessions or connections)
- [ ] In-memory data is cleared when switching connections
- [ ] Token refresh is attempted automatically if access token is expired before API call
- [ ] If token refresh fails, user is logged out and redirected to login with notification

### 9. Error Handling

- [ ] Network errors (timeout, no internet, server unavailable) trigger user notifications
- [ ] API errors (401, 403, 404, 500, 429) trigger user notifications with descriptive messages
- [ ] 401 Unauthorized triggers token refresh attempt; if fails, logs out user and redirects to login
- [ ] Error state UI displays "Failed to load collections" message with Retry button
- [ ] Retry button on error state re-fetches data
- [ ] App does not show partial or stale data on error
- [ ] Loading indicator is cleared on error

### 10. Smart Loading Indicator

- [ ] Loading/progress bar is positioned at the very top of the viewport
- [ ] Loading bar appears immediately when API call starts (within 50ms)
- [ ] Loading bar remains visible for entire duration of API call
- [ ] Loading bar disappears immediately when API call completes (success or failure)
- [ ] Loading bar does not block user interaction
- [ ] Loading bar is styled with smooth indeterminate animation (sliding or shimmer)
- [ ] Loading bar is styled according to active theme (light/dark)
- [ ] Loading bar handles concurrent API calls correctly (stays visible until all complete)

### 11. Notification System

- [ ] All API failures trigger user notifications (auto-dismiss toasts or banners)
- [ ] Successful delete operation shows success notification: "Collection '{name}' deleted successfully."
- [ ] Successful import operation shows success notification: "Data imported successfully."
- [ ] Successful export operation shows success notification: "Data exported successfully."
- [ ] Session expiration shows notification: "Session expired. Please log in again."
- [ ] Rate limit errors show notification: "Too many requests. Please try again later."
- [ ] Notifications are styled by type (error = red, success = green, warning = yellow, info = blue)
- [ ] Notifications include close button (✕) for manual dismissal
- [ ] Notifications auto-dismiss after 4-6 seconds
- [ ] Notifications do not block user interaction with main UI
- [ ] Multiple notifications stack vertically
- [ ] Notifications are in-session only (do not persist across page reloads)
- [ ] All triggered notifications are sent to global notification store
- [ ] Notifications are accessible from Notifications page (`/admin/notifications`)
- [ ] Notifications page displays all notifications with newest first
- [ ] Notifications page includes "Clear All Notifications" button

### 12. Mobile Responsiveness

- [ ] Table uses horizontal scroll on mobile if content overflows viewport
- [ ] Table rows and columns are readable on mobile (legible font sizes)
- [ ] Actions menu has minimum 44x44px touch target for easy tapping
- [ ] Search box is full width on mobile, stacked above action buttons
- [ ] Toolbar action buttons display icon-only on mobile with tooltips
- [ ] Toolbar buttons wrap to new line if needed (no horizontal overflow)
- [ ] Pagination controls are touch-friendly (larger buttons)
- [ ] Page indicator text is concise on mobile (e.g., "1 / 5")
- [ ] Pagination does not overflow viewport width
- [ ] Layout is tested on mobile (< 768px), tablet (768px - 1024px), and desktop (≥ 1024px) viewports
- [ ] Touch interactions work correctly: row tap, actions menu tap, button tap

### 13. Accessibility and Usability

- [ ] All interactive elements are keyboard accessible (Tab, Enter, Escape)
- [ ] Table rows are focusable and activatable with Enter key
- [ ] Actions menu opens with Enter key and closes with Escape key
- [ ] Search input is focusable and clearable with keyboard
- [ ] Pagination buttons are focusable and activatable with Enter/Space
- [ ] Hover states are visible for all interactive elements (rows, buttons, links)
- [ ] Focus indicators are visible for keyboard navigation
- [ ] Disabled pagination buttons have clear visual indication (grayed out, no hover)
- [ ] Semantic HTML is used: `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<button>`

### 14. Performance and Visual Quality

- [ ] Table renders within 200ms for datasets up to 100 collections
- [ ] Search filtering feels instantaneous (debounced by 300ms, results update within 50ms)
- [ ] Pagination navigation is instantaneous (no delay)
- [ ] Sorting completes within 100ms for datasets up to 100 collections
- [ ] Loading indicator appears within 50ms of API call start
- [ ] No layout shift during data load or interaction
- [ ] Layout is visually consistent across Chrome, Firefox, Safari, and Edge

### 15. Integration Testing

- [ ] End-to-end test: Navigate to `/admin/collections`, table loads and displays collections
- [ ] End-to-end test: Search for a collection name, table filters correctly
- [ ] End-to-end test: Clear search, table shows all collections again
- [ ] End-to-end test: Click a column header to sort, table re-orders correctly
- [ ] End-to-end test: Navigate pagination (Next, Previous), table shows correct page data
- [ ] End-to-end test: Click a table row, navigate to `/admin/collections/:name`
- [ ] End-to-end test: Open actions menu, click Delete, confirm deletion, collection is removed
- [ ] End-to-end test: Click Export button, select CSV format, file downloads
- [ ] End-to-end test: Click Import button, select valid JSON file, data imports successfully
- [ ] End-to-end test: Trigger API error (disconnect network), error notification appears
- [ ] Integration test: Loading bar appears during API call and disappears on completion
- [ ] Integration test: Notifications triggered by API errors appear and auto-dismiss after 4-6 seconds
- [ ] Integration test: Switch connection, table data is cleared and re-fetched

### 16. Documentation and Code Quality

- [ ] Collections list component is a TypeScript function component with strict types
- [ ] All props, state, and API response types are strongly typed
- [ ] Component uses reusable HTTP client layer for API calls
- [ ] Component uses global notification store/context for triggering notifications
- [ ] Component uses global loading state/context for smart loading indicator
- [ ] Component follows project folder structure (`src/pages/CollectionsList.tsx`)
- [ ] Code passes TypeScript strict mode checks with no errors
- [ ] Code passes ESLint checks with no warnings or errors
- [ ] Unit tests cover search, sort, pagination, and data fetching logic
- [ ] Integration tests cover user flows (search → sort → paginate → navigate)
- [ ] Code is documented with comments for complex logic
- [ ] README and SPEC.md are updated with Collections Read View documentation

---

## Checklist

- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
