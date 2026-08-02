# Layout Spec

Define the screen's structure and all of its states. Apply during **step 3 (Layout spec)** of the workflow.

---

A model builds wrong layouts when the structure is left implicit. Write it down as a tree, with intent per node.

## Structure

- **Component hierarchy** — Express the screen as an indented tree, top to bottom. Name each node and its role (e.g. `Header > Avatar | Title | Action`). The builder maps this tree 1:1 to components.
- **Flow vs. grid** — State the primary axis (vertical scroll is default on mobile), how items wrap, and column counts for any grid. Note `SafeAreaView` and scroll boundaries.
- **Spacing rhythm** — Reference the spacing scale from art direction. Specify section gaps, item gaps, and screen padding explicitly.
- **Alignment** — Where content aligns (leading-aligned text is usually right). Note any centered hero/empty states.

## States (specify every one that applies)

| State | What to show |
| --- | --- |
| Default | The populated, happy-path layout |
| Loading | Skeletons (preferred) or spinner; match the real layout's shape |
| Empty | Illustration/icon + one-line explanation + primary CTA |
| Error | Cause + a retry affordance, never a dead end |
| Success | Confirmation feedback (toast/inline), where focus lands next |

Leaving states unspecified is the most common cause of "needs human rework" — the model ships only the happy path. List them.

## Responsive & platform notes

- **Breakpoints** — Phone is the baseline; note tablet/landscape changes if relevant.
- **Insets** — Status bar, notch, home indicator, keyboard avoidance.
- **Touch ergonomics** — Primary actions within thumb reach; targets ≥ 44×44.
- **Platform diffs** — Any iOS vs. Android divergence (e.g. shadows vs. elevation).

## Hierarchy of attention

Rank the screen's elements 1→n by importance and make sure the layout's size, weight, color, and position reflect that ranking. The single most important element should win at a glance.
