# Installation Guide

This guide provides detailed instructions for setting up the Moon Admin WebApp development environment.

## System Requirements

### Required

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Modern Browser**: Latest version of Chrome, Firefox, Safari, or Edge

### Optional

- **Bun.js**: Version 1.0.0 or higher (alternative to Node.js/npm)
- **Git**: For version control

## Installation Steps

### 1. Verify Prerequisites

Check that you have the required tools installed:

```bash
# Check Node.js version
node --version  # Should be v18.0.0 or higher

# Check npm version
npm --version   # Should be 9.0.0 or higher

# Optional: Check Bun version
bun --version   # Should be 1.0.0 or higher
```

If Node.js is not installed, download it from [nodejs.org](https://nodejs.org/).

If you prefer Bun.js, install it from [bun.sh](https://bun.sh/):

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Clone the Repository

```bash
git clone <repository-url>
cd moon-ui
```

### 3. Install Dependencies

Using npm (recommended for most users):

```bash
npm install
```

Or using Bun (if installed):

```bash
bun install
```

This will install all production and development dependencies defined in `package.json`.

### 4. Verify Installation

Run the following commands to ensure everything is set up correctly:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm run test

# Build the project
npm run build
```

All commands should complete without errors.

### 5. Start Development Server

```bash
npm run dev
```

The application should start at `http://localhost:3000`. Open this URL in your browser to verify the app is running.

You should see the Moon Admin welcome screen with a "Get Started" button styled with DaisyUI.

## Troubleshooting

### Common Issues

#### 1. Port 3000 is already in use

If port 3000 is occupied, you can:

- Stop the process using port 3000
- Or modify the port in `vite.config.ts`:

```typescript
server: {
  port: 3001, // Change to any available port
  host: 'localhost',
}
```

#### 2. Module not found errors

This usually means dependencies are not installed correctly. Try:

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. TypeScript errors in IDE

If your IDE shows TypeScript errors even though `npm run typecheck` passes:

- Restart your IDE/TypeScript server
- Check that your IDE is using the workspace TypeScript version
- Ensure `tsconfig.json` is in the project root

#### 4. ESLint configuration errors

If ESLint fails to load:

```bash
# Verify ESLint config
npx eslint --print-config src/App.tsx
```

If using VS Code, install the ESLint extension.

#### 5. Prettier formatting conflicts

If Prettier and ESLint have conflicting rules:

- The project includes `eslint-config-prettier` to disable conflicting ESLint rules
- Run `npm run format:fix` to apply Prettier formatting
- Run `npm run lint:fix` to fix ESLint issues

## IDE Setup

### Visual Studio Code (Recommended)

Install these extensions for the best development experience:

1. **ESLint** (`dbaeumer.vscode-eslint`)
2. **Prettier** (`esbenp.prettier-vscode`)
3. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
4. **TypeScript** (built-in)

Recommended VS Code settings (`.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### WebStorm / IntelliJ IDEA

1. Enable ESLint: **Preferences** → **Languages & Frameworks** → **JavaScript** → **Code Quality Tools** → **ESLint** → Check "Automatic ESLint configuration"
2. Enable Prettier: **Preferences** → **Languages & Frameworks** → **JavaScript** → **Prettier** → Set "Run on save"
3. Set TypeScript version: **Preferences** → **Languages & Frameworks** → **TypeScript** → Use TypeScript from `node_modules`

## Environment Configuration

### Development

The project is configured to run in development mode by default. No additional environment variables are required for local development.

### Connection to Moon Backend

To connect to a Moon backend during development:

1. The app will prompt for backend URL, username, and password on first use
2. Example backend URL: `https://moon.asensar.in/`
3. Test credentials (if using the demo server):
   - Username: `admin`
   - Password: `moonadmin12#`

### Security Notes

- **Remember Connection**: When enabled, stores JWT tokens in `localStorage`
- **In-Memory Only**: When disabled, tokens are stored only in JavaScript variables and cleared on page reload
- **HTTPS Required**: Production deployments must use HTTPS to protect sensitive data
- **Token Scoping**: Tokens are strictly scoped to their issuing backend URL and cannot be reused across different backends

## Next Steps

After successful installation:

1. Read [SPEC.md](./SPEC.md) for technical architecture details
2. Read [SPEC_UI.md](./SPEC_UI.md) for UI/UX guidelines
3. Review the [README.md](./README.md) for project overview
4. Start implementing features following the PRD documents in `prd/`
5. Follow TDD approach: write tests first, then implement features

## Build and Deployment

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

This serves the production build locally for testing.

### Deployment

The `dist/` directory contains a static SPA that can be deployed to:

- **Static hosting**: Netlify, Vercel, GitHub Pages, AWS S3 + CloudFront
- **Traditional web server**: Apache, Nginx, IIS (configure to serve `index.html` for all routes)
- **CDN**: Any CDN that supports SPAs

Important: Configure the server to serve `index.html` for all routes, as the app uses client-side routing (HashRouter).

For HashRouter, no server-side configuration is typically needed, as all routes are handled via the hash fragment (e.g., `/#/admin/collections`).

## Support

For issues, questions, or contributions, please refer to the project repository or documentation.
