# Testing

## Query by role and accessible name

```tsx
screen.getByRole('button', { name: 'Salvar' })
```

This is the highest-value habit available: the query resolves through the same
accessible name computation a screen reader uses, so it fails when the semantics
break. `getByTestId` passes forever, including after someone deletes the label.

Corollary: if you cannot write the query without a test id, the control probably
has no accessible name — that is the finding, not an inconvenience.

## Assert the contract, not the implementation

Test what the user experiences:

```tsx
expect(button).toHaveAttribute('aria-busy', 'true')
expect(button).not.toBeDisabled()      // focus must survive the async action
button.focus()
await userEvent.click(button)
expect(handleClick).not.toHaveBeenCalled()
expect(button).toHaveFocus()           // the actual regression being prevented
```

Note that `toBeDisabled()` checks the **native attribute only** — it ignores
`aria-disabled`. That is useful: the two assertions distinguish the two
conventions, so a test can pin down which one a component uses.

## Existing tests encode existing bugs

When you fix an accessibility defect, expect the current suite to fail. A test
asserting `toBeDisabled()` on a loading button is asserting the bug. Update it and
say so in the commit — do not work around it, and do not report the change as
"tests passed unchanged" when it required an edit.

## Keyboard tests, per pattern

- Native button: Enter and Space both activate. If you had to write a handler for
  that, delete the handler.
- Non-native control: test Enter **and** Space separately. Space failing while
  Enter works is the usual half-implementation.
- Roving tabindex: assert exactly one item has `tabIndex=0`, then that Arrow keys
  move it and Tab exits the group.
- Dialog: assert focus lands inside on open and returns to the trigger on close.

## Automated auditing, and its ceiling

`axe-core` (via `jest-axe`, or the Storybook a11y addon) catches contrast,
missing names, and invalid attribute combinations cheaply. Add it — but know the
ceiling: axe evaluates a rendered tree. It will not tell you the tab order is
illogical, that focus was lost, that the announcement is misleading, or that a
role is wrong-but-valid. Those need a keyboard and a screen reader.

Treat a clean axe run as the floor, never as the deliverable.

## Minimum manual pass before shipping a control

1. Tab to it. Is the focus ring visible against its own background?
2. Operate it by keyboard alone, including its disabled and loading states.
3. Turn on a screen reader and listen to name, role, and state.
4. Zoom to 200%. Does it still fit and stay operable?
