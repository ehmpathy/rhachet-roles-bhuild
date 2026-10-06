# rule.forbid.adhoc-worktree-actions

## .what

never execute actions directly in another worktree. dispatch a crew instead.

## .why

- **context pollution** — your session loses focus on this repo's work
- **token waste** — you pay the full boot cost of a foreign repo's briefs
- **no persistence** — your work vanishes when the session ends
- **no observability** — the human cannot see what you did

## .pattern

| ⛔ forbidden | ✅ required |
|-----------|----------|
| cd into the worktree, run commands | sprout a crew, then `rhx git.crew.send` |
| read files from the worktree | let the crew read them |
| edit files in the worktree | let the crew edit them |

## .how to dispatch

```bash
# 1. author the wish in THIS repo, under the daily stream
#    src/stream/$Q/$date.dispatch.repo=$repo.behavior=fix-the-issue.wish.md

# 2. boot worktree + ducts + behavior in one call (--size + --wish required)
rhx git.tree.behavior --into org/repo --name beav/fix-the-issue --size nano \
  --wish src/stream/$Q/$date.dispatch.repo=$repo.behavior=fix-the-issue.wish.md

# 3. check progress — a crew verb, never a duct call
rhx git.crew.read --tree <tree> --who mechanic
```

the skill installs deps, upgrades, boots the behavior from the wish, and drives the route.
there is no separate ad-hoc `claude … "task"` dispatch (`rule.require.behaviors-over-adhoc`).

## .exception

a **read** of worktree state, for supervision, is allowed:

- `rhx git.crew.read --tree <tree> --who <role>` — check progress
- `rhx git.crew.poll` — the whole fleet
- `git log` — verify commits

## .enforcement

direct action in a foreign worktree = **blocker**

## .see also

- `define.sprout-vs-seed.md` — whether a tree is owed at all
- `rule.always.entool-the-layer-you-drop-below.md` — the crew verbs above, and why a `duct.*`
  call is never the answer
- `howto.dispatch-workers.md` — the full dispatch flow

---

written by human + seaturtle 🐢
