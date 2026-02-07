## Overview

- Improves notification clear button behavior for predictability and non-destructive actions.
- Adds explicit, scoped clear actions for single and all notifications.
- Provides visual feedback for clear actions.

## Requirements

- Update notification components to ensure clear actions are explicit and target-scoped (single notification vs. all).
- Implement a "Clear All Notifications" button that reliably removes all notifications.
- Provide clear visual feedback for all clear actions.
- Ensure no extra renders or network calls are triggered by clear actions.
- Add or update unit/integration tests for notification clear actions.

## Acceptance

- Clicking clear removes only intended notifications.
- "Clear All Notifications" button reliably removes all notifications.
- Visual feedback is provided for all clear actions.
- No extra renders or network calls are triggered.
- All tests pass and coverage is maintained.

- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
