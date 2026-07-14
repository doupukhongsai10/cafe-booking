# AI Workflow Rules — Café Booking & Management Platform

These are binding rules for any AI coding agent working on this codebase.
They are not suggestions. Follow them exactly, in the order they apply.

---

## 1. Overall Approach

**Build spec-first, code second.**

1. Before writing any code, read the relevant spec documents in `context/`:
   - `plan1.md` — system design and data model
   - `project-overview.md` — goals, scope, and success criteria
   - `architecture.md` — stack decisions, folder boundaries, invariants

2. Identify which unit of work you are implementing. A unit is one of the following:
   - A single API route and its controller + service
   - A single database model or migration
   - A single React page or component
   - A single middleware function
   - A single background job or Socket.io event handler

3. Implement only that unit. Stop when it is done.

4. Do not proceed to the next unit until verification is complete (see Section 7).

---

## 2. Scoping Rules

**Do exactly what is asked. Nothing more.**

- Do not add fields, columns, routes, or components that were not requested in the current task.
- Do not refactor code outside the files touched by the current unit.
- Do not rename, reorganise, or restructure existing files unless the task explicitly asks for it.
- Do not add "nice to have" features — not even small ones — without explicit instruction.
- Do not change environment variable names, config keys, or file paths that are already established and working.
- If a task says "add a route", add that route only. Do not also add logging, caching, or helper utilities unless they are required to make the route function.

**One file change must serve one purpose.** If you find yourself editing a file for a reason unrelated to the current task, stop. That change belongs to a separate task.

---

## 3. Build Order

**Follow the phased build order. Do not skip phases.**

Implement features in this sequence and do not begin a later phase until the earlier phase passes verification:

| Phase | Units |
|---|---|
| **Phase 1 — Foundation** | Prisma schema → Auth routes (register, login, logout) → JWT middleware → Role guard middleware |
| **Phase 2 — Café Management** | Café registration → Super Admin approval flow → Table CRUD → Operating hours |
| **Phase 3 — Booking Engine** | Availability query → 5-minute hold (with `SELECT FOR UPDATE`) → Booking confirmation → Cancellation (20-min enforcement) → Hold expiry cron job |
| **Phase 4 — Discovery** | Café search with filters → Geolocation sort → City/area fallback |
| **Phase 5 — Real-time & Polish** | Socket.io setup → Table availability events → Reviews system → Staff account management |

If you are asked to work on a Phase 3 feature and Phase 1 is not yet verified as complete, stop and say so. Do not proceed out of order.

---

## 4. When to Split Work Into Smaller Steps

Split a task into smaller steps when any of the following is true:

- The task touches more than **3 files** at once.
- The task requires both a **schema migration** and **application code** change — do the migration first, verify it, then write the application code.
- The task involves both **backend and frontend changes** — implement and verify the backend API first, then implement the frontend.
- The task implements a feature with a **race condition risk** (e.g., the booking hold) — implement the locking mechanism first as a standalone unit and verify it before wiring it to the route.
- You are unsure whether a step will break existing functionality — split it so each step is independently reversible.

When splitting, state the sub-steps explicitly before starting any of them. Do not start step 2 before step 1 is verified.

---

## 5. Handling Missing or Ambiguous Requirements

**Do not invent requirements. Do not make assumptions silently.**

When a requirement is missing or ambiguous, follow this decision tree in order:

1. **Check the spec files.** Read `plan1.md`, `project-overview.md`, and `architecture.md` before concluding something is undefined.
2. **If it is in the open questions section of `plan1.md`** — stop. Surface the question to the developer and do not write code until it is answered. Quote the open question exactly.
3. **If it is not addressed anywhere in the spec** — stop. State what the ambiguity is, propose exactly two concrete options with their trade-offs, and ask the developer to choose. Do not default to option A silently.
4. **If it is a minor technical detail** (e.g., which HTTP status code to use for a specific error, or what to name a local variable) — make the decision yourself using the conventions established in `architecture.md`, document your choice in a code comment, and proceed.

**Never produce code that silently implements a behaviour the developer has not agreed to.** If you are unsure whether a design choice is in scope, it is not in scope.

---

## 6. Files That Must Not Be Modified Without Explicit Instruction

Do not touch the following files unless the developer explicitly tells you to:

| File / Pattern | Reason |
|---|---|
| `prisma/migrations/*` | Migration files are auto-generated by Prisma. Never hand-edit them. Run `prisma migrate dev` instead. |
| `prisma/schema.prisma` | Only modify when a schema change is part of the current task. Do not add models, fields, or relations speculatively. |
| `contex/*.md` | Documentation files. Only update them as part of a documentation sync task (see Section 8). |
| `.env` / `.env.example` | Only add new environment variables if the current task requires them. Document every new variable in `.env.example` with a comment. |
| Any file in `node_modules/` | Never. |
| Any file in `client/src/components/ui/` (if a component library is scaffolded) | These are generated library components. Modify the consumer code instead. |
| `package.json` / `package-lock.json` | Only add a new dependency if the current task cannot be completed without it. Do not upgrade existing dependencies as a side effect. |
| `vite.config.js` / `tsconfig.json` | Only modify if the current task explicitly requires a config change. |

