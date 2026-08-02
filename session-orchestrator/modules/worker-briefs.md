# Worker Briefs

How to spawn and instruct workers. Apply during **step 3 (Delegate)** of the workflow.

---

## Model Selection

Always pass `model` explicitly (omitting defaults to expensive Opus). The global `subagent-model-guard` hook denies sonnet/opus/fable spawns whose prompt lacks a `MODEL-ESCALATION: <reason>` line.

| Work | Model | Escalation line |
| --- | --- | --- |
| Search, read, grep, run tests, mechanical edits, scaffolding | `haiku` | not needed |
| **Repeating a task type a `sonnet` worker already did** — point it at the finished example | `haiku` | not needed |
| First instance of an implementation task, multi-file edits, judgment calls | `sonnet` | required |
| Anything | never `opus`/`fable` | the orchestrator IS the strong model |

**Sonnet is ~4x the price of Haiku — justify it per worker, not per project.** In the measured session, 93% of 912K went to Sonnet, and at least two of those workers were porting files to a pattern that an earlier worker had already established. Those were Haiku jobs. Ask: *does this worker have to figure something out, or follow something?* Following is Haiku.

## Brief Template

```markdown
MODEL-ESCALATION: implementation work requiring multi-file reasoning   <!-- sonnet only -->

## Task
<one-paragraph deliverable>

## Context
<everything needed — repo layout, conventions, constraints. Workers start cold.>
<project gotchas that apply: import extensions, build steps, token usage, etc.>

## Scope
- Edit: <files/dirs>
- Do NOT edit: <files/dirs>   <!-- editing only. Reading anything is always allowed — say so. -->

## Acceptance Criteria
- [ ] <observable outcome>

## Verify Before Reporting
Run: <command>. Report the actual output, including failures.
```

**Write "do NOT edit", never "do NOT touch".** A worker read "Do NOT touch" as a prohibition on *reading*, hit a permission denial, and stopped without producing anything: **68K tokens for zero output**. When other workers are editing files in parallel, add one explicit line: *"You may read any file in the repo; these files must not be modified because other agents are editing them concurrently."*

## Warm Worker, Stepped Briefs (default for related tasks)

**One worker, several steps — not several workers, one step each.** Spawn once with the first step, then drive it through the remaining steps with `SendMessage`. The worker keeps its context: the files it already read, the conventions it already learned, the mistakes it already corrected.

Measured floor cost per spawn: **~27K tokens before the worker does anything at all.** Probe: a worker whose entire job was one `git rev-parse` cost 27,235 tokens; a second identical probe, 27,285. Every extra spawn pays that floor again; a `SendMessage` step does not.

**The floor is not reducible by trimming project docs.** Measured directly: cutting 2,646 tokens out of the project's `CLAUDE.md` moved the probe by −25 tokens, inside the ±50 noise band. Do not spend effort rewriting `CLAUDE.md`/`AGENTS.md` for token reasons without a measurement that says otherwise — the lever is **fewer spawns**, not smaller context.

```
Spawn  → step 1: "rewrite repository A to the new API"
Send   → step 2: "now B, same pattern you just used"
Send   → step 3: "now C"
Send   → step 4: "run the package's full suite and report"
```

Use it when steps share files, conventions, or a pattern the first step establishes — porting a set of files, applying one refactor across a package, a build/test/fix loop.

**The trade is wall-clock time for tokens.** Steps run in series. Take it unless the user is waiting on latency: three cold spawns finish sooner but cost ~2-3x.

Still spawn separately when a worker has gone down a wrong path and its context is now a liability, or when the work is both genuinely unrelated **and** large enough to clear the floor. "Different package" alone does not clear it: two small briefs in two apps still pay two floors, and if they implement two sides of one contract they should have been one worker's steps (see the shared-contract test in `planning.md`).

**Sequence steps so the contract is written once.** When step N defines an interface step N+1 consumes, the same worker carries the definition forward for free — you never restate it, and the two sides cannot drift. That is the second reason to prefer warm steps over parallel spawns, independent of cost.

**Write the steps during planning, not improvised.** Decide the sequence up front, then issue them one per message, checking each result before sending the next — that check is where you catch a wrong turn before it compounds across the remaining steps.

## Rules

- **Workers are cold** — repeat every constraint that matters; never assume they saw the conversation.
- **One deliverable per worker**; parallel-safe workers spawn in the same message.
- **Failure handling** — if a worker's report misses acceptance criteria, continue it via `SendMessage` with a corrective brief (it keeps its context); spawn fresh only if it went down a wrong path.
- **Never redo worker output yourself** — re-brief instead; a re-brief resumes a warm worker, while you would restart the reasoning cold.
- **Never ask an exploration worker for verbatim file content.** Quoting every SQL statement / function body across a package costs a fortune to produce and is redundant — implementation workers re-read the real files anyway. Ask for an inventory: paths, exported symbols, signatures, call sites. One such brief cost 63K and its verbatim sections went unused.
- **Give a tool-call budget** for open-ended work ("this should take under ~25 tool calls; if you are past that and still failing, stop and report what you found"). Trial-and-error against a failing build is where workers quietly burn 200K.
- **Verify claims that span beyond a worker's scope yourself.** A worker can only prove things about files it touched; when it asserts something repo-wide ("nothing was lost", "pre-existing failure"), check it with a cheap command. Two such claims in the measured session were wrong or unprovable as stated.
- **Forks** (`subagent_type: "fork"`) inherit your full context and model — use only when the task genuinely needs the whole conversation, since it runs at strong-model price.
