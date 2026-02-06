## Overview

### Purpose
Establish the foundational infrastructure for the Moon Admin WebApp, a secure, mobile-first React-based single-page application (SPA) that enables management of collections, users, API keys, and connections across multiple Moon backends.

### Context
The project requires a modern, type-safe frontend stack using Bun.js as the runtime and package manager, Vite for build tooling, React with TypeScript in strict mode, and DaisyUI with Tailwind CSS for UI components. The application must follow Test-Driven Development (TDD) principles with comprehensive test coverage and maintain high code quality through automated linting and formatting.

### Solution
Create a complete project scaffold with all required dependencies, configurations, and folder structure that enables immediate feature development while enforcing code quality, type safety, and testing standards from the start.

---

## Requirements

### Functional Requirements

#### 1. Project Initialization
- Initialize a new Vite + React + TypeScript project using Bun.js
- Command: `bun create vite moon-ui --template react-ts`
- Project name: `moon-ui`
- All package management operations must use `bun` (not npm or yarn)

#### 2. Core Dependencies
Install the following production dependencies:
- `react` (latest stable)
- `react-dom` (latest stable)
- `react-router-dom` (for HashRouter-based routing)

#### 3. UI Framework Dependencies
Install and configure DaisyUI + Tailwind CSS:
- `daisyui@latest` (as dev dependency)
- DaisyUI 5.x requires Tailwind CSS 4.x (auto-installed as peer dependency)
- Command: `bun add -D daisyui@latest`

#### 4. Test Framework Setup
Install and configure a testing framework:
- Primary option: `bun test` (built-in Bun test runner)
- Alternative option: Vitest (if Bun test is insufficient)
- Required test utilities:
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `@testing-library/user-event`
  - `happy-dom` or `jsdom` (for DOM environment in tests)
- Test configuration must support TDD workflow
- Tests must be discoverable via `*.test.ts`, `*.test.tsx`, or `*.spec.ts`, `*.spec.tsx` patterns

