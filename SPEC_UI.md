# UI Layouts and Components

> **Note:** This file `SPEC_UI.md` documents only UI/UX related features.

---

## UI/UX Requirements

- **Accessibility:** Not required (private/internal app).
- **No Modals for Records:** Viewing and editing records must always be inline—never use modals.
- **No Data Caching:** All data views must always fetch fresh data from the backend (no client-side caching).
- **Error Handling:** All API/network errors and important events must trigger a user notification. Error messages are extracted from backend API responses:
  - When an API error response includes an `"error"` field, that message is displayed in the notification (e.g., `{"error": "invalid email format"}` → notification shows "invalid email format")
  - When an API error response does not include an `"error"` field, a context-aware fallback message is displayed (e.g., "Failed to load collections")
  - This ensures users see relevant, actionable error messages from the backend while maintaining graceful degradation for other error types
- **Session Timeout:** On session expiration or token refresh failure, show a notification and redirect user to login.


## Login View

```md
┌──────────────────────────────┐
│                              │
│ [Logo/Title]                 │
│                              │
│ ┌─────────────────────┐      │
│ │ Saved Connections ▼ │      │ ← Dropdown to select saved connection
│ └─────────────────────┘      │
│ OR                           │
│ ┌─────────────────┐          │
│ │ Server URL      |          │
│ └─────────────────┘          │
│ ┌─────────────────┐          │
│ │ Username        │          │
│ └─────────────────┘          │
│ ┌─────────────────┐          │
│ │ Password        │          │
│ └─────────────────┘          │
│ [☑] Remember Me              │ ← Persist session with refresh token
│                              │
│ [Connect Button]             │
│                              │
│ [Manage Connections]         │ ← Link to connection manager
│                              │
└──────────────────────────────┘
```

**Remember Me Checkbox:**
- When checked: Session tokens (access + refresh) are stored in `localStorage` for the connection
- When unchecked: Session tokens are kept in-memory only and expire when browser tab closes
- Refresh tokens enable automatic session restoration and token renewal
- Users remain logged in across browser restarts when "Remember Me" is enabled

- Input: User enters server URL, username, password, optionally checks "Remember Me", clicks Connect.
- Output: Credentials are validated, JWT tokens are received. If "Remember Me" is checked, tokens are stored in localStorage; otherwise kept in memory. User is logged in and redirected to Dashboard.
- Explanation: Connection is isolated.

## Admin View

**Admin View (Desktop)**

```md
┌──────────────────────────────────────────────┐
│ [☰]  Current Page [Header]                  │ ← Header (fixed)
├────────┬─────────────────────────────────────┤
│ Side   │                                     │
│ bar    │ Content Area                        │
│        │ (Dynamic)                           │
│ (fix)  │                                     │
│        │                                     │
├────────┴─────────────────────────────────────┤
│ Footer                                       │ ← Footer
└──────────────────────────────────────────────┘
```

**Admin View (Mobile)**

```md
┌─────────────────────────────┐
│ [☰]  Page [Header]         │ ← Header (fixed)
├─────────────────────────────┤
│                             │
│ Content Area                │
│ (Full Width)                │
│                             │
├─────────────────────────────┤
│ Footer                      │
└─────────────────────────────┘

Sidebar (Overlay on toggle):
┌──────────┐
│ Sidebar  |
| [● Server]  │
│ Menu     │
│ Items    │
└──────────┘
```

**Content Area Behavior:**

- The Content Area is changed dynamically based on context.
- Default: `Dashboard View` showing summary statistics and recent activity
- Table pages: `Table View` for Collections, Users, API Keys
- Record pages: On click of a row item in the table show `Record View`

## Dashboard View

The dashboard is the default landing page after login, providing an overview of the system:

**Dashboard Layout:**

