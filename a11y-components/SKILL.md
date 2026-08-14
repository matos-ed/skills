---
name: a11y-components
description: Make interactive web components actually operable — buttons, menus, tabs, dialogs, toggles. Use when building or reviewing a clickable control, when a component wraps Radix/Headless UI, or when auditing a design system for accessibility gaps that linters cannot see.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
argument-hint: "[component or path to build or audit]"
---

# Accessible Interactive Components

Most accessibility bugs in a component library are not exotic. They are the same
dozen mistakes, repeated once per component, because each component reimplements
its own baseline. The fix is a shared primitive plus a checklist for what the
primitive cannot own.

## Start here

**Building a control?** Read `modules/patterns.md` for the target pattern, then
`modules/checklist.md` before you call it done.

**Auditing existing code?** Work `modules/checklist.md` top to bottom — it is
ordered by how often each defect appears and how much it costs. Report findings
with `file:line` and the concrete failure, never "improve accessibility".

**Component wraps Radix / Headless UI / Ark?** Read `modules/radix-pitfalls.md`
first. Composition-based libraries move the semantics somewhere you are not
looking, and the resulting bugs pass every linter.

**Writing tests?** `modules/testing.md`. Query by role and accessible name, so
the test fails when the semantics break.

## Non-negotiables

1. **Use the native element.** A `<button>` is free keyboard support, focus
   behaviour, and role. Every `role="button"` on a `div` is a promise you now
   have to keep by hand — and usually don't.
2. **One disabled convention, chosen deliberately.** Native `disabled` removes
   the control from the tab order, so screen reader users cannot find it and
   tooltips never fire. `aria-disabled` keeps it reachable but you must block
   activation yourself. Pick per case; never emit both attributes.
3. **Never take focus away from the user mid-action.** Making a button natively
   `disabled` while its request is in flight drops focus exactly when the user
   just acted. Use `aria-busy` and keep it focusable.
4. **Every control has an accessible name.** Icon-only buttons are where this
   dies, and it is precisely where linters go quiet, because `children` is a
   variable they cannot evaluate.
5. **Focus must be visible.** One shared `:focus-visible` definition, not one
   per stylesheet — duplicated rings drift apart and some end up invisible.

## Do not

- Trust `eslint-plugin-jsx-a11y` as coverage. It reads JSX literals, so it
  cannot see a missing name behind a prop, or an invalid role nesting built from
  two different files.
- Add ARIA to describe something the DOM already says. Redundant ARIA is a
  maintenance cost that eventually contradicts the element.
- Ship `role` and `tabIndex={-1}` together with no key handler. That combination
  announces a control and then refuses to be one.
