# Commit conventions

Single source of truth for commit messages and PR titles. The `commit` and `pull-request` skills both read this file.

## Form

```
type(scope): subject

body

footers
```

| type | for |
|---|---|
| `feat` | new capability the user can observe |
| `fix` | corrects broken behaviour |
| `perf` | same behaviour, better cost |
| `refactor` | same behaviour, different structure |
| `test` | tests only |
| `docs` | documentation only |
| `build` | build system, deps, packaging |
| `ci` | pipeline config |
| `chore` | housekeeping that fits nothing above |
| `revert` | undoes a previous commit |

`scope` is optional. It earns its place when it groups a real area someone would filter on (`fix(printer):`, `ci(prebuilds):`). Drop it when it just echoes the subject — `feat(map): show interest points on the map` says "map" twice.

## Subject

Names the **outcome** — what becomes true — not the mechanism and not the files touched. Imperative mood, lowercase after the colon, no trailing period. Target ~50 characters, hard cap 72.

```
✅ feat: rotate edge indicator toward off-screen marker            (52)
❌ feat: enhance EdgeIndicator with dynamic transform by edge position

✅ fix: keep printer default size out of print_task_runner         (49)
❌ fix: move printer default size calculation to print_task_runner

✅ ci: cache prebuild artifacts across platforms                   (44)
❌ ci: enhance GitHub Actions workflow by implementing cache restoration for prebuild artifacts across multiple platforms
```

The failing pattern is a verb that describes the patch (`enhance`, `update`, `add support for`, `implement`) followed by the component and the mechanism. Ask instead: after this commit, what can the system do that it could not before? That sentence is the subject.

## Body — when it is required

A body is **required** when any of these holds:

- the commit is `fix`, `revert`, or `perf`
- it undoes or contradicts an earlier choice
- it trades one thing for another
- it claims a number (`3x faster`, `CPU 454m`)
- it changes a public contract, or carries `BREAKING CHANGE`
- the obvious alternative was rejected for a reason

Outside that list, the subject stands alone:

```
feat: show interest points on the map
chore: bump node to 24.x
docs: add setup instructions
```

A body that restates the subject does not ship. It teaches the reader that bodies carry nothing, and the next one gets skipped too.

## Body — shape

**Problem → change → evidence.** Running prose wrapped at 72 columns; evidence becomes a bullet list when there are numbers. Name files only when *where* the change landed is itself the point.

The canonical example, from `kubernetes-worker-lab`:

```
fix: queima CPU real no handler para o HPA ver carga

O handler do laboratorio era um sleep(), espera pura com zero CPU. Isso
media apenas o extremo I/O-bound e levava a uma conclusao errada sobre o
HPA.

src/work.ts adiciona WORK_MODE=cpu|mixed, que queima CPU com hashing
encadeado — a dependencia entre iteracoes impede o JIT de eliminar o
laco.

  - espera pura:  CPU  46m (23% do request), HPA nao dispara
  - CPU real:     CPU 454m (250%), HPA escala normalmente

Ou seja, "HPA por CPU nao funciona para consumers" e falso como regra
geral. O defeito real e maxReplicas=6 num topico de 3 particoes.
```

Three moves, in order: what was wrong and what it cost; what the change does and why *that* way; what the reader can check. The last paragraph is what makes the commit worth finding — it corrects a conclusion someone would otherwise act on.

## Footers

`Refs #123`, `Fixes PROJ-12A`, `BREAKING CHANGE: <what breaks and what to do>`.

No co-authorship or generated-by trailers. This history has never carried one.

## Language

Whatever `git config --get skills.language` holds; `pt` when the repo has no value yet. The `type:` prefixes stay English in every language — `feat`, `fix`, `refactor` are the vocabulary, not prose.

One rewrite pair in Portuguese, so the rule reads the same in both languages:

```
✅ feat: aponta o indicador para o marcador fora da tela
❌ feat: melhora o EdgeIndicator com transform dinamico por posicao da borda
```
