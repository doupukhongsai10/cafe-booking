# Code Standards — Café Booking & Management Platform

These standards apply to every file in this codebase. They are not optional.
When in doubt, refer to `architecture.md` for system-level decisions and `ui-context.md` for design tokens.

---

## General

- Keep every module, component, and function **single-purpose**. If you cannot describe what a file does in one sentence without using "and", split it.
- Fix root causes. Do not wrap a broken behaviour in a conditional, add a retry, or suppress an error message. Find why it is broken and fix that.
- Do not mix unrelated concerns in a single file. A route file handles routing. A service file handles business logic. A component renders UI. None of these cross into each other's territory.
- Delete code that is no longer used. Do not comment it out. Version control is the history — the codebase is the present.
- Write for the next reader, not for the runtime. Name things accurately. Prefer clarity over brevity.
- No magic numbers inline. Extract every business-logic constant to a named constant at the top of its file, or to a shared `constants.js` if it is used in more than one place.
- Never silence an error to make a test or build pass. Fix the error.
- Every feature lives in one place. Do not duplicate logic across files — extract it and import it.

---

## JavaScript

- Use `const` by default. Use `let` only when reassignment is genuinely needed. Never use `var`.
- Use `async/await` exclusively. Do not write `.then()` / `.catch()` chains. This applies to every async operation in both frontend and backend code.
- Wrap every `async` route handler and async function that runs at the boundary in a `try/catch`. Unhandled promise rejections are not acceptable.
- Use **Zod** for all runtime input validation. Do not write manual `if (!req.body.x)` checks — define a Zod schema and parse the input once.
- Avoid deeply nested conditionals. If a function has more than two levels of nesting, extract a helper or restructure with early returns.
- Use destructuring for function arguments when the object has more than two relevant fields.
- Use template literals for string construction. Do not concatenate strings with `+`.
- Name booleans as positive assertions: `isAvailable`, `hasBooking`, `isActive`. Never `notAvailable`, `noBooking`, `inactive`.
- Named exports only. Do not use default exports in backend files. Default exports are acceptable for React page components only.
- Never use `console.log` in production code paths. Use a structured logger for backend, and remove all `console.*` calls from frontend before committing.

---

## React (Vite — Frontend)

- One component per file. The filename must match the component name exactly.
- Keep components focused. If a component has more than one significant responsibility (fetching data AND rendering a complex form AND managing multi-step state), split it.
- Put all HTTP calls inside `client/src/services/`. Components and hooks never call `axios` or `fetch` directly.
- Co-locate state with the component that needs it. Only lift state to a shared context or store when two or more sibling components need the same state.
- Use custom hooks (`useBooking`, `useAuth`, `useCafeAvailability`) to encapsulate fetch logic and derived state. Do not write data-fetching logic inline inside a component body.
- Every component that fetches data must handle three states explicitly: **loading**, **error**, and **empty**. An unhandled loading or error state is a bug.
- All Socket.io event listeners must be registered inside a `useEffect` and cleaned up in the effect's return function. A listener without a cleanup is a memory leak.
- Never hardcode any URL, API base path, or environment-specific value. Read from `import.meta.env.VITE_API_URL`. Throw a clear error at startup if the variable is missing.
- Use `React.memo` only when a component is measurably slow due to re-renders. Do not apply it preemptively.
- Avoid anonymous arrow functions as component definitions. Always name every component.

---

## Node.js + Express (Backend)

- One router file per resource. Each router is mounted at a single path prefix in `server.js`. Do not define routes inline in `server.js`.
- Every protected route must pass through `authMiddleware` before its controller runs. Every role-restricted route must also pass through `requireRole(...roles)`. These middlewares are never optional.
- Controllers do exactly two things: call a service function and return an HTTP response. No Prisma queries, no business logic, no conditional branching on domain rules inside a controller.
- All business logic lives in `services/`. Services are plain functions that take arguments and return values or throw structured errors. Services do not import `req` or `res`.
- All database access lives in `services/`. `prisma.*` is never called outside of a file in `server/src/services/`.
- Validate the request before anything else runs. The Zod schema `parse()` call is the first thing inside the controller body. If validation fails, return `400` immediately — do not pass invalid data to the service.
- Never read `cafe_id` or ownership-sensitive identifiers from `req.body` or `req.params` alone. Always resolve ownership server-side from `req.user.id` before any read or write operation.
- Use the shared `asyncHandler` wrapper (or equivalent) on every route handler so unhandled async errors flow into the global Express error handler automatically.
- The global error handler is the only place that formats and returns error responses. Controllers and services throw structured errors — they do not call `res.status().json()` for error cases.

