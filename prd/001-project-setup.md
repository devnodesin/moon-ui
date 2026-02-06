## Overview

- **What is this and why**: Initialize the Moon Admin WebApp project with the required technology stack and development tooling. This foundation ensures all subsequent features are built upon a stable, strictly typed, and testable environment.
- **Context**: The project is a fresh React SPA using TypeScript. `SPEC.md` mandates specific tools (Vite, Tailwind, DaisyUI, Vitest) and strict code quality standards (TDD, linting).
- **Goal**: Establish the repository structure, install dependencies, configure build tools/linters, and prove the setup works with a basic "Hello World" and passing tests.

## Requirements

- **Tech Stack Setup**:
  - Initialize a new Vite project with React and TypeScript (`swc` variant preferred for performance).
  - Install and configure Tailwind CSS.
  - Install and configure DaisyUI plugin.
  - Configure DaisyUI themes: `autumn` (light) and `abyss` (dark) as per `SPEC.md`.
  - Ensure `package.json` scripts are set up for `dev`, `build`, `preview`, `test`, `lint`.

- **Testing Infrastructure**:
  - Install Vitest and React Testing Library.
  - Configure `jsdom` environment for tests.
  - Create a sample test to verify the test runner works.

- **Code Quality**:
  - Configure ESLint with strict TypeScript rules.
  - Configure Prettier for consistent formatting.
  - Ensure no "any" types are allowed (Strict Mode).

- **Constraint Compliance**:
  - Must use `HashRouter` (install `react-router-dom`).
  - Mobile-first responsive meta tags must be present.

## Acceptance

- **Verification Steps**:
  1. Run `npm install` and `npm run dev` -> App should load without errors on `localhost`.
  2. Run `npm run test` -> Sample tests should pass with green output.
  3. Run `npm run build` -> Should generate a `dist/` folder with optimized assets.
  4. Inspect the browser:
     - Verify Tailwind utility classes work (e.g., change background).
     - Verify DaisyUI components render (e.g., a button).
     - Toggle themes (manually in code or devtools HTML tag) to verify `autumn` and `abyss` exist.
  
- **Automated Tests**:
  - `App.test.tsx` renders the App component and asserts "Hello Moon" (or similar) is visible.
  - Unit test confirms standard library imports work.

- **Checklist**:
  - [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
  - [ ] Run all tests and ensure 100% pass rate.
  - [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.
