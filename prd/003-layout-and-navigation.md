## Overview

This PRD defines the core application layout and navigation system for the Moon Admin WebApp. The layout establishes a responsive admin interface with fixed header, collapsible sidebar, dynamic content area, and footer. The navigation system implements client-side routing using HashRouter with route guards, authentication checks, and seamless redirection flows.

**Problem Statement:**  
Users need a consistent, intuitive, and mobile-responsive interface to navigate between different sections of the admin application while maintaining authentication state and connection context.

**Business Goals:**
- Provide a mobile-first, responsive admin interface that works seamlessly on desktop and mobile devices
- Enable secure, authenticated routing with proper guards and redirects
- Support efficient navigation between different admin sections (Collections, Users, API Keys, Connections)
- Provide visual feedback during async operations (loading states)
- Enable theme switching for user preference and accessibility
- Maintain connection context visibility through persistent server indicator

**Solution Summary:**  
Implement a fixed-layout admin interface with HashRouter-based client-side routing. The layout consists of a fixed header (with hamburger menu, page title, and theme switcher), a collapsible sidebar (fixed on desktop, overlay on mobile) with navigation menu and server indicator, a dynamic content area that changes based on route, and a footer. All authenticated routes are prefixed with `/admin` (or `/app`), and route guards ensure unauthenticated users are redirected to login with a `next` parameter preserving their intended destination. A smart loading/progress bar provides visual feedback during async operations.

---

## Requirements

### 1. Application Layout Structure

#### 1.1 Layout Components

**Header (Fixed)**
- Must remain fixed at the top of the viewport on all screen sizes
- Must contain:
  - Hamburger menu button (`[☰]`) positioned at the far left
  - Current page title/breadcrumb displayed prominently
  - Theme switcher control positioned at the far right
- Must use DaisyUI navbar component classes
- Must have z-index higher than content area but lower than overlay sidebar
- Must be visible at all times during navigation

**Sidebar (Collapsible)**
- Desktop (≥768px):
  - Must be fixed on the left side of the viewport
  - Must be always visible by default
  - Must have a fixed width (e.g., 240px or 16rem)
  - Must support collapse/expand toggle via hamburger button
  - When collapsed, must show icon-only navigation or hide completely
- Mobile (<768px):
  - Must be hidden by default
  - Must appear as an overlay when hamburger menu is clicked
  - Must cover content area with semi-transparent backdrop
  - Must close when:
    - User clicks backdrop
    - User clicks a navigation link
    - User clicks hamburger button again
  - Must have higher z-index than all other elements when open
- Must contain:
  - Navigation menu with links to all major sections
  - Server indicator showing current connection (backend URL or connection name)
  - Must highlight the active route/page
- Must use DaisyUI menu component classes

**Content Area (Dynamic)**
- Must occupy the remaining viewport space between header and footer
- Must be scrollable independently when content overflows
- Must dynamically render components based on current route
- Must clear previous content when route changes
- Must display loading state during data fetching
- Must be responsive and adapt to available width
- Desktop: Must have left margin/padding to account for fixed sidebar width
- Mobile: Must use full viewport width when sidebar is hidden

**Footer**
- Must remain at the bottom of the page
- Must be sticky or fixed at viewport bottom
- Must contain:
  - Copyright or branding information
  - Version number (optional)
  - Links to documentation or support (optional)
- Must use minimal height to maximize content area
- Must be visible on all screen sizes

#### 1.2 Responsive Behavior

- Must implement mobile-first design approach
- Breakpoints:
  - Mobile: `< 768px`
  - Tablet: `768px - 1024px`
  - Desktop: `≥ 1024px`
- Must adapt layout automatically based on viewport width
- Must support touch interactions on mobile (tap to open/close sidebar)
- Must support keyboard navigation (Tab, Enter, Escape)
- Must test layout on common device sizes (iPhone SE, iPad, 1080p desktop)

### 2. HashRouter Setup and Configuration

#### 2.1 Router Implementation

- Must use `react-router-dom` `HashRouter` for all client-side routing
- Hash-based routing format: `https://example.com/#/route/path`
- Must support nested routes under authenticated prefix
- Must define all routes in a centralized routes configuration file
- Must support route parameters (e.g., `/admin/collections/:id`)
- Must support query parameters (e.g., `?next=%2Fadmin%2Fusers`)

#### 2.2 Route Structure

