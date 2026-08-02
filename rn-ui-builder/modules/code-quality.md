# Code Quality & Design Fidelity

Self-review gates. Apply during **step 5 (Self-review)** of the workflow. Score the built UI, fix every P0/P1 before reporting.

---

## Code quality checklist

### Structure
- [ ] Components are small, single-responsibility, and composed bottom-up (leaf → screen)
- [ ] Props are fully typed (no `any`); shared types extracted
- [ ] No business logic buried in render — derive/memoize, hoist handlers
- [ ] Lists use `FlatList`/`FlashList` with `keyExtractor` for non-trivial data

### Styling
- [ ] Zero hardcoded hex / arbitrary `*-[..]` in components — all via tokens
- [ ] Spacing/radii snap to the scale, applied consistently
- [ ] `className` used for static styles; `style` only for truly dynamic values

### Robustness
- [ ] All spec states implemented (default/loading/empty/error/success)
- [ ] Touchables: `accessibilityRole`, `accessibilityLabel`, `hitSlop`, ≥44×44 target
- [ ] Safe-area + keyboard handled; no content under notch/home indicator
- [ ] Any screen with a `TextInput` wraps its scrollable content in
      `KeyboardAvoidingView` (see Keyboard avoidance below) — don't ship a
      form where focusing an input leaves it hidden behind the keyboard
- [ ] No unused imports/vars; passes lint/typecheck if the project has them

### Keyboard avoidance

If a screen has any text input, the keyboard must not cover it when
focused. Default pattern:

```tsx
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
>
  <ScrollView keyboardShouldPersistTaps="handled">
    {/* form content */}
  </ScrollView>
</KeyboardAvoidingView>
```

- Set `behavior` explicitly on **both** iOS and Android — don't leave it
  `undefined` on Android and rely on `windowSoftInputMode`; RN's own docs
  now recommend setting it on both platforms.
- If the screen has a header/tab bar above it that isn't part of this
  component's own height, pass `keyboardVerticalOffset` for that height;
  otherwise leave it `0`.
- `keyboardShouldPersistTaps="handled"` on the `ScrollView` so tapping a
  button while the keyboard is open doesn't require a first tap to dismiss
  it.
- Prefer wiring this into a **shared screen shell/layout component** if one
  exists in the project, rather than repeating it per-screen — check for
  one (e.g. a `Screen`/`Layout` wrapper) before adding it ad hoc.
- `KeyboardAvoidingView` is effectively a no-op on Expo web — that's
  expected, not a bug; verify the iOS/Android behavior by reading the code
  against these rules, not by testing only on web.
- If the project already depends on `react-native-keyboard-controller`, use
  its `KeyboardAvoidingView`/`KeyboardAwareScrollView` instead of the core
  RN one for consistency — don't introduce it as a new dependency just for
  one screen.

## Design fidelity checklist

- [ ] Layout matches the spec's hierarchy tree 1:1
- [ ] Visual hierarchy reads correctly — the #1 element wins at a glance
- [ ] Contrast: every text/surface pair ≥ 4.5:1 (AA)
- [ ] Restraint honored — one accent, tight radius set, ≤2 fonts
- [ ] Rhythm consistent — equal gaps, aligned edges, no off-grid spacing

## Severity

- **P0** — Broken render, untyped public API, hardcoded colors defeating the token system, or a missing required state. Must fix.
- **P1** — Fidelity drift from spec, contrast failure, inconsistent spacing, missing accessibility on interactive elements. Fix before reporting.
- **P2** — Polish: micro-spacing, naming, extractable duplication.
- **P3** — Nice-to-have: motion refinements, optional variants.

## Verify before reporting

- Run typecheck/lint if available (`npx tsc --noEmit`, `npm run lint`).
- Tell the user how to preview (`npx expo start`) — you can't see the pixels, so the human's first look is the real fidelity check. Flag any spec areas you were least sure about.
