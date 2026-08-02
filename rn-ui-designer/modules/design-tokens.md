# Design Tokens

Turn art-direction decisions into concrete, copy-ready tokens mapped to NativeWind. Apply during **step 4 (Design tokens)** of the workflow.

---

Tokens are the contract between designer and builder. Emit them as a table of `name → value → NativeWind key` so `rn-ui-builder` can wire them into `tailwind.config.js` with zero guesswork.

## What to emit

- **Colors** — Every hue with a hex value and a semantic name. Map to a `colors` extension key, not raw classes. Include the neutral ramp and semantic set.
- **Spacing** — The base scale. NativeWind's default `4 = 16px` already follows a 4pt grid; only extend if the design needs custom steps.
- **Radii** — Map the radius scale to `rounded-*` keys (`borderRadius` extension).
- **Typography** — Size + line-height + weight per ramp step, mapped to `text-*` / `font-*` (extend `fontSize` for custom pairs).
- **Shadows/elevation** — Named recipes if the design uses shadows.

## NativeWind theme mapping

Emit a ready-to-paste `tailwind.config.js` `theme.extend` block, e.g.:

```js
// tailwind.config.js → theme.extend
{
  colors: {
    background: '#0B0B0F',
    surface: '#16161D',
    border: '#26262F',
    primary: '#6D5EF6',
    foreground: '#F5F5F7',
    muted: '#9A9AA6',
    success: '#2FBF71', warning: '#E6A23C', danger: '#E5484D',
  },
  borderRadius: { xl2: '16px' },
  fontSize: { title: ['24px', { lineHeight: '32px' }] },
}
```

Then usage is `bg-background`, `text-foreground`, `rounded-xl2`, `text-title`.

## Rules

- **Semantic names, not literals** — `bg-primary`, never `bg-[#6D5EF6]` in components. Tokens live in config; components reference names. This is what makes restyling cheap.
- **One source of truth** — A token defined once in config; components never hardcode hex.
- **Dark mode** — If both themes, define both palettes and note the strategy (`dark:` variants or a theme provider). Verify contrast in both.
- **Completeness** — Don't leave a color/size used in the layout undefined. The builder should never have to invent a value.
