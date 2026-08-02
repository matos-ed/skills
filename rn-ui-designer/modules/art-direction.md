# Art Direction

Choose one coherent visual concept. Apply during **step 2 (Art direction)** of the workflow.

---

The goal: make taste explicit. A model can't eyeball the result, so it must reason from principles and commit to specific values. Pick **one** organizing idea and let every choice serve it.

## Decide, in order

1. **Mood / concept** — Name it in 2–3 words (e.g. "calm clinical", "playful neobrutalist", "premium dark editorial"). Everything below flows from this.
2. **Color system** — Don't pick random colors. Define:
   - 1 **brand/accent** hue, used sparingly for primary actions only.
   - A **neutral ramp** (5–7 steps) for backgrounds, surfaces, borders, text.
   - **Semantic** colors: success / warning / danger / info.
   - State the **theme** (light, dark, or both) and ensure text-on-surface contrast ≥ 4.5:1 (WCAG AA). Reject low-contrast pairings.
3. **Type ramp** — A modular scale, not arbitrary sizes. Define display / title / heading / body / caption with size, line-height, weight. Limit to one or two font families. Body ≥ 15px on mobile.
4. **Spacing rhythm** — A single base unit (4 or 8) and a scale (4, 8, 12, 16, 24, 32, 48). All padding/margins/gaps snap to it. Consistent rhythm is the #1 driver of "looks designed vs. amateur".
5. **Depth & shape** — Corner radius scale (e.g. 8 / 12 / 16 / full), border vs. shadow strategy, elevation levels. Keep radii consistent per component class.
6. **Motion feel** — One sentence: snappy/springy/subtle. Note key transitions (press feedback, screen-enter, list-item). Builder uses Reanimated/Moti — don't over-specify, just set the tone.

## Quality bars (self-check before moving on)

- **Hierarchy** — Can the user instantly tell the primary action / most important content? If everything is the same weight, fix it.
- **Restraint** — One accent color, ≤2 fonts, a tight radius set. Variety is not richness.
- **Contrast & legibility** — Every text/background pair meets AA. Touch targets ≥ 44×44.
- **Consistency** — Same spacing unit, same radii, same shadow recipe everywhere.

## Anti-patterns to avoid

- Many saturated colors competing for attention.
- Inconsistent spacing (15px here, 18px there) — snap to the scale.
- Pure black `#000` on pure white `#fff` for large surfaces; prefer near-black / off-white.
- Tiny body text or low-contrast gray-on-gray.
- Decorative shadows on flat designs (pick border OR shadow as the depth language).
