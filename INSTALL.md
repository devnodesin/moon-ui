# Installation Guide

This guide will help you set up the Moon Admin WebApp development environment.

## Prerequisites

### Required

- **Bun.js v1.0+** - This project exclusively uses Bun for package management, builds, and testing
- **Git** - For version control
- **Modern Web Browser** - Chrome, Firefox, Safari, or Edge (latest version)

### Optional

- **VS Code** - Recommended IDE with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

## Installing Bun

Bun is required to run this project. It serves as both the package manager and runtime.

### macOS and Linux

```bash
curl -fsSL https://bun.sh/install | bash
```

### Windows

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Verify Installation

```bash
bun --version
# Should output: 1.x.x
```

For more installation options and troubleshooting, visit: https://bun.com/docs/installation

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/devnodesin/moon-ui.git
cd moon-ui
```

### 2. Install Dependencies

```bash
bun install
```

This command installs all required packages defined in `package.json`.

### 3. Verify Setup

Run the test suite to ensure everything is configured correctly:

```bash
bun test
```

All tests should pass.

## Development Workflow

### Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
bun run build
```

The production build will be created in the `dist/` directory.

### Preview Production Build

```bash
bun run preview
```

### Run Linter

```bash
bun run lint
```

### Format Code

```bash
bun run format
```

## Environment Configuration

### Backend Connection

By default, the application connects to the test Moon backend:

- **URL**: `https://moon.asensar.in/`
- **Test Credentials**:
  - Username: `admin`
  - Password: `moonadmin12#`

### Local Development

For local development with a custom Moon backend:

1. Update the backend URL in your connection settings (in the UI)
2. Ensure the backend supports CORS for local development

## Troubleshooting

### Bun Installation Issues

If Bun installation fails:

1. Check your system meets the requirements
2. Try installing with sudo/admin privileges if needed
3. Consult the official Bun documentation: https://bun.com/docs/installation

### Dependency Installation Errors

If `bun install` fails:

1. Delete `node_modules` and `bun.lockb`:
   ```bash
   rm -rf node_modules bun.lockb
   ```

2. Clear Bun's cache:
   ```bash
   bun pm cache rm
   ```

3. Try installing again:
   ```bash
   bun install
   ```

### Port Already in Use

If port 5173 is already in use:

1. Stop the process using that port, or
2. Use a different port:
   ```bash
   bun run dev --port 3000
   ```

### TypeScript Errors

If you encounter TypeScript errors:

1. Ensure you're using the project's TypeScript version
2. Restart your IDE's TypeScript server
3. Check `tsconfig.json` is properly configured

## IDE Setup

### VS Code

Recommended settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Testing Configuration

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test src/components/Button.test.tsx

# Run tests with coverage
bun test --coverage
```

### Test Structure

- Unit tests: `*.test.ts` or `*.test.tsx` next to source files
- Integration tests: `tests/` directory
- E2E tests: `e2e/` directory (if applicable)

## Security Notes

### Session Storage

- **In-Memory Sessions**: Default mode. Sessions are cleared on browser refresh.
- **Persistent Sessions**: Enabled via "Remember Connection" checkbox. Uses localStorage.

⚠️ **Security Warning**: Persistent sessions store authentication tokens in localStorage. Only enable this feature on trusted devices.

### HTTPS Requirement

In production, the application **requires** HTTPS:

- Tokens are only transmitted over secure connections
- Insecure connections will be blocked

### CORS

For local development, ensure your Moon backend allows CORS from `http://localhost:5173`.

## Next Steps

Once installation is complete:

1. Review [SPEC.md](./SPEC.md) for technical architecture
2. Review [SPEC_UI.md](./SPEC_UI.md) for UI guidelines
3. Check the `prd/` directory for feature specifications
4. Start the development server and explore the application

## Support

For issues and questions:

- Check existing GitHub issues
- Review the documentation in the `docs/` folder
- Consult the Moon backend documentation: https://moon.asensar.in/doc/md

## License

See [LICENSE](./LICENSE) for details.
