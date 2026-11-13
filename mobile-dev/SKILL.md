---
name: mobile-dev
description: Engineer, verify and measure React Native (Expo) apps on Android and iOS — project structure, navigation, state, data fetching, native/Expo capabilities, permissions, performance and EAS builds/release; then automated local tests with Maestro on a release build of the branch, cold-start A/B against the base, and real battery drain per uid via ADB. Use to build or change a mobile feature, integrate a native capability, fix performance or prepare a release, before reporting a mobile change done or opening its PR, or when asked to "testa no android/ios", "roda o smoke", "valida a branch no emulador", or compare battery or startup between two builds. Defers visual design to rn-ui-designer and styled markup to rn-ui-builder.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: "[app/repo, feature, native integration, perf issue, release, branch/PR to verify or what to measure]"
---

# Mobile Dev

Builds the **engineering** of React Native (Expo) apps — structure, navigation, state, data fetching, native capabilities, performance and release — and proves each change on the platforms the user actually runs. Owns everything below the visual surface; hands styling to `rn-ui-designer` / `rn-ui-builder`.

## When to Use
- Scaffold an app or add a feature/screen's logic
- Navigation, state, data fetching, persistence or typed API wiring
- Integrating a native/Expo capability (camera, notifications, permissions, config plugins)
- Fixing performance (slow lists, re-renders, memory) or preparing an EAS build/release
- A change with runtime effect is about to be reported done or go to PR: verify it on Android and iOS
- Comparing two builds (cold start, battery) or finding what drains an app

## Do Not Use When
- Visual design (use `rn-ui-designer`) or styled markup (use `rn-ui-builder`)
- Backend/API server code (use `backend-dev`)
- Non-React-Native apps
- Only component/hook tests with Testing Library + MSW (the repo's unit suite; see `local-testing` → `frontend-mobile.md`)

## Organization notes
App-specific details (bundle ids, dev menus, stage environment, test coordinates, build schemes, ready-made flows, team conventions) live in `local/`, which is git-ignored. Read `local/` first when it exists; when a task teaches something app-specific, write it there, and keep the tracked modules generic.

## Workflows

**Engineering**
1. **Orient** — classify the task (scaffold, feature, native integration, perf/bug, release). Detect the project's Expo SDK, router and state lib first; match existing conventions. Defer visuals to `rn-ui-designer`/`rn-ui-builder`.
2. **Architecture & data** — structure, navigation, state, data fetching, typed boundaries → `modules/architecture-state.md`
3. **Native & platform** — Expo/native APIs, permissions, platform code, config plugins, EAS builds → `modules/native-platform.md` (only when the task touches native capability or release)
4. **Performance & debugging** — lists, re-renders, memory, profiling, release readiness → `modules/performance-debugging.md`
5. **Self-check** — score against the checklist ending `modules/performance-debugging.md`; fix every P0/P1.
6. **Verify on device (mandatory for runtime changes)** — run the automated local tests below. Never report a mobile change as done or open its PR without it, unless it has no runtime effect; then say it was skipped and why.

Worked patterns and snippets: `modules/examples.md`.

**Automated local tests** → `modules/automated-local-tests.md`
1. Build the branch (and the base, for A/B) as release builds in worktrees, guarding disk.
2. Run the unit suite on the same tree.
3. Drive the smoke flow with Maestro on Android emulator and iOS simulator (`templates/smoke.yaml` as a starting point).
4. Check logs for crashes, ANRs and JS errors; measure cold start A/B when startup could change.
5. Report the verification table, what was found on the way, and clean up.

**Battery profiling** (Android, physical device only)
1. **Frame the comparison** — which two states, which screen regime → `modules/battery/design.md`
2. **Set up** — ADB over Wi-Fi, unplugged, verify the tested variable is active → `modules/battery/setup.md`
3. **Run the windows** — `scripts/run-battery-test.sh`, identical duration each → `modules/battery/protocol.md`
4. **Analyze** — per-uid counters, then clear known artifacts → `modules/battery/analysis.md`
5. **Report** — what dominates, what the variable cost, what went unmeasured → `modules/battery/reporting.md`

Battery non-negotiables: never on an emulator (values are synthetic — say so and stop). Unplug the device; per-uid `batterystats` is the metric, the charge counter is support only. Contaminated windows are discarded, not adjusted, and no delta is reported before clearing the artifacts in `modules/battery/analysis.md`.

## Rules that don't change
- Nothing points at production: dev/stage builds and stage data only. Production accounts and OTA channels are off limits unless the user says otherwise.
- Never ship secrets in the JS bundle, and never print secrets from `.env*`, `.npmrc` or signing configs; read a needed value straight into a variable.
- Emulator timings are trends, not production numbers — say so in the report.
- Leave the machine as you found it: remove worktrees and build outputs, shut down emulators and simulators, report free disk.

## Output Format (engineering tasks)

```markdown
# Mobile Dev — [task]
## Files — path (new|edited)
## What changed — structure / navigation / state / data / native, as applicable
## Decisions — libs chosen + why; platform/permission notes
## Self-check — P0/P1 found & fixed
## Device verification — Android/iOS table from automated-local-tests (or skip + reason)
## Handoff — visuals → rn-ui-designer/builder; open questions
```

User request: $ARGUMENTS
