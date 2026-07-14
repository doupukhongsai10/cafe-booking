# Café Booking & Management Platform — Project Overview

---

## Overview

This is a multi-tenant web platform where customers can discover local cafés, check real-time table availability, and make seat reservations for a specific date, time, and party size — while café owners independently manage their café profile, tables, operating hours, and bookings through a dedicated dashboard. The platform operates as a marketplace: café owners register and submit their café for Super Admin approval before going live, and customers self-register to start browsing and booking. All bookings are auto-confirmed with a 5-minute hold window to prevent double bookings, and customers can cancel up to 20 minutes before their scheduled time.

---

## Goals

1. Allow customers to discover cafés by location, rating, and time-slot availability without needing to call or visit in person.
2. Allow café owners to list their café, define their tables and operating hours, and manage reservations from a single dashboard.
3. Prevent double bookings through a 5-minute table hold mechanism backed by database-level row locking.
4. Push real-time table availability updates to all users viewing a café page simultaneously using WebSockets.
5. Enforce a multi-tenant data model so that café admins can only access and manage their own café's data.
6. Provide a Super Admin who can review, approve, or reject café registrations before a café goes live on the platform.
7. Implement a complete role-based access control system covering four distinct user roles with separate permissions.
8. Deliver a fully functional MVP that can be deployed and used by real cafés and real customers.

---

## Core User Flow (Start to Finish)

### Customer

1. Customer visits the platform and clicks **Sign Up**.
2. Customer enters their name, email, and password and submits the registration form.
3. Account is created instantly and the customer is logged in.
4. Customer is taken to the café discovery page, which shows a list of cafés sorted by proximity (nearest first), then rating.
5. Customer applies filters: city/area, date, time, and party size.
6. Customer selects a café from the results and views its profile page (photos, description, location, operating hours, reviews).
7. Customer views the list of available tables for their chosen date and time (e.g., "Table for 2 — Window seat — Available 3pm–5pm").
8. Customer selects a table and clicks **Book This Table**.
9. The system immediately places a **5-minute hold** on the table — no other customer can book it during this window.
10. Customer reviews their booking summary (café, table, date, time, party size) and clicks **Confirm Booking**.
11. Booking status changes from `held` → `confirmed`. The customer sees a confirmation screen with their booking details.
12. Customer can view all their bookings under **My Bookings**.
13. If the customer wants to cancel, they click **Cancel Booking** — this is only allowed up to **20 minutes before** the start time.
14. After the booking is marked `completed`, the customer can leave a **1–5 star review with a comment** for the café.

### Café Owner

1. Café owner visits the platform and clicks **Register Your Café**.
2. Owner creates a personal account (email + password), then fills in the café profile: name, description, city, area, GPS coordinates, cover photo, additional photos, and operating hours per day.
3. Owner defines their tables: table name, seating capacity, zone (indoor / outdoor / rooftop / private), and a short description.
4. Owner submits the café profile for review.
5. Café status is set to `pending`. The owner waits for Super Admin approval.
6. Super Admin reviews the submission and either **approves** or **rejects** it with a reason.
7. If approved, the café status changes to `approved` and it appears on the platform immediately.
8. Owner can log in to their dashboard to view upcoming and past bookings, update their café profile, add or deactivate tables, and manage staff accounts.
9. Owner can create **Café Staff** accounts (email + password) which are granted read-only access to the bookings dashboard.

### Super Admin

1. Super Admin logs in with a hardcoded email + password account.
2. Super Admin views the **Pending Registrations** list.
3. Super Admin reviews each café submission and either approves it or rejects it with a written reason.
4. Super Admin can suspend or remove a café from the platform at any time.
5. Super Admin can monitor all registered cafés, users, and active bookings across the platform.

---

## Features

### Authentication
- Email + password registration for customers and café owners
- Email + password login for all user types, returning a JWT (7-day expiry)
- Logout (token invalidation via server-side blacklist)
- Password hashing with bcrypt (12 salt rounds)
- Role-based middleware that gates every protected route by user role

### Café Discovery (Customer-Facing)
- Browse all approved cafés with a paginated list view
- Filter cafés by: city, area, date, available time slot, and party size
- Sort results by: nearest location first, then average rating
- Geolocation detection with manual city/area fallback if location is denied
- Individual café profile page with photos, description, hours, and reviews

### Table & Availability
- Real-time table availability list per café (date + time filtered)
- 5-minute booking hold on selected table using `SELECT FOR UPDATE` row-level locking
- Background cron job (runs every 30 seconds) that expires stale holds
- Live availability updates pushed to all active viewers via Socket.io

