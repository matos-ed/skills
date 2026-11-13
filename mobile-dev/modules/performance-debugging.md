# Performance & debugging

Keep the app smooth, find the cause of jank, and verify before shipping. Apply during **step 4 (Performance & debugging)** and **step 5 (Self-check)**.

---

## Lists — the #1 perf source

- Use **`FlashList`** (Shopify) or a well-configured `FlatList`; never `.map()` a large array inside a `ScrollView` (renders everything, no recycling).
- Stable, non-index `keyExtractor`. Index keys break recycling and cause wrong-item state.
- Memoize `renderItem` and its row component (`React.memo`); give `FlatList` `getItemLayout` when rows are fixed-height.
- Set `estimatedItemSize` (FlashList) / tune `windowSize`, `maxToRenderPerBatch` for long lists.

## Re-render hygiene

- A parent re-render cascades to children unless they're `memo`'d with stable props. Wrap callbacks in `useCallback`, derived objects in `useMemo` — but only where a memoized child or dependency array actually consumes them.
- **Select narrowly** from stores (`useStore(s => s.count)`), not the whole store. Split Context into value vs. dispatch.
- Don't create inline objects/arrays/functions as props to memoized children (defeats the memo).
- Lift expensive work off the JS thread: animations via **Reanimated** (worklets, runs on UI thread) and gestures via **react-native-gesture-handler**, not `Animated` + JS-driven state.

## Other hotspots

- **Images** — `expo-image` (caching, downsampling) over `<Image>`; size sources to display size; avoid huge bitmaps.
- **Bridge/JS thread** — batch state updates; avoid heavy synchronous work in render or on scroll.
- **Memory** — clean up listeners, timers, and subscriptions in `useEffect` cleanup; cancel in-flight requests on unmount.

## Debugging

- **React Native DevTools** (Hermes debugger) for breakpoints/console; **Reactotron** or React Query Devtools for state/network.
- Profile re-renders with the React DevTools Profiler / `why-did-you-render`.
- Reproduce perf issues in a **release/production build** — dev mode is much slower and hides the real picture.
- Read the **native logs** (`npx expo run:android` logcat / Xcode console) for native crashes that the JS error overlay won't show.

## Self-check (run before reporting)

```
[ ] Matches the project's existing SDK, router, and state/data libs (no parallel stack)
[ ] Screens thin; logic in hooks/stores; feature-first structure
[ ] Server data via React Query/SWR (not stuffed in a global store)
[ ] Navigation params typed; ids passed, not objects; auth gated in a layout
[ ] API responses validated at the boundary; typed seams (no untyped JSON leaking)
[ ] Async surfaces handle loading/empty/error(+retry)/success
[ ] Secrets never in the JS bundle; env validated; EXPO_PUBLIC_* used correctly
[ ] Native libs installed via `expo install`; dev-build need + permissions/usage strings stated
[ ] Permissions requested at use; denied/blocked handled
[ ] Long lists use FlashList/FlatList with stable keys + memoized rows
[ ] No needless re-renders (narrow selectors, stable props, memo where it pays)
[ ] Listeners/timers/requests cleaned up on unmount
[ ] Verified via `npx expo start` (or a release dev build for perf); visuals handed to rn-ui-builder
[ ] Runtime change verified on Android and iOS (modules/automated-local-tests.md) — or the skip is stated with its reason
```
