# Reading the Numbers

Read at battery step 4. **Check the artifacts section before believing any delta.**

## Per-uid estimate — the headline

```bash
grep -m1 -A3 "UID u0aNNN" <run>-batterystats.txt
```

```
UID u0a550: 9.32 bg: 9.32
    cpu=0.00598 wifi=0.0363 wakelock=9.27 (28m 17s 987ms)
```

The first number is total mAh attributed to the app in the window. The terms that follow are the
breakdown — `wakelock`, `cpu`, `wifi`, `screen`, `gnss`, `sensors`, `camera`. Convert to a rate
(`mAh / hours`) so windows of different lengths stay comparable, and compare each app against
`UID 1000` (system) for a sense of scale.

## Detail lives in the full dump

The per-uid block of `<run>-batterystats-full.txt` has what the estimate summarizes:

```bash
awk '/^  u0aNNN:/{f=1} f&&/^  [a-z0-9]+:$/&&!/u0aNNN/{exit} f' <run>-batterystats-full.txt
```

Look for:

| Line | Meaning |
| --- | --- |
| `Wake lock <name>: <time> partial (<n> times)` | who held the CPU awake, and how often |
| `TOTAL wake: <blamed> blamed, <actual> actual` | blamed is what gets charged to the app |
| `Wakeup alarm *walarm*:<name>: <n> times` | scheduled wakeups |
| `Sensor GPS: <time> realtime` | GPS session duration |
| `Wi-Fi network: X received, Y sent (packets ...)` | bytes and packet counts |
| `Wifi Scan (blamed): <time> <n>x` | scans, usually location-driven |
| `WiFi Sleep/Rx/Tx time` | how long the radio was actually up |
| `Foreground activities` / `Top for` | how long the app was in front |

A wakelock printed with `(0 times)` and `running for <window-length>ms` was held continuously across
the whole window — it was acquired before the reset and never released.

## Two regimes, different physics

| Screen off | Screen on |
| --- | --- |
| Wakelocks dominate | Screen dominates, then GPS |
| GPS often not used at all — position comes from the network provider | GPS typically pinned on |
| — | **Wakelocks cost nothing**: the CPU is already awake, so blamed time stays near zero |

Never carry a conclusion from one regime into the other.

## Known artifacts — verify these before reporting a delta

**Missing `gnss` attribution.** Two windows can show the GPS sensor active for a similar or longer
duration, yet only one gets a `gnss=` power term. The other window then looks dramatically cheaper.
Always cross-check `Sensor GPS:` duration against the presence of a `gnss=` term. If sensor time is
equal or higher but the term is absent, the difference is attribution, **not** savings — say so
explicitly, because this artifact is larger than most real effects.

**`screen-on` / `screen-off` buckets can contradict reality.** The estimate splits terms into
`(on battery, screen on)` and `(screen off/doze)` buckets that may not match the actual measured
screen time — a window with 2s of real screen time can report minutes of "screen on" wakelock. Do not
use these buckets to factor out an interruption. Use the totals and the real `Screen on:` value.

**Charge counter quantization.** It moves in fixed steps (commonly ~3705 µAh). Over a short window
that is a large relative error. Use it only as a sanity check on the per-uid story.

**Radio piggybacking.** Radio-active time is charged to whoever woke the radio. Heavy background
activity from other apps can make the measured app look cheaper.

**Multiplexed channels hide channel counts.** A client that multiplexes N subscriptions over one
connection produces nearly identical traffic for 2 or 20 channels. Do not expect subscription counts
to show up in bytes.

## When the compared variable is below the noise floor

Say it plainly, and pivot to the exact counters — bytes, packets, wakeup alarms, radio-active time,
wakelock acquisitions. Those are precise, and a consistent difference across several independent
counters is real evidence even when the mAh difference is not measurable.

Then look for the *cause* rather than stopping at the correlation. A traffic difference between two
configs is frequently a debounce, poll interval, or retry policy attached to each path — a
configuration difference, not a property of the thing being compared. Check the code before crediting
the variable.
