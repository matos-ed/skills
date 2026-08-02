---
name: backend-dev
description: Build/structure backend apps (HTTP APIs, services) with layered clean architecture — thin routers, business-logic services, repository-isolated persistence, shared validated contracts, and a standardized error taxonomy. Framework-agnostic.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
argument-hint: "[what to build, refactor, or review]"
---

# Backend Dev

Builds and refactors backend apps toward a maintainable, testable structure. Principles are framework-agnostic (Express, Fastify, NestJS, Hono, Flask…). Adapt idioms to the project's conventions; never restyle working code to match the examples.

## When to Use
- Scaffolding a new backend service or API endpoint
- A feature spanning the delivery → logic → persistence path
- Refactoring toward clearer layering or testability
- Reviewing backend code for layering, validation, or error-handling gaps

## Do Not Use When
- Frontend/UI work (use `rn-ui-builder` / `rn-ui-designer`)
- Pure infra/devops (CI, deploy) with no application logic
- One-off scripts with no architecture concerns

## The dependency rule (remember this one)
Layers flow one way: **delivery (http) → services → infra (repository) → datastore**. Outer depends on inner, never the reverse. The datastore is reachable *only* through the repository.

## Workflow
1. **Classify** — new service, endpoint, or refactor/review. Inspect existing structure first; match it.
2. **Apply layering** — each piece in its layer. Read `modules/layering.md`.
3. **Wire contracts & errors** — edge validation against shared schemas; standardized error taxonomy. Read `modules/contracts-and-errors.md`.
4. **Set foundations** — validated env, testable app factory, graceful degradation, tests. Read `modules/foundations.md` (new services / scaffolding).
5. **Self-check** — score against the checklist ending `modules/foundations.md`.

User request: $ARGUMENTS
