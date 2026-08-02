---
name: validate-skill-optimization
description: Analyzes AI skill directories for token efficiency, conditional loading patterns, structural best practices, and provides actionable optimization recommendations
allowed-tools: Read, Grep, Glob, Bash
argument-hint: "[path to skill directory]"
---

# Validate Skill Optimization

Analyzes a skill directory and produces a structured optimization report covering token budget, loading strategy, structure, and best practices.

## When to Use

- After creating or refactoring a skill
- Auditing an existing skill for token bloat or structural issues
- Comparing skills against optimization best practices
- User says "validate skill", "check skill optimization", "audit skill tokens"

## Do Not Use When

- The target is not a skill directory (no SKILL.md present)
- You need to implement fixes rather than analyze
- The task is general code review (use a code-review skill instead)

## Analysis Workflow

1. **Scan structure** - Identify SKILL.md, `modules/` directory, and any other resource files in the target skill directory.
2. **Estimate tokens** - For each file, compute `characters / 3.5` (rounded). Sum totals for entry point, modules, and overall.
3. **Check optimization patterns** - Evaluate against criteria below.
4. **Identify anti-patterns** - Flag eager loading, duplication across files, inline example bloat, oversized entry points.
5. **Generate report** - Output the structured report below.

## Evaluation Criteria

### Structure (4 points)
- YAML frontmatter with name and description
- Scope guards (When to Use / Do Not Use)
- Conditional loading directives for modules
- Modular file organization (modules/ directory)

### Token Efficiency (3 points)
- Entry point under 500 tokens
- No duplicated content across files
- Examples in separate module (not inline)

### Best Practices (3 points)
- Output format specification
- Issue prioritization / severity system
- Clear workflow steps

## Report Output Format

```markdown
# Skill Optimization Report - [Skill Name]

## Executive Summary
- **Overall Score:** X/10
- **Entry Point Tokens:** N (target: <500)
- **Total Tokens (all files):** N
- **Conditional Loading:** Yes/No
- **Verdict:** [Optimized | Needs Work | Critical Bloat]

## Token Breakdown

| File | Characters | Est. Tokens | Loaded | Notes |
|------|-----------|-------------|--------|-------|
| SKILL.md | X | Y | Always | Entry point |
| modules/foo.md | X | Y | On demand | ... |
| **Total** | **X** | **Y** | | |

## Structure Assessment
- [ ] YAML frontmatter with name and description
- [ ] Scope guards (When to Use / Do Not Use)
- [ ] Conditional loading directives for modules
- [ ] Modular file organization (modules/ directory)
- [ ] Output format specification
- [ ] Issue prioritization / severity system

## Gap Analysis
### Anti-Patterns Found
- [Description of each issue with severity]

### Missing Best Practices
- [What should be added]

## Recommendations
| Priority | Action | Expected Token Savings |
|----------|--------|----------------------|
| P0 | ... | ~N tokens |
| P1 | ... | ~N tokens |
| P2 | ... | ~N tokens |

## Self-Compliance Note
> State whether the analyzed skill follows its own standards (if applicable).
```

User request: $ARGUMENTS