### Booking Engine
- Create a booking (places 5-minute hold immediately)
- Auto-confirm booking on customer confirmation
- Customer cancellation (allowed up to 20 minutes before start time)
- Booking statuses: `held` → `confirmed` → `completed` / `cancelled` / `no_show`
- Customer booking history page (`/my-bookings`)

### Reviews
- Customers can submit a 1–5 star rating and written comment
- Review is only allowed after the booking status is `completed`
- One review per booking (enforced by unique constraint on `customer_id + booking_id`)
- Reviews displayed on the café profile page with average rating

### Café Management Dashboard (Café Admin)
- Edit café profile: name, description, photos, operating hours, location
- Add, edit, and deactivate tables (name, capacity, zone, description)
- View all upcoming and past bookings for their café
- Create and remove Café Staff accounts

### Staff Dashboard (Café Staff)
- Read-only view of the café's upcoming and past bookings
- No access to settings, tables, or profile management

### Super Admin Panel
- View all pending café registration submissions
- Approve a café (sets status to `approved`, makes it live)
- Reject a café with a written reason
- Suspend or remove any café from the platform
- View all registered cafés, users, and bookings platform-wide

### Platform & Infrastructure
- Multi-tenant data isolation: all queries scoped by `cafe_id` from the authenticated user's JWT
- Input validation on all API endpoints (using zod or express-validator)
- Consistent API error response format: `{ error: string, code: string }`
- Rate limiting on booking and auth endpoints to prevent abuse
- Image hosting via Cloudinary (café cover photo + gallery)
- Pagination on all list endpoints (cafés, bookings, reviews)

---

## In Scope

- Email + password authentication for all four user roles
- Customer self-registration and café owner self-registration
- Super Admin approval workflow for new café registrations
- Café profile management (name, description, location, photos, operating hours)
- Table management (add, edit, deactivate) with zone and capacity metadata
- Café discovery with filters: location, rating, date, time, party size
- Geolocation-based sorting with manual city/area fallback
- Table availability querying based on date, time, and party size
- 5-minute booking hold with database-level row locking
- Background job to expire stale holds (cron every 30 seconds)
- Booking auto-confirmation, cancellation (up to 20 minutes before)
- Booking status tracking: `held`, `confirmed`, `completed`, `cancelled`, `no_show`
- Real-time table availability updates via Socket.io
- Customer booking history
- Post-booking review system (rating + comment, after completed booking only)
- Café Staff accounts with read-only booking access
- Role-based access control enforced server-side on every route
- Multi-tenant data isolation per café
- Super Admin platform oversight (cafés, users, bookings)
- Image uploads via Cloudinary
- Deployed frontend (Vercel) + backend + database (Railway)

---

## Out of Scope

- Payment processing or booking deposits
- Pre-ordering food or drinks with a booking
- Event or private function bookings
- Takeaway or delivery ordering
- Native mobile app (iOS or Android)
- Visual/drag-and-drop floor map editor
- Analytics dashboard or business reporting for café owners
- Email marketing or promotional campaigns
- Social login (Google, Facebook, etc.)
- SMS notifications
- Refresh token rotation (deferred to Phase 2)
- Visual floor plan for customers selecting specific seats
- Multi-location support per café owner (one café per admin account in MVP)
- Third-party reservation integrations (e.g., Google Reserve)

---

## Success Criteria

The MVP is considered done when all of the following are true:

1. **Authentication works end-to-end:** A new customer can register, log in, and log out. A café owner can register, await approval, and log in after approval. The Super Admin can log in with the hardcoded credentials.

2. **Café onboarding is functional:** A café owner can fill in their café profile (with photos uploaded to Cloudinary), define tables, and submit for review. The Super Admin can approve or reject it. An approved café appears on the discovery page.

3. **Booking flow works without double bookings:** Two customers attempting to book the same table at the same time will result in exactly one confirmed booking. The 5-minute hold is enforced at the database level and expired holds are cleaned up automatically by the cron job.

4. **Real-time availability is live:** When a table is held or confirmed, all other users viewing the same café page see the table's availability update within 1–2 seconds without a page refresh.

5. **Cancellation enforcement is correct:** A customer can cancel a booking more than 20 minutes before the start time. An attempt to cancel within 20 minutes of the start time returns a clear error and does not cancel the booking.

6. **Reviews are gated correctly:** A customer cannot submit a review until their booking status is `completed`. A customer cannot submit more than one review per booking.

7. **Role-based access is enforced server-side:** A Café Staff account cannot access any route that modifies café settings or tables. A Café Admin cannot access another café's data. A Customer cannot access any admin route. All of these restrictions are verified at the API level, not just the UI level.

8. **The platform is deployed and publicly accessible:** The frontend is live on Vercel and the backend + database is live on Railway. Any user with an internet connection can register, browse cafés, and make a booking without running anything locally.
