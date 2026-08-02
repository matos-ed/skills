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
- **Match the existing codebase first** — these are defaults, not a mandate to restyle working code.

## Self-check (run before reporting)

```
[ ] Dependency rule holds: http → services → infra → datastore, one direction
[ ] Routers/controllers are thin (validate + delegate only)
[ ] DB driver / ORM imported ONLY inside infra/repositories
[ ] Services are framework-free (no req/res, no ORM) and throw domain errors
[ ] Repository exposes intent-named ops and returns plain records
[ ] Input validated at the edge against shared schemas (no drift; one source of truth)
[ ] Serializers strip secrets via allow-list; no internal field leaks
[ ] Error taxonomy + single central handler; consistent { error, code } envelope; 500s masked + logged
[ ] Config validated & typed at boot; no scattered process.env reads
[ ] createApp() factory separable from bootstrap; tests target it
[ ] Optional deps degrade; required deps fail fast
[ ] Tests cover edge + integration (ephemeral datastore) + pure helpers
[ ] File/identifier naming consistent with the codebase
```
