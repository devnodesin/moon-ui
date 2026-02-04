# UI Layouts and Components

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
│ [☑] Remember Connection      │
│                              │
│ [Connect Button]             │
│                              │
│ [Manage Connections]         │ ← Link to connection manager
│                              │
└──────────────────────────────┘
```

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
- Default: `Table View`, On click of a row item in the table show `Record View`

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

- Clicking a row in any data table opens a **Single Record View** using `Record View` component

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
