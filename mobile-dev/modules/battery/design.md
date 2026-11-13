# Designing the Comparison

Read at battery step 1. Decide what is being compared before touching the device — most failed battery tests
fail here, not in the measurement.

## A comparison needs two identical windows

Everything must match except the one variable: same device, same duration, same screen regime, same
app screen, same network type, similar starting battery level and temperature. A window that differs
in two things measures nothing.

## Regime is not a detail — it changes which costs exist

| Regime | What dominates | What becomes free |
| --- | --- | --- |
| Screen off (background) | Wakelocks, network-location scans, alarms | Screen |
| Screen on (foreground) | Screen, then GPS | **Wakelocks** — CPU is already awake, holding it costs nothing |

Consequence: a fix that removes a wakelock shows a large gain with the screen off and **zero** gain
with the screen on. Pick the regime that matches how users actually run the app, and state it.

## Window duration

Per-uid counters are exact, so they do not need long windows to be readable. The device-level charge
counter does: it moves in quantized steps (commonly ~3705 µAh), so a short window carries a large
rounding error. 15 min is enough when per-uid counters are the metric; 30 min makes the support
metric usable too.

Whatever you choose, **use the same duration for every window in the comparison** — even if a run
gets cut short, rerun it rather than compare unequal windows.

## Ask what the measured variable can possibly be worth

Before running, estimate the ceiling. If the variable only affects network, and network is ~0.4% of
the app's consumption, no window length will make a transport difference visible in mAh. That is not
a failed test — it is the answer, and it is worth stating up front so nobody reruns it hoping for a
different number.

When the effect is expected to be below the noise floor, shift the deliverable: compare the **exact
counters** the variable touches (bytes, packets, wakeup alarms, radio-active time) rather than mAh.
Those are precise even when the energy difference is not measurable.

## Confounders to fix before starting

| Confounder | Handling |
| --- | --- |
| Incoming calls, notifications | Enable Do Not Disturb |
| Screen timeout shorter than the window (foreground runs) | Extend it, restore afterwards |
| Device warm from charging | Wait for temperature to settle; record it per sample |
| Battery level far apart between windows | Keep windows close in level; note the gap |
| Background sync from unrelated apps | Per-uid metric handles it; note that radio piggybacking can still shift attributed radio time |
| A streaming `adb logcat` | Kill it — it keeps the link and CPU awake and blocks deep sleep |

## What the test will not measure

State these limits in the report, because they are how results get misused later:

- Idle channel cost is not message-processing cost — if no real events flowed, that part is unmeasured
- Wi-Fi results do not transfer to cellular; the radio profile differs
- One device, one OS version, one battery age
