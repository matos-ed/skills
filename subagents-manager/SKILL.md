---
name: subagents-manager
description: Read BEFORE spawning ANY subagent/fork via the Agent tool. Defines which model to pick — Haiku by default, sonnet/opus only for specific justified cases — and the escalation marker the enforcement hook requires.
allowed-tools: Read
---

# Subagents Manager

Consult this before every `Agent` tool call. A `PreToolUse` hook
(`~/.claude/hooks/subagent-model-guard.py`) enforces these rules and will
**deny** spawns that violate them.

## Core rule

**Always pass `model` explicitly.** Omitting it defaults to the parent model
(Opus) — expensive, and blocked by the hook. Default to `haiku`; escalate only
for the specific cases below.

## Before anything else: could I just do it?

**Before every spawn, ask: "Could I write this diff/design/plan myself right
now, using only what I already know?"** If yes, don't spawn — do it. This
check comes before picking a model tier, and it overrides any workflow
step (including plan-mode's own phases) that names an agent type by
default.

**Plan-mode trap, specifically:** plan-mode's Phase 1/2 instructions read as
"explore with Explore agents, then launch a Plan agent to design it." That
default assumes the coordinator hasn't already gathered the context itself.
If *you* (the coordinator) did Phase 1 directly — Read/Bash/Grep in your own
context, not delegated to Explore agents — you already hold everything a
Plan agent would need, and spawning one just re-synthesizes context you
already have into a plan file you could write directly. In that case, skip
the Plan-agent spawn: write the plan file yourself, then go straight to
Phase 3 (review) / AskUserQuestion / ExitPlanMode. Only spawn Plan when the
scope is big enough, or unfamiliar enough, that you genuinely don't yet have
a synthesized approach in your head.

(Concrete incidents: (1) after doing all the exploration and reading every
relevant file myself, still spawned a `sonnet` agent to implement a
multi-file feature already fully understood. (2) after directly reading
every relevant file for an SVG chart-wheel feature — same session, same
context already loaded — still spawned a `Plan` agent for Phase 2 out of
habit, because plan-mode's instructions default to it. Both were pure
waste; the user caught both. The escalation-marker mechanism only gates
*which model*; it does not by itself justify *whether to spawn at all*.)

## Default → `haiku`

Use Haiku for the bulk of subagent work:

- search / exploration (the `Explore` agent, locating files, grep sweeps)
- reading & summarizing files
- mechanical edits against a clear spec, simple renames/refactors
- running builds/tests and reporting output
- scaffolding boilerplate, data extraction/formatting

## Escalate → `sonnet` (requires justification)

When the task genuinely needs judgment:

- implementing non-trivial features spanning multiple files
- root-cause debugging / reasoning about failures
- ambiguous tasks requiring interpretation
- `Plan`-agent architecture for medium+ tasks

## Escalate → `opus` (requires justification)

Reserve for the hardest work:

- complex architecture / design trade-offs
- deep code review, security review
- subtle correctness reasoning, large multi-system refactors

## Escalation marker

To spawn with `sonnet`, `opus`, or `fable`, the `prompt` **must** contain a line:

```
MODEL-ESCALATION: <one-line reason>
```

Without it the hook denies the spawn. Keep the reason specific (e.g.
`MODEL-ESCALATION: root-cause debugging across auth + session layers`).

## Forks are exempt

`subagent_type: "fork"` ignores `model` — a fork always runs on the parent
model. No choice to make; the hook lets forks through regardless of `model`.

## Don't delegate synthesis — or implementation — you've already done

If the coordinator already holds the full context needed to produce an
output — e.g. it just ran Explore agents and has their findings in its own
context, or has directly read the files that need to change — do not spawn
another agent (Plan, sonnet "implementer", or otherwise) to re-synthesize
that same context into a design/plan **or to write the actual code**. A
fresh agent starts cold and either re-derives what the coordinator already
knows (wasted tokens) or, worse, gets a context dump pasted into its prompt
and produces nothing a direct write couldn't. This applies just as much to
"go implement this feature" spawns as to planning spawns — a `sonnet`
escalation for "non-trivial features spanning multiple files" is only
justified when the coordinator does NOT already have the files read and the
approach decided. Delegate only when the subagent brings something the
coordinator lacks: a cold-context deep-dive, a large noisy search you don't
want polluting your own context, or genuinely parallel independent work.
When you already have the pieces, assemble them yourself — use Read/Edit/
Write directly instead of writing a prompt that describes the edit to
someone else. See the plan-mode callout above — it's the most common way
this rule gets skipped in practice.
