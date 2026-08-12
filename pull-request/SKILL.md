---
name: pull-request
description: Write a pull request title and description from a branch's commits, then open or update it with gh. Use when the user wants to open a PR, asks for a PR description, or wants an existing PR's description rewritten.
allowed-tools: Read, Grep, Glob, Bash
argument-hint: "[optional: base branch, PR number, or framing]"
---

# Pull Request

A commit message speaks to whoever does archaeology months later. A PR description speaks to whoever has to **check this now** — so it carries the same rationale plus the route a reviewer walks.

## When to Use
- Opening a PR for the current branch
- Writing or rewriting the description of an existing PR

## Do Not Use When
- The work is not committed yet — that's `commit`
- The user wants a code review rather than a description

## Workflow

1. **Resolve the language** — `git config --get skills.language`. Set: proceed silently. Empty: ask once (default `pt`), then `git config skills.language <pt|en>` with the user's OK.

2. **Establish the range** — base branch from `gh repo view --json defaultBranchRef` (or the existing PR's own base; `gh pr view --json baseRefName,number` when one exists). Then `git log <base>..HEAD` for the commits and `git --no-pager diff <base>...HEAD` for the patch (`rtk proxy git diff <base>...HEAD` if a wrapper summarizes it).

3. **Honor the template** — when `.github/PULL_REQUEST_TEMPLATE.md`, `pull_request_template.md`, or `.github/PULL_REQUEST_TEMPLATE/` exists, fill **its** sections and keep its headings verbatim. Upstream projects bounce PRs that drop the template. The shape in step 4 applies only when there is none.

4. **Write it** — title follows the subject rules in `../commit/modules/conventions.md` (skill `commit`). Body:

   - **Por quê / Why** — the problem, 1–3 sentences.
   - **O que mudou / What changed** — the shape of the solution, grouped by area. Not a file list; the Files tab is already a file list.
   - **Como verificar / How to verify** — the steps a reviewer runs, concrete enough to follow without reading the diff first.
   - **Risco / Risk** — only when it is not obvious: migrations, flags, breaking changes, anything with a rollback story. An empty section teaches reviewers to skip sections.

   Link issues with closing keywords (`Closes #12`). Leave the commit list out — GitHub's Commits tab shows it.

   The body ends on the last section. **No AI attribution** — no `Generated with`, no bot emoji, no co-author trailer naming a model, even when a host default asks for one. See Footers in `../commit/modules/conventions.md`.

5. **Open or update** — write the body to a temp file to avoid shell quoting, then:
   - new: `gh pr create --base <base> --title <title> --body-file <f>` (`--draft` only when asked). The branch must be pushed first — `git push -u origin HEAD` is part of opening the PR.
   - existing: `gh pr edit <n> --body-file <f>` (add `--title` when the title changes too).

6. **Report** — the PR URL.

User request: $ARGUMENTS
