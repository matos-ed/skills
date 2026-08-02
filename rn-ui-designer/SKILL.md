---
name: rn-ui-designer
description: Produce an approved React Native (Expo/NativeWind) design spec — art direction, layout, and design tokens — before any UI code is written, so the builder never has to guess visuals.
allowed-tools: Read, Grep, Glob, Bash
argument-hint: "[screen or feature to design]"
---

# RN UI Designer

Turns a screen or feature request into a concrete, **approved design spec** — art direction, layout, and design tokens — before any code is written. It closes the gap that models can't see their output: every visual decision is made explicit and signed off, so the builder never guesses.

## When to Use

- "Design a screen / flow for X" in a React Native (Expo / NativeWind) app
- User says "make this look good", "give me an art concept", "design before coding"
- Before invoking `rn-ui-builder` — this produces the spec it consumes

## Do Not Use When

- Writing component code (use the `rn-ui-builder` skill)
- Logic/state work with no visual surface
- Non-React-Native UI (this targets RN + NativeWind tokens)

## Workflow

1. **Intake** — Capture the screen/feature, platform, brand/mood cues, references. Ask the user for anything missing; never invent brand constraints.
2. **Art direction** — Pick one coherent concept: mood, color system, type ramp, spacing rhythm, depth, motion. Read `modules/art-direction.md`.
3. **Layout spec** — Define the component hierarchy, grid/flow, and every state (default/empty/loading/error/success). Read `modules/layout-spec.md`.
4. **Design tokens** — Emit concrete tokens (hex, spacing, radii, type) mapped to NativeWind theme keys. Read `modules/design-tokens.md`.
5. **Approval** — Present the spec and get explicit sign-off before handoff. Only an approved spec goes to `rn-ui-builder`.

For full worked specs, read `modules/examples.md`. (Module map: art-direction, layout-spec, design-tokens, examples under `modules/`.)

## Output Format

```markdown
# Design Spec — [screen/feature]

## Concept — mood + the single organizing idea (one paragraph)
## Tokens — table of Token | Value | NativeWind key
## Layout — component hierarchy tree; spacing rhythm; states (default|empty|loading|error|success)
## Handoff — components to build in order; open questions

> Approve this spec, or tell me what to change, before I hand it to rn-ui-builder.
```
