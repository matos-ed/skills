---
name: side-by-side
description: Build an interactive side-by-side artifact that lets non-engineers judge a UI change — before vs after, or two candidate designs. Use when the user wants to compare UI variants, show a visual change to the team or business, or decide between design options.
---

# Side-by-side

A UI change described in prose gets argued about. The same change shown running, next to what it replaces, gets decided. This skill produces one page where both variants answer a single control, so the difference is the only variable in the room.

## 1. Fix the baseline

Derive the "before" from **committed code** — `git show <ref>:<path>` — not from the working tree and not from memory. A working tree carries your own half-finished edits, and a remembered behaviour is a guess wearing a fact's clothes. Attributing your own regression to the baseline discredits the whole page.

Read the real source for both variants and record the file and line behind each behaviour.

**Done when:** every behaviour you intend to show traces to a source location, and each "before" behaviour was read out of a commit rather than the checkout.

## 2. Choose the axis

- **Before vs after** — a change that is already decided, shown for validation.
- **Variant A vs variant B** — a design decision still open.

Fixes belong on the before/after axis. Putting a known defect in a control group is not an experiment.

**Done when:** the axis is named, and any open design decision is stated separately from the fixes.

## 3. Organise by situation, not by defect

The unit of the page is a **situation**: a moment where someone is doing something specific. *The partner opens and closes the menu.* *The partner leaves the order manager.* Never *the padding animation* or *the z-index fix* — a list of defects reads as an engineering changelog and the judge cannot picture any of it.

Name each situation by the action and give it context: who, on what screen, doing what. Then restate its difference as the symptom that person experiences — *the title jumps*, not *the flex row reflows*. A difference with no observable symptom does not earn a situation.

Separate the defects from the matters of taste, and say which is which. The judge needs to know whether they are being informed or asked.

**Done when:** every situation is named by an action a non-engineer performs, and each carries one symptom they can spot unaided.

## 4. Build each situation as a passage

Per situation, in reading order: the context, one play button, **today's version, then the new one directly below it**, each captioned with what just happened.

Stacking beats a two-column split for this audience: the page reads as a narrative rather than a control panel, and the caption sits with the thing it describes. Both variants still answer the *same* button at the *same* moment — separate controls destroy the comparison, because the eye cannot hold two moments apart.

- **Slow motion**, offered once at the top. Interaction-scale motion lives at 150–300 ms and cannot be judged at 1×.
- **Reveal the invisible.** Hit areas, stacking, and overlays the user cannot see are precisely what needs drawing.
- **Same content, same scale** in both variants, so nothing but the variant differs.
- **Let them act** where the symptom is about input rather than motion — a blocked tap is understood by tapping and getting nothing, not by watching.

**Done when:** each situation plays both variants from one button, every caption states what just happened, and each symptom from step 3 is reachable.

## 5. Write for the judge

The reader decides; they do not maintain the code. Name the symptom, then its consequence for the person doing the work — *they tap again, harder, and conclude the panel froze*. Keep the technical trace in a footnote or a linked document.

**Done when:** the copy addressed to the judge carries no property names or framework terms, and defects read as defects while open decisions read as questions.

## 6. Verify, then publish

- The variants are **recreations**. Say so on the page: a viewer who takes them for the real product will trust them past what they can bear.
- A performance claim gets measured on the page, with the honest number reported — including when the variants tie. A tie that scales apart under load is itself the lesson.
- Confirm tag balance and script syntax before publishing.

**Done when:** the recreation is disclosed, every claim is demonstrated or measured on the page, and the page reads correctly in both light and dark themes.

## Reference

Write the page's copy in the audience's language, not the codebase's.

Load `artifact-design` before writing the page — it governs palette, type, and theming. Ground the palette in the product's own design tokens so the recreation reads as the product rather than as a mockup of it.

When the axis is an open design decision and the team needs to register opinions rather than just look, `artifact-capabilities` covers the shared state a vote requires.
