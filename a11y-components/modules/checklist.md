# Checklist, ordered by how often it actually breaks

Each item names the symptom, how to find it, and what the user experiences. All
of these were found in a real production design system audit; none of them were
caught by lint or by the existing test suite.

## 1. Missing `type="button"`

**Grep:** every `<button` in the codebase, then check which lack `type`.

A button with no `type` inside a `<form>` defaults to `type="submit"`. A "clear
filter" or "toggle password" button silently submits the form. This is the single
most common defect and the cheapest to fix.

Watch for the inconsistency pattern: a library where 8 of 10 buttons set `type`
and the 2 that don't are the *most reused* ones — a base Button and a Dropdown
trigger. The exceptions are always the components that were written first.

## 2. `loading` implemented as native `disabled`

**Grep:** `disabled={.*loading` / `disabled={isLoading` / `disabled || loading`.

Native `disabled` removes the element from the tab order. The user pressed Enter,
so focus was on the button; now focus falls to `<body>`. Screen readers announce
nothing, and the next Tab restarts from the top of the page.

Correct: `aria-busy="true"`, keep it focusable, block activation in the handler.

## 3. Disabled convention divergence

**Grep:** `aria-disabled` and compare against `disabled` in the same components.

Three variants usually coexist: native only, both attributes together, and
delegated to a library. Both-together is redundant, not harmful. The real
question is which controls need to stay discoverable while unavailable — those
need `aria-disabled` *and* a handler guard, because ARIA does not block anything.

## 4. Icon-only control with no accessible name

**Why lint misses it:** `jsx-a11y/control-has-associated-label` evaluates JSX
literals. With `<Button icon={<X/>}>{children}</Button>` it cannot know whether
`children` renders text.

Catch it at runtime instead: in development, if there is no text in children and
no `aria-label` / `aria-labelledby` / `title`, log an error. Walk nested children
so a wrapper like `<Text>Save</Text>` still counts, and stop at a depth limit and
assume a name exists rather than crying wolf.

## 5. `role="button"` + `tabIndex={-1}` + no key handler

**Grep:** `role="button"`, then check each for `onKeyDown` and tab order.
Also grep for `eslint-disable.*click-events-have-key-events` — that comment is a
map to exactly these bugs, written by someone who knew.

The element claims to be a control, is not in the tab order, and has no keyboard
path. Mouse-only. Common in steppers, custom selects, and drag handles.

## 6. Invalid nested ARIA roles

**Grep:** components that set `role` on an element rendered *inside* another
library's primitive.

`role="option"` inside a `role="menuitem"` is not a valid pattern; listbox
semantics inside a menu are announced inconsistently or not at all. This bug is
invisible in a single file — it only exists in the composition of two files, so
no linter and no per-component test finds it. It needs the tree, i.e. either a
browser accessibility inspector or reading both files together.

## 7. Focus ring duplicated per stylesheet

**Grep:** `:focus-visible` across all stylesheets and diff the declarations.

N copies drift. Some lose `outline-offset`, some get overridden by a later rule,
some end up with a color that fails contrast against their own background. One
shared mixin, included everywhere.

Related: a `button { outline: none }` reset anywhere in the codebase deletes the
default ring for everything it touches — check that every affected control got a
replacement.

## 8. Action-shaped element that is not operable

An element carrying an `aria-label` describing an action ("drag to close") with
no role, no `tabIndex`, and no handler. Screen readers announce an affordance
that keyboard users cannot use. Either make it a real control, or drop the label
and provide an operable alternative.

## 9. Empty ARIA references

**Grep:** `aria-describedby={.*join` and similar computed values.

`describedBy.join(' ')` yields `aria-describedby=""` when the list is empty. Emit
`undefined` instead. Harmless in most screen readers, but it is the tell that ID
wiring was never verified — check the referenced IDs actually exist too.

## 10. No ref forwarding on components that manage focus

A dialog, dropdown, or popup whose consumer cannot get a DOM handle also cannot
restore focus after close. Focus management is the consumer's job as often as the
component's; without a ref, it is nobody's.
