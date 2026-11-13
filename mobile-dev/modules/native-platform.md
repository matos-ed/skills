# Native & platform

Native/Expo capabilities, permissions, platform differences, and builds. Apply during **step 3 (Native & platform)** — only when the task touches a device capability, platform-specific behavior, or release.

---

## Add native capability the Expo way

- Install with `npx expo install <pkg>` (not bare `npm install`) so the native version matches the SDK.
- Prefer **Expo modules** (`expo-camera`, `expo-notifications`, `expo-image-picker`, `expo-location`…) over unmaintained community wrappers.
- A library with native code needs a **dev build** (`npx expo run:ios|android` or an EAS dev build) — it will **not** work in Expo Go. State this when a task pulls one in.
- Config that affects the native project (permissions strings, URL schemes, plugins) goes in `app.config.ts` via **config plugins**, never by hand-editing `ios/`/`android/` (CNG regenerates them).

## Permissions

- Request **at point of use**, with rationale, not all at launch. Use the hook form (`Camera.useCameraPermissions()`) where provided.
- Always handle **denied / undetermined**, including "blocked" (must deep-link to Settings) — not just granted.
- Declare purpose strings in `app.config.ts` (`ios.infoPlist` `NS*UsageDescription`, `android.permissions`); a missing iOS usage string crashes on request.

## Platform-specific code

- Branch with `Platform.OS === 'ios'` / `Platform.select({...})` for small differences; use **platform extensions** (`file.ios.tsx` / `file.android.tsx` / `file.web.tsx`) for whole-component splits.
- **Safe areas** — wrap with `react-native-safe-area-context` (`useSafeAreaInsets`); never hardcode status-bar/notch padding.
- **Keyboard** — `KeyboardAvoidingView` (`behavior` differs per OS) or `react-native-keyboard-controller`.
- **Web** — Expo supports RN Web, but native-only modules need a `.web` fallback or a guard; verify a feature exists on web before assuming it.
- **Back button / gestures** — Android hardware back (`BackHandler`) and iOS swipe-back differ; let the router own it where possible.

## Builds & release (EAS)

- `eas build` produces store binaries; **`eas.json`** defines `development` (dev client), `preview` (internal), and `production` profiles.
- **OTA updates** via `expo-updates` / `eas update` ship JS-only changes; anything touching native code or the SDK needs a **new store build**. Don't try to OTA a native change.
- Bump `version` + native `ios.buildNumber`/`android.versionCode` per store submission.
- Secrets for builds live in **EAS secrets / env**, never committed.
- Sanity-check on a **release-mode dev build** before submitting — debug-only behavior (slow lists, dev warnings) hides real perf.
