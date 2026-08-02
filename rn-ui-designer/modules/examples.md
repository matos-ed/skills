# Examples

Worked design specs. Read when you want a concrete reference for the Output Format. Apply during **step 5 (Approval)** of the workflow.

---

## Example — "Habit tracker home screen"

### Concept
Calm, focused dark UI. The organizing idea: **one glanceable progress ring** dominates; everything else recedes. Premium, low-saturation, a single violet accent for "done today".

### Tokens
| Token | Value | NativeWind key |
| --- | --- | --- |
| color.bg | #0B0B0F | bg-background |
| color.surface | #16161D | bg-surface |
| color.border | #26262F | border-border |
| color.primary | #6D5EF6 | bg-primary / text-primary |
| color.foreground | #F5F5F7 | text-foreground |
| color.muted | #9A9AA6 | text-muted |
| space.screen | 20 | px-5 |
| space.section | 24 | gap-6 |
| radius.card | 16 | rounded-2xl |
| type.display | 32/40 700 | text-3xl font-bold |
| type.body | 16/24 400 | text-base |

### Layout
```
SafeAreaView (bg-background, px-5)
└─ ScrollView (gap-6)
   ├─ Header  → Greeting (display) | DateChip
   ├─ ProgressRing (hero, centered, primary) | caption "3 of 5 done"
   ├─ SectionTitle "Today"
   └─ HabitList
      └─ HabitCard (surface, rounded-2xl, p-4)  → Icon | Name + streak | Checkbox
```
- Vertical scroll; cards full-width with `gap-3` between.
- **States** — Loading: skeleton ring + 3 skeleton cards. Empty: ring at 0 + "Add your first habit" CTA. Error: inline retry banner above list. Success (habit checked): card animates, ring fills.

### Handoff
- Build order: tokens → `HabitCard` → `ProgressRing` → `HomeScreen` composition.
- Open question: tablet two-column layout in scope? Assume phone-only unless told otherwise.

> Approve this spec, or tell me what to change, before I hand it to rn-ui-builder.
