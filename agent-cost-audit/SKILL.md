---
name: agent-cost-audit
description: Measure and reduce what a session actually spends on subagents — probe the per-spawn floor cost, A/B a proposed context reduction before doing the work, and apply the levers that are known to pay. Use when a session's token spend is questioned, before rewriting CLAUDE.md/AGENTS.md for token reasons, or when planning heavy delegation.
---

# Agent Cost Audit

Token spend on subagents is measurable. **Measure before optimizing** — the intuitive levers are mostly wrong.

## Where the money goes

Subagents dominate. They start cold with no shared cache and pay full price for everything they read, while the orchestrator's own context is re-sent at cache-read price in sessions with a long prompt-cache TTL.

Measured in one real orchestration session (2026-08-01, `surebet-finder`):

| | |
|---|---|
| Total across 8 workers | **912,102 tokens** |
| Share on Sonnet | **93%** |
| Floor cost (8 spawns × ~27K) | **216K — 24%, before any useful work** |
| Wasted on one badly-scoped worker | **68K, zero output** |

## The per-spawn floor

**~27K tokens, before the worker does anything.** Probe: a worker whose entire job was one `git rev-parse` cost 27,235 tokens; an identical second probe, 27,285. Noise is ±50 (0.18%), so the measurement is reliable enough to A/B against.

This floor is what makes spawn count — not context size — the thing to optimize.

## How to probe

Spawn a worker that does essentially nothing, so its cost *is* the floor:

```
model: haiku
prompt: |
  Run exactly one command: `git rev-parse --abbrev-ref HEAD`

  Report only its output, in a single short sentence. Do not read any file,
  do not explore the repository, do not run any other command, and do not
  elaborate. Stop immediately after reporting.
```

Read `subagent_tokens` from the completion notification. **Run two identical probes** — the spread between them is your noise floor, and without it you cannot tell a real change from drift.

To A/B a proposed change: probe twice, apply the change, probe twice again. Only believe a difference several times larger than the spread.

## What does NOT pay (measured)

**Trimming the project's `CLAUDE.md`.** Cutting 2,646 tokens out of it moved the probe by **−25 tokens** — inside the ±50 noise band. Zero measurable saving.

The test could not distinguish "project docs aren't charged per spawn" from "the harness snapshotted them at session start, so a mid-session edit never reached the probes". Either way: **do not rewrite `CLAUDE.md`/`AGENTS.md` for token reasons without a measurement that says otherwise.** If you want to settle it, apply the change and re-probe in a *fresh* session.

Restructuring docs for **maintainability** is a fine goal. Just don't justify it with unmeasured token claims.

## What does pay

Ranked by measured or estimated impact:

1. **Fewer spawns — one warm worker, several steps.** Spawn once, drive the remaining steps with `SendMessage`; the worker keeps the files it read and the pattern it learned. Three cold workers rewriting files in one package cost 3× the floor *plus* ~100–150K re-reading the same schema/db/helper files. Trades wall-clock time for tokens; take it unless someone is waiting.
2. **Escalate the first, downgrade the rest.** The first instance of a task type justifies Sonnet — it establishes the pattern. The rest follow it: Haiku, pointed at the finished example. Ask *does this worker figure something out, or follow something?*
3. **Say "do NOT edit", never "do NOT touch".** A worker read "Do NOT touch" as a ban on *reading*, hit a permission denial, and stopped: 68K for nothing. When others edit in parallel, spell it out: *"You may read any file; these must not be modified because other agents are editing them concurrently."*
4. **Never ask an exploration worker for verbatim file content.** Quoting every SQL statement across a package cost 63K and went unused — implementation workers re-read the real files anyway. Ask for an inventory: paths, exported symbols, signatures, call sites.
5. **Budget tool calls** for open-ended work: *"under ~25 tool calls; if you are past that and still failing, stop and report."* Trial-and-error against a failing build is where workers quietly burn 200K.
6. **Split by concern, not by size.** One worker doing two apps + tests + env plumbing burned 208K over 93 tool calls; two narrower briefs would have been cheaper and easier to verify.

## Reporting

Cost is a result, like tests passing. When a cycle finishes, tell the user what it spent and where it went — per worker, with the floor called out separately so the avoidable part is visible.

## Related

- `session-orchestrator` — the delegation workflow these rules belong to
- `subagents-manager` — model selection and the escalation marker the hook enforces
