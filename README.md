
# MoonUI Admin WebApp

MoonUI is a secure, mobile-first admin interface for managing Moon API Server backends.

## Main Features

- Manage collections, users, API keys, and backend connections
- Mobile-first, responsive UI
- Secure authentication and session management

## App Routes

- `/` — Login (public)
- `/admin` — Dashboard (protected)
- `/admin/collections` — List all collections
- `/admin/collections/:name` — View records in a collection
- `/admin/collections/:name/:id` — View/edit a record
- `/admin/users` — User management
- `/admin/users/:id` — View/edit/create user
- `/admin/apikeys` — API key management
- `/admin/connections` — Connection management

## Test Backend

- URL: https://moon.devnodes.in/
- Username: `admin`
- Password: `moonadmin12#`
- Demo MoonUI: https://moon.devnodes.in/ui/

## License

See [LICENSE](./LICENSE) for details.
