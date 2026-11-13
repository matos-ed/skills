---
name: mobile-dev
description: Verify and measure mobile apps (React Native, Android and iOS) on emulators, simulators and real devices — automated local smoke tests with Maestro on a release build of the branch, cold-start A/B against the base build, and real battery drain per uid via ADB. Use before reporting a mobile change as done or opening its PR, when asked to "testa no android/ios", "roda o smoke", "valida a branch no emulador", or to compare battery or startup between two builds.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: "[app/repo, branch or PR, what to verify or measure]"
---

# Mobile Dev

Proves a mobile change works and measures what it costs, on the platforms the user actually runs. Engineering of the app itself (structure, navigation, state, native modules, release) is `react-native-dev`; visuals are `rn-ui-designer` / `rn-ui-builder`.

## When to Use
- A change with runtime effect in a mobile app is about to be reported done or go to PR
- Validating a branch, PR or release build on Android and iOS
- Comparing two builds (cold start, battery) or finding what drains an app

## Do Not Use When
- Component/hook tests with Testing Library + MSW only (that's the repo's unit suite; see `local-testing` → `frontend-mobile.md`)
- The change has no runtime effect (docs, CI, comments): say it was skipped and why

## Organization notes
App-specific details (bundle ids, dev menus, stage environment, test coordinates, build schemes, ready-made flows) live in `local/`, which is git-ignored. Read `local/` first when it exists; when a run teaches something app-specific, write it there, and keep the tracked modules generic.

## Workflows

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
- Never print secrets from `.env*`, `.npmrc` or signing configs; read a needed value straight into a variable.
- Emulator timings are trends, not production numbers — say so in the report.
- Leave the machine as you found it: remove worktrees and build outputs, shut down emulators and simulators, report free disk.

User request: $ARGUMENTS
