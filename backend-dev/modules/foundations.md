# Foundations — config, bootstrap, resilience, testing

The supporting practices that make a layered backend reliable to run and safe to change. Apply these when scaffolding a new service; spot-check them on refactors.

## Validate config at boot — fail early

Environment/config is parsed and **typed once at startup** against a schema. If something essential is missing or malformed, the process **crashes immediately at boot** with a clear message — never deep inside a request handler in production.

```ts
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  STRIPE_KEY: z.string().optional(), // optional features stay optional
});
export const env = schema.parse(process.env); // throws at boot if invalid
export type Env = z.infer<typeof schema>;
```

The rest of the app imports the typed `env` object and never reads `process.env` directly.

## App factory vs. bootstrap — testability

Split "build the app" from "run the app":

- **`app.ts`** — a pure `createApp()` factory that wires middleware + routes and **returns** the app. No port binding, no DB connection.
- **`index.ts`** — the bootstrap: connect dependencies, then `createApp().listen(port)`.

Tests instantiate `createApp()` and fire requests at it in-memory (no real port, no real network), which is what makes HTTP-level tests fast and hermetic.

## Graceful degradation of optional dependencies

If a dependency is optional, the service should **still boot without it** and degrade rather than crash. Example: a server whose core compute works in memory can start with no database — persistence is simply skipped, and a `isDatabaseConnected()` check gates the save path. Required dependencies still fail fast; optional ones degrade.

## Tests that pin behavior

- **Edge/HTTP tests** against the `createApp()` factory — validation rejections, auth gates, status codes, the error envelope.
- **Integration tests** for the persistence path using an **in-memory or ephemeral datastore** (e.g. in-memory Mongo/SQLite, testcontainers) so the repository is exercised for real without external setup.
- **Verifiable anchors** — assert known-correct values and structural invariants, not just "no error thrown."
- **Pure helpers** (hashing, token signing, derivations) get focused unit tests since they're framework-free.

## Conventions

- **Consistent file naming** — pick one convention (e.g. `kebab-case`) and apply it everywhere, including one-module-per-domain-concept in `services/` and `repositories/`.
- **Name by intent** — `findByEmail`, `saveChart`, `addAuthProvider`; never `doQuery`/`handle`/`process`.
- **Name compound conditions** (suggestion, not mandatory) — when an `if` combines more than two clauses, move it into a variable whose name states the meaning (`const hasChangedValidatedPhone = isV2 && validatedAt && phone !== previousPhone; if (hasChangedValidatedPhone)`), so the reader gets the intent without decoding the clauses.
- **Match the existing codebase first** — these are defaults, not a mandate to restyle working code.

## Self-check (run before reporting)

```
[ ] Dependency rule holds: http → services → infra → datastore, one direction
[ ] Routers/controllers are thin (validate + delegate only)
[ ] DB driver / ORM imported ONLY inside infra/repositories
[ ] Services are framework-free (no req/res, no ORM), only orchestrate, and throw domain errors
[ ] Every invariant is in an entity method — none in the constructor or the service
[ ] Repository exposes intent-named ops and returns the entity (restore), never a live ORM document
[ ] Service takes named-field dependencies via IParamsCreate*Service, no `deps` object
[ ] Signatures have no inline composite types; interfaces live in the domain interface file
[ ] Every `if` has braces; named imports (`import { x } from 'lodash'`), no new default import
[ ] Input validated at the edge against shared schemas (no drift; one source of truth)
[ ] Serializers strip secrets via allow-list; no internal field leaks
[ ] Error taxonomy + single central handler; consistent { error, code } envelope; 500s masked + logged
[ ] User-facing error messages in pt-BR
[ ] Every catch with a fallback filters the "not found" error, logs warn, and lets integration failures through
[ ] Errors the client branches on carry a boolean flag in the body (BusinessErrorWithData), declared in the contract and asserted in the test
[ ] Every listing query has $limit; new fields declared in schema and projection
[ ] Config validated & typed at boot; no scattered process.env reads
[ ] createApp() factory separable from bootstrap; tests target it
[ ] Optional deps degrade; required deps fail fast
[ ] Tests cover edge + integration (ephemeral datastore) + pure helpers
[ ] Every rule has an integration test asserting status and message, and it failed under manual mutation
[ ] Local verification ran (modules/local-verification.md) — or the skip is stated with its reason
[ ] PR has at most 500 additions and 500 deletions (no lockfile), measured with git diff --shortstat
[ ] File/identifier naming consistent with the codebase
```
