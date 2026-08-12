# Reporting

Read at step 5. A battery report is read by people deciding whether to spend engineering time. Lead
with what dominates, not with the process.

## Window validity — classify every window

| Class | Meaning |
| --- | --- |
| **Válida** | screen state held, app alive, no interruption |
| **Válida com ressalva** | minor interruption quantified and shown not to move the totals |
| **Descartada** | app died, screen left state, or heavy interference — excluded from conclusions |

List the discarded windows too. A report that only shows successful runs hides how noisy the setup was.

## Structure

1. **Answer first.** One sentence on the question asked, one on what actually dominates.
2. **Method.** Device + OS version (`getprop ro.build.version.release` and `.sdk` — verify, never
   infer from code), app build, unplugged + ADB Wi-Fi, per-uid metric and why, window length.
3. **Chronology.** Every window with timestamps and its validity class.
4. **Results table.** Per window: app mAh, app mAh/h, device mAh/h. Normalize rates so unequal
   windows stay comparable.
5. **Breakdown per regime.** What the app's consumption is made of, as shares.
6. **The dominant cost, with its cause.** Name the wakelock, the sensor, the code path. Cite
   `file:line` for the mechanism.
7. **What the compared variable actually cost.** Give the share, even when it is negligible — that is
   the answer to the original question.
8. **Caveats and limits.** Artifacts found, what was not measured. This section is what stops the
   result from being misquoted later.
9. **Where to attack.** Ranked, with a projected gain where the model supports one.

## Rules for the numbers

- **Never report a raw delta as a saving without clearing the artifacts** in `modules/analysis.md`.
  If an artifact explains it, show the naive reading and then correct it — readers arrive with the
  naive reading already in mind.
- Quote counters at the precision the tool gives; do not round a 0,036 mAh into "negligible" without
  also giving the share.
- Projections are projections. State the model (`batterystats` scales power linearly over time) and
  label them as needing validation by a further measurement.
- Separate correlation from cause. "WebSocket mode moved 63% less data" and "the WebSocket causes
  less traffic" are different claims.

## Deliverables

Keep raw dumps in a durable directory (not a temp dir), one folder per window, plus a text summary.
Logcat dumps run tens of MB — keep them, they are the crash evidence.

```
battery-tests/<date>/
  RESULTADOS.md
  run1-<label>/ … runN-<label>/
  run-battery-test.sh
```

For an audience beyond the requester, render a PDF — it needs no account and survives forwarding.
Write the HTML, then:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --no-pdf-header-footer --print-to-pdf="out.pdf" "file:///abs/path/in.html"
```

Set `@page { size: A4; margin: 14mm 12mm }` and cap the content at ~180mm, or the right edge clips.
Always confirm Chrome printed ("bytes written") and read the result back — a bad source path yields a
small PDF of an error page, not a failure.

Report language follows the conversation.
