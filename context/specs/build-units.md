# Café Booking & Management Platform — Build Units

This document defines the incremental build plan for the platform, divided into 22 individual, sequential build units. Each unit is scoped to a single system boundary and results in a verifiable outcome.

---

## Phase 1 — Foundation

### Unit 1: Database Schema Initialization
- **System Boundary:** Database / ORM (`prisma/`)
- **What it builds:** 
  - `prisma/schema.prisma` defining initial models: `User` and `TokenBlacklist` (with a unique `jti` constraint).
  - Runs database migration (`prisma migrate dev`) to create the physical database tables.
- **Dependencies:** Active PostgreSQL database.
- **Verifiable Outcome:** Initial schema tables exist in the database, and `prisma studio` can connect to and query them.

### Unit 2: Backend Authentication API & JWT Middleware
- **System Boundary:** Backend (`server/`)
- **What it builds:**
  - Route handlers: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`.
  - Auth services for bcrypt password hashing and stateless JWT signing/validation.
  - Middlewares: `authMiddleware` (gating route requests), `requireRoleMiddleware` (role validation), and `errorHandler`.
  - In-memory JWT ID (`jti`) blacklist check to enforce logout.
- **Dependencies:** Unit 1.
- **Verifiable Outcome:** Requesting `/api/auth/register` and `/api/auth/login` returns a signed JWT containing user metadata. Requesting `/api/auth/logout` blacklists the JWT. Route gating returns `401 Unauthorized` for missing tokens and `403 Forbidden` for role mismatches when tested via API client (e.g. Curl/Postman).

### Unit 3: Frontend Shell, Auth Context & Auth UI
- **System Boundary:** Frontend (`client/`)
- **What it builds:**
  - Vite base project shell and stylesheet setup implementing styling tokens (`client/src/index.css`).
  - Auth HTTP client (`client/src/services/auth.service.js`).
  - React Auth Context (`useAuth`) maintaining persistent token state in browser memory/localStorage.
  - Login page (`/login`) and Customer Self-Registration page (`/register`) layout and integration.
- **Dependencies:** Unit 2.
- **Verifiable Outcome:** Entering email/password on the UI registers a customer user and logs them in, redirecting them to an authenticated homepage shell.

---

## Phase 2 — Café Onboarding & Management

### Unit 4: Database Café, Tables, & Staff Models
- **System Boundary:** Database / ORM (`prisma/`)
- **What it builds:**
  - Updates `prisma/schema.prisma` to include models for `Cafe` (with average rating, photos JSON, status, location), `Table` (capacity, zone, active status), and `CafeStaff`.
  - Performs migration (`prisma migrate dev`).
- **Dependencies:** Unit 1.
- **Verifiable Outcome:** Prisma Client updates types; updated database tables are visible in `prisma studio`.

### Unit 5: Backend Café Registration & Super Admin API
- **System Boundary:** Backend (`server/`)
- **What it builds:**
  - Endpoints: `POST /api/cafes` (café onboarding submission by owner), `GET /api/admin/cafes/pending` (super admin listing), and status patch endpoints `/api/admin/cafes/:id/approve` and `/api/admin/cafes/:id/reject` (requiring a text reason).
  - Cloudinary configuration utility (`server/src/lib/cloudinary.js`) for server-side image upload.
- **Dependencies:** Unit 2, Unit 4.
- **Verifiable Outcome:** Submitting a café registration payload (with image uploads) creates a pending café. A super-admin can retrieve pending applications and change their status.

### Unit 6: Frontend Café Onboarding & Admin Panel UI
- **System Boundary:** Frontend (`client/`)
- **What it builds:**
  - Café Owner onboarding form (profile details, hours matrix, and file upload for cover photo).
  - Super Admin Dashboard page showing pending registration submissions with "Approve" and "Reject" buttons.
- **Dependencies:** Unit 3, Unit 5.
- **Verifiable Outcome:** A registered user can apply to list a café, and a super admin user can view the application details and click "Approve" to activate it.

### Unit 7: Backend Table CRUD & Operating Hours API
- **System Boundary:** Backend (`server/`)
- **What it builds:**
  - Route endpoints: `POST /api/cafes/:id/tables` (add table), `GET /api/cafes/:id/tables` (list all tables), `PATCH /api/cafes/:id/tables/:tableId` (edit/deactivate table), `DELETE /api/cafes/:id/tables/:tableId` (remove table).
  - Operating hours setup endpoint: `PATCH /api/cafes/:id/hours`.
  - Scopes table modifications by extracting the owner's `cafe_id` from their identity token (enforcing multi-tenancy isolation).
- **Dependencies:** Unit 5.
- **Verifiable Outcome:** Requesting table CRUD operations with appropriate auth tokens successfully adds, updates, or deactivates table details for that specific café only.

### Unit 8: Frontend Café Owner Dashboard Configuration
- **System Boundary:** Frontend (`client/`)
- **What it builds:**
  - Dashboard panels for Café Owners: "Profile Editor", "Table Manager" (CRUD list), and "Operating Hours Planner".
- **Dependencies:** Unit 6, Unit 7.
- **Verifiable Outcome:** Café owners can log in and view their personal workspace to add/remove tables and modify operating hours.

---

## Phase 3 — Booking Engine

### Unit 9: Database Booking Model
- **System Boundary:** Database / ORM (`prisma/`)
- **What it builds:**
  - Adds `Booking` model to `prisma/schema.prisma` (`status` enum, `hold_expires_at` timestamp).
  - Executes database migration.
- **Dependencies:** Unit 4.
- **Verifiable Outcome:** Database schema updated and prepared to hold reservation metadata.

### Unit 10: Backend 5-Minute Booking Hold & Confirmation API
- **System Boundary:** Backend (`server/`)
- **What it builds:**
  - Booking Hold Endpoint: `POST /api/bookings` (places a 5-minute hold with status `held` and `hold_expires_at = now() + 5 minutes`).
  - Uses a Prisma Transaction containing a raw PostgreSQL `SELECT ... FOR UPDATE` row-lock to check overlapping slots and block double booking attempts.
  - Confirmation Endpoint: `POST /api/bookings/:id/confirm` (transitions status to `confirmed`).
- **Dependencies:** Unit 7, Unit 9.
- **Verifiable Outcome:** Attempting to place a hold on an already held/confirmed slot returns a `409 Conflict`. Proceeding to the confirm endpoint marks the reservation as booked.

### Unit 11: Backend Hold Expiry Cron Job
- **System Boundary:** Backend (`server/`)
- **What it builds:**
  - Background task module `server/src/jobs/expireHolds.job.js` utilizing `node-cron`.
  - Runs every 30 seconds to fetch all `held` bookings where `hold_expires_at < NOW()`, set their status to `cancelled`, and release the slots.
- **Dependencies:** Unit 10.
- **Verifiable Outcome:** Running the server and creating a hold without confirming it results in the hold record transitioning to `cancelled` automatically after 5 minutes has elapsed.

### Unit 12: Backend Booking History & Cancellation API
- **System Boundary:** Backend (`server/`)
- **What it builds:**
  - Endpoints: `GET /api/bookings/my` (customer's list of reservations) and `PATCH /api/bookings/:id/cancel`.
  - Enforces the 20-minute cancellation rule (fails with `403` if start time is less than 20 minutes away).
- **Dependencies:** Unit 10.
- **Verifiable Outcome:** Customers can retrieve their reservation list. Attempting to cancel a booking within 20 minutes of its start returns a clear validation error.

### Unit 13: Frontend Table Availability & Booking Hold UI
- **System Boundary:** Frontend (`client/`)
- **What it builds:**
  - Café Profile page table grid displaying available intervals.
  - "Book Table" action placing the API hold.
  - Checkout drawer displaying booking details, a 5-minute countdown timer, and a final "Confirm Booking" action button.
- **Dependencies:** Unit 8, Unit 10.
- **Verifiable Outcome:** Selecting a table on the café page reserves the table, starts a 5-minute timer, and transitions to a confirmed reservation screen upon user submission.

### Unit 14: Frontend Booking History & Cancellation UI
- **System Boundary:** Frontend (`client/`)
- **What it builds:**
  - `/my-bookings` portal showing active and past reservations categorized by status.
  - Cancel reservation action with a dialog checking time thresholds and displaying error notifications.
- **Dependencies:** Unit 12, Unit 13.
- **Verifiable Outcome:** Customers can view all their active holds and reservations, and successfully trigger cancellations from their dashboard.

---

## Phase 4 — Café Discovery

### Unit 15: Backend Café Search & Filtering API
- **System Boundary:** Backend (`server/`)
- **What it builds:**
  - Endpoint: `GET /api/cafes` with pagination parameters.
  - Supports filters: `city`, `area`, `date`, `time`, `party_size` (only returns cafés with tables matching capacity and operating status).
  - Filters out unapproved/suspended cafés (status must equal `approved`).
  - Sorts results by geolocation distance (nearest first) when coordinates are passed.
- **Dependencies:** Unit 10.
- **Verifiable Outcome:** Calling the discovery API with filters returns a paginated list of approved cafés matching the criteria.

### Unit 16: Frontend Café Search & Discovery Homepage
- **System Boundary:** Frontend (`client/`)
- **What it builds:**
  - Discovery marketplace homepage with search bars, filters (city selection, party size, date/time), and sort parameters.
  - Browser geolocation API lookup with fallback manual city text-input if permission is rejected.
- **Dependencies:** Unit 14, Unit 15.
- **Verifiable Outcome:** Customers can search and filter cafés from the landing page and see closest approved cafés dynamically loaded.

---

## Phase 5 — Real-time & Polish

### Unit 17: Database Reviews Schema & Constraints
- **System Boundary:** Database / ORM (`prisma/`)
- **What it builds:**
  - Adds `Review` model to `prisma/schema.prisma`.
  - Configures unique compound index `@@unique([customer_id, booking_id])`.
  - Runs database migration.
- **Dependencies:** Unit 9.
- **Verifiable Outcome:** Database schema prepared to receive reviews without allowing duplicates.

### Unit 18: Backend Reviews API
- **System Boundary:** Backend (`server/`)
- **What it builds:**
  - Route endpoints: `POST /api/reviews` (requires authorization, booking status `completed`, and enforces unique user-booking constraint) and `GET /api/reviews/cafe/:id` (retrieving reviews for a café with pagination).
- **Dependencies:** Unit 12, Unit 17.
- **Verifiable Outcome:** Posting a review on a completed booking succeeds, while posting a duplicate review or review for a pending booking fails with a structured error.

### Unit 19: Backend Staff Management API & Owner Booking Views
- **System Boundary:** Backend (`server/`)
- **What it builds:**
  - Endpoints: `POST /api/cafes/:id/staff` (owner registers a staff user account), `DELETE /api/cafes/:id/staff/:staffId` (removes staff), and `GET /api/cafes/:id/bookings` (retrieves reservations list scoped to the owner/staff café).
- **Dependencies:** Unit 5, Unit 10.
- **Verifiable Outcome:** Café owners can manage staff logins. Café Admin and Café Staff accounts can retrieve booking logs scoped strictly to their café.

### Unit 20: Backend Socket.io Real-time Dispatcher
- **System Boundary:** Backend (`server/`)
- **What it builds:**
  - Configures Socket.io server layer integrated into Express.
  - Socket listeners handling connection, disconnection, and room mapping (`cafe:{cafe_id}`).
  - Exported socket emitter utility functions to dispatch events: `table:held` (on booking hold), `table:confirmed` (on confirmation), and `table:available` (on cancellation or cron-job release).
- **Dependencies:** Unit 10, Unit 11.
- **Verifiable Outcome:** Server accepts WebSocket connections and successfully broadcasts table status changes to specific café rooms.

### Unit 21: Frontend Real-time Availability Hook
- **System Boundary:** Frontend (`client/`)
- **What it builds:**
  - Socket client configuration and custom react state hook (`useSocket`).
  - Wire listener events (`table:held`, `table:confirmed`, `table:available`) to the café profile available-tables list state.
- **Dependencies:** Unit 13, Unit 20.
- **Verifiable Outcome:** Holding a table in window A causes window B (viewing the same café) to immediately show the table's state change without a manual refresh.

### Unit 22: Frontend Complete Integration (Reviews, Staff & Role Polish)
- **System Boundary:** Frontend (`client/`)
- **What it builds:**
  - Reviews layout list on Café Profile and a "Write a Review" form visible on completed customer bookings in `/my-bookings`.
  - Café Staff CRUD list in Café Owner dashboard.
  - Scoped dashboard panels limiting Café Staff accounts to booking views (no access to settings or CRUD).
- **Dependencies:** Unit 14, Unit 18, Unit 19, Unit 21.
- **Verifiable Outcome:** All roles can navigate, review, manage staff permissions, and submit ratings smoothly.
