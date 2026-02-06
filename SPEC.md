## Role

You are a senior full-stack engineer specializing in secure, mobile-first admin web applications.

## Context

Moon Admin WebApp is a fully standalone, schema-driven admin UI for managing any Moon API-compliant backend. It must support multiple backend connections, encrypt all sensitive data in localStorage, and guarantee real-time, uncached data. The stack is React + DaisyUI (Tailwind) + Bun.js.

---

**Important:**

- The backend is powered by Moon server: [https://github.com/devnodesin/moon](https://github.com/devnodesin/moon)
- For backend API documentation, always attempt to fetch from [https://moon.asensar.in/doc/md](https://moon.asensar.in/doc/md). If unavailable, refer to the local copy in `MOON_API.md`.
- **UI Layouts and Components**: refer [SPEC_UI.md](./SPEC_UI.md) for UI design.

---

### Application Flows

#### Authentication Flow

```
Login → Encrypt & Store Tokens → API Calls (with token) →
Token Refresh → Logout → Clear Tokens
```

#### Connection Switching Flow

```
Select New Connection → Confirm Switch → Logout from Current →
Clear In-Memory Data → Decrypt New Credentials → Login to New Backend →
Fetch Fresh Data → Update UI
```

## Objective

Design and implement a secure, mobile-first admin webapp that enables seamless management of collections, users, API keys, and connections across multiple Moon backends, with all sensitive data encrypted at rest and no data caching.

## Instructions

1. TypeScript is required (strict mode and type-checking enforced).
2. Use DaisyUI themes: `autumn` for light mode, `abyss` for dark mode.
3. Support only the latest major browsers; no need to support legacy browsers like IE.
4. Extract backend connection, authentication, and schema-driven UI requirements from the context.
5. Generate a React-based admin app using DaisyUI for all UI components and Tailwind for layout.
6. Implement secure localStorage encryption (AES-GCM 256, PBKDF2, browser fingerprint).
7. For browser fingerprinting, use a privacy-respecting method (e.g., user agent and platform string; avoid canvas or advanced fingerprinting unless absolutely necessary).
8. Ensure all data (collections, users, API keys, schemas) is always fetched fresh from the backend.
9. Support multiple backend connections with encrypted credentials and tokens.
10. Provide mobile-first, responsive layouts for all views.
11. Use Bun.js for project setup, dev server, and builds.
12. Validate all user input and API responses.
13. Explicitly require robust error handling for network/API failures in the UI. Show user notifications for errors, auto-dismiss them, and provide a separate Notification page to view all previous notifications with a 'clear all notifications' option. Specify if notifications should persist only in-session or across reloads (recommend in-session only for now).
14. All errors, API failures, and important events must be handled using the notification system. Show a smart loading/progress bar for best UX/UI during async operations. Any API failure must trigger a notification to the user.
15. Support data import and export features using CSV and JSON formats.
16. Follow session timeout and auto-logout rules as specified in `MOON_API.md`.
17. Notifications are in-session only and stored completely locally (not persisted across reloads).
18. No need for i18n or translation support; all UI and messages will be in English only.
19. Storing sensitive data in in-memory (JS variables) is acceptable during the session, but never persist keys or sensitive data in plaintext.
20. Document setup, configuration, and security model in the repo.
21. **UI Layouts and Components**: refer [SPEC_UI.md](./SPEC_UI.md) for UI design.

## Constraints

### MUST

- **Test Driven Development:** All features and implementations must follow TDD—first write a failing test, then implement to pass. Aim for 90%+ test coverage and 100% test pass rate. Fix any failing test, even if unrelated to your implementation.
- Encrypt all sensitive data before localStorage (AES-GCM 256-bit, PBKDF2, unique IV).
- Use React + DaisyUI (Tailwind) for all UI.
- Use Bun.js for all scripts and builds.
- Always fetch fresh data from backend (no caching).
- Support multiple backend connections, each isolated and encrypted.
- Validate all user input and API responses.
- Provide mobile-first, accessible UI (WCAG 2.1 AA).
- Document all security and setup steps.

### MUST NOT

- Must not store encryption keys or sensitive data in plaintext or cookies.
- Must not cache backend data between sessions or connections.
- Must not use any UI/component library other than DaisyUI/Tailwind.
- Must not use any backend except Moon API-compliant servers.
- Must not allow HTTP (unencrypted) in production.

## Output Format

- All code and documentation must be in markdown or code files as appropriate.
- UI code must use React function components, DaisyUI classes, and Tailwind for layout.
- Encryption logic must be in a separate utility module, fully documented.
- Setup and security documentation must be in INSTALL.md and README.md.

## Success Criteria

- ✅ All sensitive data is encrypted at rest (localStorage).
- ✅ No backend data is cached between sessions or connections.
- ✅ All UI is mobile-first, responsive, and accessible.
- ✅ Switching connections never leaks or reuses data.
- ✅ All code and docs follow the specified stack and security model.

## Edge Cases

- Switching connections with unsaved changes: Prompt user to confirm, warn about data loss.
- Token expiration or refresh failure: Force logout and require re-authentication.
- Corrupted or missing encrypted data: Prompt user to re-enter credentials and reset localStorage.

## Examples

### Example 1: Simple Login & Connection

Input: User enters server URL, username, password, checks "Remember Connection", clicks Connect.
Output: Credentials are validated, JWT tokens are received, all sensitive data is encrypted and stored in localStorage, user is logged in and redirected to Admin view.
Explanation: No sensitive data is stored unencrypted; connection is isolated.

### Example 2: Connection Switch & Data Isolation

Input: User switches from "Production" to "Staging" backend.
Output: All in-memory data is cleared, tokens for new backend are decrypted, user is authenticated, fresh data is fetched from new backend, UI updates to reflect new connection.
Explanation: No data is shared or cached between backends.

-
