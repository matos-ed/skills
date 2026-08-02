# Templates

Copy-paste boilerplate. Apply during **step 3 (Draft)**. Copy the matching block, replace every `<placeholder>`, delete unused optional sections.

---

## Agent — `agents/<name>/AGENT.md`

````markdown
# <Title> Agent

<One- to two-sentence description of what it does and the value it delivers.>

## When to Use

- <concrete scenario>
- User says "<trigger phrase>", "<trigger phrase>"

## Do Not Use When

- <adjacent task> (use `<other-artifact>` instead)

## Workflow

1. **<Step>** — <action>. Read `modules/<topic>.md`.
2. **<Step>** — <action>.
3. **Report** — Output the structured report below.

## Modules (Read When Relevant)

- **<Topic>** — `modules/<topic>.md`
- **Examples** — `modules/examples.md`

## Output Format

```markdown
# <Title> — [Scope]

## Findings
### [P0/P1/P2/P3] <Finding>
**Location:** file:line
**Issue:** ...
**Fix:** ...

## Summary
- P0: X | P1: X | P2: X | P3: X
```
````

---

## Skill (thin-wrapper) — `skills/<name>/SKILL.md`

```markdown
---
name: <name>
description: <one-line discriminative description>
allowed-tools: Read, Grep, Glob, Bash
argument-hint: "[scope or input]"
---

# <Title>

You are the <name> agent. Read your full instructions and workflow at `.claude/agents/<name>/AGENT.md`.

Load modules as directed by the AGENT.md — read them with the Read tool when relevant to the task. Modules are located at `.claude/agents/<name>/modules/`.

User request: $ARGUMENTS
```

---

## Skill (self-contained) — `skills/<name>/SKILL.md`

```markdown
---
name: <name>
description: <one-line discriminative description>
allowed-tools: Bash
argument-hint: "[optional input]"
---

# <Title>

<Lead description.>

## When to Use
- <scenario>

## Do Not Use When
- <adjacent task> (use `<other>` instead)

## <Workflow / Rules>
1. <step>

User request: $ARGUMENTS
```

---

## Command — `commands/<name>.md`

```markdown
# <name> — <one-line purpose>

> **<When/why to invoke.>**

You are <role>. When this command is invoked, <do X> BEFORE <the main action>.

---

## RULE 1 — <title>
<instructions / code block / table>

---

## Checklist (copy before executing)
\`\`\`
[ ] <check>
[ ] <check>
\`\`\`
```

---

## Rule (auto-attach) — `rules/<name>.md`

```markdown
---
paths:
  - "<glob>"
---

# <Domain> Standards

> **Why this rule exists:** <failure mode prevented.>

## <Topic>
- **<Directive>** — <rationale.>
```

---

## Rule (on-demand reference) — `rules/<name>.md`

```markdown
# <Topic> Reference

> **On-demand reference.** Use when <condition>.

## <Section>
<canonical snippet / pattern>
```