#### 5. TypeScript Configuration
Configure TypeScript with strict mode enabled:
- `compilerOptions.strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: true`
- `strictBindCallApply: true`
- `strictPropertyInitialization: true`
- `noImplicitThis: true`
- `alwaysStrict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `esModuleInterop: true`
- `skipLibCheck: true`
- Target: `ES2020` or later
- Module: `ESNext`
- JSX: `react-jsx`
- Include `src/**/*` files
- Output directory configuration for build artifacts

#### 6. ESLint Configuration
Install and configure ESLint:
- `eslint` (latest)
- `@typescript-eslint/parser`
- `@typescript-eslint/eslint-plugin`
- `eslint-plugin-react`
- `eslint-plugin-react-hooks`
- `eslint-plugin-jsx-a11y` (optional, accessibility not required but good practice)
- Extend recommended configurations:
  - `eslint:recommended`
  - `plugin:@typescript-eslint/recommended`
  - `plugin:react/recommended`
  - `plugin:react-hooks/recommended`
- Configure for TypeScript file extensions (`.ts`, `.tsx`)
- Enable React 18+ automatic JSX runtime (no need to import React in every file)
- Set parser options for latest ECMAScript features

#### 7. Prettier Configuration
Install and configure Prettier:
- `prettier` (latest)
- `eslint-config-prettier` (to disable ESLint formatting rules that conflict with Prettier)
- `eslint-plugin-prettier` (optional, to run Prettier as an ESLint rule)
- Configuration file: `.prettierrc` or `.prettierrc.json`
- Recommended settings:
  - `semi: true`
  - `singleQuote: true`
  - `trailingComma: 'es5'`
  - `tabWidth: 2`
  - `printWidth: 80`
- Create `.prettierignore` to exclude build artifacts, node_modules, etc.

#### 8. DaisyUI + Tailwind CSS Configuration
Configure Tailwind CSS 4.x with DaisyUI 5.x:
- **Important**: Tailwind CSS 4.x does NOT use `tailwind.config.js`
- Configuration is done via CSS file using `@import` and `@plugin` directives
- Create main CSS file (e.g., `src/index.css` or `src/app.css`) with:
  ```css
  @import "tailwindcss";
  @plugin "daisyui";
  ```
- Configure DaisyUI themes in the CSS plugin declaration:
  - Light mode theme: `autumn` (default)
  - Dark mode theme: `abyss` (prefersdark)
  - Enable theme switching support
  - Example configuration:
    ```css
    @plugin "daisyui" {
      themes: autumn --default, abyss --prefersdark;
      logs: false;
    }
    ```
- Import the main CSS file in `src/main.tsx`

#### 9. Folder Structure
Create the following directory structure inside `src/`:

```
src/
├── assets/              # Static assets (images, fonts, etc.)
├── components/          # Reusable React components
│   ├── common/          # Common UI components (buttons, inputs, etc.)
│   └── layout/          # Layout components (header, footer, sidebar, etc.)
├── pages/               # Page-level components (route views)
├── services/            # API client and HTTP utilities
├── hooks/               # Custom React hooks
├── utils/               # Utility functions and helpers
├── types/               # TypeScript type definitions and interfaces
├── contexts/            # React Context providers
├── constants/           # Application constants and configuration
├── App.tsx              # Main App component
├── main.tsx             # Application entry point
└── index.css            # Main CSS file with Tailwind and DaisyUI imports
```

For tests, use co-located test files:
- Place test files adjacent to the code they test (e.g., `Button.tsx` and `Button.test.tsx` in the same directory)
- Alternative: Create a `__tests__` directory within each module/feature folder

#### 10. Git Configuration
Create a `.gitignore` file with the following exclusions:
- `node_modules/`
- `dist/`
- `build/`
- `.env`
- `.env.local`
- `.env.*.local`
- `*.log`
- `.DS_Store`
- `coverage/`
- `.vite/`
- `*.tsbuildinfo`
- IDE-specific files (`.vscode/`, `.idea/`, etc.) - optional based on team preference

#### 11. Package.json Scripts
Define the following npm scripts in `package.json`:

- `dev`: Start development server
  - Command: `bun --bun vite` or `bun run vite`
  - Must use Vite dev server with hot module replacement (HMR)
  
- `build`: Production build
  - Command: `bun run vite build`
  - Must perform type checking before build
  - Output to `dist/` directory
  
- `preview`: Preview production build locally
  - Command: `bun run vite preview`
  
- `test`: Run all tests
  - Command: `bun test` (if using Bun's built-in test runner)
  - Alternative: `bun run vitest` (if using Vitest)
  - Must run all test files matching the test pattern
  
- `test:watch`: Run tests in watch mode for TDD workflow
  - Command: `bun test --watch` or `bun run vitest --watch`
  
- `test:coverage`: Run tests with coverage report
  - Command: `bun test --coverage` or `bun run vitest --coverage`
  - Target: 90%+ coverage
  
- `lint`: Run ESLint on source files
  - Command: `eslint src --ext .ts,.tsx`
  - Must check all TypeScript files in `src/`
  
- `lint:fix`: Run ESLint with auto-fix
  - Command: `eslint src --ext .ts,.tsx --fix`
  
- `format`: Run Prettier to check formatting
  - Command: `prettier --check "src/**/*.{ts,tsx,css,json}"`
  
- `format:fix`: Run Prettier with auto-fix
  - Command: `prettier --write "src/**/*.{ts,tsx,css,json}"`
  
- `typecheck`: Run TypeScript type checking without emitting files
  - Command: `tsc --noEmit`

#### 12. Initial Application Setup
Create a minimal working React application:
- Set up `main.tsx` as the entry point that renders the root React component
- Create `App.tsx` with basic structure (placeholder for routing and layout)
- Configure `index.html` with proper meta tags:
  - Viewport meta tag for mobile-first design
  - UTF-8 charset
  - Appropriate title and description
- Verify DaisyUI styling is applied by using at least one DaisyUI component (e.g., a button with `btn` class)

### Technical Requirements

#### TR-1: Bun.js Runtime
- All commands must use `bun` instead of `node` or `npm`
- Vite dev server must run under Bun runtime (`bun --bun vite`)
- Package installation must use `bun add` or `bun install`

#### TR-2: Vite Configuration
- Vite config file: `vite.config.ts`
- Configure React plugin: `@vitejs/plugin-react`
- Set up path aliases (optional but recommended):
  - `@/` → `./src/`
  - Configure in both `vite.config.ts` and `tsconfig.json`
- Configure server settings:
  - Port: `3000` (or configurable via environment variable)
  - Host: `localhost`
  - Open browser on start: optional

#### TR-3: Type Safety
- Zero TypeScript errors before build
- No `any` types without explicit justification
- Strict null checks enforced
- All React component props must have explicit type definitions

#### TR-4: Code Quality Gates
- ESLint must pass with zero errors before build
- Prettier formatting must be consistent across all files
- Pre-commit hooks (future enhancement) may enforce these checks

#### TR-5: Testing Standards
- All new features must have corresponding tests written first (TDD approach)
- Target: 90%+ test coverage
- 100% test pass rate required
- Tests must include:
  - Unit tests for utility functions
  - Component tests for React components
  - Integration tests for user flows (future enhancement)

#### TR-6: Mobile-First Design
- Viewport configuration for responsive design
- DaisyUI responsive utilities must be available
- Default breakpoints as per Tailwind CSS standards

#### TR-7: Browser Support
- Support only the latest major browsers:
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)
- No Internet Explorer support required

### Validation Requirements

#### VR-1: Successful Build
- `bun run build` completes without errors
- Build output is generated in `dist/` directory
- Build output includes optimized and minified assets

#### VR-2: Successful Test Execution
- `bun test` runs without errors
- All initial placeholder tests pass (at least one smoke test)
- Test coverage report is generated successfully

#### VR-3: Code Quality Checks
- `bun run lint` passes with zero errors
- `bun run format` confirms all files are formatted correctly
- `bun run typecheck` passes with zero TypeScript errors

#### VR-4: Development Server
- `bun run dev` starts the development server successfully
- Application loads in the browser at `http://localhost:3000`
- Hot module replacement (HMR) works for React components
- DaisyUI styling is visible (verify by rendering a styled button or card)

