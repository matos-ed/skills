# Onboarding / Stepped Data-Collection Patterns

Read when building a multi-step data-collection flow (onboarding, anamnesis-style intake, signup wizard) — not for single-screen forms. Stack-agnostic: adapt the shapes below to whatever framework/styling system the target project uses.

---

## One field per step drives engagement

Validated in production (Oráculo Astral's visitor onboarding, 2026-07): splitting a single long form into **one field (or tightly-coupled field pair) per step** measurably increases perceived guidance and completion — more taps, but each tap feels like progress instead of friction. Prefer this over a single scrollable form whenever the data being collected doubles as a "getting to know you" moment (not just a technical requirement).

### Per-step layout (top → bottom)

1. **Progress indicator** — total steps visible, current position highlighted. Dots for ≤5 steps, a bar for more — dots become visual noise past ~6.
2. **Title** — short, conversational, phrased as a question when it fits ("Quando você nasceu?" not "Data de nascimento").
3. **Help text** — one line explaining *why this field is being asked*, not what it is. This is the single highest-leverage trust-building element in the whole flow; never skip it.
4. **The input** — centered, one concern only.
5. **Primary CTA** — advances. Disable until the step's minimum requirement is met (don't gate on data that's genuinely optional).
6. **Optional secondary action** — a de-emphasized button for an alternate path the user might need: "I don't know" (supply a sane default and advance), "Skip" (for optional fields), etc. Only add this when the step has a real escape hatch to offer — don't pad every step with a redundant "Skip" next to an already-optional primary CTA unless the design spec calls for the affordance consistently.

### Transitions and navigation

- Animate step changes (slide + fade in the direction of travel) using the project's existing motion primitives — a hard cut between steps undercuts the "guided" feel this pattern exists to create.
- Provide **two ways back**: an explicit back control (chevron/button) always, plus a coarse swipe-to-go-back recognizer if the platform doesn't already have a dedicated gesture library installed — build it threshold-based from primitives already available, don't add a new gesture dependency just for this affordance. Note the simplification to the user if the ask was for a full interactive drag (Stories-style).
- Hold all step state in one parent component/store, not per-step routes — keeps back/forward instant and avoids re-fetching between steps.

### Ritual loading screen after the last step

When the flow ends in a real async operation (account creation, a computed result), don't just show a spinner — treat the wait as part of the experience:

- Rotate 4-6 short status messages (~1.2-1.5s each) that narrate what's "happening" ("Calculating…", "Putting it all together…") instead of one static "Loading…" string.
- Enforce a **minimum display duration** (sum of the message rotation, typically 7-10s) even if the real request finishes faster — advance only when both the minimum ritual time *and* the real request have completed. This is a deliberate UX trade-off (perceived value > raw speed); confirm with the user before applying it if the operation is already slow enough that adding delay would frustrate rather than delight.
- Pair it with a small looping decorative animation built from the project's existing animation primitives — not a new asset pipeline — and respect reduced-motion (freeze to the final/static state, keep the message rotation since that's still useful information, not just decoration).