---

## Styling

- Use CSS custom property tokens exclusively. Never write a hardcoded hex value, pixel value from outside the spacing scale, or font-size outside the type scale directly in a CSS rule. Every value must reference a token from `ui-context.md`.
  ```css
  /* Wrong */
  background-color: #3C2A21;
  border-radius: 20px;

  /* Correct */
  background-color: var(--primary);
  border-radius: var(--radius-xl);
  ```
- Follow the border-radius scale defined in `ui-context.md`. Buttons and inputs use `--radius-md` (8px). Cards and modals use `--radius-xl` (20px). Status chips use `--radius-full`. These are not negotiable.
- Follow the 8px spacing grid. Every margin, padding, and gap must be a multiple of 8px and must use a `--space-*` token. Do not introduce arbitrary pixel values.
- All shadow values come from the `--shadow-*` token scale in `ui-context.md`. Do not write `box-shadow` values inline.
- Glassmorphism surfaces (sticky nav, modals, dropdowns) must use `--bg-overlay` for background-color and `--bg-overlay-blur` for `backdrop-filter: blur()`. Do not redefine these values per component.
- All focus-visible states must use `--ring-focus` as the `outline` color. Do not remove `outline` without replacing it with a visible focus indicator.
- Typography classes must map to the `--type-*` tokens. Set `font-family`, `font-size`, `font-weight`, `line-height`, and `letter-spacing` from the token — not from arbitrary values.
- Dark mode styles are scoped under a `[data-theme="dark"]` attribute on the root element. Do not use the `prefers-color-scheme` media query as the sole mechanism — allow user preference to override system preference.
- Do not use inline styles for anything other than dynamically computed values (e.g., progress bar width as a percentage). Static visual styles belong in CSS.

---

## API Routes

- Validate and parse all request input (body, params, query) with a Zod schema at the top of the controller, before any other logic runs. A failed parse returns `400 Bad Request` with the validation error message.
- Enforce authentication before any route logic runs. Enforce ownership before any mutation. These two checks are never skipped, never deferred to inside the service.
- Return a consistent response shape for every endpoint:
  - **Success:** `{ data: <payload> }` for single resources, `{ data: [], meta: { total, page, limit } }` for lists.
  - **Error:** `{ error: "<human readable message>", code: "<SCREAMING_SNAKE_CASE_CODE>" }`.
  - Never return a raw Prisma error, stack trace, or internal model field to the client.
- Always return the correct HTTP status code:
  - `200` — successful GET, PATCH, DELETE
  - `201` — successful POST (resource created)
  - `400` — validation failure, malformed request
  - `401` — unauthenticated (missing or invalid JWT)
  - `403` — authenticated but not authorised (wrong role or wrong ownership)
  - `404` — resource not found
  - `409` — conflict (duplicate booking, duplicate review)
  - `500` — unhandled server error (should trigger an alert)
- Apply `express-rate-limit` to auth routes (`/api/auth/*`) and the booking creation route (`POST /api/bookings`). These are the two highest-risk surfaces for abuse.
- Paginate every list endpoint. No list endpoint may return an unbounded result set. Default page size is 20. Maximum page size is 100.
- Never log request bodies for auth routes. The logger must explicitly exclude `/api/auth/register` and `/api/auth/login` from body logging.

---

## Data and Storage

- Structured, relational data belongs in PostgreSQL. If a piece of data has relationships, needs to be queried, filtered, or joined — it goes in the database.
- Binary file data (images, uploads) belongs in Cloudinary. Never store image binary data as a database column. Store only the Cloudinary `secure_url` returned after upload.
- Never store an entire request payload or a large text blob as a single database field. If a value will exceed 1KB on average, reconsider the data model.
- All Prisma queries that write data in a multi-step operation must be wrapped in a `prisma.$transaction()`. Never perform two dependent writes outside a transaction — the second write failing after the first succeeds creates corrupted state.
- The booking hold must be created inside a `prisma.$transaction()` that includes a `SELECT ... FOR UPDATE` raw query to lock the relevant rows before inserting. This is not optional — it is the only way to prevent double bookings.
- Use `select` in every Prisma query to return only the fields the caller needs. Never return `password_hash`. Never return internal join fields that the API consumer does not use.
- Define `UNIQUE` constraints in `schema.prisma` for every rule that must be enforced at the database level. Application-level checks alone are not sufficient for uniqueness.
  - `reviews`: `UNIQUE(customer_id, booking_id)`
  - `token_blacklist`: `UNIQUE(jti)`
