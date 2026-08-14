# Patterns

Framework-agnostic targets. Code is React, but the semantics apply anywhere.

## The shared primitive

Before writing a fifth button, extract the baseline into one headless primitive.
Headless matters: if the primitive owns no styling, adopting it across an existing
library changes zero pixels, which is what makes the migration reviewable.

What the primitive owns:

| Concern | Resolution |
|---|---|
| Element | native `<button>`; `href` present → anchor semantics; other tag → inject `role`/`tabIndex`/keys |
| `type` | default `"button"`, caller can override |
| Disabled | native `disabled`, **or** `aria-disabled` + handler guard — never both |
| Busy | `aria-busy`, stays focusable, activation blocked |
| Toggle | `aria-pressed` only when the prop is defined |
| Name | dev-time error when none can be found |

Export the hook alongside the component. Composition libraries render the element
themselves (`asChild`), so a component-only API cannot reach exactly the cases
where the bugs concentrate.

```tsx
// element is yours
<BaseButton loading={isSaving} onClick={save}>Salvar</BaseButton>

// element is not yours
<Radix.Trigger asChild {...useButtonA11y({ disabled })}>{trigger}</Radix.Trigger>
```

## Non-native control, when unavoidable

```tsx
role="button"
tabIndex={disabled ? -1 : 0}
onKeyDown: Enter  → preventDefault, activate
           Space  → preventDefault (stops page scroll), mark pending
onKeyUp:   Space  → activate if pending
```

Space activates on **keyup**, matching native buttons: the user can press Space,
change their mind, move off, and release without firing. Activating on keydown
also repeats while held.

Prefer `element.click()` over calling the handler directly — one code path, and
the event the handler receives is a real event.

## Toggle vs. tab vs. menu — pick the right state attribute

- `aria-pressed` — a button that stays in. Not for navigation.
- `aria-selected` — an option within `tablist`, `listbox`, or `grid`. Never
  standalone.
- `aria-checked` — checkbox, radio, switch, and menu items that behave like them.
- `aria-expanded` — this control shows/hides something. Pair with
  `aria-controls` pointing at the container's real id.

Using the wrong one is worse than using none: it places the control in a
container pattern that does not exist, and the screen reader reports position
("2 of 5") that is fiction.

## Tabs

`role="tablist"` wrapper, `role="tab"` triggers, `role="tabpanel"` panels, each
tab's `aria-controls` naming its panel. Roving tabindex: exactly one tab has
`tabIndex={0}`, the rest `-1`. Arrow keys move between tabs; Home/End jump to the
ends; Tab leaves the tablist entirely. That last part is the point of roving
tabindex — a 9-tab bar should cost one Tab press to skip, not nine.

## Accordion / disclosure

`<button aria-expanded aria-controls>` inside the heading element, not wrapping
it. Do not add `onKeyDown` for Enter/Space — a native button already does that,
and a hand-rolled handler double-fires the moment someone also calls `onClick`.

## Dialog

`role="dialog"` + `aria-modal="true"`, labelled by its own heading via
`aria-labelledby`. On open, move focus in; trap it while open; on close, return
it to the element that opened the dialog — which requires having kept a ref to
that element. Escape closes. Every visual way to dismiss (backdrop click, drag)
needs a keyboard equivalent.

## Loading and async

Announce state changes on the region that changed, not globally. `aria-busy` on
the control covers "this button is working". A separate polite live region is for
outcomes ("3 items saved"), and duplicating both for the same event makes some
screen readers announce it twice.
