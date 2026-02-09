## Overview

- Establish a clear and consistent z-index layering system across the application to prevent UI elements from overlapping incorrectly
- Notifications must always be visible above all other elements to ensure critical user feedback is never obscured
- Sidebar navigation should be above main content but below notifications to maintain proper visual hierarchy
- Remove sticky positioning from the navbar as it is not required for the current design

## Requirements

- **Notification Layer (Highest Priority)**
  - Notifications (`ToastContainer`) must have the highest z-index value in the application
  - Should render above all other UI components including modals, sidebars, and navbar
  - Suggested z-index range: `z-50` or higher (DaisyUI/Tailwind convention)

- **Sidebar Layer (Medium Priority)**
  - Sidebar menu must be positioned below notifications but above main page content
  - Should overlay the main content area when expanded on mobile/tablet viewports
  - Suggested z-index: `z-40`

- **Main Content and Other Elements (Base Priority)**
  - All other UI elements (main content, cards, tables, forms) should use default or low z-index values
  - Should be below both notifications and sidebar in the stacking order
  - Suggested z-index: `z-0` to `z-10`

- **Navbar Positioning**
  - Remove any sticky positioning (`position: sticky`) from the navbar
  - Navbar should use static or relative positioning as per the current design requirements
  - May use a low z-index value if needed for layout consistency

- **Implementation Constraints**
  - Use DaisyUI/Tailwind utility classes (`z-0`, `z-10`, `z-20`, `z-30`, `z-40`, `z-50`) for consistency
  - Document the z-index system in a comment or constants file for future reference
  - Ensure z-index changes do not break existing functionality (modals, dropdowns, tooltips)

- **Testing Requirements**
  - Verify notification visibility when sidebar is open
  - Verify sidebar overlays main content correctly
  - Verify navbar does not interfere with notification or sidebar layering
  - Test on mobile, tablet, and desktop viewports

## Acceptance

- [ ] Notifications always appear above all other UI elements in all scenarios
- [ ] Sidebar menu is positioned below notifications but above main page content
- [ ] Navbar does not use sticky positioning
- [ ] Z-index values are consistent and follow DaisyUI/Tailwind conventions
- [ ] No visual stacking order issues occur when multiple overlays are active (e.g., notification + sidebar open)
- [ ] Manual testing confirms correct layering on mobile, tablet, and desktop viewports
- [ ] Existing functionality (modals, dropdowns, tooltips) remains unaffected
- [ ] Z-index system is documented in code comments or a constants file
- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
