---
name: backend-dev
description: Build, refactor or review backend code (HTTP APIs, Node/TypeScript services) with layered clean architecture and DDD rules — thin routers, rich entities holding the invariants, services that only orchestrate, repository-isolated persistence, OpenAPI contract as first barrier, named interfaces, standardized errors with pt-BR messages, fallbacks that don't swallow failures. Use when creating or reviewing an endpoint, entity, service or business-rule validation. Every task that changes runtime code ends with mandatory local verification against local MongoDB/Kafka/Redis, A/B against the base branch.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
argument-hint: "[endpoint, entity or rule to build, refactor or review]"
---

# Backend Dev

Builds and refactors backend apps toward a maintainable, testable structure. The layering principles are framework-agnostic; the domain rules assume Node/TypeScript, OpenAPI, Mongo and Kafka. Organization-specific notes (shared packages and their quirks, internal libraries, error helpers) live in `local/`, which is git-ignored: read it when it exists. Adapt idioms to the project's conventions; never restyle working code to match the examples.

## When to Use
- Scaffolding a new backend service or API endpoint
- Creating or changing an entity, service or business-rule validation
- A feature spanning the delivery → logic → persistence path
- Refactoring toward clearer layering or testability
- Reviewing backend code for layering, domain, validation or error-handling gaps
- Finishing any backend task that changes runtime code, before reporting it done or opening a PR — local verification is mandatory

## Do Not Use When
- Frontend/UI work (use `rn-ui-builder` / `rn-ui-designer`)
- Pure infra/devops (CI, deploy) with no application logic
- One-off scripts with no architecture concerns

## The two rules to remember
- **Dependency rule** — layers flow one way: **delivery (http) → services → infra (repository) → datastore**. Outer depends on inner, never the reverse. The datastore is reachable *only* through the repository.
- **The rule belongs to the entity** — invariants live in entity methods; the service loads, calls the entity and persists. A business `if` in a service is a candidate entity method.

## Workflow
1. **Classify** — new service, endpoint, or refactor/review. Inspect existing structure first; match it. Read `local/` if present.
2. **Apply layering** — each piece in its layer. Read `modules/layering.md`.
3. **Apply the domain rules** — where each validation lives, rich entity, orchestrating service, OpenAPI contract, types and names, errors, reuse before helper, integration tests. Read `modules/domain-rules.md`.
4. **Wire contracts & errors** — edge validation, error taxonomy, errors the client branches on. Read `modules/contracts-and-errors.md`.
5. **Persistence & integrations** — when reading or writing a new field, creating a query, using Redis or calling a third party. Read `modules/persistence-and-integrations.md`: Mongo defaults, `strict`, `$limit`, Redis timeouts and HTTP fallbacks have already caused incidents.
6. **Set foundations** — validated env, testable app factory, graceful degradation, tests. Read `modules/foundations.md` (new services / scaffolding).
7. **Verify locally (mandatory)** — boot the branch and the base branch against local MongoDB/Kafka/Redis with third parties stubbed, exercise the most-used endpoints, compare A/B, and report the result. Read `modules/local-verification.md`; reuse `scripts/`. Never report a backend task as done or open its PR without this step, unless the change has no runtime effect — then say it was skipped and why.
8. **Never print secret values** — when reading cluster config, `.env` or `.npmrc`, list key names only; read a needed value straight into an env var (`U=$(kubectl get cm X -o jsonpath='{.data.KEY}')`) and never print it. Never filter keys by substring to decide what to show. `~/.claude/hooks/secret-dump-guard.py` blocks the usual dumps.
9. **Self-check** — score against the checklist ending `modules/foundations.md`.

## Delivery
- **500-line PR limit:** at most 500 additions + 500 deletions. Lockfiles and added libraries don't count.
  - Measure **before opening the PR** and again after each review fix: `git diff --shortstat <base>...HEAD -- . ':!yarn.lock' ':!package-lock.json'`.
  - If it will exceed the limit, plan the split before coding, not after: PRs chained by base (`stage` ← A ← B), each reviewable and meaningful on its own. Atomic commits (`feat:` + `test:` per slice) make slicing easy.
  - State the size in the reply to the user when opening or updating the PR.
- Vertical slice per subtask: contract and rule in one PR, persistence in another, when the ticket already comes split that way.

User request: $ARGUMENTS
