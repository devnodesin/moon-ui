# Moon Admin WebApp

A secure, mobile-first admin web application for managing collections, users, API keys, and connections across multiple Moon backends.

## Tech Stack

- **Framework**: React 18 with TypeScript (strict mode)
- **Build Tool**: Vite
- **Package Manager**: Bun.js (required)
- **Styling**: Tailwind CSS + DaisyUI
- **Routing**: React Router (HashRouter)
- **Testing**: Bun Test
- **Linting**: ESLint + Prettier

## Prerequisites

- **Bun.js** v1.0+ (required - [install instructions](https://bun.sh))
- Modern web browser (Chrome, Firefox, Safari, Edge latest versions)

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/devnodesin/moon-ui.git
cd moon-ui

# Install dependencies using Bun
bun install
```

### Development

```bash
# Start the development server
bun run dev

# The app will be available at http://localhost:5173
```

### Building for Production

```bash
# Build the application
bun run build

# Preview the production build
bun run preview
```

### Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch
```

### Code Quality

```bash
# Run linter
bun run lint

# Format code
bun run format
```

## Project Structure

```
moon-ui/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── lib/            # Utility functions and helpers
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Root application component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles with Tailwind
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project dependencies and scripts
```

## Features (Planned)

- ✅ Project setup with Vite + React + TypeScript
- ✅ Tailwind CSS + DaisyUI with autumn (light) and abyss (dark) themes
- ⬜ Authentication and connection management
- ⬜ Layout and navigation with responsive sidebar
- ⬜ Collections browsing and viewing
- ⬜ Full CRUD operations for records
- ⬜ Multi-backend support with isolated sessions
- ⬜ Theme switching (light/dark mode)
- ⬜ Global notification system

## Configuration

### Themes

The application uses DaisyUI themes:
- **Light mode**: `autumn`
- **Dark mode**: `abyss`

### Path Aliases

The project uses `@/` as an alias for the `src/` directory:

```typescript
import { Component } from '@/components/Component'
```

## Documentation

- [SPEC.md](./SPEC.md) - Technical specification and architecture
- [SPEC_UI.md](./SPEC_UI.md) - UI design guidelines
- See `prd/` directory for detailed product requirement documents

## Testing Backend

- **Test Server**: https://moon.asensar.in/
- **Credentials**: 
  - Username: `admin`
  - Password: `moonadmin12#`

## Contributing

This project follows strict TypeScript and code quality standards:

- TypeScript strict mode is enabled
- All code must pass ESLint checks
- Follow Prettier formatting rules
- Maintain 90%+ test coverage
- All tests must pass before merging

## Security

- HTTPS required in production
- No data caching between sessions
- Token-based authentication with automatic refresh
- Per-connection session isolation

## License

See [LICENSE](./LICENSE) for details.

## Links

- [Moon Backend Documentation](https://moon.asensar.in/doc/md)
- [Moon GitHub Repository](https://github.com/devnodesin/moon)
