---
name: rn-ui-builder
description: Build React Native (Expo) UI from an approved design spec using NativeWind — token-driven styling, composable typed components, all states handled, with code-quality and design-fidelity self-review.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: "[design spec or screen to build]"
---

# RN UI Builder

Turns an **approved design spec** into production React Native + NativeWind code: faithful tokens and layout, composable typed components, every state handled, then a self-review — minimizing the rework that vague, unstyled output needs.

## When to Use

- "Build / implement this screen" in a React Native + NativeWind (Expo) app
- You have a spec from `rn-ui-designer` (or the user described one)
- Restyling existing RN UI to be token-driven and consistent

## Do Not Use When

- Visuals aren't settled — run `rn-ui-designer` first to get a spec
- Non-React-Native UI, or logic with no visual surface
- Project uses StyleSheet/styled-components, not NativeWind

## Workflow

1. **Read the spec** — Get approved tokens, layout tree, states. If none exists, stop and recommend `rn-ui-designer`. If NativeWind isn't set up, confirm before installing.
2. **Wire tokens** — Put tokens in `tailwind.config.js` `theme.extend`; components reference names (`bg-primary`), never raw hex. Read `modules/nativewind-patterns.md`.
3. **Build bottom-up** — Leaf components first, then compose the screen 1:1 with the layout tree. Small, typed, single-responsibility. Read `modules/nativewind-patterns.md`.
4. **Handle every state** — default, loading (skeleton), empty, error, success — not just the happy path.
5. **Self-review** — Score against `modules/code-quality.md` (code + design fidelity). Fix every P0/P1 before reporting.

For worked component builds, read `modules/examples.md`.

## Output Format

```markdown
# Built — [screen/feature]
## Files — path (new|edited)
## Spec fidelity — tokens wired (no hex in components); layout 1:1; states default|loading|empty|error|success
## Self-review — P0/P1 found & fixed; preview with `npx expo start`
```

User request: $ARGUMENTS
