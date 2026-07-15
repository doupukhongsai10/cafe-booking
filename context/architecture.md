# Café Booking & Management Platform — Architecture

---

## Stack Table

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | React.js (Vite) | Renders all UI — customer discovery, booking flow, café dashboard, admin panel |
| **Backend** | Node.js + Express | HTTP API server — handles all business logic, auth, validation, and route gating |
| **Database** | PostgreSQL | Source of truth for all relational data — users, cafés, tables, bookings, reviews |
| **ORM** | Prisma | Type-safe query builder and migration runner on top of PostgreSQL |
| **Image Storage** | Cloudinary | Stores and serves café photos (cover image + gallery); returns CDN URLs saved in the DB |
| **Authentication** | JWT + bcrypt | bcrypt hashes passwords at rest; JWTs carry identity and role on each request |
| **Token Blacklist** | PostgreSQL `token_blacklist` table | Persists invalidated JWT IDs so logout is enforced server-side |
| **Real-time** | Socket.io | Pushes live table availability events to all clients watching a café page |
| **Background Jobs** | node-cron | Runs every 30 seconds to expire stale booking holds |
| **Frontend Hosting** | Vercel | Serves the React build; handles CDN, routing, and HTTPS automatically |
| **Backend + DB Hosting** | Railway | Runs the Express server and PostgreSQL instance in the same private network |

---

## System Boundaries

Each folder owns exactly one responsibility. No folder reaches into another folder's internals.

```
cafe-booking/
├── client/                         # React frontend (Vite)
│   ├── src/
│   │   ├── pages/                  # Route-level page components
│   │   ├── components/             # Reusable UI components
│   │   ├── hooks/                  # Custom React hooks (useAuth, useBooking, etc.)
│   │   ├── services/               # All HTTP calls to the backend API (axios)
│   │   ├── store/                  # Global client state (React Context or Zustand)
│   │   ├── sockets/                # Socket.io client setup and event listeners
│   │   └── utils/                  # Pure helper functions (date formatting, etc.)
│
├── server/                         # Node.js + Express backend
│   ├── src/
│   │   ├── routes/                 # Express routers — one file per resource
│   │   │   ├── auth.routes.js
│   │   │   ├── cafes.routes.js
│   │   │   ├── tables.routes.js
│   │   │   ├── bookings.routes.js
│   │   │   ├── reviews.routes.js
│   │   │   └── admin.routes.js
│   │   ├── controllers/            # Request handlers — call services, return responses
│   │   ├── services/               # Business logic (booking engine, hold expiry, etc.)
│   │   ├── middleware/             # Auth guard, role check, rate limiter, error handler
│   │   ├── jobs/                   # node-cron job definitions (hold expiry job)
│   │   ├── sockets/                # Socket.io server setup and event emitters
│   │   ├── lib/                    # Shared utilities (prisma client, cloudinary client)
│   │   └── validators/             # Zod schemas for request body/param validation
│
├── prisma/
│   ├── schema.prisma               # Single source of truth for the database schema
│   └── migrations/                 # Auto-generated migration files — never edited by hand
│
└── contex/                         # Project documentation (not deployed)
    ├── plan1.md
    ├── project-overview.md
    └── architecture.md
```

### Boundary Rules

| Boundary | Rule |
|---|---|
| `routes/` → `controllers/` | Routes only parse the request and call the correct controller. No business logic in routes. |
| `controllers/` → `services/` | Controllers only coordinate: call a service, handle the response, return HTTP result. No DB queries in controllers. |
| `services/` → `prisma/` | All database access lives in services. No `prisma.xyz` calls outside the `services/` folder. |
| `client/services/` | All backend API calls from the frontend are centralised here. No raw `fetch`/`axios` calls inside components or hooks. |
| `sockets/` (server) | All Socket.io event emissions go through the `sockets/` module. Services call `emitTableUpdate()` — they never touch the socket directly. |

---

## Storage Model

### PostgreSQL (Relational Database)

Everything that requires consistency, joins, or transactional integrity lives here.

