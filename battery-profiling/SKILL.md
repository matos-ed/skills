---
name: battery-profiling
description: Measure an Android app's real battery drain on a physical device via ADB, attributed per uid to wakelocks, GPS, screen, radio and network. Use to compare two builds/flags/configs or to find what drains an app. Not for emulators.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: "[app package, what to compare, or the drain question]"
---

# Battery Profiling

Measures where an Android app's battery goes on a real device. Battery percentage is too noisy to
answer anything — this reads per-uid counters, and treats the measurement as something that can lie.

## When to Use

- "Does flag/feature X cost battery?" — two configs, same device
- "Why does this app drain?" — attributing drain across wakelock, GPS, screen, radio, network
- Validating a battery fix

## Do Not Use When

- **On an emulator** — no real battery, modem or GPS; values are synthetic. Say so and stop.
- No physical device on ADB, or it cannot be unplugged
- CPU/render performance rather than energy, or the platform is iOS

## Workflow

1. **Frame the comparison** — which two states, which screen regime → `modules/design.md`
2. **Set up** — ADB over Wi-Fi, unplugged, verify the tested variable is active → `modules/setup.md`
3. **Run the windows** — `scripts/run-battery-test.sh`, identical duration each → `modules/protocol.md`
4. **Analyze** — per-uid counters, then clear known artifacts → `modules/analysis.md`
5. **Report** — what dominates, what the variable cost, what went unmeasured → `modules/reporting.md`

## Non-negotiables

Unplug the device — plugged in there is no drain. Per-uid `batterystats` is the metric; the charge
counter is support only. Contaminated windows are discarded, not adjusted. No delta is reported
before clearing the artifacts in `modules/analysis.md` — attribution gaps fake savings bigger than
real effects.

User request: $ARGUMENTS
