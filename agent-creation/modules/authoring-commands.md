# Authoring Commands

How to build a slash command (`commands/<name>.md`). Apply during **step 2 (Classify → Command)** of the workflow.

## Convention

- File: `~/.claude/commands/<name>.md`, `kebab-case`.
- **No YAML frontmatter.** Plain markdown instructions, read top-to-bottom when the command is invoked.
- Written as a direct instruction set to the assistant ("When this command is invoked, do X").
- Imperative voice, dense, actionable. Commands are *procedures*, not knowledge bases.

## Recommended Shape

```markdown
# <name> — <one-line purpose>

> **<When/why to invoke — a strong directive or origin note.>**

You are <role/stance>. When this command is invoked, <do the following> BEFORE <doing the risky/main thing>.

---

## <STEP / RULE 1> — <title>
<instructions, code blocks, tables>

---

## Checklist (copy before executing)
```
[ ] step one
[ ] step two
```
```

(See `~/Downloads/claude/commands/k8s-preflight.md` for a full reference — checklist + numbered rules + fenced command blocks.)

## Command vs Skill — Which to Build

| Build a **command** when | Build a **skill** when |
| --- | --- |
| A fixed procedure/checklist run on demand | Reusable capability with tool scoping (`allowed-tools`) |
| No need for argument hints or tool restrictions | You want `argument-hint` and discovery via `description` |
| Often a guardrail/preflight ("do this before X") | Domain expertise, possibly backed by an agent + modules |

## Tips

- Use tables for decision matrices (type of change → correct approach).
- Embed copy-pasteable `bash` blocks with placeholders (`<release>`, `<ns>`).
- End with a quick checklist the user can copy before executing.
- Keep destructive operations behind explicit confirmation/backup steps.
