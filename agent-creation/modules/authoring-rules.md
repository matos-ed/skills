# Authoring Rules

How to build a rule (`rules/<name>.md`). Apply during **step 2 (Classify → Rule)** of the workflow.

## Two Rule Flavors

| Flavor | Frontmatter | Loading | Example |
| --- | --- | --- | --- |
| **Auto-attach** | `paths:` globs | Pulled in automatically when a matching file is in context | `typescript.md` (`**/*.ts`) |
| **On-demand reference** | none | Loaded only when explicitly asked or relevant | `design-patterns-ref.md` |

## Auto-Attach Rule Shape

```markdown
---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# <Domain> Standards

> **Why this rule exists:** <the failure mode this prevents and the value it protects.>

## <Topic>
- **<Directive>** — <terse rationale.>
- ...
```

- `paths` is a list of globs. The rule activates when a file matching any glob is being worked on.
- Always open the body with a `> **Why this rule exists:**` blockquote — it justifies the constraints and survives skimming.

## On-Demand Reference Rule Shape

```markdown
# <Topic> Reference

> **On-demand reference.** Use when <implementing X or asked for Y>.

## <Section>
<canonical snippets / patterns>
```

No frontmatter; the opening blockquote states when to reach for it.

## Writing Directives

- One directive per bullet, **bolded lead term** + short rationale.
- Prefer concrete, checkable rules ("Never `any` — use `unknown` and narrow") over vague guidance.
- Group by theme with `##` headings (Type System, Strict Mode, Error Handling…).
- Include short `typescript`/`bash` snippets for non-obvious patterns; keep them minimal.
- A rule encodes *standards and references*, not procedures — if it's a step-by-step task, make a command or skill instead.
