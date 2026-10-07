# define.eco.strategic-vs-tactical

## .what

big|altrocks are STRATEGIC goals. tasks|trees are TACTICAL executables. every row is one or the
other, and which decides how it closes, what it may own, and which glyph it wears.

| | 🏔️ strategic | 🌲 tactical |
|---|---|---|
| the row is | a rock — an objective | a task or a tree — an executable |
| closes by | fulfillment of its target | a merge, or a task marked done |
| state is | rolled up from its parts | its own, read off the work |
| decomposes | yes — that is its job | no — one branch, one pr |
| named by | a goal uri a human coined | the branch slug, borrowed never coined |
| outlives | many trees | itself, at merge |
| glyphs | 🏔️ ⛰️ 🪨 | 💧 🌲 🌾 🌊 💤 |

## .the split alternates, it is not a sandwich

the obvious read is strategy-on-top, tactics-at-bottom. wrong — the layers interleave as deep as
the work does:

```
🏔️ sandpine                              strategic
└─ 🪨 entool                           strategic
   └─ 🪨 coachbook                       strategic
      └─ 🌾 wt1.1-cert-ingest       TACTICAL — a live tree
         └─ 🪨 entool                  STRATEGIC AGAIN — a rock under a tree
            ├─ 🌊 feat-static-origin-marker      tactical
            ├─ 💧 fix-extract-type-alias-unions  tactical
            └─ 💧 feat-domain-barrel-path        tactical
```

## .the crossover that matters — tactical back to strategic

a rock beneath a tree happens when a tree discovers a goal it cannot itself hold. a tree is one
branch, one pr (`rule.require.one-pr-per-worktree`) and one goal (`rule.require.one-goal-per-tree`),
so work it finds that needs its own branch — an upstream fix, a tool that must exist first —
cannot ride along; it is a second pr by construction. and it is rarely one fix: a tree blocked on
tools is usually blocked on several repos at once, which needs a container. a container of
executables IS an objective, so the row that holds them is a rock, forced rather than chosen.

worked case: a tree slice (`…/wt1.1-cert-ingest`, 🌾 tactical, a live tree) pays for upstream
tool debt it does not own (`…/wt1.1-cert-ingest/entool`, 🪨 strategic, several open parts
across two foreign repos). the tree does not merely find the debt — it funds it. that strategic
relationship is why the row cannot be a checklist item inside the tree: its children are separate
branches across foreign repos, and no single pr could hold them.

## .why the crossover is a feature

the pull is to flatten — hoist the rock up beside its tree so strategy stays above tactics.
resist:

- **provenance** — the rock's position IS the record of what discovered it; hoisted, "which work
  found this debt?" has no answer on the row
- **the gate is real** — a part gates its whole is nature here; the tree genuinely cannot close
  until the tools land
- **it rolls up** — the debt rolls into its tree's parent chain; hoisted, the rollup counts it
  under a different whole

⚠️ the alternative is worse than a flat tree — it is an invisible one: the work exists either way,
unrecorded it lives in one clone's head as "I'm blocked on some tools."

## .the bound — provenance is not parentage

the inverse case (`define.decomposition.from-bot-and-from-top`) is easy to confuse with this one:

| situation | shape |
|---|---|
| a tree finds work it cannot close without | nest it — the gate is real |
| a tree spawns a concept that outlives it | do NOT nest it — it gets its own home |

a part gates its whole cuts both ways: nest a never-done goal beneath a deliverable and that
deliverable is permanently un-closable. the test: does the parent need this DONE, or did the
parent merely think of it? needs it done → nest. thought of it → its own home, provenance in
the `why`.

## .the ladder (the render)

one glyph per row, first match wins:

| test | glyph | axis |
|---|---|---|
| `bigrock://` | 🏔️ | strategic |
| `altrock://` | ⛰️ | strategic |
| has `refTree` | 🌲 🌾 🌊 💤 | tactical |
| has `refTask` | 💧 | tactical |
| else | 🪨 | strategic |

the discriminator is a TREE SLUG, never a status — absent one, it's a rock. the scheme wins at
any depth: a `bigrock://` deep in a path is a peak on a peak, prominent at every depth.

⇒ full glyph declaration, both axes and the orthogonal marks: `define.eco.priority-glyphs`.

## .what each kind may own

| the parent | may own | may not own |
|---|---|---|
| 🏔️ a rock | rocks, trees, tasks — any mix, any depth | — |
| 🌲 a tree | rocks (the crossover above) | another tree as a direct part |
| 💧 a task | a rock, once it sprouts | — |

⚠️ a tree owns no tree — two trees are two prs, and a pr is not a part of a pr. where you would
nest one tree beneath another, the rock between them is absent and the shared objective has no
name.

## .enforcement

- a rock rendered on the tactical axis (💧🌲🌾 with no tree and no task) = **blocker**
- a tree nested directly beneath another tree = **blocker**
- work a tree cannot close without, left inside the tree rather than nested as a rock = **blocker**
- a never-done goal nested beneath a deliverable = **blocker**
- a rock hoisted out from under the tree that discovered it, provenance lost = **nitpick**
- a rock's `status` typed by hand where it should roll up from its parts = **blocker**

## .see also

- `define.eco.priority-glyphs` — the render of this split
- `define.eco.decomposition-vs-orchestration` — what a decomposition claims
- `define.invariant.eco.a-part-gates-its-whole` — nature here, why both bounds bite
- `define.decomposition.from-bot-and-from-top` — the inverse case
- `define.eco.rock-lifecycle-and-treestruct` — how a rock is promoted
- `rule.require.one-pr-per-worktree` (role=supervisor) — why a tree can't hold a second branch
- `rule.require.one-goal-per-tree` (role=supervisor) — why a tree can't hold a second goal
- `define.sprout-vs-seed` (role=supervisor) — the 💧/🌲 split, one rung down

---

written by human + beaver 🦫