| Table | What it stores |
|---|---|
| `users` | id, email, name, password_hash, role, created_at |
| `cafes` | id, owner_id, name, description, city, area, latitude, longitude, cover_photo_url, photos (JSON array of URLs), operating_hours (JSON), status, average_rating, total_reviews, created_at |
| `tables` | id, cafe_id, name, capacity, zone, description, is_active |
| `bookings` | id, customer_id, cafe_id, table_id, booking_date, start_time, end_time, party_size, status, hold_expires_at, created_at, cancelled_at |
| `reviews` | id, customer_id, cafe_id, booking_id, rating, comment, created_at |
| `cafe_staff` | id, cafe_id, user_id, added_by |
| `token_blacklist` | jti (JWT ID), expires_at — rows purged nightly |

> **Note:** `cafes.photos` is stored as a JSON array of Cloudinary URLs for MVP simplicity. This can be extracted into a `cafe_photos` table in Phase 2 if querying individual photos becomes necessary.

### Cloudinary (File / Image Storage)

Only image binary data is stored in Cloudinary. The database never stores raw image data.

| What | How |
|---|---|
| Café cover photo | Uploaded via the backend (server-side upload using Cloudinary SDK); the returned `secure_url` is saved to `cafes.cover_photo_url` |
| Café gallery photos | Same pattern; URLs appended to `cafes.photos` JSON array |
| Naming convention | `cafe-booking/{cafe_id}/{timestamp}-{original_filename}` to keep assets organised and deletable |

### In-Memory / Cache

| What | Where | Notes |
|---|---|---|
| Socket.io rooms | Socket.io internal memory | Each café's real-time viewers are grouped into a room keyed by `cafe:{cafe_id}`. No persistence needed. |

---

## Auth and Access Model

### How Authentication Works

1. **Registration:** Password is hashed with `bcrypt` (12 salt rounds) before being written to `users.password_hash`. The plaintext password is never stored or logged.
2. **Login:** The backend retrieves the user by email, runs `bcrypt.compare()`, and on success issues a signed JWT containing `{ sub: user.id, role: user.role, jti: uuid() }`. The JWT expires in 7 days.
3. **Request Auth:** Every protected route passes through the `authMiddleware`. It reads the `Authorization: Bearer <token>` header, verifies the JWT signature, checks the `jti` against the blacklist, and attaches `req.user` to the request.
4. **Logout:** The `jti` from the token is inserted into the `token_blacklist` table. All subsequent requests with the same token are rejected.
5. **Role Guard:** After `authMiddleware`, routes that require specific roles pass through `requireRole(...roles)` middleware. This returns `403 Forbidden` if `req.user.role` is not in the allowed list.
6. **Account Creation:** Public registration accepts only `CUSTOMER` and `CAFE_ADMIN`. Café staff are created by their café admin, and the super admin account is not publicly registerable.

### Role Permissions Matrix

| Action | Customer | Café Staff | Café Admin | Super Admin |
|---|---|---|---|---|
| Browse & search cafés | ✅ | ✅ | ✅ | ✅ |
| Create a booking | ✅ | ❌ | ❌ | ❌ |
| Cancel own booking | ✅ | ❌ | ❌ | ❌ |
| Leave a review | ✅ | ❌ | ❌ | ❌ |
| View café bookings | ❌ | ✅ (own café) | ✅ (own café) | ✅ (all) |
| Manage café profile & tables | ❌ | ❌ | ✅ (own café) | ❌ |
| Create/remove staff accounts | ❌ | ❌ | ✅ (own café) | ❌ |
| Approve/reject café registrations | ❌ | ❌ | ❌ | ✅ |
| Suspend/remove cafés | ❌ | ❌ | ❌ | ✅ |

### Ownership & Tenancy

- `cafe_id` is present on every resource that belongs to a café (`tables`, `bookings`, `reviews`, `cafe_staff`).
- When a Café Admin or Café Staff makes a request, the backend extracts their `cafe_id` from their user record (not from the request body or URL params alone) and uses it to scope every database query.
- A Café Admin can never supply a `cafe_id` belonging to another café and gain access — ownership is always resolved server-side from the authenticated identity.

---

## Background Task Model

### Hold Expiry Job (node-cron)

**Purpose:** Release tables that were held but never confirmed within 5 minutes.

**Schedule:** Every 30 seconds — `*/30 * * * * *`

**Logic:**
```
SELECT all bookings WHERE status = 'held' AND hold_expires_at < NOW()
  → SET status = 'cancelled'
  → Emit Socket.io event: tableAvailabilityChanged({ cafe_id, table_id, date, time })
  → All clients viewing that café page update the table to show as available
```

**Failure handling:** If the cron job crashes, the next run (30 seconds later) will catch the same expired holds. There is no risk of permanent data corruption — the worst case is a 30-second delay in releasing a held table.