```md
┌─────────────────────────────────────────────┐
│ Dashboard                                    │
├─────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│ │ 📚        │ │ 👥        │ │ 🔑        │  │
│ │Collections│ │  Users    │ │ API Keys  │  │
│ │    25     │ │    12     │ │     8     │  │
│ └───────────┘ └───────────┘ └───────────┘  │
│                                              │
│ Collections                                  │
│ ┌──────────────────────────────────────┐    │
│ │ Name      │ Records │ Actions         │    │
│ ├──────────┼─────────┼──────────────────┤    │
│ │ products  │   124   │ View →          │    │
│ │ users     │    45   │ View →          │    │
│ │ orders    │   892   │ View →          │    │
│ └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Dashboard Features:**
- **Summary Cards:** Display total counts for Collections, Users, and API Keys
- **Clickable Cards:** Each summary card is clickable and navigates to the respective resource page
- **Collections Table:** Shows all collections with record counts
- **Quick Actions:** Direct "View" buttons for each collection
- **Responsive Design:** Cards stack vertically on mobile, display in a grid on desktop
- **Loading States:** Show loading spinner while fetching dashboard data
- **Error Handling:** Display error notifications if data fails to load

## Navbar Settings Dropdown

The navbar includes a settings icon button (⚙️) that opens a dropdown menu with organized sections:

**Settings Dropdown Structure:**

```md
┌─────────────────────────────────────┐
│ Connection                          │ ← Section: Connection Management
│ • Moon Production (active)          │
│ • Local Development                 │
│ • Manage Connections                │
├─────────────────────────────────────┤
│ Appearance                          │ ← Section: Theme
│ • Light Mode / Dark Mode (toggle)   │
├─────────────────────────────────────┤
│ Notifications                       │ ← Section: Notification Management
│ • Clear All Notifications           │
└─────────────────────────────────────┘
```

**Features:**
- **Connection switcher:** Quick access to switch between saved connections
- **Theme toggle:** Switch between light (autumn) and dark (abyss) themes
- **Clear All Notifications:** Manually clear all pinned error/warning notifications
- Items are grouped by functionality for clarity
- Connection switcher and theme toggle moved from main navbar into settings dropdown for cleaner UI

## Table View (Collections, Users, API Keys)

```md
┌─────────────────────────────────────────────┐
│ [Search Box]             [+ Action Button]  │ ← Toolbar
├─────────────────────────────────────────────┤
│ Column 1 │ Column 2 │ Column 3 │ Actions    │ ← Header (sortable, 5-6 colums)
├──────────┼──────────┼──────────┼────────────┤
│ Data 1   │ Data 2   │ Data 3   │ [⋮]        │ ← Rows
│ Data 1   │ Data 2   │ Data 3   │ [⋮]        │
│ Data 1   │ Data 2   │ Data 3   │ [⋮]        │
├─────────────────────────────────────────────┤
│ [← Prev] Page 1 of 10 [Next →]              │ ← Pagination
└─────────────────────────────────────────────┘
```

**Pagination:**
- All table views (Collections records, Users, API Keys) support cursor-based pagination
- Pagination controls show Previous and Next buttons with current page indicator
- Buttons are automatically disabled when there are no more pages in that direction
- Default page size is 20 records per page
- Pagination state resets when search criteria change

- Clicking a row in any data table opens a **Single Record View** using `Record View` component

- Table views must provide buttons for importing (CSV/JSON) and exporting data (CSV/JSON).

## Record View

`Record View`: On click of a row item in the table, show a single record view with an edit button at the top. This view supports both viewing and editing record data in a single screen.

- Clicking a row in any data table opens a **Single Record View**
- The record opens in **View Mode by default**
- In View Mode:
  - Fields are read-only
  - Fields look like plain text (not form inputs)
- An **Edit** button is visible at the top
- Clicking **Edit** switches the same screen to **Edit Mode**
- In Edit Mode:
  - Fields become inline-editable
  - Editable fields use minimal UI (underline or subtle focus)
- **Save** and **Cancel** actions are shown only in Edit Mode
- No modals are used for viewing or editing records
  **UX Rule :** Same screen, same layout, two modes (`view` = read-only text
  `edit` = inline editable fields)

**Record View - View Mode**

```md
┌──────────────────────────────────┐
│ ← Back                  [ Edit ] |
├──────────────────────────────────┤
│                                  │
│ Name      John Doe               │
│ Email     john@example.com       │
│ Role      Admin                  │
│ Status    Active                 │
│                                  │
└──────────────────────────────────┘
```

**Record View - Edit Mode**

```md
┌──────────────────────────────────┐
│ ← Back                  [ Edit ] |
├──────────────────────────────────┤
│                                  │
│ Name     John Doe___________     │
│ Email    john@example.com___     │
│ Role     Admin______________     │
│ Status   Active_____________     │
│                                  │
│ [ Cancel ] [ Save ]              │
└──────────────────────────────────┘
```

- Only [ Save ] will save the record
- Cancel will not save the data
- Edit button disabled

## Collection Management

### Collection Creation Form

When creating a new collection, users can define the schema by specifying fields with the following properties:

- **Field Name**: Must be lowercase snake_case (e.g., `user_id`, `email_address`)
- **Field Type**: Select from string, integer, boolean, datetime, decimal, or json
- **Nullable**: Checkbox to allow null values
- **Unique**: Checkbox to enforce unique values across all records

**Collection Creation UI:**
```md
┌──────────────────────────────────────────────┐
│ Collection Name                              │
│ ┌──────────────────────────────────────────┐ │
│ │ my_collection                            │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Fields                                       │
│ ┌────────┬─────────┬─────────┬──────────┐   │
│ │ Name   │ Type    │ Nullable│ Unique   │   │
│ │ email  │ String ▼│ ☐       │ ☑        │ ✕ │
│ │ name   │ String ▼│ ☐       │ ☐        │ ✕ │
│ └────────┴─────────┴─────────┴──────────┘   │
│ [ + Add Field ]                              │
│                                              │
│ [ Cancel ]  [ Create Collection ]            │
└──────────────────────────────────────────────┘
```

### Schema Editor

When editing an existing collection schema:

- **Read-only fields** (e.g., `id`) are marked with a "Read-only" badge
- Read-only fields have all controls disabled:
  - Field name input is disabled
  - Type selector is disabled
  - Nullable and Unique checkboxes are disabled
  - Remove button is disabled
- Non-readonly fields can be edited, renamed, or removed
- Field changes are tracked with status badges:
  - "New" (green) for newly added fields
  - "Modified" (blue) for fields with type/constraint changes
  - "Renamed" (yellow) for fields with name changes
  - "Read-only" (yellow) for read-only system fields

**Schema Editor UI:**
```md
┌──────────────────────────────────────────────────────┐
│ Edit Schema: users                                   │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Field  │ Type    │ Null │ Unique │ Status │ Act │ │
│ │ id     │ string ▼│ ☐    │ ☐      │[Rdonly]│ ✕  │ │ (disabled)
│ │ email  │ string ▼│ ☐    │ ☑      │ [Mod]  │ ✕  │ │
│ │ name   │ string ▼│ ☐    │ ☐      │  —     │ ✕  │ │
│ └──────────────────────────────────────────────────┘ │
│ [ + Add Field ]                                      │
│                                                      │
│ [ Cancel ]  [ Save Changes ]                         │
└──────────────────────────────────────────────────────┘
```

## Smart Loading/Progress Bar UX

During any async operation (such as data fetch, save, or authentication), display a visible progress indicator at the top of the screen (e.g., a thin animated bar or subtle loader). The progress bar should:

- Appear immediately when an async action starts and remain visible until completion.
- Use smooth, non-blocking animation to indicate ongoing activity.
- Avoid blocking user interaction unless absolutely necessary.
- Optionally show incremental progress if possible, or use an indeterminate animation if progress is unknown.
- Be styled to match the app’s theme and remain unobtrusive, but clearly visible.
- Disappear instantly when the operation completes or fails.

This ensures users always know when the app is working and prevents confusion during network delays or long-running actions.

## Notifications UX

- Show user notifications for errors, warnings, and important events as non-blocking banners or toasts at the top or bottom of the screen.
- Notifications should:
  - Appear immediately when triggered (e.g., on error, success, or important info).
  - Be styled to indicate type (error = red, warning = yellow, info/success = green/blue).
  - **Success and info notifications** auto-dismiss after 5 seconds.
  - **Error and warning notifications** remain pinned and require manual dismissal.
  - Include a close button (✕) for manual dismissal.
  - Never block user interaction with the main UI.
- All notifications from the current session are stored in memory (in-session only, do not persist across reloads).
- **No separate notifications page is required.** All notification management is handled via the navbar settings dropdown:
  - Settings dropdown (navbar) includes a "Clear All Notifications" option.
  - This allows users to manually clear all pinned error/warning notifications at once.

- All errors, API failures, and important events must be handled using the notification system. Any API failure must trigger a notification to the user.

**Notification Toast Example:**

```md
┌─────────────────────────────────────────────┐
│  ⚠️  Error: Failed to save changes. [✕]     │ ← Error notification (red, stays pinned)
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  ✓  Success: Record saved! [✕]              │ ← Success notification (green, auto-clears after 5s)
└─────────────────────────────────────────────┘
```

- Notifications are only visible for the current session and are cleared on reload or logout.