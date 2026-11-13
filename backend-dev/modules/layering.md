# Layering — clean architecture & the dependency rule

A backend is organized in concentric layers with a **single, one-way dependency rule**:

```
delivery (http) → services → infra (repository) → datastore
```

Each layer depends only on the one beneath it. The outer world (HTTP framework, DB driver, third-party SDKs) is pushed to the edges so the business rules stay pure and testable. Below: the responsibility of each layer and the idioms that keep the boundaries clean.

## Suggested directory shape

```
src/
  http/              delivery (interface adapters)
    routes/          thin: validate input, delegate to a service
    middleware/      auth, async-handler, error-handler
    serializers/     internal record → public DTO (never leak secrets)
  domain/            entities holding the invariants (match the repo's existing location)
  services/          use-case orchestration (one module per domain concept)
  infra/             drivers — the outside world, isolated
    database/        connection + models/ (ORM schemas)
    repositories/    THE ONLY layer that touches the DB driver
  external-services/ third-party clients (payment, email, LLM…)
  errors/            error taxonomy (AppError + subclasses)
  lib/               generic pure utilities (validate, etc.)
  config/ or env.ts  validated, typed configuration
  app.ts             app factory (builds the app; no listen)
  index.ts           bootstrap (connect deps + listen)
```

## Layer responsibilities

### Delivery (`http/routes`, controllers) — thin
Routers/controllers do exactly two things: **validate the incoming request against a schema, then delegate to a service.** No business logic, no DB access. Keep them short enough to read at a glance.

```ts
// route — validate at the edge, delegate, return
router.post("/register", asyncHandler(async (req, res) => {
  const result = await authService.registerLocal(parse(registerSchema, req.body));
  res.status(201).json(result);
}));
```

Use an **async-handler** wrapper so rejected promises reach the central error handler (many frameworks don't forward async errors on their own).

### Services — orchestration
Services orchestrate the use case: load the aggregate through the repository (404 if missing), call the **entity** method that validates and changes state, persist. Invariants live in the entity, not here (see `domain-rules.md`); a service keeps only the checks that need a repository or an external service, like the uniqueness check below. Services **throw domain errors** (see `contracts-and-errors.md`) and **know nothing about HTTP or the DB driver** — no `req`/`res`, no ORM imports.

```ts
export async function registerLocal(input: RegisterInput): Promise<AuthResult> {
  if (await userRepository.findByEmail(input.email)) {
    throw new ConflictError("Email already registered");
  }
  const user = await userRepository.create({
    email: input.email,
    passwordHash: await hashPassword(input.password),
  });
  return buildAuthResult(user); // serialize + sign token
}
```

Keep cross-cutting pure helpers (password hashing, token signing, date math) in small framework-free modules so services compose them and tests cover them directly.

### Infra / repository — the only DB boundary
The repository is the **single layer that knows the persistence driver** (Mongoose, Prisma, SQL, etc.). It exposes operations **by intent** — `findByEmail`, `saveChart`, `addAuthProvider` — not generic query passthroughs, and returns the **domain entity** (`Entity.restore(doc)`), never a live ORM document. Swapping the datastore should touch only this layer.

```ts
// repository — intent-named, returns the entity
export async function findByEmail(email: string): Promise<User | null> {
  const doc = await UserModel.findOne({ email }).lean<UserRecord>().exec();
  if (!doc) {
    return null;
  }
  return User.restore(doc);
}
```

Sensitive columns (e.g. password hashes) are excluded by default at the schema level and only pulled in via an explicit method (`findByEmailWithPassword`) when a use case truly needs them.

### External services
Wrap third-party SDKs (payment, email, LLM, geocoding) behind your own module with a domain-shaped interface, so a provider swap or an outage fallback is local. Treat them like another driver at the edge.

## Boundary violations to reject

| Violation | Why it's wrong |
| --- | --- |
| Business logic inside a router | Untestable without HTTP; logic scatters |
| Invariant checked in a service or entity constructor | Belongs in an entity method; a constructor check breaks rehydrating legacy documents |
| ORM/DB driver imported outside `infra/` | Couples rules to persistence; blocks swap |
| Service importing `req`/`res` | Ties domain logic to the web framework |
| Repository returning live ORM documents | Leaks driver semantics (lazy loads, mutability) upward |
| Repository with generic `query(sql)` passthrough | Defeats the intent boundary; SQL leaks up |

## Output contracts are explicit
Data crossing a boundary is **named and serializable — nothing positional**. Return `{ body, longitude, sign, house }`, not a bare tuple. Explicit shapes are self-documenting, safe to send over the wire, and stable to consume.