**Location:** `server/src/jobs/expireHolds.job.js` — registered once at server startup in `server.js`.

---

## Real-Time Model (Socket.io)

### Room Structure

Each café page creates a Socket.io room: `cafe:{cafe_id}`.

When a customer opens a café page → they join `cafe:{cafe_id}`.
When they leave the page or disconnect → they leave the room automatically.

### Events

| Event Name | Direction | Triggered By | Payload |
|---|---|---|---|
| `table:held` | Server → Client | Booking creation (hold placed) | `{ table_id, held_until }` |
| `table:confirmed` | Server → Client | Booking confirmation | `{ table_id }` |
| `table:available` | Server → Client | Hold expired or booking cancelled | `{ table_id }` |

All three events are emitted to the room `cafe:{cafe_id}` so every viewer of that café page receives the update instantly.

---

## Invariants

These are rules the codebase must never violate. They are enforced at the service layer and, where possible, at the database constraint level.

---

### INV-1: A table can have at most one active hold or confirmed booking per time slot

At the moment a hold is placed, the backend must use a PostgreSQL transaction with `SELECT ... FOR UPDATE` on the relevant booking rows to acquire a row-level lock before inserting the new `held` record. No two concurrent requests may successfully place a hold on the same table for the same date + time slot. This is enforced at the **database level**, not the application level.

```sql
-- Example lock pattern (executed inside a Prisma $transaction)
SELECT id FROM bookings
  WHERE table_id = $1
    AND booking_date = $2
    AND status IN ('held', 'confirmed')
    AND (start_time, end_time) OVERLAPS ($3, $4)
  FOR UPDATE;
-- If any row is returned → reject the request. Otherwise → insert hold.
```

---

### INV-2: A customer cannot cancel a booking within 20 minutes of its start time

The cancellation window is calculated **server-side** at the moment the cancel request arrives. The frontend may hide the cancel button, but the backend independently enforces this rule regardless of what the client sends.

```
if (booking.start_time - NOW() < 20 minutes) → return 403 with error code CANCELLATION_WINDOW_CLOSED
```

This check uses UTC timestamps throughout. No timezone conversion is done at the API layer — all times are stored and compared in UTC.

---

### INV-3: A review can only be submitted for a booking with status = 'completed', by the customer who made the booking, and only once

Three conditions are checked in the review service before writing to the database:
1. `booking.status === 'completed'` — otherwise return `403 BOOKING_NOT_COMPLETED`
2. `booking.customer_id === req.user.id` — otherwise return `403 NOT_YOUR_BOOKING`
3. No existing review with the same `booking_id` — enforced by a `UNIQUE(customer_id, booking_id)` constraint on the `reviews` table. A duplicate insert at the DB level returns a unique violation error, which the service maps to `409 REVIEW_ALREADY_EXISTS`.

---

### INV-4: A Café Admin can only read or write data belonging to their own café

Every service function that operates on café-owned data (tables, bookings, staff) resolves `cafe_id` from the server's record of the authenticated user — never from the request URL or body alone.

```js
// Correct — cafe_id comes from the server-side user record
const cafe = await prisma.cafe.findFirst({ where: { owner_id: req.user.id } });

// Wrong — never trust the client to provide their own cafe_id
const cafeId = req.params.cafeId; // ← cannot be used without ownership verification
```

If the resource's `cafe_id` does not match the authenticated user's café, the service returns `403 FORBIDDEN` before any data is read or written.

---

### INV-5: Plaintext passwords are never stored, logged, or returned in any API response

- `bcrypt.hash()` is called on the plaintext password before the `users` row is inserted. The plaintext string is then discarded.
- The `password_hash` column is never included in any Prisma `select` that is returned to the client.
- No Express logger, error handler, or request logger may log request bodies on auth routes (`/api/auth/register`, `/api/auth/login`).
- This is enforced by excluding `password_hash` in all user-returning Prisma queries using `select: { password_hash: false }` or equivalent.

---

### INV-6: A café is only visible to customers if its status is `approved`

All public-facing café queries (`GET /api/cafes`, `GET /api/cafes/:id`) must include `WHERE status = 'approved'` at the database level. A café with status `pending`, `rejected`, or `suspended` must return no results to unauthenticated users or customers. This condition is applied inside the service function — not as an optional query parameter from the client.
