# Café Booking & Management Platform — System Design

A multi-tenant marketplace platform where customers discover cafés, browse table availability, and make reservations — and café owners manage their own spaces independently.

---

## What We're Building (MVP Scope)

**In scope:**
- Café discovery with search/filters
- Table reservation + time slot booking
- 5-minute booking hold to prevent double bookings
- Auto-confirmed bookings (no manual approval)
- Customer cancellation up to 20 minutes before booking
- Café onboarding with Super Admin approval flow
- Role-based access control (4 roles)
- Email + Password authentication for all users

**Deliberately out of scope (Phase 2):**
- Payment / booking deposit
- Pre-ordering food
- Event booking
- Takeaway / delivery
- Mobile app
- Visual floor map editor
- Analytics dashboard
- Email marketing

---

## User Roles & Permissions

| Role | What they can do |
|---|---|
| **Super Admin** | Approve/reject café registrations, remove cafés, platform oversight |
| **Café Admin** | Manage café profile, tables, hours, view all bookings, add/remove staff |
| **Café Staff** | View bookings only — no settings access |
| **Customer** | Browse cafés, make bookings, cancel bookings (up to 20 mins before) |

---

## Authentication Model

**All users authenticate with Email + Password.** Simple, consistent, no third-party SMS dependency.

| User Type | Auth Method | Account Creation |
|---|---|---|
| Customer | Email + Password | Self-registration |
| Café Admin | Email + Password | Self-registration (pending Super Admin approval) |
| Café Staff | Email + Password | Created by Café Admin |
| Super Admin | Email + Password | Single hardcoded account |

---

## Core User Flows

### Customer Flow
```
Sign up (Email + Password)
  → Browse cafés (filtered by: nearest location → ratings → available time slots)
  → Select café
  → View available tables (list view: "Table for 2 — Window seat — Available 3pm–5pm")
  → Select table + pick time + enter party size
  → System places 5-minute hold on table
  → Confirm booking
  → Auto-confirmed ✅
  → Can cancel up to 20 minutes before booking time
```

### Café Owner Flow
```
Register account (Email + Password)
  → Fill in café profile (name, location, photos, tables, operating hours)
  → Submit for review
  → Super Admin reviews and approves
  → Café goes live on platform ✅
  → Manage bookings, add staff, update availability
```

### Super Admin Flow
```
Login (Email + Password)
  → View pending café registrations
  → Approve or reject with reason
  → Monitor platform (cafés, users, bookings)
```

---

## Data Model (Key Entities)

### Users
```
users
  id, email, name, role (customer | cafe_admin | cafe_staff | super_admin),
  password_hash, created_at
```

### Cafés
```
cafes
  id, owner_id (→ users), name, description, location, city, area,
  latitude, longitude, cover_photo_url, photos[], operating_hours (JSON),
  status (pending | approved | rejected | suspended),
  average_rating, total_reviews, created_at
```

### Tables
```
tables
  id, cafe_id, name, capacity, zone (indoor | outdoor | rooftop | private),
  description, is_active
```

### Bookings
```
bookings
  id, customer_id (→ users), cafe_id, table_id,
  booking_date, start_time, end_time,
  party_size, status (held | confirmed | cancelled | no_show | completed),
  hold_expires_at, created_at, cancelled_at
```

### Reviews
```
reviews
  id, customer_id, cafe_id, booking_id, rating (1–5),
  comment, created_at
```

### Staff
```
cafe_staff
  id, cafe_id, user_id, added_by (→ cafe_admin)
```

---

## Technically Complex Parts

### 1. 5-Minute Booking Hold (Hardest Problem)
When a customer selects a table:
- Set `status = 'held'` and `hold_expires_at = now() + 5 minutes`
- A background job (cron every 30 seconds) clears expired holds
- On booking completion, set `status = 'confirmed'`
- PostgreSQL row-level locking (`SELECT FOR UPDATE`) prevents two customers grabbing the same table simultaneously

