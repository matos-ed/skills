# Contracts, validation & errors

Two cross-cutting disciplines that keep a backend honest: a **single source of truth for data shapes** validated at the edge, and a **standardized error taxonomy** translated in one place.

## Contracts as the single source of truth

DTOs and validation schemas live in **one shared place** — a `contracts`/`shared` package (in a monorepo) or a single `contracts/` directory — and every layer (and any client) **imports** them rather than redefining. Redefining types in two places guarantees *drift*: the server and the app eventually disagree about a field.

- Define each request/response shape **once** (e.g. with zod / valibot / a typed schema lib) and derive the static type from the schema (`type RegisterInput = z.infer<typeof registerSchema>`), so the validator and the type can never diverge.
- Export both **input schemas** (used for validation) and **output DTOs** (the public shape).
- Keep contracts **framework-free** — no Express, no ORM — so both server and client can depend on them.

## Validate at the boundary

Every untrusted input (request body, query, params, webhook payload, env) is validated **at the edge** with a thin helper that either returns the typed value or throws a `ValidationError`:

```ts
export function parse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Invalid data", { issues: result.error.issues });
  }
  return result.data;
}
```

Past this line, data is trusted and typed. Services receive validated inputs, never raw `req.body`.

## Serializers — never leak internals

The shape stored internally ≠ the shape sent to clients. A **serializer** maps an internal record to its public DTO and is the choke point that **strips secrets** (password hashes, internal flags, tokens):

```ts
export function toPublicUser(record: UserRecord): PublicUser {
  return { id: record._id.toString(), email: record.email, name: record.name };
  // passwordHash, authProviders, internal fields never included
}
```

Make leaking hard by construction: build the DTO with an allow-list of fields, not by deleting from the full object.

## Standardized error taxonomy

One base error carries everything the HTTP layer needs: an HTTP `statusCode`, a **stable machine-readable `code`** (so clients branch programmatically), and optional `details`.

```ts
export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype); // keep instanceof working
  }
}
```

Subclass per failure mode so services raise intent, not status numbers:

| Class | HTTP | `code` |
| --- | --- | --- |
| `BusinessError` | 400 | `BUSINESS_ERROR` |
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ConflictError` | 409 | `CONFLICT` |
| `UnprocessableEntityError` | 422 | `UNPROCESSABLE_ENTITY` |

Services `throw new ConflictError("Email already registered")` — they never set status codes or shape responses.

## One central error handler

A single handler (the last middleware) translates known errors and **masks everything else as 500** while logging it — so unexpected failures never leak stack traces or internal messages to clients.

```ts
export function errorHandler(err, _req, res, _next) {
  if (isAppError(err)) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
  }
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
}
```

The response body is a **consistent envelope** (`{ error, code, details? }`) across every endpoint, so clients have one error contract to handle.
