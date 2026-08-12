# Running the Windows

Read at step 3.

## The script

`scripts/run-battery-test.sh` runs one window end to end:

```bash
run-battery-test.sh <package> <nome-da-rodada> <minutos> <bg|fg> [dir-saida]
```

It refuses to start if the app is not running or the device is charging, waits for the screen state
the mode requires, resets `batterystats`, samples every 2 min, and collects all dumps on close. It
flags the window if the screen left the expected state or the app died.

Launch it detached so it survives the turn, and let it wait for the screen state rather than trying
to synchronize by hand:

```bash
nohup ./run-battery-test.sh com.example.app run1-flag-on 30 bg ./out > /dev/null 2>&1 &
```

Then tell the user what to do — put the app in the intended state and turn the screen off (or leave
it on for `fg`). The window opens itself.

## What each window produces

| File | Content |
| --- | --- |
| `<run>-samples.txt` | every 2 min: charge counter, level, temperature, instant current, screen state |
| `<run>-batterystats.txt` | `--charged <pkg>` — per-uid estimates |
| `<run>-batterystats-full.txt` | full dump, all uids — wakelock durations, sensors, network live here |
| `<run>-netstats.txt` | `netstats detail` |
| `<run>-logcat.txt` | buffer dump — crashes, errors |
| `<run>-conns.txt` | app's established connections at close |
| `<run>-conns-timeline.txt` | connections per sample, with socket inode and `bidir` |
| `<run>.log` | window boundaries, baseline, contamination warnings |

## During the window

Poll as little as possible. Every `adb shell` wakes the device; the 2 min cadence is a deliberate
compromise. Specifically:

- **Do not stream `adb logcat`** during a screen-off window — it holds the link and CPU awake and
  blocks deep sleep, which is exactly what you are trying to measure. Dump the buffer at the end
  instead (`adb logcat -d`); it persists.
- Reading local files and DNS lookups are free — do that work while waiting.

If the user reports an interruption, measure the damage instead of guessing: check whether the
process survived, how much screen time accumulated (`Screen on:` in the full dump), and whether the
accumulated consumption still tracks the other window. A 15s call in a 30 min window is noise; a
window where the app died has nothing left to measure.

## Discard rules

Discard and rerun when:

- the app process died mid-window
- the screen left the expected state for more than ~3% of the window
- a call or heavy interaction occurred (visible as a large `current now` spike and a temperature jump)

Keep the discarded samples — they document why the window was rejected, and the pre-interruption
portion is often a usable preview. Rename rather than delete.

## Restore the device

After the last window, restore anything changed:

```bash
adb shell settings put system screen_off_timeout <valor-original>
```

Tell the user how to end the ADB Wi-Fi session (`adb disconnect`, then turn off wireless debugging).
