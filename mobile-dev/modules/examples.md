# Examples

Worked patterns. Read on demand — never inline these in AGENT.md. Adapt to the project's libs and conventions.

---

## Typed API client + zod boundary (`src/lib/api.ts`)

```ts
import { z } from "zod";
import { env } from "./env";

async function request<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  init?: RequestInit,
): Promise<z.infer<T>> {
  const res = await fetch(`${env.EXPO_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return schema.parse(await res.json()); // validate at the boundary
}

export const userSchema = z.object({ id: z.string(), name: z.string() });
export const getUser = (id: string) => request(`/users/${id}`, userSchema);
```

## Server state with React Query (not a global store)

```ts
export function useUser(id: string) {
  return useQuery({ queryKey: ["user", id], queryFn: () => getUser(id) });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user", id] }),
  });
}
```

Screen consumes the hook and renders all states:

```tsx
const { data, isLoading, isError, refetch } = useUser(id);
if (isLoading) return <ScreenSkeleton />;        // visuals → rn-ui-builder
if (isError) return <ErrorState onRetry={refetch} />;
return <Profile user={data} />;
```

## zustand store with narrow selectors

```ts
export const useAuth = create<AuthState>((set) => ({
  user: null,
  signIn: (user) => set({ user }),
  signOut: () => set({ user: null }),
}));

// consume narrowly so unrelated changes don't re-render:
const user = useAuth((s) => s.user);
```

## expo-router: auth gating in a root layout

```tsx
// app/_layout.tsx
export default function RootLayout() {
  const user = useAuth((s) => s.user);
  return (
    <Stack>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
```

Pass an **id**, not an object: `router.push({ pathname: "/user/[id]", params: { id } })`, then read it with `useLocalSearchParams` and fetch from the store/query.

## Permission at point of use

```tsx
const [permission, requestPermission] = Camera.useCameraPermissions();

if (!permission) return null;            // still loading
if (!permission.granted) {
  return permission.canAskAgain
    ? <Button title="Allow camera" onPress={requestPermission} />
    : <Button title="Open Settings" onPress={() => Linking.openSettings()} />;
}
return <CameraView />;
```

## Performant list (FlashList)

```tsx
const renderItem = useCallback(({ item }: { item: Row }) => <RowCard row={item} />, []);

<FlashList
  data={rows}
  renderItem={renderItem}
  keyExtractor={(r) => r.id}     // stable, non-index
  estimatedItemSize={72}
/>
```

`RowCard` is `React.memo`'d and takes only primitive/stable props.

## Reanimated worklet (off the JS thread)

```tsx
const offset = useSharedValue(0);
const style = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
// offset.value = withTiming(100) animates on the UI thread, no JS-thread re-render
```
