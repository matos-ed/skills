# Authoring Agents

How to build a multi-file agent. Apply during **step 2 (Classify → Agent)** of the workflow.

## Directory Layout

```
~/.claude/agents/<name>/
  AGENT.md            # entry doc — always loaded when the agent runs
  modules/
    <topic>.md        # progressive-disclosure knowledge, loaded on demand
~/.claude/skills/<name>/
  SKILL.md            # paired thin-wrapper so the agent is invocable
```

`<name>` is `kebab-case`, descriptive of the domain (`mongodb-expert`, `gitops-migrate`).

## AGENT.md — Section-by-Section Spec

No YAML frontmatter. Sections, in order:

| Section | Content |
| --- | --- |
| `# <Title> Agent` | H1 title |
| (lead paragraph) | One- to two-sentence description of what it does and its value |
| `## When to Use` | Bullets — concrete scenarios + literal trigger phrases the user might say |
| `## Do Not Use When` | Bullets — adjacent tasks that belong to other artifacts, with the redirect |
| `## Workflow` | **Numbered** steps. Each step that needs detail says which `modules/*.md` to read |
| `## Modules (Read When Relevant)` | Bulleted map of `modules/*.md` → one-line purpose. **Omit if the Workflow already names every module 1:1** — a second index that repeats the same mapping is duplication, not documentation. Include it only when it adds information the Workflow doesn't (e.g. reference modules pulled from several steps, or modules with no single owning step) |
| `## Output Format` | Fenced ```` ```markdown ```` block showing the exact report shape |

Keep AGENT.md as a **router**, not an encyclopedia. Detail lives in modules.

## When to Split Into a Module

Move content into `modules/<topic>.md` when **any** holds:

- The topic is only needed for *some* runs (conditional) — keep it out of the always-loaded entry point.
- It exceeds ~150 lines or ~40 lines of reference tables/examples.
- It is a self-contained body of knowledge (a checklist, a pattern catalog, examples).

Always put **examples in their own module** (`modules/examples.md`) — never inline in AGENT.md.

## Module File Shape

Open with an H1 title + one line stating which workflow step it serves:

```markdown
# <Topic>

<One line>. Apply during **step N (<StepName>)** of the workflow.

---

## <Subsection>
...
```

## Paired Thin-Wrapper Skill

Every agent needs a `skills/<name>/SKILL.md` thin wrapper so it is invocable via the Skill tool — see `modules/authoring-skills.md`. The wrapper points to `.claude/agents/<name>/AGENT.md` and forwards `$ARGUMENTS`.

## Naming & Tone

- Imperative, dense, no filler. Match the voice of `mongodb-expert` / `refinement-expert`.
- Prefer tables and bullets over prose. Use severity tags (P0–P3) in output where ranking helps.
