## Overview

- Consolidate navbar controls into a single unified settings dropdown to improve usability and reduce UI clutter
- Currently `ConnectionSwitcher` and `ThemeToggle` are presented as separate dropdowns, which fragments the user experience
- A single settings dropdown with a recognizable icon will provide a cleaner, more intuitive interface
- The dropdown must be modular to allow easy addition of new settings or actions in the future

## Requirements

- **Dropdown Trigger**
  - Replace the two separate dropdown buttons with a single settings icon button in the navbar
  - Use a universally recognizable settings icon (e.g., gear/cog icon) without accompanying text
  - Icon button should follow existing navbar styling and be positioned in the top-right area

- **Dropdown Menu Structure**
  - Display a unified dropdown menu containing all navbar settings and actions
  - Group menu items logically with visual separators for clarity

- **Menu Items**
  - **Connection Switching Section**
    - Display the current active connection name or label
    - Provide a list of all configured connections
    - Allow users to switch between connections (same functionality as `ConnectionSwitcher`)
    - Include a "Manage Connections" option to navigate to the connection management page
  
  - **Theme Toggle Section**
    - Provide theme switching options (same functionality as `ThemeToggle`)
    - Display current theme selection clearly
    - Support all existing themes (e.g., light, dark, system)
  
  - **Visual Separator**
    - Insert a horizontal divider/separator between the theme toggle section and logout action
    - Separator should group similar controls and visually distinguish the logout action
  
  - **Logout Action**
    - Add a "Logout" menu item as the last item in the dropdown
    - Clicking "Logout" should trigger the application's logout flow (clear session, redirect to login)
    - Use a distinct icon or styling to indicate this is a destructive or final action

- **Modularity and Extensibility**
  - Design the dropdown component to allow easy addition of new menu items
  - Use a configuration-driven approach (e.g., menu items array) for scalability
  - Ensure clear separation of concerns (dropdown logic, menu items, actions)

- **Functional Requirements**
  - Clicking outside the dropdown should close it
  - Pressing the Escape key should close the dropdown
  - Only one dropdown should be open at a time
  - Dropdown items should support keyboard navigation (arrow keys, Enter, Tab)

- **Styling and Accessibility**
  - Use DaisyUI dropdown components and utilities for consistency
  - Ensure proper ARIA attributes for accessibility (e.g., `aria-label`, `role="menu"`)
  - Menu items should have clear hover and focus states
  - Icon and text sizing should match existing navbar design patterns

- **Implementation Notes**
  - Remove or refactor `ConnectionSwitcher` and `ThemeToggle` as standalone navbar components
  - Create a new `SettingsDropdown` component that encapsulates all settings and actions
  - Reuse existing connection and theme context logic
  - Ensure the logout action integrates with `useAuth` hook and authentication flow

## Acceptance

- [ ] A single settings icon button is displayed in the navbar (no text label)
- [ ] Clicking the settings icon opens a dropdown menu with all required items
- [ ] Connection switching options are present and functional in the dropdown
- [ ] Theme toggle options are present and functional in the dropdown
- [ ] A visual separator divides the theme section from the logout action
- [ ] A "Logout" option is present as the last item and triggers the logout flow correctly
- [ ] Clicking outside the dropdown or pressing Escape closes the menu
- [ ] Dropdown supports keyboard navigation (arrow keys, Enter, Tab)
- [ ] The dropdown design is modular and allows easy addition of new menu items
- [ ] Old `ConnectionSwitcher` and `ThemeToggle` standalone dropdowns are removed from the navbar
- [ ] All functionality from the original components is preserved
- [ ] The dropdown follows DaisyUI styling conventions and matches the existing navbar design
- [ ] Accessibility attributes (ARIA) are correctly implemented
- [ ] Unit tests cover dropdown behavior, menu item actions, and keyboard interactions
- [ ] E2E tests verify the dropdown workflow and logout action
- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
