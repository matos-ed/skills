# Architecture & state

Project structure, navigation, state, and data for an Expo app. Apply during **step 2 (Architecture & data)** of the workflow.

---

## Detect before you decide

Read these before adding anything; match what exists rather than introducing a parallel stack:

- **Expo SDK** — `package.json` `expo` version → which APIs/syntax are valid. Prefer Expo-managed packages (`npx expo install <pkg>`) so native versions stay aligned.
- **Router** — `app/` dir + `expo-router` vs `@react-navigation/*` set up manually.
- **State/data libs** — zustand / redux / jotai; `@tanstack/react-query` / SWR; `axios`/`fetch`.
- **TS config** path aliases; lint/format rules.

## Project structure

Feature-first, not type-first. Group by domain so a feature is self-contained:

```
app/                 expo-router routes (file = route); thin screens
src/
  features/<name>/   components, hooks, api, store for one feature
  components/        shared, presentational (styling → rn-ui-builder)
  hooks/             cross-feature reusable hooks
  lib/               api client, storage, env, pure utils
  navigation/        types, linking config (if not pure expo-router)
  types/             shared types / API contracts
```

Keep **screens thin**: they compose hooks + components and wire navigation. Business logic lives in hooks (`useX`) or a store, not inside the JSX.

## Navigation (expo-router preferred)

- **File-based routes** under `app/`. Layouts via `_layout.tsx` (stack/tabs/drawer). Groups `(auth)`/`(app)` to gate flows.
- **Typed routes** — enable `experiments.typedRoutes` (or type the `href`); never pass untyped string params.
- **Params are strings** — parse/validate at the screen boundary; don't pass objects through params, pass an id and read from the store/query.
- **Auth gating** — redirect in a root layout based on session state; don't scatter guards per screen.

## State: pick the smallest tool that fits

| Need | Use |
| --- | --- |
| Local UI state | `useState`/`useReducer` |
| A few values shared down a subtree | Context (split value vs. dispatch to limit re-renders) |
| App-wide client state (auth, theme, cart) | A store lib (zustand: tiny, selector-based) |
| **Server** state (anything from an API) | React Query / SWR — **not** a global store |

The most common mistake is dumping server data into Redux/zustand. Server data is *cache*, not app state: let React Query own fetching, caching, retries, dedup, and invalidation. Reserve client stores for genuinely client-owned state.

## Data fetching

- One **typed API client** in `lib/api` (base URL from env, auth header injection, error normalization). Screens never call `fetch` directly.
- Wrap calls in `useQuery`/`useMutation` keyed by stable query keys; invalidate on mutation instead of manual refetch.
- **Validate responses at the boundary** (zod) so untyped JSON can't leak through your types — mirrors the backend's edge-validation principle.
- Handle the **four states** every async surface has: loading, empty, error (with retry), success. (Visual treatment → `rn-ui-builder`.)
- Persistence: `expo-secure-store` for secrets/tokens, `AsyncStorage`/MMKV for plain cache, React Query persister for offline.

## Environment & config

- Public config via `EXPO_PUBLIC_*` env vars or `app.config.ts` `extra` (read through `expo-constants`). **Never** ship secrets in the bundle — anything in the JS bundle is readable.
- Centralize and validate env once (zod) in `lib/env.ts`; fail fast in dev.

## Typed boundaries

Type the seams: API responses, navigation params, store shape. Prefer deriving types from runtime schemas (zod `infer`) so validation and types can't drift. Keep shared contract types in `src/types` (or a shared package in a monorepo).
