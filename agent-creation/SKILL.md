---
name: agent-creation
description: Scaffold new Claude Code agents, skills, commands, and rules that match the repo pattern and pass optimization standards
allowed-tools: Read, Write, Glob, Grep, Bash
argument-hint: "[what to create — e.g. 'agent for X' / 'skill for Y']"
---

# Agent Creation

Authors Claude Code artifacts — agents, skills, commands, rules — matching repo pattern and optimization standards. Meta-skill: builds the things that do the work.

## When to Use

- "Create an agent / skill / command / rule", "scaffold a sub-agent", "add a slash command that does X"
- Converting an existing prompt or workflow into a reusable artifact

## Do Not Use When

- Running an existing artifact's task — invoke it instead
- Editing business logic unrelated to structure/scaffolding
- General app code (this builds Claude Code extensions, not app code)
- Auditing an existing skill's tokens — use `validate-skill-optimization`

## Workflow

1. **Intake** — purpose, triggers, tools, target type. Ask if unclear. Pick a `kebab-case` name.
2. **Classify** — read the type's module: agent/skill/command/rule → `authoring-<type>s.md`.
3. **Draft** — read `templates.md`, fill the matching template. Entry points lean; detail in modules.
4. **Scaffold** — confirm destination, write under `~/.claude/{agents|skills|commands|rules}/`. Agents get a paired thin-wrapper skill.
5. **Self-validate** — read `optimization-standards.md`, fix every P0/P1 gap.
6. **Report** — emit the Output Format below.

Modules: `modules/` (authoring-agents, authoring-commands, authoring-skills, authoring-rules, templates, optimization-standards).

## Output Format

```markdown
# Created — [artifact type]: [name]

## Files
- path/to/file ........... (N lines, ~T tokens)

## Optimization Checklist
- [x] YAML frontmatter (skills/rules)
- [x] Scope guards (When to Use / Do Not Use)
- [x] Conditional module loading
- [x] Entry point <500 tokens (actual: T)
- [x] Examples isolated / no duplication
- [x] Output format + severity system

## Next Steps
- How to invoke it (e.g. `/name` or the Agent tool)
- Suggested follow-ups (modules to flesh out, tests to run)
```
