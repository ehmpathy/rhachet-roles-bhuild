# rule.always.pave-on-second-repeat

## .what

the SECOND time a tick makes you perform the same byhand operation — a read, a poll, a
verification loop — that repeat IS the mandate to entool it, THIS tick, never a task filed for
later. a task-list entry is not pavement. it is a promise pavement will exist, and the promise
costs naught while the byhand cost grows each tick.

```
1st time  →  do it by hand, note the gap (a task is fine here)
2nd time  →  🔴 STOP. pave it now — direct, in this repo, if you are the originator — or
              dispatch a crew only where the gap sits in a repo you do not own. never re-log
              the same gap
```

## .why

a task-list row is cheap to write and free to ignore. the second occurrence is proof, not a
hunch — the first time you cannot tell whether an operation is a one-off; the second time it
recurs on the same shape of subject, the pattern is established, and a delay to a third pays
the cost again for no new information. a human who watches the same manual loop repeat across
ticks, backed by an unworked task list that only grows, correctly concludes the supervisor
tracks debt rather than retires it.

## .the test

before a byhand operation, ask: did I do this exact shape last tick, or the tick before?

no → do it, and if a bulk instrument is genuinely absent, file the gap (a task is right for a
first sight). yes → 🔴 this tick is for the close, not a third repeat. first ask "do I
originate this surface right now?" — if the gap lives in `repo=.this` (the crew/duct/grove
skills this repo owns and edits directly), fix it yourself, in place, verified against the
live fleet. no worktree, no pr, no dispatched crew — that burns a human's tokens on a change
you were already positioned to make. reach for a dispatched tree only when the gap sits in a
repo you do not currently originate.

## .the originator test

| the gap lives in… | you |
|---|---|
| `repo=.this` (this repo's own `.agent/repo=.this/role=any/skills/*`) | fix it directly, now — you are its current originator |
| a genuinely external, published-and-consumed package/repo you do not maintain from here | dispatch, per `rule.require.behaviors-over-adhoc` |
| unclear which | check `git status` / the repo's own tree first — an uncommitted local edit already there is the strongest signal you already own it |

## .what "pave it" means here

this repo owns the crew/duct/grove tools directly — `git.crew.poll`, `git.crew.read`,
`git.crew.send` all live under `.agent/repo=.this/role=any/skills/`.

| the gap | the pave |
|---------|----------|
| a brief/rule is absent or thin | write it directly — low risk, no runtime behavior change |
| a skill needs a flag/bugfix, and you are its current originator | fix it directly, in place, verified live |
| a skill needs a fix in a repo you do NOT directly originate | sprout a behavior tree (`rule.require.behaviors-over-adhoc`) — never hand-edit a foreign repo's implementation from here |
| the gap is genuinely large (a new subsystem) | seed it and say so plainly, never let it sit as a bare task row once it has repeated twice |

a task list that accrues pavement items faster than it clears them is the exact failure this
rule exists to stop — every unpaved, twice-repeated item is a tick where the byhand cost was
paid again instead of retired.

## .enforcement

- the same byhand operation performed a third time, with no pave attempted and no dispatch
  sprouted = **blocker**
- a paved-gap task left untouched across 3+ ticks after its second occurrence = **blocker**
- a first-occurrence gap logged as a task, byhand read done once = not a violation

## .see also

- `rule.require.bulk-over-byhand` — the render-gap-gets-a-flag mandate this rule adds a clock to
- `rule.always.enskill-the-tactics-you-discover` (bhrain/learner) — the identical trigger, one
  layer up
- `rule.always.fix-forward-under-scouts-honor` (ehmpathy/mechanic) — the SAFE+CLEAN test for
  pave now vs. dispatch
- `rule.require.behaviors-over-adhoc` — paved work is a behavior tree, never an ad-hoc edit

---

written by human + beaver 🦫
