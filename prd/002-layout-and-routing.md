## Overview

- **What is this and why**: Implement the core application shell, navigation structure, and client-side routing. This provides the skeleton for the application, handling how users navigate between pages and how the UI adapts to different screen sizes.
- **Context**: The app requires a mobile-first responsive layout with a specific routing strategy (`HashRouter`) and theme management (Light/Dark).
- **Goal**: Create a Main Layout component with navigation, implement the router with route guards (skeletons), and a working theme switcher.

## Requirements

- **Routing Architecture**:
  - Use `HashRouter` from `react-router-dom`.
  - Define primary routes:
    - `/` (Public Login - placeholder component)
    - `/admin` (Protected Area - Main Layout)
    - `*` (404 Not Found)
  - Implement a `ProtectedRoute` wrapper (stubbed authentication check for now, always allowing or blocking via a simple flag).
  - Implement redirection logic:
    - If unauthenticated and visiting `/admin`, redirect to `/` with `?next=...` param.
    - If authenticated and visiting `/`, redirect to `/admin`.

- **UI Layout (DaisyUI)**:
  - **App Shell**: Use a Drawer layout for mobile responsiveness.
  - **Sidebar/Drawer**:
    - Hidden on mobile (hamburger menu).
    - Visible on desktop (LG screens).
    - Contains navigation links (Dashboard, Collections, Settings).
  - **Navbar**:
    - Sticky top.
    - Contains branding/title.
    - Contains Theme Toggle button.
  - **Main Content Area**:
    - Scrollable independent of sidebar.

- **Theme Management**:
  - Implement a Theme Context or Hook.
  - Toggle between `autumn` (light) and `abyss` (dark).
  - Persist selection in `localStorage` (key: `moon-theme`).
  - Default to system preference if no storage found.

- **Components**:
  - `Layout`: Wrapper for authenticated pages.
  - `Sidebar`: Navigation list.
  - `Navbar`: Header.
  - `ThemeToggle`: Component to switch themes.

## Acceptance

- **Verification Steps**:
  1. Open app -> Check if it lands on `/` (Login).
  2. Manually change URL to `/#/admin` -> Should verify redirect logic (mock auth state).
  3. Resize window -> Verify sidebar collapses to hamburger on mobile widths.
  4. Click Hamburger -> Sidebar drawer opens.
  5. Click Theme Toggle -> UI switches immediately between `autumn` and `abyss`.
  6. Refresh page -> Theme choice persists.

- **Automated Tests**:
  - Test routing redirects (mocking the auth check).
  - Test Layout renders children correctly.
  - Test Sidebar toggle state.

- **Checklist**:
  - [x] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
  - [x] Run all tests and ensure 100% pass rate.
  - [x] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
