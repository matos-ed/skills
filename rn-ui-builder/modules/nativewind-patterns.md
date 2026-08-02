# NativeWind Patterns

How to write token-driven, composable RN UI with NativeWind. Apply during **steps 2–3 (Wire tokens / Build)** of the workflow.

---

## Token wiring (do this first)

Map the spec's tokens into `tailwind.config.js` so components reference names, not values:

```js
// tailwind.config.js
module.exports = {
  content: ['./App.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],
  theme: {
    extend: {
      colors: { background: '#0B0B0F', surface: '#16161D', border: '#26262F',
                primary: '#6D5EF6', foreground: '#F5F5F7', muted: '#9A9AA6',
                success: '#2FBF71', warning: '#E6A23C', danger: '#E5484D' },
      borderRadius: { '2xl': '16px' },
      fontSize: { title: ['24px', { lineHeight: '32px' }] },
    },
  },
};
```

**Rule:** components use `bg-primary`, `text-foreground`, `rounded-2xl` — never `bg-[#6D5EF6]`. One source of truth; restyling = edit config only.

## Component shape

- **Typed props** — `type Props = { ... }`; no `any`. Destructure with defaults.
- **className over style** — Use NativeWind `className`; reserve the `style` prop for dynamic values that can't be classes (animated values, computed sizes).
- **Single responsibility** — A `HabitCard` renders one card; the screen composes a list. Leaf → composite, bottom-up.
- **Forward refs / accessibility** — Add `accessibilityRole`, `accessibilityLabel`, and `hitSlop` for touchables.

```tsx
type HabitCardProps = { name: string; streak: number; done: boolean; onToggle: () => void };

export function HabitCard({ name, streak, done, onToggle }: HabitCardProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${streak} day streak`}
      className="flex-row items-center gap-3 rounded-2xl bg-surface p-4 active:opacity-80"
    >
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{name}</Text>
        <Text className="text-sm text-muted">{streak} day streak</Text>
      </View>
      <View className={`size-6 rounded-full border ${done ? 'bg-primary border-primary' : 'border-border'}`} />
    </Pressable>
  );
}
```

## Conditional & variant styling

- Keep conditional classes readable; for 3+ variants use a lookup map, not nested ternaries:

```tsx
const tone = { primary: 'bg-primary', danger: 'bg-danger', ghost: 'bg-transparent border border-border' }[variant];
```

- Press/disabled feedback via `active:` and `disabled:` variants or `opacity`.
- Dark mode: use `dark:` variants if the spec defines both themes.

## Layout idioms

- `SafeAreaView` (from `react-native-safe-area-context`) wraps screens.
- Fl: `flex-1`, `flex-row`, `items-center`, `justify-between`, `gap-*` (gap is supported — prefer it over margin chains).
- Lists: `FlatList`/`FlashList` for long data with `contentContainerClassName`; `.map` only for small static sets.
- Spacing snaps to the scale (`p-4`, `gap-6`) — no arbitrary `p-[15px]`.

## Motion (when the spec calls for it)

- Use `react-native-reanimated` (or Moti) for entering/layout/press animations. Keep durations short (150–250ms) and respect the spec's motion feel. Don't add motion the spec didn't ask for.
