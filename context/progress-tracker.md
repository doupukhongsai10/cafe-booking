# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 2 — Café Onboarding & Management

## Current Goal

- Unit 8: Frontend Café Owner Dashboard Configuration.

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

## In Progress

- None (ready to start Unit 8).

## Next Up

- Unit 8: Frontend Café Owner Dashboard Configuration.

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
