# Moon API Reference — Moon Admin WebApp

```text
Version:    1.99
Service:    moon
Base URL:   https://moon.devnodes.in  (test server)
GitHub:     https://github.com/devnodesin/moon
```

This document is the authoritative Moon API reference for the Moon Admin WebApp. All HTTP calls are made from the browser using `fetch`. Never invoke `curl` from the app.

## Table of Contents

1. [Moon Terminology](#moon-terminology)
2. [Data Types](#data-types)
3. [Standard Response Patterns](#standard-response-patterns)
4. [Standard Error Response](#standard-error-response)
5. [Public Endpoints](#public-endpoints)
6. [Authentication](#authentication)
7. [Users (Admin Only)](#users-admin-only)
8. [API Keys (Admin Only)](#api-keys-admin-only)
9. [Collections](#collections)
10. [Data Access (Records)](#data-access-records)
11. [Query Options](#query-options)
12. [Aggregation](#aggregation)
13. [Security & Rate Limiting](#security--rate-limiting)

---

## Moon Terminology

| Moon Term  | Database Equivalent |
| ---------- | ------------------- |
| Collection | Table               |
| Field      | Column              |
| Record     | Row                 |

---

## Data Types

| Type       | Description                                    | Notes                                                  |
| ---------- | ---------------------------------------------- | ------------------------------------------------------ |
| `id`       | ULID (26-char, URL-safe, read-only)            | System-generated; never send in create requests        |
| `string`   | Text of any length                             | Maps to TEXT                                           |
| `integer`  | 64-bit whole number                            |                                                        |
| `decimal`  | Exact numeric value (e.g., price)              | API input/output as strings (e.g., `"29.99"`)          |
| `boolean`  | `true` / `false`                               |                                                        |
| `datetime` | RFC3339 date/time (e.g., `2026-01-31T13:00Z`) |                                                        |
| `json`     | Arbitrary JSON object or array                 |                                                        |

**Default values by type (applied to nullable fields automatically):**

| Type       | Default          |
| ---------- | ---------------- |
| `string`   | `""` (empty)     |
| `integer`  | `0`              |
| `decimal`  | `"0.00"`         |
| `boolean`  | `false`          |
| `datetime` | `null`           |
| `json`     | `{}` (empty obj) |

---

## Standard Response Patterns

### `:list` — Paginated List

```json
{
  "data": [ { "id": "01H...", "name": "..." } ],
  "meta": {
    "count": 15,
    "limit": 15,
    "next": "01H...",
    "prev": null,
    "total": 42
  }
}
```

- `data`: Array of resource objects. Always includes `id` (ULID), except collections which use `name`.
- `meta.count`: Records returned in this page.
- `meta.limit`: Page size applied (default 15, max 200).
- `meta.next`: Cursor to the last record on this page. Pass as `?after=` for the next page. `null` on last page.
- `meta.prev`: Cursor for the previous page. `null` on first page.
- `meta.total`: Total matching records across all pages.

**Pagination:**
```
GET /{resource}:list              # First page
GET /{resource}:list?after={id}   # Next page (use meta.next)
GET /{resource}:list?after={id}   # Previous page (use meta.prev)
```

### `:get` — Single Resource

```json
{
  "data": { "id": "01H...", "name": "..." }
}
```

No `meta` field. `data` is a single object (not an array).

### `:create` — Create Resource(s)

```json
{
  "data": [ { "id": "01H...", "field": "value" } ],
  "message": "N record(s) created successfully",
  "meta": { "total": 2, "succeeded": 2, "failed": 0 }
}
```

- Status: `201 Created`
- Send records as array in `data`, even for single records.
- Partial success: failed records are excluded from `data`. Check `meta.failed`.

### `:update` — Update Resource(s)

```json
{
  "data": [ { "id": "01H...", "field": "new_value" } ],
  "message": "N record(s) updated successfully",
  "meta": { "total": 1, "succeeded": 1, "failed": 0 }
}
```

- Status: `200 OK`
- Only provided fields are updated (partial update).
- For special actions (e.g., `reset_password`, `rotate`), use `action` field in body.

### `:destroy` — Delete Resource(s)

```json
{
  "data": ["01H...", "01H..."],
  "message": "N record(s) deleted successfully",
  "meta": { "total": 2, "succeeded": 2, "failed": 0 }
}
```

- Status: `200 OK`
- `data` contains IDs of successfully deleted records.

### `:schema` — Collection Schema

```json
{
  "data": {
    "collection": "products",
    "fields": [
      { "name": "id", "type": "string", "nullable": false, "readonly": true },
      { "name": "title", "type": "string", "nullable": false }
    ],
    "total": 6
  }
}
```

---

## Standard Error Response

All errors return the appropriate HTTP status code and a JSON body with a single `message` field:

```json
{ "message": "A human-readable description of the error" }
```

**HTTP Status Codes:**

| Code | Meaning                                    |
| ---- | ------------------------------------------ |
| 200  | OK                                         |
| 201  | Created                                    |
| 400  | Bad Request (validation, malformed input)  |
| 401  | Unauthorized (authentication required)     |
| 404  | Not Found                                  |
| 429  | Too Many Requests (rate limit exceeded)    |
| 500  | Internal Server Error                      |

**Always display `message` from the error response in user notifications.** Only use a generic fallback if the API provides no message.

---

## Public Endpoints

No authentication required.

| Endpoint         | Method | Description              |
| ---------------- | ------ | ------------------------ |
| `/health`        | GET    | Health check             |
| `/`              | GET    | Alias for `/health`      |
| `/doc/`          | GET    | API docs (HTML)          |
| `/doc/llms.md`   | GET    | API docs (Markdown)      |
| `/doc/llms.json` | GET    | API docs (JSON)          |

**Health Response:**
```json
{
  "data": { "moon": "1.99", "timestamp": "2026-02-28T05:52:36Z" }
}
```

---

## Authentication

All non-public endpoints require: `Authorization: Bearer <token>`

Supported token types:
- **JWT** (`eyJ...`) — for interactive users (obtained via login)
- **API Key** (`moon_live_<64chars>`) — for service integrations

| Endpoint        | Method | Description                              |
| --------------- | ------ | ---------------------------------------- |
| `/auth:login`   | POST   | Authenticate; receive access + refresh tokens |
| `/auth:logout`  | POST   | Invalidate current refresh token         |
| `/auth:refresh` | POST   | Exchange refresh token for new tokens    |
| `/auth:me`      | GET    | Get current authenticated user           |
| `/auth:me`      | POST   | Update current user's profile/password   |

### Login

```
POST /auth:login
Content-Type: application/json

{ "username": "admin", "password": "moonadmin12#" }
```

**Response (200 OK):**
```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "SEb54NKd...",
    "expires_at": "2026-02-28T06:52:38Z",
    "token_type": "Bearer",
    "user": {
      "id": "01KJ...",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "can_write": true
    }
  },
  "message": "Login successful"
}
```

**Token notes:**
- Access tokens expire in 15 minutes (configurable on server).
- Refresh tokens are **single-use**. Each refresh returns a new access token AND a new refresh token — always store the latest refresh token.
- Store both tokens in `localStorage`. Clear on logout.
- Changing password invalidates all sessions; user must re-login.

### Refresh Token

```
POST /auth:refresh
Content-Type: application/json

{ "refresh_token": "<current_refresh_token>" }
```

**Response (200 OK):**
```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "aDSM1M...",
    "expires_at": "2026-02-28T06:52:40Z",
    "token_type": "Bearer",
    "user": { ... }
  },
  "message": "Token refreshed successfully"
}
```

### Logout

```
POST /auth:logout
Authorization: Bearer <access_token>
Content-Type: application/json

{ "refresh_token": "<refresh_token>" }
```

**Response (200 OK):**
```json
{ "message": "Logged out successfully" }
```

### Get Current User

```
GET /auth:me
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "01KJ...",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "can_write": true
  }
}
```

### Update Current User

```
POST /auth:me
Authorization: Bearer <access_token>
Content-Type: application/json

{ "email": "new@example.com" }
```

Or change password:
```json
{ "old_password": "OldPass123#", "password": "NewPass456#" }
```

**Response (200 OK):** Returns updated user object with `message`.

---

## Users (Admin Only)

| Endpoint         | Method | Description              |
| ---------------- | ------ | ------------------------ |
| `/users:list`    | GET    | List all users           |
| `/users:get`     | GET    | Get user by ID           |
| `/users:create`  | POST   | Create user              |
| `/users:update`  | POST   | Update user / run action |
| `/users:destroy` | POST   | Delete user              |

### Create User

```
POST /users:create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "data": {
    "username": "moonuser",
    "email": "moonuser@example.com",
    "password": "UserPass123#",
    "role": "user"
  }
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "01KJ...",
    "username": "moonuser",
    "email": "moonuser@example.com",
    "role": "user",
    "can_write": true,
    "created_at": "2026-02-28T05:52:42Z",
    "updated_at": "2026-02-28T05:52:42Z"
  },
  "message": "User created successfully"
}
```

### List Users

```
GET /users:list
Authorization: Bearer <access_token>
```

**Response (200 OK):** Standard paginated list. User objects include `id`, `username`, `email`, `role`, `can_write`, `created_at`, `updated_at`, `last_login_at`.

### Get User

```
GET /users:get?id=<user_id>
Authorization: Bearer <access_token>
```

### Update User

```
POST /users:update?id=<user_id>
Authorization: Bearer <access_token>
Content-Type: application/json

{ "email": "new@example.com", "role": "admin" }
```

**Special actions (in request body):**

```json
{ "action": "reset_password", "new_password": "NewPass123#" }
{ "action": "revoke_sessions" }
```

### Delete User

```
POST /users:destroy?id=<user_id>
Authorization: Bearer <access_token>
```

---

## API Keys (Admin Only)

| Endpoint           | Method | Description                    |
| ------------------ | ------ | ------------------------------ |
| `/apikeys:list`    | GET    | List all API keys              |
| `/apikeys:get`     | GET    | Get API key by ID              |
| `/apikeys:create`  | POST   | Create API key                 |
| `/apikeys:update`  | POST   | Update metadata or rotate key  |
| `/apikeys:destroy` | POST   | Delete API key                 |

### Create API Key

```
POST /apikeys:create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "data": {
    "name": "Integration Service",
    "description": "Key for integration",
    "role": "user",
    "can_write": false
  }
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "01KJ...",
    "key": "moon_live_<64chars>",
    "name": "Integration Service",
    "description": "Key for integration",
    "role": "user",
    "can_write": false,
    "created_at": "2026-02-28T05:52:46Z"
  },
  "message": "API key created successfully",
  "warning": "Store this key securely. It will not be shown again."
}
```

**Important:** `key` is only shown once at creation. Display it to the user immediately with a copy button and prominent warning.

### List API Keys

```
GET /apikeys:list
Authorization: Bearer <access_token>
```

Note: The `key` value is NOT included in list responses — only at creation and rotation.

### Rotate API Key

```
POST /apikeys:update?id=<key_id>
Authorization: Bearer <access_token>
Content-Type: application/json

{ "data": { "action": "rotate" } }
```

**Response (200 OK):** Returns new `key` value (shown once only).

### Update API Key Metadata

```
POST /apikeys:update?id=<key_id>
Authorization: Bearer <access_token>
Content-Type: application/json

{ "data": { "name": "New Name", "description": "...", "can_write": true } }
```

### Delete API Key

```
POST /apikeys:destroy?id=<key_id>
Authorization: Bearer <access_token>
```

---

## Collections

| Endpoint               | Method | Description                 |
| ---------------------- | ------ | --------------------------- |
| `/collections:list`    | GET    | List all collections        |
| `/collections:get`     | GET    | Get collection schema       |
| `/collections:create`  | POST   | Create collection           |
| `/collections:update`  | POST   | Update collection schema    |
| `/collections:destroy` | POST   | Delete collection           |

### Create Collection

```
POST /collections:create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "data": {
    "name": "products",
    "columns": [
      { "name": "title", "type": "string", "nullable": false, "unique": true },
      { "name": "price", "type": "decimal", "nullable": false },
      { "name": "description", "type": "string", "nullable": true }
    ]
  }
}
```

**Column rules:**
- Name: lowercase, snake_case, 2–63 chars, pattern `^[a-z][a-z0-9_]*$`
- Reserved names: `id`, `pkid`
- Do NOT include `default` in column definitions — the server sets it automatically.
- `unique` is optional (boolean).

**Collection name rules:**
- Lowercase, snake_case, 2–63 chars
- Cannot be: `collections`, `auth`, `users`, `apikeys`, `doc`, `health`
- Cannot start with `moon_`

**Response (201 Created):** Returns full collection schema.

### List Collections

```
GET /collections:list
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": [{ "name": "products", "records": 42 }],
  "meta": { "count": 1, "limit": 15, "next": null, "prev": null }
}
```

### Get Collection Schema

```
GET /collections:get?name=products
Authorization: Bearer <access_token>
```

### Update Collection Schema

```
POST /collections:update
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "data": {
    "name": "products",
    "add_columns": [{ "name": "stock", "type": "integer", "nullable": false }],
    "rename_columns": [{ "old_name": "description", "new_name": "details" }],
    "modify_columns": [{ "name": "price", "type": "decimal", "nullable": true }],
    "remove_columns": ["old_field"]
  }
}
```

All four operations can be combined in one request.

### Delete Collection

```
POST /collections:destroy?name=products
Authorization: Bearer <access_token>
```

---

## Data Access (Records)

Replace `{collection}` with your collection name.

| Endpoint                   | Method | Description              |
| -------------------------- | ------ | ------------------------ |
| `/{collection}:list`       | GET    | List records             |
| `/{collection}:get`        | GET    | Get single record by ID  |
| `/{collection}:schema`     | GET    | Get collection schema    |
| `/{collection}:create`     | POST   | Create record(s)         |
| `/{collection}:update`     | POST   | Update record(s)         |
| `/{collection}:destroy`    | POST   | Delete record(s)         |

### Create Records

```
POST /products:create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "data": [
    { "title": "Wireless Mouse", "price": "29.99", "description": "Ergonomic mouse" }
  ]
}
```

- Always send as array, even for single record.
- Never include `id` — it is system-generated.

### Get Record

```
GET /products:get?id=<record_id>
Authorization: Bearer <access_token>
```

### Update Records

```
POST /products:update
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "data": [
    { "id": "01KJ...", "price": "39.99" }
  ]
}
```

- Always send as array. Include `id` for each record to update.
- Only provided fields are updated.

### Delete Records

```
POST /products:destroy
Authorization: Bearer <access_token>
Content-Type: application/json

{ "data": ["01KJ...", "01KJ..."] }
```

---

## Query Options

Apply to all `:list` endpoints.

| Parameter                 | Description                                           |
| ------------------------- | ----------------------------------------------------- |
| `?limit={n}`              | Page size (default 15, max 200)                       |
| `?after={cursor}`         | Cursor-based pagination (use `meta.next` or `meta.prev`) |
| `?sort={field,-field}`    | Sort ascending (`field`) or descending (`-field`)     |
| `?q={term}`               | Full-text search across all string fields             |
| `?fields={f1,f2}`         | Return only specified fields (id always included)     |
| `?{column}[{op}]={value}` | Filter by column using operator                       |

### Filter Operators

| Operator | Description                                   |
| -------- | --------------------------------------------- |
| `eq`     | Equal to                                      |
| `ne`     | Not equal to                                  |
| `gt`     | Greater than                                  |
| `lt`     | Less than                                     |
| `gte`    | Greater than or equal to                      |
| `lte`    | Less than or equal to                         |
| `like`   | Pattern match (`%` wildcard, e.g. `Wo%`)      |
| `in`     | Matches any in comma-separated list           |

**Examples:**
```
?quantity[gt]=5&brand[eq]=Wow
?price[gte]=10&price[lte]=100
?brand[like]=Wo%
?brand[in]=Wow,Orange
?sort=-quantity,title
?q=mouse
?fields=title,price
?limit=10&after=01KJ...
```

All parameters can be combined.

---

## Aggregation

Server-side analytics. All support filter query parameters.

| Endpoint                | Method | Description                      |
| ----------------------- | ------ | -------------------------------- |
| `/{collection}:count`   | GET    | Count records                    |
| `/{collection}:sum`     | GET    | Sum a numeric field              |
| `/{collection}:avg`     | GET    | Average a numeric field          |
| `/{collection}:min`     | GET    | Minimum value of a numeric field |
| `/{collection}:max`     | GET    | Maximum value of a numeric field |

`sum`, `avg`, `min`, `max` require `?field={field_name}`.  
Only supported on `integer` and `decimal` field types.

**Response:**
```json
{ "data": { "value": 85 } }
```

**Examples:**
```
GET /products:count
GET /products:count?quantity[gt]=10
GET /products:sum?field=quantity
GET /products:sum?field=quantity&brand[eq]=Wow
GET /products:avg?field=quantity
GET /products:min?field=quantity
GET /products:max?field=quantity
```

---

## Security & Rate Limiting

### Rate Limits

| Auth Type | Limit              |
| --------- | ------------------ |
| JWT       | 100 requests/min/user |
| API Key   | 1,000 requests/min/key |

**Rate limit response headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706875200
```

**429 Too Many Requests:**
```json
{ "message": "rate limit exceeded" }
```
Use `Retry-After` header (seconds) before retrying.

### Request Correlation

Include `X-Request-ID` header in requests for traceability. Server echoes it in the response header and includes it in server logs.

### CORS

The Moon server must be configured with your webapp's origin in `cors.allowed_origins`. The app must handle CORS-related errors gracefully. In development, the test server at `https://moon.devnodes.in` allows all origins.

### HTTPS

Always use HTTPS in production. The test server is available at `https://moon.devnodes.in`.

### HTTP Methods

Moon only supports `GET`, `POST`, and `OPTIONS`. All other methods return `405 Method Not Allowed`.

---

**[Moon](https://github.com/devnodesin/moon)** — Dynamic Headless Engine by [Devnodes.in](https://devnodes.in)
