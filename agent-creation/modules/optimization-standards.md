# Optimization Standards & Self-Review

Apply during **step 5 (Self-validate)**. Score the draft, fix every P0/P1 gap before reporting. Mirrors the `validate-skill-optimization` criteria so the meta-agent and the validator agree.

## Token Budget Math

Estimate tokens per file as `characters / 3.5` (rounded). Targets:

| Artifact | Entry point target |
| --- | --- |
| AGENT.md | < 500 tokens |
| SKILL.md (entry) | < 500 tokens |
| Module | No hard cap, but split if a single topic dominates |

Quick check: `wc -c <file>` then divide by 3.5.

## Self-Review Checklist

### Structure
- [ ] YAML frontmatter with `name` + `description` (skills; `paths` for auto-rules)
- [ ] Scope guards present (`When to Use` / `Do Not Use When`)
- [ ] Conditional loading directives — workflow steps name which module to read
- [ ] Modular organization — detail lives in `modules/`, not the entry point

### Token Efficiency
- [ ] Entry point under 500 tokens
- [ ] No duplicated content across files (single source of truth per fact)
- [ ] Examples in a separate module, never inline in the entry point

### Best Practices
- [ ] Output format specified (fenced template)
- [ ] Severity / priority system where ranking helps (P0–P3)
- [ ] Clear numbered workflow steps

## Anti-Patterns to Flag

| Anti-pattern | Severity | Fix |
| --- | --- | --- |
| Eager loading — all knowledge in the entry point | P0 | Move topics into `modules/`, reference conditionally |
| Oversized entry point (>500 tokens) | P0 | Extract detail; keep entry as a router |
| Inline example bloat | P1 | Relocate to `modules/examples.md` |
| Duplicated content across files, or within one (e.g. a "Modules" index that just repeats the Workflow's module pointers) | P1 | Keep one canonical copy, link/point to it |
| Missing scope guards | P1 | Add `When to Use` / `Do Not Use When` |
| No output format / severity system | P2 | Add a fenced output template + P0–P3 tags |
| Vague description (poor discovery) | P2 | Rewrite to be domain-specific and discriminative |
| Hardcoded pointer to another agent/skill for a need that doesn't arise on most runs | P2 | Drop the pointer — every line in the entry point is loaded on *every* invocation, so a reference that only pays off occasionally is context cost paid constantly for a benefit collected rarely. Trust the other artifact's own `description` to surface it via discovery when actually relevant. Reserve explicit pointers for dependencies the workflow needs on (nearly) every run (e.g. `rn-ui-builder` always needing a `rn-ui-designer` spec). |

## Severity Tags

- **P0** — breaks the optimization model (eager loading, oversized entry). Must fix.
- **P1** — significant bloat or missing guard. Fix before shipping.
- **P2** — polish (format, description quality).
- **P3** — nice-to-have.

## Self-Compliance Note

State in the report whether the created artifact follows these standards, with the measured entry-point token count.
