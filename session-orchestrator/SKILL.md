---
name: session-orchestrator
description: Run a work session manager-style — the strong model plans and verifies while cheaper workers execute, with a context reset suggested before each planning cycle to cut strong-model cost.
argument-hint: "[task to orchestrate]"
---

# Session Orchestrator

Runs a session as a manager: the strong model only plans, delegates, and verifies — workers execute. Goal: planning quality at minimum strong-model token spend. Model names below are Claude tiers; on other tools, map "strong" to the most capable model and "worker" to the cheapest adequate one, using whatever subagent mechanism the tool has.

## When to Use

- Multi-step task (feature, refactor, migration) where planning matters but execution is delegable
- User says "orquestre a sessão", "modo orquestrador", "planeje e use workers"

## Do Not Use When

- Small single-file change — spawning costs more than it saves
- Picking a model for one ad-hoc spawn (use `subagents-manager`)
- Work spanning multiple sessions (use `wayfinder`)

## Workflow

1. **Reset** — if the conversation carries unrelated history, suggest the user run `/clear` (or the tool's equivalent) and re-invoke this skill. Repeat before **every planning cycle**, not just the first.
2. **Plan** — decompose into worker-sized tasks with acceptance criteria. Read `modules/planning.md` (includes the orchestrator's economy rules).
3. **Delegate** — **prefer one warm worker driven through several steps via `SendMessage`** over several cold spawns; each spawn costs ~27K tokens before doing anything. `sonnet` for the first instance of a task type, `haiku` for the rest and for search/mechanical; never opus/fable workers. Read `modules/worker-briefs.md` for the brief template, the stepped-warm-worker pattern, and the escalation marker.
4. **Verify & integrate** — check each report against its acceptance criteria; run typecheck/tests via a haiku worker; re-brief (SendMessage) on failure instead of redoing work yourself. **Verify claims that reach beyond a worker's own scope yourself** — a worker can only prove things about files it touched.
5. **Report** — Output the structured report below, **including what the cycle cost**.

## Output Format

```markdown
# Session Orchestrator — [task]

## Plan
1. <task> → worker (<model>) — <status>

## Worker Results
- <worker/task>: <outcome, verified how>

## Verification
- typecheck/tests: <result>

## Cost
- <total subagent tokens; spawns × ~27K floor called out separately>

## Pending / Next
- <follow-ups, suggest /clear before next planning cycle>
```

## Related

- `agent-cost-audit` — how to measure spawn cost and A/B a proposed context reduction before doing the work. Read it before rewriting `CLAUDE.md` for token reasons.