**Authenticated Routes (Prefix: `/admin` or `/app`)**
- `/admin/` or `/app/` — Dashboard/Home (default landing page)
- `/admin/collections` — Collections list
- `/admin/collections/:id` — Collection detail/records
- `/admin/users` — Users list
- `/admin/users/:id` — User detail
- `/admin/api-keys` — API Keys list
- `/admin/connections` — Manage connections
- `/admin/notifications` — Notifications page
- `/admin/profile` — User profile/settings

**Unauthenticated Routes**
- `/` or `/login` — Login page (public)

**Configuration Support**
- Must support configurable authenticated prefix (default `/admin`, alternative `/app`)
- Prefix must be configurable via environment variable or config file

#### 2.3 Route Guards and Authentication Checks

**Route Guard Logic**
- Must implement a `PrivateRoute` or `ProtectedRoute` wrapper component
- Must check authentication state before rendering protected routes
- Authentication state check:
  - Verify presence of valid access token in app state or localStorage (based on "Remember Connection" setting)
  - Optionally verify token expiration timestamp
  - If token is expired but refresh token exists, attempt silent refresh before redirecting
- If authenticated: render the requested route component
- If not authenticated: redirect to login

**Unauthenticated Redirect with `next` Parameter**
- When an unauthenticated user attempts to access a protected route:
  - Must capture the original target route path
  - Must URL-encode the target route
  - Must redirect to `/#/login?next=%2Fadmin%2Fcollections` (example)
  - The `next` parameter must preserve the full intended path including route parameters
- After successful login:
  - Must parse the `next` parameter from query string
  - Must decode the URL-encoded path
  - Must redirect user to the originally requested route
  - If no `next` parameter exists, redirect to default `/admin/` route

**Authenticated Redirect from Login**
- If an authenticated user visits `/` or `/login`:
  - Must detect existing valid authentication state
  - Must redirect to `/admin/` (or configured prefix) immediately
  - Must not render login form

**Token Validation on Route Change**
- On every route transition within authenticated area:
  - Must verify access token is still valid
  - If token expired and refresh token available: attempt silent refresh
  - If refresh fails: must log out user and redirect to login with `next` parameter
  - Must trigger notification on forced logout due to token expiration

### 3. Sidebar Navigation Menu

#### 3.1 Navigation Menu Items

Must include the following navigation links:
- **Dashboard** — `/admin/` (Home icon)
- **Collections** — `/admin/collections` (Database icon)
- **Users** — `/admin/users` (Users icon)
- **API Keys** — `/admin/api-keys` (Key icon)
- **Connections** — `/admin/connections` (Server/plug icon)
- **Notifications** — `/admin/notifications` (Bell icon with badge showing unread count)
- **Profile/Settings** — `/admin/profile` (User/settings icon)
- **Logout** — Trigger logout action (not a route, executes logout function)

#### 3.2 Navigation Item Behavior

- Must use React Router `NavLink` component with `activeClassName` or `isActive` prop
- Active route must be visually highlighted (e.g., different background color, bold text, accent border)
- Must display icon + label on desktop
- Must support icon-only mode when sidebar is collapsed
- Must close sidebar overlay on mobile when a navigation link is clicked
- Logout action must:
  - Clear authentication state (tokens, user data)
  - Clear in-memory application data
  - Redirect to login page
  - Display logout success notification

#### 3.3 Server Indicator

**Location:** Must be displayed prominently in the sidebar (top or bottom)

**Display Content:**
- Must show current active connection information:
  - Connection name (if saved connection)
  - OR backend server URL (if custom/unsaved)
  - Optional: connection status indicator (green dot = connected)
- Must truncate long URLs with ellipsis and show tooltip on hover
- Must be clearly distinguishable from navigation menu items

**Interaction:**
- Must be clickable
- On click: navigate to `/admin/connections` page or open connection switcher
- Must provide visual feedback on hover (cursor pointer, background highlight)

**Mobile Behavior:**
- Must remain visible in mobile sidebar overlay
- Must use compact display on smaller screens

### 4. Theme Switcher

#### 4.1 Theme Options

- Must support exactly two DaisyUI themes:
  - **Light Mode:** `autumn` theme
  - **Dark Mode:** `abyss` theme
- Themes must be applied using DaisyUI's `data-theme` attribute on the `<html>` element

#### 4.2 Theme Switcher UI

**Location:** Fixed position in header (top-right corner)