#### VR-5: Documentation
- `README.md` includes:
  - Project description and purpose
  - Technology stack overview
  - Prerequisites (Bun.js version requirement)
  - Installation instructions
  - Available scripts and their usage
  - Project structure overview
  - Development workflow (TDD approach)
- `INSTALL.md` includes:
  - Detailed setup instructions
  - Environment configuration
  - Troubleshooting common issues

### Error Handling

#### EH-1: Dependency Installation Failures
- If any dependency fails to install, document the error and provide resolution steps
- Ensure peer dependency warnings are addressed

#### EH-2: Build Failures
- TypeScript errors must be resolved before marking setup complete
- Vite configuration errors must be debugged and fixed

#### EH-3: Test Runner Issues
- If Bun's built-in test runner is insufficient, fallback to Vitest with proper configuration
- Document the reason for choosing an alternative test runner

### Constraints

#### C-1: No Additional UI Libraries
- Must not install any UI component library other than DaisyUI
- Custom components must be built using DaisyUI + Tailwind utilities

#### C-2: No Backend in This Phase
- This PRD covers only frontend setup
- Backend integration is deferred to future PRDs

#### C-3: No Authentication in This Phase
- Authentication flow setup is deferred to a separate PRD
- Placeholder pages and routing structure may be created but without actual auth logic

