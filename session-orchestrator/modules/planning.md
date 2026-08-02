# Planning & Economy Rules

How the orchestrator plans and keeps its own context cheap. Apply during **step 2 (Plan)** of the workflow.

---

## Where the money actually goes

**Workers are the dominant cost, not your context.** Sessions with a long prompt-cache TTL re-send the orchestrator's context at cache-read price, while **every worker starts cold with no shared cache** and pays full price for everything it reads.

Measured, one real session (2026-08-01, storage migration): **912K tokens across 8 workers, 93% of it on Sonnet.** The orchestrator's own context was a rounding error next to that.

So delegating is not automatically cheap. Spawning a worker to avoid ~5K tokens of your own reading, when that worker will spend 90K rediscovering the codebase, is a **loss**. Delegate for parallelism, isolation and cheap models — not reflexively to protect your context.

## Economy Rules (the orchestrator's contract)

- **Sequential-with-warm-context beats parallel-with-cold-context when tasks share heavy files.** This is the biggest single lever. Three workers rewriting files in one package each independently re-read the same schema/db/test-helper files: ~100–150K of pure duplication. One worker doing all of them in sequence reads once. Parallelize only when the file sets are genuinely disjoint.
- **Escalate the first, downgrade the rest.** The first instance of a task type justifies `sonnet` — it establishes the pattern. Once a reference implementation exists, the remaining instances are pattern-following: `haiku`, pointed at the finished example.
- **Never read large files yourself** — but weigh it. Delegating exploration is right when the search is broad; reading one known file yourself is cheaper than a spawn.
- **Never execute grep sweeps, log trawls, or test runs inline.** A haiku worker runs them and reports the distilled result. (Cheap verification commands you run yourself to check a worker's claim are the exception — verifying is your job.)
- **Hold decisions, not evidence.** After a worker reports, keep the conclusion; do not re-quote raw output into your own messages.
- **Plan once, brief precisely.** A vague brief forces a re-brief round-trip that costs more than the minutes spent writing acceptance criteria up front.
- **Batch independent spawns** in one message so workers run in parallel — after confirming they do not share heavy context (see the first rule).
- **Suggest `/clear` before each planning cycle.** Planning quality degrades and cost climbs with stale context; tell the user explicitly: "recomendo rodar `/clear` e me re-invocar antes deste próximo planejamento". This is the rule most often skipped — if you have not said it once in a long session, you are not following this skill.

## Decomposition Checklist

For each worker-sized task, define before spawning:

- [ ] **Scope** — exact files/areas the worker touches; what it must NOT touch
- [ ] **Context** — everything the worker needs stated in the brief (workers start cold; they have none of your conversation)
- [ ] **Acceptance criteria** — observable outcome (test passes, file exists, typecheck clean)
- [ ] **Verification command** — what the worker runs before reporting done
- [ ] **Model** — haiku (search/read/mechanical/tests) or sonnet (implementation/judgment)

## Sizing

- One worker = one coherent deliverable verifiable in isolation.
- **Disjoint files are permission to split, never a reason to.** They only remove the obstacle to parallelizing; the reason must be positive — wall-clock you actually need, or a context liability you want isolated. Absent one of those, disjoint tasks still belong to one warm worker as sequential steps.
- **Merge when tasks share heavy context that would be re-derived twice** — easy to read past, expensive to violate. Before splitting, ask literally: *which files will both workers have to read?* If the answer is a big schema, a core module, or a shared test helper, merge them.
- **The small-task rule: a task you estimate at under ~15 tool calls does not deserve its own spawn.** At a ~27K floor, a 25K job costs 52K as its own worker and ~25K as a step on a warm one. Measured (2026-08-01, Phase-4 cutover): two disjoint briefs — a Fastify route in one app, an HTTP client in another — cost 55.6K/12 calls and 52.9K/11 calls. **Half of that 108K was floor.** One warm worker doing both in sequence: ~82K. Estimate each task's size *before* deciding the worker count, not after.
- **The shared-contract test.** If you catch yourself writing the same API shape, interface, or data contract into two briefs, those are two steps of one worker, not two workers. Duplicated specification in the briefs is the cheapest early signal that the tasks are coupled — and it is a correctness risk too: two cold workers implementing both sides of a contract can each be internally consistent and still not meet.
- **Split a worker when its job spans unrelated concerns.** A single worker doing two apps + tests + env plumbing burned 208K in 93 tool calls; two narrower briefs would have been cheaper and easier to verify. Big scope is not the same as coherent deliverable.
- 3–6 workers per planning cycle is the sweet spot; more than that, plan in phases and suggest `/clear` between them.

## Budgeting

- **Estimate before spawning.** A worker that reads a few files and edits them lands around 60–100K. One doing live browser work, or trial-and-error against a failing build, lands at 200K+. If a cycle's estimate is over ~500K, cut scope or downgrade models before starting, not after.
- **Report the spend.** When a cycle finishes, tell the user what it cost and where it went. Cost is a result, like tests passing.