**Component Type:** Toggle switch or button (DaisyUI swap component recommended)

**Visual Indicators:**
- Must display sun/moon icon or similar visual indicator
- Must show current theme state clearly
- Must have smooth transition animation when switching

**Interaction:**
- Single click/tap toggles between light and dark theme
- Must apply theme change immediately without page reload
- Must persist theme preference in localStorage
- On app initialization: must read saved theme preference and apply it before rendering

#### 4.3 Theme Persistence

- Must store user's theme preference in localStorage under key `theme` or `appTheme`
- On app mount/initialization:
  - Read theme from localStorage
  - If no saved preference: default to `autumn` (light mode)
  - Apply theme to `<html data-theme="...">` attribute
- Must update localStorage whenever user changes theme
- Theme preference must persist across sessions and page reloads
- Theme preference must be per-browser, not per-connection

### 5. Mobile Responsiveness

#### 5.1 Hamburger Menu

**Desktop (≥768px):**
- Hamburger button visible but optional (sidebar is already visible)
- May be used to collapse sidebar for more content space

**Mobile (<768px):**
- Hamburger button must be prominently visible in header
- Must use standard icon: `☰` or three horizontal lines
- On click: must toggle sidebar overlay visibility
- Must show open/close animation

#### 5.2 Sidebar Overlay (Mobile)

**Open State:**
- Sidebar slides in from left or fades in
- Semi-transparent backdrop covers content area
- Sidebar width: 70-80% of viewport width (or fixed 280px, whichever is smaller)
- Must trap focus within sidebar when open
- Must support swipe-to-close gesture (optional enhancement)

**Close State:**
- Sidebar slides out or fades out
- Backdrop fades out and is removed from DOM
- Focus returns to main content area

**Accessibility:**
- Must be keyboard accessible (Escape key closes sidebar)
- Must handle touch events properly
- Backdrop click must close sidebar

### 6. Content Area Dynamic Loading

#### 6.1 Route-Based Content Rendering

- Content area must render different components based on current route using React Router's `Outlet` or `Routes` component
- Must clear previous route's component before rendering new route
- Must unmount previous component to avoid memory leaks
- Must support nested routes (e.g., `/admin/collections/:id` renders within collections layout)

#### 6.2 Lazy Loading (Optional Enhancement)

- May implement code-splitting for route components using React `lazy()` and `Suspense`
- Must show loading fallback during lazy component load
- Must handle lazy load failures gracefully with error boundary

### 7. Smart Loading/Progress Bar

#### 7.1 Progress Bar Requirements

**Location:** Fixed at the very top of the viewport, above header

**Visual Design:**
- Thin horizontal bar (2-4px height)
- Styled with accent color from current theme
- Smooth animation (sliding, indeterminate progress, or shimmer effect)
- Must not block user interaction

**Trigger Conditions:**
- Must appear when any async operation starts:
  - API fetch requests (GET, POST, PUT, DELETE)
  - Authentication operations (login, token refresh, logout)
  - Data import/export operations
  - Route transitions with data loading
- Must remain visible for the entire duration of the operation
- Must disappear immediately when operation completes (success or failure)

**Implementation Approach:**
- Use a global loading state managed by context, Redux, or state management library
- HTTP client (axios/fetch wrapper) must trigger loading state automatically
- May use a library like `nprogress`, `react-top-loading-bar`, or implement custom solution
- Must support concurrent operations (if multiple requests are in flight, bar stays visible until all complete)

#### 7.2 Loading State Behavior

- Must start animation immediately (no delay)
- Indeterminate animation (continuous sliding or shimmer) if progress percentage unknown
- May show determinate progress (0-100%) if operation provides progress updates
- Must be styled according to active theme (light/dark mode)
- Must have smooth transition when appearing and disappearing

### 8. Error Handling and Edge Cases

#### 8.1 Navigation Errors

- **Invalid Route:** Must redirect to `/admin/` or show a 404-style page within admin layout
- **Network Failure During Route Transition:** Must show notification and allow retry
- **Token Refresh Failure During Route Guard Check:** Must force logout and redirect to login with `next` parameter

#### 8.2 Layout Errors

- **Sidebar Fails to Render:** Must still show header, content area, and footer; log error
- **Header Component Crashes:** Must be caught by error boundary; show fallback UI
- **Theme Switcher Fails:** Must default to `autumn` theme; log error and disable switcher