- All timestamps are stored in UTC. No timezone conversion happens at the service layer — conversion is the frontend's responsibility.
- Run migrations using `prisma migrate dev` in development and `prisma migrate deploy` in production. Never run raw SQL migrations by hand. Never edit a generated migration file.

---

## Security

- Hash every password with `bcrypt` at 12 salt rounds before writing to the database. The plaintext password is discarded immediately after hashing. It is never stored, logged, or returned.
- JWTs must include a `jti` (UUID) claim. On logout, insert the `jti` into the `token_blacklist` table. Every protected route must check the blacklist before accepting the token.
- Read all secrets (JWT secret, database URL, Cloudinary credentials) from `process.env`. If a required environment variable is missing at startup, throw an error and crash the process. A misconfigured server must not start silently.
- Never include `password_hash` or any token field in a Prisma `select` result that gets returned via the API. Use `select: { password_hash: false }` explicitly.
- Scope every multi-tenant query by `cafe_id` derived from the authenticated user's record — never from the request. A café admin must never be able to access another café's data by supplying a different `cafe_id` in the URL.
- Sanitise all user-supplied strings that are rendered in the UI. Do not use `dangerouslySetInnerHTML` with untrusted input.
- Cloudinary uploads go through the backend only. The frontend never talks to Cloudinary directly. The Cloudinary API secret is never exposed to the client.

---

## Real-Time (Socket.io)

- All Socket.io event emission happens through the `server/src/sockets/` module via exported emitter functions (e.g., `emitTableAvailable(cafeId, tableId)`). Services import and call these functions — they never access the `io` instance directly.
- Every client joining a café's real-time updates must join the room `cafe:{cafe_id}`. No client receives events for a café they are not currently viewing.
- The three canonical table events are `table:held`, `table:confirmed`, and `table:available`. Do not create new event names without adding them to the events table in `architecture.md`.
- Socket.io events are supplementary to the REST API. They update UI state for already-loaded data. They are never the source of truth. If a socket event is missed, a page refresh must always show correct state from the API.
- All Socket.io event listeners on the client must be registered inside `useEffect` and must return a cleanup function that calls `socket.off(eventName)`.

---

## File Organisation

- `server/src/routes/` — Express router files only. One file per resource. No business logic. No Prisma calls.
- `server/src/controllers/` — Request handlers only. Validates input, calls one service function, returns response. No DB access.
- `server/src/services/` — All business logic and all Prisma queries. This is the only layer that touches the database.
- `server/src/middleware/` — Reusable Express middleware only: `authMiddleware`, `requireRole`, `rateLimiter`, `errorHandler`, `asyncHandler`.
- `server/src/validators/` — Zod schemas only. One file per resource (e.g., `booking.validators.js`). No logic — only schema definitions.
- `server/src/jobs/` — node-cron job definitions only. One file per job. Jobs import and call service functions — they contain no business logic themselves.
- `server/src/sockets/` — Socket.io server setup and exported emitter functions. Nothing else.
- `server/src/lib/` — Singleton client instances only: Prisma client, Cloudinary client, logger. These are imported by services and middleware.
- `client/src/pages/` — Route-level React components only. One file per route. Composed of components, never contains raw markup or inline styles.
- `client/src/components/` — Reusable UI components. Each component lives in its own file. No API calls inside components — use hooks.
- `client/src/hooks/` — Custom React hooks only. Hooks encapsulate fetch logic, socket subscriptions, and derived state. No JSX.
- `client/src/services/` — All axios/fetch calls to the backend API. Exports async functions. No React imports. No business logic.
- `client/src/sockets/` — Socket.io client setup and event listener registration. Imported by hooks — not by components directly.
- `client/src/store/` — Global client state (React Context or Zustand). Auth state, current user, theme. Do not put server-derived data here — that belongs in hooks.
- `client/src/utils/` — Pure utility functions with no side effects. Date formatting, string helpers, number formatting.
- `prisma/` — `schema.prisma` and auto-generated `migrations/` only. No application code lives here.
- `contex/` — Project documentation only. Not deployed. Not imported by application code.
