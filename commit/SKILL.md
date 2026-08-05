---
name: commit
description: Group working-tree changes into atomic commits and write Conventional Commit messages that carry the rationale. Use when the user wants to commit, says "commita isso", asks to save work to git, or finishes a change that should land as commits.
allowed-tools: Read, Grep, Glob, Bash
argument-hint: "[optional: what the change is about]"
---

# Commit

The diff already records *what* changed. The message carries the **rationale** — why the change was necessary and what it makes true. A future reader who hits this commit in `git blame` gets the reasoning, not a retelling of the patch.

## When to Use
- The user asks to commit, save, or land work
- A change is finished and should enter history
- The working tree holds several unrelated changes that need untangling

## Do Not Use When
- The user asks to push an existing commit and nothing new needs committing
- The user asks for a pull request description — that's `pull-request`

## Workflow

1. **Resolve the language** — `git config --get skills.language`. Set: proceed silently. Empty: ask once (default `pt`), then `git config skills.language <pt|en>` with the user's OK. Never ask twice in the same repo.

2. **Read the change** — `git status`, `git diff`, `git diff --cached`, and `git log -10` to inherit the repo's own conventions. Read the **removed** lines as closely as the added ones: the rationale usually lives in what was replaced. If a wrapper hands back a summary instead of hunks, ask for the raw patch (`rtk proxy git diff` where RTK is on the path).

3. **Split into atomic commits** — one logical change each: it reverts cleanly and reviews on its own. A refactor and the feature it enables are two commits. Stage by path (`git add <paths>`, or `git add -p` when one file holds two changes).
   *Done when* every modified path is either assigned to a commit or deliberately left out with a stated reason.

4. **Write each message** — read `modules/conventions.md` and follow it.

5. **Commit** — if HEAD is on the default branch, `git switch -c <type>/<slug>` first. New work becomes a new commit; `--amend` is for commits that have never been pushed.

6. **Report** — `git log --oneline` of what landed, plus whatever stayed unstaged and why. Push only when the user asked for it.

User request: $ARGUMENTS