#### C-4: Bun.js Compatibility
- All tooling and dependencies must be compatible with Bun.js runtime
- Document any compatibility issues and workarounds

---

## Acceptance

### AC-1: Project Structure
- [ ] Project is initialized with `bun create vite moon-ui --template react-ts`
- [ ] All required folders (`components/`, `pages/`, `services/`, etc.) exist under `src/`
- [ ] Folder structure matches the specification in Requirements section 9

### AC-2: Dependencies Installed
- [ ] React and React DOM are installed as production dependencies
- [ ] DaisyUI 5.x is installed as a dev dependency
- [ ] Tailwind CSS 4.x is installed (as a peer dependency of DaisyUI or directly)
- [ ] Test framework (Bun test or Vitest) and testing libraries are installed
- [ ] ESLint, Prettier, and TypeScript are installed as dev dependencies
- [ ] All dependencies are installed using `bun add` or `bun install`

### AC-3: TypeScript Configuration
- [ ] `tsconfig.json` exists with strict mode enabled
- [ ] All strict compiler options are set to `true`
- [ ] TypeScript target is ES2020 or later
- [ ] JSX mode is set to `react-jsx`
- [ ] Path aliases are configured (optional: `@/` → `./src/`)
- [ ] `bun run typecheck` passes with zero errors

### AC-4: ESLint Configuration
- [ ] `.eslintrc` or `eslint.config.js` exists
- [ ] ESLint is configured for TypeScript and React
- [ ] Recommended rule sets are extended
- [ ] `bun run lint` passes with zero errors on initial setup
- [ ] `bun run lint:fix` can auto-fix formatting issues

### AC-5: Prettier Configuration
- [ ] `.prettierrc` or `.prettierrc.json` exists
- [ ] Prettier is integrated with ESLint (no conflicts)
- [ ] `.prettierignore` excludes build artifacts and `node_modules`
- [ ] `bun run format` confirms all files are correctly formatted
- [ ] `bun run format:fix` can auto-format files

### AC-6: DaisyUI + Tailwind Configuration
- [ ] Main CSS file (e.g., `src/index.css`) includes `@import "tailwindcss";`
- [ ] DaisyUI plugin is configured with `@plugin "daisyui";`
- [ ] DaisyUI themes `autumn` (default) and `abyss` (prefersdark) are enabled
- [ ] Main CSS file is imported in `src/main.tsx`
- [ ] At least one DaisyUI component is rendered in `App.tsx` to verify styling (e.g., button with `btn` class)

### AC-7: Test Framework Configuration
- [ ] Test framework is configured (Bun test or Vitest)
- [ ] Testing libraries (`@testing-library/react`, `@testing-library/jest-dom`) are installed
- [ ] DOM environment (`happy-dom` or `jsdom`) is configured for tests
- [ ] At least one smoke test exists and passes (e.g., renders `App` component without crashing)
- [ ] `bun test` runs all tests successfully
- [ ] `bun test --watch` enables watch mode for TDD workflow
- [ ] `bun test --coverage` generates a coverage report

### AC-8: Package.json Scripts
- [ ] `dev` script starts the Vite dev server under Bun runtime
- [ ] `build` script builds the project for production
- [ ] `preview` script serves the production build locally
- [ ] `test` script runs all tests
- [ ] `test:watch` script runs tests in watch mode
- [ ] `test:coverage` script generates coverage report
- [ ] `lint` script runs ESLint on all TypeScript files
- [ ] `lint:fix` script runs ESLint with auto-fix
- [ ] `format` script checks formatting with Prettier
- [ ] `format:fix` script formats files with Prettier
- [ ] `typecheck` script runs TypeScript type checking without emitting files

### AC-9: Git Configuration
- [ ] `.gitignore` file exists
- [ ] `.gitignore` excludes `node_modules/`, `dist/`, `.env` files, and other build artifacts
- [ ] `.gitignore` excludes coverage reports and logs

