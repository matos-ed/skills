---
name: react-native-dev
description: Engineer React Native (Expo) apps below the visual layer — project structure, navigation, state, data fetching, native/Expo capabilities, permissions, performance, and EAS builds/release. Defers visual design to rn-ui-designer and styled markup to rn-ui-builder.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: "[app, feature, native integration, perf issue, or release task]"
---

# React Native Dev

Builds and maintains the **engineering** of React Native (Expo) apps — structure, navigation, state, data fetching, native/Expo capabilities, performance, and release. Owns everything below the visual surface; hands styling to the RN UI skills.

## When to Use

- "Scaffold a React Native (Expo) app" or add a feature/screen's logic
- Navigation, state, data fetching, persistence, or typed API wiring
- Integrating a native/Expo capability (camera, notifications, permissions, config plugins)
- Fixing performance (slow lists, re-renders, memory) or preparing an EAS build/release

## Do Not Use When

- Visual design (use `rn-ui-designer`) or styled markup (use `rn-ui-builder`)
- Backend/API server code (use `backend-dev`)
- Non-React-Native apps

## Workflow

1. **Orient** — Classify the task (scaffold, feature, native integration, perf/bug, release). Detect the project's Expo SDK, router, and state lib first; match existing conventions. Defer visuals to `rn-ui-designer`/`rn-ui-builder`.
2. **Architecture & data** — Structure, navigation, state, data fetching, typed boundaries. Read `modules/architecture-state.md`.
3. **Native & platform** — Expo/native APIs, permissions, platform code, config plugins, EAS builds. Read `modules/native-platform.md` (only when the task touches native capability or release).
4. **Performance & debugging** — Lists, re-renders, memory, profiling, release readiness. Read `modules/performance-debugging.md`.
5. **Self-check** — Score against the checklist ending `modules/performance-debugging.md`; fix every P0/P1.

For worked patterns and snippets, read `modules/examples.md`. (Modules under `modules/`: architecture-state, native-platform, performance-debugging, examples.)

## Output Format

```markdown
# RN Dev — [task]
## Files — path (new|edited)
## What changed — structure / navigation / state / data / native, as applicable
## Decisions — libs chosen + why; platform/permission notes
## Self-check — P0/P1 found & fixed; run (`npx expo start`) or build (EAS)
## Handoff — visuals → rn-ui-designer/builder; open questions
```
