---
name: code-comments
description: Decide which code comments earn their place and delete the rest. Use when writing or reviewing comments, when a diff comes back heavy in prose, or when the user asks to reduce comment verbosity ("limpa os comentários", "muito comentário").
allowed-tools: Read, Grep, Glob, Edit, Bash
argument-hint: "[optional: paths or repos to audit]"
---

# Code comments

The code already says **what** it does. A comment earns its place only by saying what the code cannot — and most of the time that turns out to be nothing, because the rationale belongs in the commit message, where `git blame` finds it.

## When to Use
- Writing a comment, before writing it
- Reviewing a diff where comments outnumber the logic they surround
- The user asks to cut comment verbosity across a change

## Do Not Use When
- Writing the commit message or PR body — that's `commit` and `pull-request`, and it's where the argumentation goes
- Writing README or architecture docs

## The test

**Would someone editing this line break a contract they cannot see from here?**

Yes → one comment, naming the contract. No → delete it; the reason lives in the commit.

The test kills the four things that produce comment bloat:

| pattern | verdict |
|---|---|
| Restates the line below (`// builds on demand` over a lazy getter) | delete |
| Argues for the decision (`// a green pod consuming nothing is worse`) | delete — it's in the commit |
| Repeats the error message printed three lines down | delete |
| Names an invisible contract (`--list` must answer before any I/O; CI depends on it) | keep, ≤2 lines |

## Four audiences, four rules

The "self-explanatory code" premise assumes a reader who can read the rest of the code. Where they can't, the rule changes.

1. **Production code** — the test above. Cap 2 lines. No paragraphs.
2. **Exported symbol of a published package** — the consumer reads the `.d.ts` and never sees the implementation. Short JSDoc: one sentence of what it is, plus the contracts the type doesn't express. Cap ~5 lines. A usage example only when the shape isn't derivable from the signature — `(dir: string) => TWorkerRegistry` doesn't say files must be named `<name>.worker.ts`, so that one earns an example.
3. **Configuration YAML** (deploy values, declarations) — no type, no test, no call site, and the editor is usually not the author. A **pointer** to the canonical doc, never a copy of it. Copies rot; pointers don't.
4. **Scaffolded / generated code** — the TODOs are the product: the developer receives a file to complete. Keep the instructions, cut the argument for each one. It belongs in the generated PR body.

## Workflow

1. **Measure before cutting.** Density makes the argument concrete and finds the worst offender fast:
   ```bash
   for f in <paths>; do
     t=$(grep -c '' "$f"); c=$(grep -cE '^\s*(//|#|\*|/\*)' "$f")
     echo "$c/$t  $f"
   done
   ```
   Anything above ~1/3 is a candidate. A file with more comment lines than code is indefensible.

2. **Classify, don't skim.** Walk each comment against the table. Restatement and argumentation go without discussion; only the "invisible contract" ones get debated.

3. **Rewrite what survives.** A kept comment loses its build-up: state the trap in one sentence. `// Runs BEFORE the release step on purpose: the authoritative check needs the image, which only exists after it.` — not the three paragraphs explaining why that matters.

4. **Move, don't delete, the reasoning.** If the argument isn't already in a commit message, put it there before deleting it from the file. Deleting rationale that exists nowhere else is a loss, not a cleanup.

5. **Verify.** Run the tests and the typecheck. A comment cleanup that changes behaviour means a comment was load-bearing — usually an `eslint-disable` or a pragma. Never delete those.

## Do not touch

`eslint-disable`, `@ts-expect-error`, `prettier-ignore`, `istanbul ignore`, license headers, and codegen markers. They look like comments and are code.

## Report

State the before/after count and what class was cut. "255 lines to 105; restatement and argumentation removed, traps and public-API contracts kept" tells a reviewer what happened. "Cleaned up comments" doesn't.
