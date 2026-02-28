# AGENTS.md — Moon Admin WebApp

## Project Identity

This is the **Moon Admin WebApp**: a secure, mobile-first, single-page admin interface for managing Moon API backends. Built exclusively with **Vue 3 + Vite + TypeScript + Bootstrap 5.3**.

- Greenfield project — ignore backwards compatibility.
- Single-user scope — make any changes needed without hesitation.
- Never introduce new TypeScript or build warnings. Fix any that appear.

## Mandatory Rules

- **SPEC.md is the only source of truth for architecture, design, and behavior.**
  - Follow its structure, component patterns, and operational details exactly.
  - For Moon API endpoints, request/response formats, and error codes, see **moon-llms.md**.
- Do not invent patterns or workflows not described in SPEC.md or moon-llms.md.
- Do not use any UI/component library other than **Bootstrap 5.3** and **Bootstrap Icons**.
- Do not use any framework other than **Vue 3 + Vite + TypeScript**. Remove all references to other frameworks.
- Never cache backend data between sessions or connections.
- Never reference any file in `prd/` unless explicitly provided by the user.
  - When a `prd/` file is given, use only that file for the specific implementation requested.
  - Do not use `prd/` files for cross-reference or any other purpose unless instructed.
- Flag missing information and unsupported assumptions explicitly.
- Be skeptical by default; state uncertainty clearly.

## Documentation Compliance

- **SPEC.md**: Frontend architecture, component design, authentication flow, HTTP client layer, state management, routing, and all UI/UX behavior.
- **moon-llms.md**: Complete Moon API reference — endpoints, request/response patterns, query options, aggregation, error codes, and authentication.

Strictly follow all guidelines and structures in these documents for every task.

## Stack (Non-Negotiable)

| Concern      | Technology                        |
| ------------ | --------------------------------- |
| Framework    | Vue 3 (Composition API)           |
| Build tool   | Vite (latest)                     |
| Language     | TypeScript (strict mode)          |
| UI           | Bootstrap 5.3 + Bootstrap Icons   |
| HTTP         | `fetch` (native browser API)      |
| Testing      | Vitest + Vue Test Utils           |
| E2E Testing  | Playwright                        |
| Linting      | ESLint + Prettier                 |

No other frameworks, UI libraries, or CSS frameworks are permitted.

## Best Practices

- Follow idiomatic Vue 3 (Composition API, `<script setup>`) and TypeScript best practices.
- Research as needed; use the **context7 MCP server** for up-to-date Vue 3, Vite, and Bootstrap docs.
- Use **Playwright MCP server** for visual/E2E testing.
- Keep code, configuration, and docs lean, simple, and clean.
- Avoid unnecessary complexity and duplication.
- **Test-Driven Development (TDD) is required:**
  - Write a failing test first, then implement to make it pass.
  - Every component, composable, utility, and service must have a corresponding `.spec.ts` test file.
  - Target **90%+ test coverage** and **100% test pass rate**.
  - Fix any failing test, even if unrelated to the current task.
- Always check for existing, well-maintained npm packages before building custom solutions. Document evaluation and rationale for any custom implementation.

## Workflow & Verification

- **Plan:** List minimal steps; note risks and edge cases.
- **Patch:** Make small, focused diffs; exclude unrelated changes.
- **Test:** Write failing tests first; run tests with timeout; fix failures; add or update only minimal tests to cover new logic.
- **Decompose:** Split work into small, reviewable steps/commits.
- **Double-check:** Re-evaluate logic and trade-offs before finalizing.
- **Verify:** Briefly note how you validated; optionally record trade-offs and related follow-ups.
- **If uncertain:** Ask clarifying questions. If you must proceed, choose the conservative/simple path and state assumptions.

## Code Quality & Style

- Use Vue 3 Composition API with `<script setup lang="ts">` for all components.
- Enforce TypeScript strict mode throughout; no `any` unless absolutely unavoidable and documented.
- Use clear, descriptive names; avoid magic values; extract constants.
- Keep composables and components small and single-purpose.
- Prefer the simplest working solution over cleverness.
- Add abstractions only when justified.
- Fail fast: surface errors explicitly; do not swallow them silently.
- Handle all errors and edge cases. No TODOs, dead code, or partial fixes.
- Always use Bootstrap 5.3 utility classes and components — no custom CSS unless Bootstrap cannot achieve the result.
- Always use Bootstrap toasts for all user notifications (success, error, warning, info).
- Always display the error `message` from the API response in notifications; use a fallback only if the API provides none.
- Show a smart loading/progress indicator for all async operations.

### Format All TypeScript & Vue Files

Format all `.ts`, `.vue`, and `.js` files using `prettier` for consistent style:

1. Find all `*.ts`, `*.vue`, `*.js` files (including subdirectories).
2. Run `npx prettier --write` on each file.
3. Fix any remaining ESLint issues with `npx eslint --fix`.

## Documentation Sync

Always keep the following in sync with code changes:

- AI Agent Rules: `AGENTS.md`
- Software Specification: `SPEC.md`
- API Reference: `moon-llms.md`
- Installation & Setup: `INSTALL.md`
- Project Overview: `README.md`