#### 8.3 Mobile-Specific Edge Cases

- **Sidebar Overlay Open During Orientation Change:** Must adjust layout and remain open
- **Sidebar Overlay Open During Browser Resize to Desktop Width:** Must close overlay and show fixed sidebar
- **Touch Event Conflicts:** Must properly handle touch events without interfering with content scrolling

### 9. Technical Constraints

- Must use React 18+ function components with hooks
- Must use React Router v6+ for routing
- Must use DaisyUI components and Tailwind CSS classes exclusively for styling
- Must use TypeScript with strict mode enabled
- Must be compatible with Bun.js build pipeline
- Must work in latest versions of Chrome, Firefox, Safari, and Edge
- Must not use any other UI library or CSS framework
- Must not implement custom routing logic (use React Router primitives)

### 10. Performance Requirements

- Layout must render within 100ms on modern devices
- Route transitions must feel instantaneous (<200ms)
- Sidebar toggle animation must be smooth (60fps)
- Theme switching must be immediate (no visible flash or delay)
- Loading bar must appear within 50ms of async operation start
- Must not cause layout shift (CLS) during initial render or route transitions

### 11. Security Requirements

- Route guards must prevent unauthenticated access to protected routes
- Token validation must occur on every route transition
- Must not expose sensitive data in route parameters or query strings
- Must clear authentication state completely on logout
- Must not persist unauthenticated users' navigation history

---

## Acceptance

### 1. Layout Rendering

- [ ] Admin layout renders with header, sidebar, content area, and footer on page load
- [ ] Header is fixed at the top and remains visible during scroll
- [ ] Sidebar is fixed on desktop and visible by default (≥768px viewport width)
- [ ] Sidebar is hidden on mobile and toggled via hamburger menu (<768px viewport width)
- [ ] Content area occupies remaining space and scrolls independently
- [ ] Footer is positioned at the bottom of the page
- [ ] Layout adapts correctly when resizing browser window from desktop to mobile and vice versa

### 2. HashRouter and Route Guards

- [ ] Application uses HashRouter for all client-side navigation
- [ ] All authenticated routes are prefixed with `/admin` (or configured prefix)
- [ ] Unauthenticated users attempting to access `/admin/*` are redirected to `/#/login?next=%2Fadmin%2F...`
- [ ] After login, users are redirected to the route specified in `next` parameter (if present)
- [ ] If no `next` parameter, users are redirected to `/admin/` after login
- [ ] Authenticated users visiting `/` or `/login` are automatically redirected to `/admin/`
- [ ] Route guards validate token on every route transition
- [ ] Expired tokens trigger silent refresh attempt before redirecting to login
- [ ] If refresh fails, user is logged out and redirected with notification

### 3. Sidebar Navigation Menu

- [ ] Sidebar displays navigation links for: Dashboard, Collections, Users, API Keys, Connections, Notifications, Profile, Logout
- [ ] Active route is visually highlighted in the sidebar
- [ ] Navigation links use React Router `NavLink` with active state styling
- [ ] Clicking a navigation link navigates to the corresponding route
- [ ] Clicking Logout clears authentication state and redirects to login
- [ ] Server indicator displays current connection name or backend URL
- [ ] Server indicator is clickable and navigates to Connections page
- [ ] Long server URLs are truncated with ellipsis and show full URL on hover

### 4. Mobile Responsiveness

- [ ] Hamburger menu button is visible in header on mobile (<768px)
- [ ] Clicking hamburger button opens sidebar as an overlay on mobile
- [ ] Sidebar overlay covers content with semi-transparent backdrop
- [ ] Clicking backdrop closes sidebar overlay
- [ ] Clicking a navigation link closes sidebar overlay
- [ ] Clicking hamburger button again closes sidebar overlay
- [ ] Sidebar overlay slides in/out with smooth animation
- [ ] On desktop (≥768px), sidebar is fixed and always visible (no overlay)
- [ ] Layout is tested and works on iPhone SE, iPad, and 1080p desktop viewports

### 5. Theme Switcher

- [ ] Theme switcher is visible in header (top-right corner)
- [ ] Theme switcher displays sun/moon icon or similar indicator
- [ ] Clicking theme switcher toggles between `autumn` (light) and `abyss` (dark) themes
- [ ] Theme change applies immediately without page reload
- [ ] Theme preference is saved to localStorage
- [ ] On app initialization, saved theme preference is loaded and applied
- [ ] If no saved preference, default theme is `autumn`
- [ ] Theme persists across page reloads and sessions
- [ ] Theme switch animation is smooth and visually appealing

