## Overview

- **What is this and why**: This task involves initializing the Moon Admin WebApp project repository with the required technology stack and configuration. It establishes the foundation for all subsequent development.
- **Overview**: We will set up a React + TypeScript application using Vite and Bun.js. We will configure Tailwind CSS and DaisyUI for styling, establish the project directory structure, and set up linting, formatting, and testing tools to ensure code quality and `SPEC.md` compliance.
- **Overview**: The result will be a runnable "Hello World" application with the correct build system, test runner, and style framework in place, ready for feature development.

## Requirements

- **What must it do?**
  - Initialize a new Vite project using the `react-ts` template.
  - Use `bun` as the package manager and runtime.
  - Install and configure Tailwind CSS and DaisyUI.
  - Configure `autumn` (light) and `abyss` (dark) themes in DaisyUI.
  - Set up a strict TypeScript configuration (`tsconfig.json`).
  - Configure ESLint and Prettier for code consistency.
  - Set up a test runner (Bun test or Vitest) with a sample test to verify the setup.
  - Create the initial directory structure (e.g., `src/components`, `src/pages`, `src/lib`, `src/hooks`, `src/types`).
  - Ensure the app runs locally on `localhost`.

- **Requirements**
  - **Stack**: React, TypeScript, Vite, Bun.js.
  - **Styling**: Tailwind CSS, DaisyUI.
  - **Testing**: Bun Test (preferred) or Vitest. 90%+ coverage goal infrastructure.
  - **Linting**: ESLint, Prettier.
  - **Strict Mode**: TypeScript strict mode must be enabled.
  - **Path Aliases**: Configure `@/` to point to `src/`.

## Acceptance

- **How do we know it’s done?**
  - Repository contains a valid `package.json` with `bun` lockfile.
  - `bun run dev` starts the server without errors.
  - `bun run build` produces a production build in `dist/`.
  - `bun test` runs and passes the sample test.
  - Tailwind and DaisyUI are working: A sample component using DaisyUI classes renders correctly with the `autumn` theme by default.
  - Directory structure matches the standard React layout.
  - Linting commands (`bun run lint`) pass without errors.

- **Acceptance Checklist**
  - [ ] Project initialized with `bun create vite moon-ui --template react-ts` (or equivalent).
  - [ ] Tailwind CSS and DaisyUI installed and configured in `tailwind.config.js`.
  - [ ] Themes `autumn` and `abyss` added to DaisyUI config.
  - [ ] TypeScript configured with `strict: true`.
  - [ ] ESLint and Prettier configured and scriptable via `package.json`.
  - [ ] Test runner configured; `bun test` passes a trivial test.
  - [ ] Project structure created (`src/` with subfolders).
  - [ ] README updated with start commands.

- **Verification**
  - Run `bun install && bun run dev` and open the browser.
  - Run `bun test`.
  - Check `tailwind.config.js` for theme configuration.

## Documentation Checklist

- [x] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
