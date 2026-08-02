# Authoring Skills

How to build a skill (`skills/<name>/SKILL.md`). Apply during **step 2 (Classify → Skill)** of the workflow.

## Frontmatter Reference

Every SKILL.md opens with YAML frontmatter:

```yaml
---
name: <kebab-case-name>            # must match the directory name
description: <one line>            # used for skill selection — make it discriminative
allowed-tools: Read, Grep, Glob, Bash   # comma-separated; least privilege
argument-hint: "[what to pass]"    # shown to the user as the arg placeholder
---
```

- **name** — identical to the folder; lowercase, hyphens.
- **description** — the single most important field for discovery. State the domain and the distinctive value, not generic verbs. Avoid overlap with other skills.
- **allowed-tools** — grant only what the skill needs. Common sets:
  | Skill kind | Tools |
  | --- | --- |
  | Read-only analysis | `Read, Grep, Glob, Bash` |
  | Authoring/scaffolding | `Read, Write, Glob, Grep, Bash` |
  | Git/commit | `Bash` |
  | Web-aware review | `Read, Grep, Glob, Bash, WebFetch` |
- **argument-hint** — bracketed example of the expected input.

## Thin-Wrapper vs Self-Contained

| Choose | When |
| --- | --- |
| **Thin-wrapper** | The skill fronts a multi-module **agent**. Body is ~5 lines delegating to `.claude/agents/<name>/AGENT.md`. Keeps the entry point tiny and detail in modules. |
| **Self-contained** | The logic is small and single-file (no modules needed), e.g. `commit`. Full instructions live inline in SKILL.md with `When to Use` / `Do Not Use When` guards. |

## Thin-Wrapper Body (canonical)

```markdown
# <Title>

You are the <name> agent. Read your full instructions and workflow at `.claude/agents/<name>/AGENT.md`.

Load modules as directed by the AGENT.md — read them with the Read tool when relevant to the task. Modules are located at `.claude/agents/<name>/modules/`.

User request: $ARGUMENTS
```

## Self-Contained Body Shape

```markdown
# <Title>

<Lead description.>

## When to Use
- ...
## Do Not Use When
- ...
## <Workflow / Rules / Checklist>
...
User request: $ARGUMENTS   # if the skill consumes an argument
```

## The `$ARGUMENTS` Placeholder

Place `$ARGUMENTS` where the user's input should be injected — usually a final `User request: $ARGUMENTS` line. Omit only if the skill takes no input.

## Token Budget

Entry point target: **<500 tokens** (`chars / 3.5`). Thin-wrappers are inherently small; for self-contained skills, push examples and long reference tables into a `modules/` directory and load them conditionally. See `modules/optimization-standards.md`.
