# Examples

A worked screen build from spec. Read for a concrete reference. Apply during **steps 3–4 (Build / States)** of the workflow.

---

## From spec → screen (habit tracker home)

Given the tokens already wired into `tailwind.config.js`, compose the screen mapping the layout tree 1:1 and implementing every state.

```tsx
// HomeScreen.tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text } from 'react-native';
import { HabitCard } from './HabitCard';
import { ProgressRing } from './ProgressRing';

type Habit = { id: string; name: string; streak: number; done: boolean };
type Props = { status: 'loading' | 'error' | 'ready'; habits: Habit[]; onToggle: (id: string) => void; onRetry: () => void };

export function HomeScreen({ status, habits, onToggle, onRetry }: Props) {
  const doneCount = habits.filter((h) => h.done).length;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-6 px-5 py-4">
        <Text className="text-3xl font-bold text-foreground">Good morning</Text>

        {status === 'loading' && <Skeleton />}
        {status === 'error' && <ErrorBanner onRetry={onRetry} />}

        {status === 'ready' && (
          <>
            <ProgressRing value={doneCount} total={habits.length} />
            <Text className="text-base font-semibold text-foreground">Today</Text>

            {habits.length === 0 ? (
              <EmptyState />
            ) : (
              <View className="gap-3">
                {habits.map((h) => (
                  <HabitCard key={h.id} {...h} onToggle={() => onToggle(h.id)} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Skeleton() {
  return (
    <View className="gap-3">
      <View className="size-40 self-center rounded-full bg-surface" />
      {[0, 1, 2].map((i) => <View key={i} className="h-16 rounded-2xl bg-surface" />)}
    </View>
  );
}

function EmptyState() {
  return (
    <View className="items-center gap-2 py-12">
      <Text className="text-base text-muted">No habits yet</Text>
      <Text className="text-sm text-muted">Add your first habit to get started.</Text>
    </View>
  );
}

function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-surface p-4">
      <Text className="text-sm text-danger">Couldn't load habits.</Text>
      <Text onPress={onRetry} accessibilityRole="button" className="text-sm font-semibold text-primary">Retry</Text>
    </View>
  );
}
```

### What this demonstrates

- **Token-only styling** — every color/radius is a semantic class.
- **All states present** — loading skeleton matching real shape, empty, error-with-retry, ready.
- **1:1 with the spec tree** — header → ring → section title → list of cards.
- **Composable & typed** — leaf `HabitCard`/`ProgressRing` imported; helpers are small and local.