### 2. Real-Time Table Availability
- Use **Socket.io** to push live updates to all customers viewing the same café
- When a table is held/confirmed/cancelled → emit event → all viewers see updated availability instantly

### 3. Multi-Tenancy Data Isolation
- All tables include `cafe_id` foreign key
- All API queries are scoped by `cafe_id` extracted from the authenticated user's JWT token
- Café admin cannot query another café's data

### 4. Password Security
- Passwords hashed using **bcrypt** (salt rounds: 12) before storing
- JWTs issued on login, expire after 7 days
- Refresh token strategy optional for Phase 2

---

## Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| **Frontend** | React.js (Vite) | Familiar, fast build tooling |
| **Backend** | Node.js + Express | Familiar, great ecosystem |
| **Database** | PostgreSQL | Relational integrity for bookings, row-level locking |
| **ORM** | Prisma | Type-safe queries, easy migrations |
| **Image Storage** | Cloudinary | Familiar, handles café photos |
| **Authentication** | JWT + bcrypt | Stateless JWT, secure password hashing |
| **Real-time** | Socket.io | Works natively with Express |
| **Background Jobs** | node-cron | Clear expired booking holds every 30 seconds |
| **Hosting** | Vercel (frontend) + Railway (backend + DB) | Familiar |

---

## API Structure (High Level)

```
/api/auth
  POST /register          → Register new customer account
  POST /login             → Login for all user types, return JWT
  POST /logout            → Invalidate session

/api/cafes
  GET  /                  → Browse cafés (with filters: location, rating, time)
  GET  /:id               → Single café details
  POST /                  → Register new café (café admin)
  PATCH/:id               → Update café profile (café admin)

/api/cafes/:id/tables
  GET  /                  → List tables with availability
  POST /                  → Add table (café admin)

/api/bookings
  POST /                  → Create booking (places 5-min hold)
  GET  /my                → Customer's booking history
  DELETE /:id             → Cancel booking (customer, up to 20 mins before)

/api/admin
  GET  /cafes/pending     → List pending café registrations (super admin)
  PATCH/cafes/:id/approve → Approve café (super admin)
  PATCH/cafes/:id/reject  → Reject café (super admin)

/api/reviews
  POST /                  → Leave a review (after completed booking)
  GET  /cafe/:id          → Get reviews for a café
```

---

## Recommended Build Order

**Phase 1 — Foundation**
1. Database schema + Prisma setup
2. Auth system (Email + Password, JWT, bcrypt)
3. Role-based middleware

**Phase 2 — Café Management**
4. Café registration + Super Admin approval flow
5. Table management (CRUD)
6. Operating hours setup

**Phase 3 — Booking Engine**
7. Table availability query
8. 5-minute hold mechanism + background job
9. Booking confirmation + cancellation logic

**Phase 4 — Discovery**
10. Café search with location/rating/availability filters
11. Geolocation (nearest cafés first)

**Phase 5 — Real-time & Polish**
12. Socket.io for live availability updates
13. Reviews system
14. Staff account management

---

## Open Questions (Decide Before Building)

> [!IMPORTANT]
> **Reviews:** Can a customer leave a review only after a completed booking, or anytime? Recommend: only after a completed booking (prevents fake reviews).

> [!IMPORTANT]
> **No-show policy:** If a customer books and doesn't show up and doesn't cancel, what happens? Does the booking just mark as `no_show`? Does this affect their account in any way?

> [!IMPORTANT]
> **Geolocation:** Will customers always allow location access? You need a fallback — probably ask them to enter their city/area manually if location is denied.

> [!IMPORTANT]
> **Booking duration:** When a customer books a table, how long is the slot? Fixed (e.g., 1 hour, 2 hours)? Or does the café admin define slot durations per table?

> [!NOTE]
> **Password reset:** You'll need an email service (like Nodemailer + Gmail SMTP or Resend.dev) to send password reset links. This is simple to add and recommended before launch.
