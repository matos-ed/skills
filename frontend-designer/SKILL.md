---
name: frontend-designer
description: Consult framework-agnostic frontend UX patterns (stepped onboarding/data-collection, engagement mechanics) validated across projects — before a stack-specific builder implements one.
allowed-tools: Read, Grep, Glob
argument-hint: "[pattern to look up, e.g. 'stepped onboarding flow']"
---

# Frontend Designer

Holds framework-agnostic frontend design/UX patterns — interaction flows, layout conventions, and engagement mechanics that hold true regardless of stack (React Native, web, or otherwise). Consulted by stack-specific builders (`rn-ui-builder`, `rn-ui-designer`) when a task needs a proven pattern, not a one-off invention.

## When to Use

- Building a UX pattern that recurs across stacks (multi-step onboarding, data-collection wizards, empty/loading rituals) and you want the validated shape before improvising
- A stack-specific builder needs "what's the right pattern here" answered before it starts wiring framework code
- Growing the shared pattern library with a new validated pattern from a shipped feature

## Do Not Use When

- The question is stack-specific implementation (NativeWind classes, RN gesture libraries, CSS) — that's `rn-ui-builder`'s `modules/nativewind-patterns.md`, not here
- Visual tokens/layout for one concrete screen — that's `rn-ui-designer`
- Writing actual component code — this skill describes patterns, it doesn't implement them

## Workflow

1. **Identify the pattern category** the task needs (e.g. stepped data-collection → `modules/onboarding-patterns.md`).
2. **Read the matching module.** Each pattern is stack-agnostic by design — the caller adapts it to their own framework's idioms (NativeWind, StyleSheet, CSS-in-JS, etc.).
3. **Report the pattern** as a shape the caller can implement directly in their stack, flagging any part that's a deliberate UX trade-off requiring confirmation (e.g. added artificial delay).

## Modules (Read When Relevant)

- **Onboarding / stepped data-collection** — `modules/onboarding-patterns.md`

## Output Format

```markdown
# Frontend Designer — [pattern requested]

## Pattern
- <shape: structure, sequencing, key decisions>

## Trade-offs to confirm with user
- <any deliberate cost the pattern imposes, e.g. added wait time>

## Adapt in your stack
- <pointer: e.g. "wire with modules/nativewind-patterns.md in rn-ui-builder">
```