### AC-10: Initial Application
- [ ] `src/main.tsx` renders the root React component
- [ ] `src/App.tsx` contains a basic placeholder component
- [ ] `index.html` includes proper meta tags for mobile-first design
- [ ] Application loads successfully in the browser at `http://localhost:3000`
- [ ] Hot module replacement (HMR) works when editing React components
- [ ] At least one DaisyUI-styled element is visible in the browser (e.g., a button)

### AC-11: Build Success
- [ ] `bun run build` completes without errors
- [ ] Build output is generated in `dist/` directory
- [ ] Build output includes `index.html`, JavaScript bundles, and CSS files
- [ ] `bun run preview` serves the production build and loads correctly in the browser

### AC-12: Code Quality Verification
- [ ] `bun run typecheck` passes with zero TypeScript errors
- [ ] `bun run lint` passes with zero ESLint errors
- [ ] `bun run format` confirms all files are formatted correctly
- [ ] All tests pass: `bun test` reports 100% pass rate

### AC-13: Documentation
- [ ] `README.md` exists and includes:
  - Project description
  - Technology stack (Bun.js, Vite, React, TypeScript, DaisyUI, Tailwind)
  - Prerequisites (Bun.js installation)
  - Installation steps (`bun install`)
  - Available scripts and usage
  - Project folder structure
  - TDD workflow notes
- [ ] `INSTALL.md` exists and includes:
  - Detailed setup instructions
  - Bun.js installation guide (or link to official docs)
  - Environment configuration (if any)
  - Troubleshooting section
  - Next steps for development

### AC-14: Quality Assurance Checklist
- [ ] Ensure all documentation (`SPEC.md`, `README.md`) are updated and remain consistent with the implemented code changes.
- [ ] Run all tests and ensure 100% pass rate.
- [ ] If any test failure is unrelated to your feature, investigate and fix it before marking the task as complete.

### Edge Cases and Error Scenarios

#### EC-1: Bun.js Not Installed
- [ ] If Bun.js is not installed, `README.md` provides a clear installation link and instructions
- [ ] Error message during setup points user to Bun.js installation guide

#### EC-2: Dependency Conflicts
- [ ] If peer dependency warnings occur, document them in `INSTALL.md`
- [ ] Provide resolution steps or acceptable warning explanations

#### EC-3: Port 3000 Already in Use
- [ ] Dev server gracefully handles port conflicts (tries next available port or provides error)
- [ ] `README.md` documents how to change the dev server port

#### EC-4: TypeScript Errors on Initial Setup
- [ ] Ensure TypeScript configuration is correct and default files have no errors
- [ ] Document any known issues with template-generated code

#### EC-5: DaisyUI Styling Not Applied
- [ ] Verify main CSS file is imported in `main.tsx`
- [ ] Verify Tailwind and DaisyUI directives are correct in CSS file
- [ ] Document troubleshooting steps in `INSTALL.md`

### Verification Steps

**Developer Verification:**
1. Clone the repository
2. Run `bun install` to install dependencies
3. Run `bun run dev` and verify the app loads at `http://localhost:3000`
4. Verify at least one DaisyUI component is visible with correct styling
5. Run `bun test` and confirm all tests pass
6. Run `bun run lint` and confirm no errors
7. Run `bun run format` and confirm all files are formatted
8. Run `bun run typecheck` and confirm no TypeScript errors
9. Run `bun run build` and verify build succeeds
10. Run `bun run preview` and verify production build loads correctly

**QA Verification:**
1. Follow all steps in `INSTALL.md` from scratch on a clean machine
2. Verify all commands execute successfully
3. Verify the application loads in Chrome, Firefox, Safari, and Edge (latest versions)
4. Verify responsive design by resizing the browser window or using device emulation
5. Verify DaisyUI theme switching works (if implemented in initial setup)
6. Run `bun test --coverage` and verify coverage report is generated
7. Verify all documentation is clear, accurate, and complete

---

**End of PRD 001**
