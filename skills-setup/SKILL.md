---
name: skills-setup
description: Set up or refresh this machine/session to use the personal skills collection at ~/dev/skills — detects the host tool (Claude Code, Kimi Code, or other) and merges the skills the way that tool consumes them. Run at the start of a setup, on a new machine, after adding/editing skills in ~/dev/skills, or when a tool is not seeing the skills.
argument-hint: "[optional: tool name, e.g. 'kimi' or 'claude' — default: auto-detect]"
---

# Skills Setup

`~/dev/skills` is the **single source of truth** for the user's personal
skills (flat layout: `~/dev/skills/<name>/SKILL.md` + optional `modules/`).
This skill merges that collection into whatever AI coding tool is running
right now. It is idempotent — safe to re-run.

`~/dev/matt-skills` is a read-only upstream clone (mattpocock/skills) used
only for reference — never merge from it, never edit it.

## 0. Detect the host tool

Identify which tool is running this session (you know what you are; when in
doubt, check which of these exist and are configured: `~/.claude/`,
`~/.kimi-code/`). `$ARGUMENTS` may name the target tool explicitly — honor
it over auto-detection. Then follow the matching section. If the tool has
no section, use "Generic tool".

## 1. Claude Code — mirror copies

Claude only scans `~/.claude/skills/` (global) and `.claude/skills/`
(project); it has no extra-dirs config. So sync **real copies**:

1. For each `~/dev/skills/<name>/`: copy to `~/.claude/skills/<name>/`
   (`cp -r`). Overwrite files that changed; add new ones.
2. Entries in `~/.claude/skills/` that no longer exist in `~/dev/skills/`:
   list them and **ask the user** before deleting — they may be
   machine-local on purpose.
3. Never write into `~/dev/skills` during the merge — sync is one-way.

## 2. Kimi Code — live link via config

Kimi supports `extra_skill_dirs` in `~/.kimi-code/config.toml`, so no
copies — point it at the source:

1. Ensure this top-level key exists (merge entries, don't duplicate):

   ```toml
   extra_skill_dirs = ["~/dev/skills", ".claude/skills"]
   ```

   The relative `.claude/skills` entry covers every project's local Claude
   skills automatically.
2. Remove legacy artifacts from pre-skill-only setups, if present:
   - `~/.kimi-code/agents/<name>.md` wrappers whose `<name>` matches a dir
     in `~/dev/skills` (agents were converted to skills).
   - `~/.kimi-code/skills/<name>/` shadow dirs whose `<name>` matches a dir
     in `~/dev/skills`.
   - Leave anything else untouched (e.g. user-created `rtk`).
3. Skills take effect on new sessions — tell the user to start one.

## 3. Generic tool

No section above fits. Discover how this tool consumes skills:

1. Find where it reads skills/instructions from (official docs first —
   config file, conventional dirs like `~/.agents/skills/`, or
   project-level dirs).
2. Prefer a **live link** (config pointing at `~/dev/skills`, or symlinks)
   over copies. If neither exists, mirror copies as in section 1.
3. Follow the tool's format requirements (frontmatter fields, naming);
   `~/dev/skills` uses the common `SKILL.md` + `name`/`description`
   frontmatter, which most tools accept.
4. Never edit `~/dev/skills` during the merge.
5. If the tool is likely to be used again, propose adding a dedicated
   section to this skill (edit `~/dev/skills/skills-setup/SKILL.md` and
   tell the user what you added).

## 4. Verify and report

- List what was synced/linked, what was removed, what was left alone.
- Sanity-check: every `~/dev/skills/<name>/SKILL.md` has `name` +
  `description` in frontmatter; no lingering references to
  `.claude/agents/` in the collection (agents were converted to skills).
- Remind the user: start a new session in the target tool to pick changes
  up; skills of project scope (`.claude/skills/`) are out of scope here and
  keep working natively.
