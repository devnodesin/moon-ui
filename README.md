# Moon Admin WebApp

A secure, mobile-first admin webapp for managing collections, users, API keys, and connections across multiple Moon backends.

## Technology Stack

- **Runtime**: Bun.js (primary)
- **Framework**: React 18+ with TypeScript (strict mode)
- **Build Tool**: Vite
- **UI Framework**: DaisyUI 5.x + Tailwind CSS 4.x
- **Router**: React Router (HashRouter)
- **Testing**: Vitest with Testing Library
- **Linting**: ESLint + Prettier

## Features

- Multi-backend connection management
- Real-time data fetching (no caching)
- JWT token authentication with auto-refresh
- Mobile-first responsive design
- Theme switcher (light/dark modes)
- Comprehensive notification system
- CSV/JSON import/export
- Test-driven development (TDD) approach

## Prerequisites

- Bun.js 1.0+ (primary runtime)
- Modern browser (Chrome, Firefox, Safari, or Edge latest)

## Quick Start

### Installation

```bash
# Install dependencies with npm (Bun registry has connectivity issues)
npm install

# Or if you prefer, you can use Bun when it's stable
# bun install
```

### Development

```bash
# Start development server with Bun (http://localhost:3000)
bun run dev
```

### Building

```bash
# Type check and build for production with Bun
bun run build

# Preview production build
bun run preview
```

### Testing

```bash
# Run all tests with Bun
bun run test

# Run tests in watch mode (TDD)
bun run test:watch

# Generate coverage report
bun run test:coverage
```

### Code Quality

```bash
# Type checking
bun run typecheck

# Lint code
bun run lint

# Fix linting issues
bun run lint:fix

# Check code formatting
bun run format

# Fix formatting issues
bun run format:fix
```

## Project Structure

```
src/
├── assets/          # Static assets (images, fonts)
├── components/      # Reusable React components
│   ├── common/      # Common UI components
│   └── layout/      # Layout components (header, footer, sidebar)
├── pages/           # Page-level components (route views)
├── services/        # API client and HTTP utilities
├── hooks/           # Custom React hooks
├── utils/           # Utility functions and helpers
├── types/           # TypeScript type definitions
├── contexts/        # React Context providers
├── constants/       # Application constants
├── test/            # Test utilities and setup
├── App.tsx          # Main App component
├── main.tsx         # Application entry point
└── index.css        # Main CSS (Tailwind + DaisyUI)
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start development server with HMR |
| `build` | Build for production (includes type checking) |
| `preview` | Preview production build locally |
| `test` | Run all tests once |
| `test:watch` | Run tests in watch mode |
| `test:coverage` | Generate test coverage report |
| `lint` | Check for linting errors |
| `lint:fix` | Fix linting errors automatically |
| `format` | Check code formatting |
| `format:fix` | Fix formatting issues automatically |
| `typecheck` | Run TypeScript type checking |

## Development Workflow

1. **Write tests first** (TDD approach)
2. **Implement features** to pass the tests
3. **Run linters and formatters** to ensure code quality
4. **Type check** to catch type errors
5. **Build** to verify production readiness

## Documentation

- [SPEC.md](./SPEC.md) - Technical specification and architecture
- [SPEC_UI.md](./SPEC_UI.md) - UI/UX design specification
- [INSTALL.md](./INSTALL.md) - Detailed installation and setup instructions

## License

[MIT](./LICENSE)

## Contributing

This project follows Test-Driven Development (TDD) principles. All features must have tests written before implementation, and all tests must pass (100% pass rate required).