### 6. Content Area Dynamic Rendering

- [ ] Content area renders the correct component for each route:
  - `/admin/` renders Dashboard
  - `/admin/collections` renders Collections list
  - `/admin/users` renders Users list
  - `/admin/api-keys` renders API Keys list
  - `/admin/connections` renders Connections manager
  - `/admin/notifications` renders Notifications page
  - `/admin/profile` renders Profile/Settings
- [ ] Content area clears previous component before rendering new route
- [ ] Content area is scrollable when content overflows
- [ ] Invalid routes render 404 page or redirect to `/admin/`

### 7. Smart Loading/Progress Bar

- [ ] Loading/progress bar is positioned at the very top of the viewport
- [ ] Progress bar appears immediately when an async operation starts (e.g., API call)
- [ ] Progress bar remains visible for the entire duration of the operation
- [ ] Progress bar disappears immediately when operation completes or fails
- [ ] Progress bar does not block user interaction with the UI
- [ ] Progress bar is styled with smooth animation (sliding, shimmer, or indeterminate)
- [ ] Progress bar is styled according to active theme (light/dark)
- [ ] Progress bar handles concurrent requests correctly (stays visible until all complete)
- [ ] Progress bar is tested with login, data fetch, and route transitions

### 8. Error Handling and Edge Cases

- [ ] Invalid routes redirect to `/admin/` or show 404 page
- [ ] Token expiration during navigation triggers refresh attempt
- [ ] Failed token refresh logs out user and redirects to login with `next` parameter
- [ ] Notification is shown when user is logged out due to expired session
- [ ] Sidebar overlay closes correctly during orientation change on mobile
- [ ] Sidebar overlay closes when resizing from mobile to desktop width
- [ ] Theme switcher fails gracefully if localStorage is unavailable (default to `autumn`)
- [ ] Error boundaries catch component crashes and show fallback UI

### 9. Accessibility and Usability

- [ ] Hamburger menu button is keyboard accessible (Tab + Enter)
- [ ] Sidebar is keyboard accessible (Tab through navigation links)
- [ ] Pressing Escape key closes sidebar overlay on mobile
- [ ] Theme switcher is keyboard accessible (Tab + Enter)
- [ ] Active navigation link has clear focus indicator
- [ ] All interactive elements have hover states
- [ ] Server indicator shows tooltip with full URL on hover

### 10. Performance and Visual Quality

- [ ] Layout renders within 100ms on modern devices
- [ ] Route transitions complete within 200ms
- [ ] Sidebar toggle animation is smooth at 60fps
- [ ] Theme switch is immediate with no flash of unstyled content
- [ ] Loading bar appears within 50ms of async operation start
- [ ] No layout shift (CLS) during initial render or navigation
- [ ] Layout is visually consistent across Chrome, Firefox, Safari, and Edge

### 11. Integration Testing

- [ ] End-to-end test: Unauthenticated user accesses `/admin/collections`, is redirected to login, logs in, and is redirected back to `/admin/collections`
- [ ] End-to-end test: Authenticated user navigates through all main routes (Dashboard, Collections, Users, API Keys, Connections, Notifications, Profile)
- [ ] End-to-end test: User logs out from sidebar, is redirected to login, and cannot access `/admin/*` routes
- [ ] End-to-end test: User switches theme, refreshes page, theme persists
- [ ] End-to-end test: User opens sidebar on mobile, clicks navigation link, sidebar closes, and route changes
- [ ] End-to-end test: Token expires during navigation, user is logged out and redirected with notification
- [ ] Integration test: Loading bar appears during API call and disappears on completion
- [ ] Integration test: Server indicator displays correct connection name/URL

### 12. Documentation and Code Quality

- [ ] All components are TypeScript function components with proper types
- [ ] All props and state are strongly typed
- [ ] Route configuration is centralized and documented
- [ ] Layout components are modular and reusable
- [ ] Route guard logic is extracted into reusable wrapper/hook
- [ ] Theme management logic is documented
- [ ] Loading bar integration is documented
- [ ] Mobile-responsive behavior is documented
- [ ] Code passes TypeScript strict mode checks with no errors
- [ ] Code follows project ESLint rules (if configured)

---

## Checklist

- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