If you believe a file in this list needs to change, stop and ask the developer first.

---

## 7. Verification Checklist

**Do not move to the next unit until every applicable item below is confirmed.**

Run through this checklist after completing each unit. Mark each item explicitly as ✅ PASS or ❌ FAIL with a note.

### Backend Unit (route / controller / service)
- [ ] The route is registered in the correct router file and at the correct path
- [ ] The route is protected by `authMiddleware` if it requires authentication
- [ ] The route is protected by `requireRole()` if it is role-restricted
- [ ] The request body / params are validated by a Zod schema before the controller runs
- [ ] The service contains all business logic — no DB queries in the controller
- [ ] All Prisma queries are scoped by `cafe_id` or `user_id` where required by architecture invariants
- [ ] The response uses the project's standard error format `{ error: string, code: string }` for all failure paths
- [ ] No `password_hash` field is included in any response object
- [ ] The happy path works with a manual test (curl or Postman)
- [ ] At least two failure paths return the correct HTTP status code and error code

### Database / Prisma Unit (schema change or migration)
- [ ] `prisma migrate dev` runs without errors
- [ ] The generated migration SQL is reviewed and matches the intended change
- [ ] No existing migration files were modified
- [ ] All new foreign keys have a corresponding `@relation` defined in `schema.prisma`
- [ ] Unique constraints are present where the architecture or invariants require them

### Frontend Unit (page or component)
- [ ] The component only calls backend APIs through `client/src/services/` — no inline `fetch` or `axios`
- [ ] The component handles the loading state, error state, and empty state explicitly
- [ ] No hardcoded API base URLs — all requests use the environment variable `VITE_API_URL`
- [ ] The page renders correctly when the user is not authenticated and redirects if required
- [ ] Role-restricted UI elements are hidden for users without the required role

### Background Job Unit
- [ ] The job is registered exactly once at server startup
- [ ] The job logs how many records it processed on each run
- [ ] The job failing or throwing does not crash the Express server
- [ ] After the job runs, a Socket.io event is emitted for each affected table

### After Every Unit — Documentation Sync (see Section 8)
- [ ] If a new route was added, it is reflected in the API structure section of `plan1.md`
- [ ] If a schema field was added or changed, the data model section of `plan1.md` is updated
- [ ] If a new invariant was discovered or enforced, it is added to `architecture.md`

---

## 8. Keeping Documentation in Sync

**Code and documentation must never contradict each other.**

- When you add or change an API route, update the API structure section in `plan1.md` in the same task — not later.
- When you add a column or model to the Prisma schema, update the data model section in `plan1.md` in the same task.
- When you enforce a rule in service code that is not yet listed as an invariant in `architecture.md`, add it as a new invariant with a code reference.
- When you decide something that was listed as an open question in `plan1.md`, mark it as resolved with the decision and the date.
- Do not create new documentation files without instruction. Update the existing files in `contex/`.

**The documentation is the spec. If the code deviates from the spec, the spec wins — fix the code, then update the spec to reflect any intentional deviation.**

---

## 9. Code Style Rules

Follow these conventions consistently. Do not introduce new patterns.

- **Naming:** `camelCase` for variables and functions, `PascalCase` for React components and classes, `SCREAMING_SNAKE_CASE` for constants and environment variable names.
- **Async:** Always use `async/await`. Do not use `.then()` chains.
- **Error handling:** Wrap all `async` route handlers in a `tryCatch` wrapper or use an Express async error middleware. Do not let unhandled promise rejections reach the process.
- **Magic numbers:** Never use a raw number inline for business logic values. Extract them as named constants at the top of the file.
  ```js
  // Wrong
  if (minutesUntilBooking < 20) { ... }

  // Correct
  const CANCELLATION_WINDOW_MINUTES = 20;
  if (minutesUntilBooking < CANCELLATION_WINDOW_MINUTES) { ... }
  ```
- **Comments:** Only write a comment if the code does not make the intent obvious. Explain *why*, not *what*.
- **Secrets:** Never hardcode API keys, database URLs, or JWT secrets. Always read from `process.env`. Crash at startup if a required environment variable is missing.

---

## 10. What to Do When You Are Stuck

If you cannot complete a unit cleanly, take these steps in order:

1. **Re-read the spec.** The answer is usually in `architecture.md` or `plan1.md`.
2. **Reduce scope.** Strip the unit back to the smallest thing that can be verified as working, then ask what to add next.
3. **Surface the blocker explicitly.** State: what you are trying to do, what you expected, what is actually happening, and what the two most likely causes are.
4. **Do not silently work around a problem** by skipping a constraint (e.g., removing the `SELECT FOR UPDATE` because it is causing a test issue). State the problem and wait for instruction.
5. **Do not ask more than one question at a time.** Identify the single most important blocker and ask about that.
