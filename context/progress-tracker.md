# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 3 — Booking Engine

## Current Goal

- Unit 16: Final polish — notifications, edge case hardening, and production readiness.

## Completed

- [x] Initial System Design definition (`context/plan1.md`)
- [x] Project Overview & Scope Alignment (`context/project-overview.md`)
- [x] System Architecture & Multi-Tenant Design (`context/architecture.md`)
- [x] UI Design Token Reference System (`context/ui-context.md`)
- [x] Coding Standards & Boundary Rules (`context/code-standards.md`)
- [x] AI Development Workflow Rules (`context/ai-workflow-rules.md`)
- [x] Build Units Roadmap (`context/specs/build-units.md`)
- [x] Unit 1: Database Schema Initialization (Prisma schema + migration `init_users_and_token_blacklist` applied to Neon — `users` and `token_blacklist` live)
- [x] Unit 2: Backend Authentication API & JWT Middleware (endpoints, token blacklist, validation, role gates completed and verified)
- [x] Unit 3: Frontend Shell, Auth Context & Auth UI (Vite dev server client and routing configured and tested)
- [x] Unit 4: Database Café, Tables, & Staff Models (Prisma schema models added and migration `20260715100609_add_cafe_tables_staff` successfully applied to Neon)
- [x] Unit 5: Backend Café Registration & Super Admin API (endpoints implemented, role-gating verified, approve/reject changed to PATCH methods, and verified using test script)
- [x] Unit 6: Frontend Café Onboarding & Admin Panel UI (onboarding form, super admin dashboard page, and status routes verified)
- [x] Unit 7: Backend Table CRUD & Operating Hours API (endpoints for table management and hours implemented, and tenancy controls verified)
- [x] Unit 8: Frontend Café Owner Dashboard Configuration (table CRUD management, operating hours planner, and profile settings panels configured and verified)
- [x] Unit 9: Database Booking Model (added Booking model and BookingStatus enum to Prisma schema, successfully migrated database and regenerated Prisma Client)
- [x] Unit 10: Backend 5-Minute Booking Hold & Confirmation API (endpoints for placing holds and confirming reservations implemented, with database-level row locking verified)
- [x] Unit 11: Backend Hold Expiry Cron Job (background cron job created using node-cron to clear stale holds every 30 seconds, successfully verified)
- [x] Unit 12: Backend Booking History & Cancellation API (endpoints for fetching customer booking history and cancelling holds/bookings with a 20-minute safety margin implemented and verified)
- [x] Unit 13: Frontend Customer Booking History & Cancellation (customer home page now shows reservation history with cancel controls and live 20-min window checks)
- [x] Unit 14: Frontend Café Discovery & Booking Flow (public café listing with search, café detail page with table picker, 5-minute hold placement, live countdown, and confirmation flow)
- [x] Unit 15: Café Owner Bookings Dashboard (Reservations tab added to café dashboard; owners can view all bookings and mark CONFIRMED bookings as COMPLETED or NO_SHOW)
- [x] Unit 16: Final polish — notifications, edge case hardening, and production readiness (introduced ToastProvider overlay, converted alert/confirm popups to toast notifications, added same-day booking validations)
- [x] Unit 17/18: Reviews System (ratings and comments database schema, migration, backend review endpoints, customer write review modals, and café profile reviews list integrated)
- [x] Unit 19/22: Staff Management (owners registering staff accounts, staff dashboard role security gating, and read-only reservation views complete)
- [x] Unit 20/21: Socket.io Real-time Updates (Socket.io server bootstrapping, room-joining mapping, booking holds/expiries/confirmations real-time emitters, custom react useSocket client hook, and live availability list tracking on CafeDetailPage integrated)
- [x] Public landing page (designed according to mockup spec in context/DESIGN.md, styled with project-integrated TailwindCSS, and mapped to root route '/')

## In Progress

- None (All scoped roadmap units are completed!).

## Next Up

- None (All Phase 5 units successfully implemented!).

## Open Questions

- None at present. All core goals have been scoped and baseline requirements documented.

## Architecture Decisions

- PostgreSQL for relational consistency and row-level locking during booking holds.
- JWT stateless authentication with a PostgreSQL-backed blacklist for MVP logout enforcement.
- Layered Express boundaries (Routes → Controllers → Services → Prisma).
- Fluid-Fixed UI spacing based on an 8px grid with a Cream/Espresso brand theme.

## Session Notes

- The build plan contains 22 specific units mapped out in order.
- Unit 1 verified: Neon Postgres connected; migration `20260714111328_init_users_and_token_blacklist` applied successfully.
- Unit 2 corrected: public registration is limited to customers and café admins; validation, protected-route errors, and persisted token invalidation are verified locally.
