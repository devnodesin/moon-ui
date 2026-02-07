# Moon Admin WebApp

A secure, mobile-first admin web application for managing Moon CMS backends.

## Tech Stack

- **Framework**: React 19 with TypeScript (strict mode)
- **Build Tool**: Vite with SWC
- **Styling**: Tailwind CSS + DaisyUI
- **Routing**: React Router (HashRouter)
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier

## Features

- 🌓 **Dual Theme Support**: `autumn` (light) and `abyss` (dark)
- 📱 **Mobile-First Design**: Responsive UI for all screen sizes
- 🔒 **Secure Authentication**: JWT-based login with token refresh, in-memory or persistent storage
- 🔌 **Multi-Connection**: Save, switch, and manage multiple Moon backend connections
- 📊 **Collection Management**: Browse, search, create, edit, and delete collections and records with CSV/JSON import/export
- 👥 **User Management**: Admin CRUD for system users with role assignment and password reset
- 🔑 **API Key Management**: Create, view, rotate, and revoke API keys with one-time key display
- ⏳ **Global Progress Indicator**: Animated loading bar for all async operations
- 🔔 **Notification System**: Toast notifications and notification history page
- 🧪 **Test-Driven**: 200+ tests with TDD approach

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Project Structure

```
moon-ui/
├── src/
│   ├── components/     # Reusable UI components (DataTable, RecordView, GlobalProgress, etc.)
│   ├── contexts/       # React contexts (Auth, Theme, Notification, Connection, Loading)
│   ├── hooks/          # Custom hooks (useAuth, useNotify, useLoading)
│   ├── pages/          # Page components (Login, Collections, Users, API Keys, etc.)
│   ├── services/       # API services (auth, collections, users, apiKeys, connections)
│   ├── types/          # TypeScript type definitions
│   ├── test/           # Test setup files
│   ├── App.tsx         # Main app component with routing
│   └── main.tsx        # App entry point
├── prd/                # Product requirement documents
├── SPEC.md             # Technical specification
└── SPEC_UI.md          # UI/UX specification
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Login page (public) |
| `/admin` | Dashboard (protected) |
| `/admin/collections` | Collection list |
| `/admin/collections/:name` | Collection records |
| `/admin/collections/:name/:id` | Record detail (view/edit) |
| `/admin/users` | User management |
| `/admin/users/:id` | User detail (view/edit/create) |
| `/admin/keys` | API key management |
| `/admin/connections` | Connection management |
| `/admin/notifications` | Notification history |

## Documentation

- [SPEC.md](./SPEC.md) - Full technical specification
- [SPEC_UI.md](./SPEC_UI.md) - UI design patterns and components
- [PRD Directory](./prd/) - Product requirement documents

## Testing Backend Server

A test Moon backend is available at:

- **URL**: `https://moon.asensar.in/`
- **Username**: `admin`
- **Password**: `moonadmin12#`

## Security Notes

- Tokens are stored in-memory by default
- Persistent storage requires explicit "Remember Connection" opt-in
- No data caching between sessions or connections
- HTTPS required in production

## License

See [LICENSE](./LICENSE) file for details.
