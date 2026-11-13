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

**QD services:** the edge validator is the OpenAPI contract (`express-openapi-validator`), not a hand-written `parse`. It rejects shape errors with 400 automatically; don't repeat those checks in the service. Contract conventions (`oneOf` + `discriminator`, English enums, `format: date`) are in `domain-rules.md`.

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
| `BusinessError` | 422 | `BUSINESS_ERROR` |
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ConflictError` | 409 | `CONFLICT` |

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

**QD services:** the taxonomy and the central handler already come from `qd-packages` (`BusinessError` is 422, `GeneralError` 500; `middlewareHandleError`, registered by `validationAppCustomizer`, answers `{ message }`). Use them; don't write a second handler or a new envelope. Messages shown to the user are pt-BR.

## Errors the client branches on (QD services)

When the front has to react differently to two failures of the same endpoint (skip a step, go back, show a specific screen), the error body carries a **boolean flag per case** beside the `message`. The client branches on the flag, never on the message text, which is pt-BR copy that changes.

```json
{ "message": "O telefone já foi validado", "phoneAlreadyValidated": true }
{ "message": "Informe o telefone do responsável antes de validar o número", "phoneMissing": true }
```

- **Why a custom error:** the qd-packages `middlewareHandleError` (registered by `validationAppCustomizer`) sends only `{ message }`. Throw a `BusinessErrorWithData(message, { flag: true })` (same name as in qd-api-geral), and register a customizer that spreads `error.data` into the body **before** `validationAppCustomizer`, both in `server.ts` and in the test app (`__tests__/configApp.ts`). Every other error keeps the default handler.
- **Name the flag after the state** in camelCase (`phoneAlreadyValidated`, `phoneMissing`), so `if (body.phoneAlreadyValidated)` reads right.
- **Declare it in the contract:** an explicit `'422'` response with its own schema, `additionalProperties: false` and every flag as an optional boolean. With `validateResponses: true`, an undeclared field fails the response.
- **Test it:** the integration test asserts the whole body (`toEqual({ message, flag: true })`). Since the tests boot `configApp`, not `server.ts`, check the flag once against the real server in the local verification.
- A plain `BusinessError` stays fine when the client only shows the message and has nothing to branch on.
