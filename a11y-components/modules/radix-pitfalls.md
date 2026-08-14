# Composition libraries: Radix, Headless UI, Ark

These libraries are the right choice. They also relocate the semantics away from
the file you are reading, which produces a specific family of bugs that no linter
finds.

## `asChild` merges props onto a child you may not control

`<Trigger asChild>{child}</Trigger>` clones `child` and injects `aria-expanded`,
`aria-haspopup`, `id`, `disabled`, and handlers. Consequences:

- **Reading the child's file tells you nothing.** A trigger `<button>` with no
  ARIA attributes in source may be fully wired at runtime — or not wired at all.
  Verify in the browser accessibility tree, not in the JSX.
- **A `<div>` child gets the attributes and none of the behaviour.** Radix can
  inject `aria-expanded` onto anything; it cannot make a div focusable or
  keyboard-operable. A component that accepts an arbitrary `trigger` node is
  accepting arbitrary accessibility.
- **Prop merge order is the library's, not yours.** `disabled` passed to the
  primitive and `disabled` on the child are not guaranteed to agree. Do not set
  the same attribute in both places.
- **`type="button"` is still yours.** Radix does not add it. A trigger inside a
  form submits it.

Guard the arbitrary-trigger case explicitly: if your component takes a `trigger`
prop, either document that it must be a focusable control, or wrap it in your own
button primitive rather than passing it through.

## Do not add your own role inside a library primitive

The library's `Item` already renders `role="menuitem"`. If your inner component
sets `role="option"` and `aria-selected`, you have nested listbox semantics inside
a menu — invalid, and announced inconsistently.

This bug lives in the *composition*: file A renders the primitive, file B sets the
role, and each file is locally reasonable. Reviewing one file at a time will never
find it. When auditing, grep for `role=` in components and check what renders them.

The same applies to state: menus convey selection through `aria-checked` and
`data-state`, not `aria-selected`. Follow the primitive's model instead of
layering a second one on top.

## Controlled state must reach ARIA

When you lift `open` state out of the primitive, confirm `aria-expanded` still
tracks it. A controlled component that renders its own trigger — rather than
passing one through `asChild` — commonly loses the attribute entirely.

## Styling hooks are not state

`data-state="open"` is for CSS. It is not announced. Styling from `data-state` is
correct; relying on it *instead of* `aria-expanded` is not.

## What to actually verify

1. Open the browser accessibility tree — not the DOM — and read the control's
   name, role, and state.
2. Tab through the whole flow. Open, navigate, close. Confirm focus returns to
   the trigger on close.
3. Test with a real screen reader for the composed pattern (VoiceOver: Cmd+F5).
   Automated tooling checks attributes; only listening catches "announced as a
   menu item when it is meant to be a selectable option".
4. If the component accepts a custom trigger, run all of the above with a `<div>`
   trigger. That is the configuration consumers will actually ship.
