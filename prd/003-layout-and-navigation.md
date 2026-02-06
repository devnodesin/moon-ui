## Overview

- **What is this and why**: This task defines the visual skeleton and navigation structure of the application. It ensures a consistent, responsive, and accessible user interface across all admin pages.
- **Overview**: We will implement the main application layout using React Router (HashRouter) and DaisyUI components. This includes a responsive Sidebar for navigation, a Header for global actions (Connection switch, Theme toggle), and a Main Content area.
- **Overview**: The layout will also house global UI elements like the Notification Toast Container and handle the routing logic for public (Login) vs. private (Admin) areas.

## Requirements

- **What must it do?**
  - **Routing**:
    - Implement `HashRouter`.
    - Define Public Route wrapper (redirects to Admin if logged in).
    - Define Protected Route wrapper (redirects to Login if not logged in).
    - Handle `?next=` redirection parameter.
  - **Layout Components**:
    - **Sidebar**:
      - Responsive (collapsible on mobile, fixed on desktop).
      - Navigation links (Dashboard, Collections, Settings).
      - Active state indication.
    - **Header**:
      - Breadcrumbs (optional but good).
      - Theme Switcher (Toggle between `autumn` and `abyss`).
      - User/Connection Info summary.
      - Logout button.
    - **Main Content**:
      - Scrollable area for page content.
  - **Theming**:
    - Implement a Theme Context/Hook to toggle DaisyUI themes.
    - Persist theme preference in `localStorage`.
  - **Notifications**:
    - Implement a global Toast container for displaying notifications (Success, Error, Info).

- **Requirements**
  - **Mobile-First**: Sidebar must be a drawer on mobile screens (< 768px).
  - **DaisyUI**: Use standard components (Drawer, Navbar, Menu, Toast).
  - **Performance**: No layout thrashing; smooth transitions.
  - **Accessibility**: Keyboard navigation support for menu items.

## Acceptance

- **How do we know it’s done?**
  - App renders a Login page at root `/` (when unauthenticated).
  - App renders the Dashboard layout at `/admin` (when authenticated).
  - Sidebar toggles correctly on mobile.
  - Theme switcher changes the UI appearance instantly and persists on reload.
  - Navigating to a protected route without auth redirects to login.
  - Toast notifications appear in the correct position (e.g., bottom-right) and auto-dismiss.

- **Acceptance Checklist**
  - [ ] `HashRouter` configured with routes.
  - [ ] `Layout` component created (Sidebar + Navbar + Content).
  - [ ] `ThemeContext` implemented (`autumn`/`abyss`).
  - [ ] Responsive Sidebar (Drawer) working on mobile and desktop.
  - [ ] Protected Route Guard implemented.
  - [ ] Notification/Toast component integrated into Layout.
  - [ ] Logout action in Header works (clears session and redirects).

- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
