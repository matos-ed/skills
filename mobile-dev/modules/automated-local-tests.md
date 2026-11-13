# Automated local tests

Every mobile change with runtime effect ends with the branch running as a **release build** on an Android emulator and an iOS simulator, a scripted smoke flow passing on both, and the logs clean. Unit suites don't replace this: they mock the network and never exercise native code, the bundle or startup.

Read `local/` first: it holds the app's bundle ids, how to reach the stage environment, test coordinates and ready-made flows.

## 1. Builds in worktrees

- **Disk first.** An iOS release build needs ~6–8 GB free and an Android one ~2–3 GB. Check `df -h` before each build and abort under 2 GB instead of letting the machine fill up.
- Build from `origin/<branch>` in a worktree outside the repo (scratchpad), never in the user's checkout. When the base moved since the branch was cut, test what will land: a worktree at the base with `git merge --no-commit origin/<branch>`.
- `node_modules` in the worktree: **APFS clone** (`cp -c -R`), not a symlink — Metro can't resolve through symlinks.
- iOS in a worktree also needs the codegen output (`ios/build/generated`) copied and a `pod install`: `Manifest.lock` checksums drift between checkouts and the build fails otherwise.
- Android: `cd android && ENVFILE=<env file> ./gradlew assembleRelease --console=plain`. Log to a file and check the exit code.
- iOS (simulator, no signing):
  ```bash
  xcodebuild -workspace <App>.xcworkspace -scheme <scheme> -configuration Release \
    -sdk iphonesimulator -destination 'id=<simulator udid>' -derivedDataPath <scratch>/ios-dd \
    ONLY_ACTIVE_ARCH=YES ARCHS=arm64 CODE_SIGNING_ALLOWED=NO COMPILER_INDEX_STORE_ENABLE=NO build
  ```
  Address the simulator by **udid**: newer Xcode versions may not resolve older runtime names.
- Run the unit suite on the same tree and report suites/tests/failures, plus suites already skipped in the code.

## 2. Devices

- Android emulator: `emulator -avd <avd> -read-only -memory 3072 -no-snapshot-save -no-boot-anim -no-audio`. `-read-only` lets several instances share one AVD without copying it; two instances is the safe ceiling on a 16 GB machine (three with 4 GB each swapped and froze).
- Prefer an AVD with 4 KB pages when profiling tools are involved (some segfault on 16 KB page images).
- Install with `adb install -r -d <apk>`; on iOS `xcrun simctl install <udid> <App>.app` and `xcrun simctl launch <udid> <bundle id>`.
- Set a location the stage environment covers: Android `adb emu geo fix <lon> <lat>` (longitude first), iOS `xcrun simctl location <udid> set <lat>,<lon>`.
- macOS has no `timeout`: wrap commands that can hang with `perl -e 'alarm 15; exec @ARGV' <cmd>`.
- The user may want the simulator minimized: no GUI clicks (`osascript`), drive everything through Maestro/ADB.

## 3. Smoke flow with Maestro

Maestro drives both platforms from one YAML file with automatic waits, no app-side setup and no credentials. Start from `templates/smoke.yaml`: launch with clean state → reach the environment the build should hit → guest/login → address → home → a list screen → relaunch.

Install without touching shell rc files: download the release zip with `gh release download` (the direct URL can 504 on large assets), verify the SHA-256, unzip into `~/.maestro`, run `~/.maestro/bin/maestro`. Disable telemetry with `MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true`.

```bash
maestro --device <udid or emulator serial> test smoke.yaml \
  --format junit --output out/report.xml --test-output-dir out
```

On failure, read `out/<timestamp>/smoke/commands.json` (status and error per step) and the last file in `screen-hierarchy/` (what Maestro could see) before changing the flow.

**Selector rules learned on React Native:**
- On iOS, RN bottom sheets and modals expose **one merged accessibility element**: buttons inside them are invisible to text selectors. Tap by position (`tapOn: point: "50%,82%"`) and guard it with `runFlow: when: visible: "<sheet title>.*"` so it only fires when the sheet is there.
- Cards merge their texts too: use regex selectors (`"Category name.*"`), not exact text.
- Gate optional screens with an alternation wait first — `extendedWaitUntil: visible: "(Warning.*|Next screen.*)"` — then the conditional `runFlow`.
- System prompts appear at different moments each run (iOS App Tracking Transparency): add an optional dismiss (`tapOn: text: Ask App Not to Track, optional: true`) both at launch and after the next screen.
- iOS location permission in `launchApp.permissions` takes `always`, `inuse` or `never` — `allow` fails.
- `hideKeyboard` is flaky: tap a neutral area of the header instead (`tapOn: point: "50%,14%"` + `waitForAnimationToEnd`).
- Wait for images and late data with `waitForAnimationToEnd` and a small swipe up/down before the screenshot you will show.
- Android `uiautomator dump` hangs on screens with a running spinner: navigate by screenshots (`adb exec-out screencap -p`) instead.

Keep the flow that passed: in the repo (`.maestro/`) if the team wants it, otherwise in `local/`.

## 4. Logs and startup

- Clear and capture logs around the flow: `adb logcat -c` before, `adb logcat -d > session.log` after. Count `FATAL EXCEPTION`, `ANR in`, JS errors (`ReactNativeJS` with `Error`) and any log line the change was supposed to remove.
- iOS: `xcrun simctl spawn <udid> log show --last 10m --predicate 'process == "<App>"'` and check the process is still alive.
- Logcat truncates lines around 4 KB: split long probe output across lines.
- **Cold start A/B** (when startup could change): install each APK in turn, then repeat `am force-stop <pkg>; sleep 3; am start -W -n <pkg>/.MainActivity` and take `TotalTime`. Use 6+ launches per build, interleave builds, report the median.
- In scripts that background emulators, `wait` only on the measurement PIDs — a bare `wait` also waits for the emulators forever. Never edit a shell script while it runs (bash reads it incrementally).

## 5. Report

| Check | Android (emulator model) | iOS (simulator, OS version) |
|---|---|---|
| Unit suite | suites / tests / failures (skipped) | — |
| Release build | size, notable build facts | builds and installs |
| Smoke flow | steps covered | steps covered, duration |
| Crash, ANR, JS error | count | count |
| Change-specific signal | e.g. log lines expected to disappear | same |
| Cold start (median of N) | branch vs base | — |

Then: what was found on the way (separate pre-existing behavior from regressions by checking the base), what was **not** covered, and what was left on the machine (tools installed, flows saved).

## 6. Cleanup

Remove worktrees (`git worktree remove`), derived data and APKs from the scratchpad, shut down emulators (`adb emu kill`) and simulators (`xcrun simctl shutdown <udid>`), and report free disk.

## OTA updates (when the app ships JS over the air)

- Check which backend the OTA tool's config actually targets: scripts that only swap the app's env file may still publish to production. Publish test bundles to a stage backend and a dedicated channel.
- Build the test APK first, then deploy the bundle: bundles older than the APK build are ignored.
