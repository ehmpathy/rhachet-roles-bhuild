# domain.term: prune

term.chosen   = prune
term.kind     = verb
term.boundary = grove
term.synonyms.forbidden:
- kill
- reap
- purge
- clean up
- sweep
- cull
- nuke

## .what

to **cut back the overgrowth on a grove so the rest of it thrives** — end the runaway processes of
one name, and spare the healthy ones.

```
sprout  →  a tree breaks ground on a grove
fell    →  a tree comes down
prune   →  the GROVE is cut back — no tree is touched
```

a prune acts on **processes**, never on trees, crews, or records. that is the whole of its
boundary, and it is why it is a `grove.*` verb rather than a `tree.*` or `crew.*` one.

## ⚠️ .the SELECTIVITY is the definition, not a feature of it

> **prune** = to cut back overgrowth **so the rest thrives**. never to clear the ground.

a verb that took every match would be a **purge**, and this repo holds one word per concept. so the
cpu floor is not an option bolted onto the act — **it is what makes the act a prune**:

| the call | what it is |
|---|---|
| `--where-cpu-over 100` | a **prune** — the runaways go, the idle ones stay |
| `--where-cpu-over 0` | a **purge**, spelled out on purpose. every match dies |

measured 2026-09-07: eleven `nvim` on one grove ranged 19.7% cpu down to 0.0%. the top three were
the sluggishness; the bottom five were idle editors a human left open. **a verb with no floor takes
a human's buffers to cure a problem three processes caused.**

## .prune is NOT fell, and the two never overlap

`fell` forbids `kill` as a synonym and so does this — but for opposite reasons, and the pair is
best read together:

| | acts on | leaves behind | reversible |
|---|---|---|---|
| **`fell`** | a **tree** + its crew record | naught — the branch and row are gone | no |
| **`prune`** | **processes** on a grove | the tree, the crew, the record — all intact | the process restarts |

⇒ so a pruned crew is **still a crew**. it keeps its tree, its branch, its ledger row, and its
route stone. the forestry metaphor holds exactly: you fell a tree, and you prune a grove.

🔴 **and a prune may NEVER be used to end a clone.** it moves no route stone and touches no crew
record, so a pruned clone leaves a `husk` — a pane whose program is dead, which conceals the gate
that clone had parked at (`term=duct.pane.husk`). the skill refuses `claude`, `tmux`, `node-pty`,
and the box's daemons by construction rather than by caution.

⇒ a clone is ended through the layer that owns its record: `crew.stop` ends the work, `crew.fell`
ends the crew.

## .the four off-verbs, by axis

`fell`'s cluster names three; this is the fourth, and it sits outside their axis entirely:

| verb | the axis | the cost |
|---|---|---|
| `hide` | the **view** | free, reversible with `crew.show` |
| `stop` | the **work** | ends a claude conversation for good |
| `fell` | the **crew** | ends the tree, the branch, the record |
| **`prune`** | the **grove** | ends a process. **no crew, tree, or record is touched** |

⚠️ the first three descend one lifetime at a time and all belong to a crew. **prune belongs to the
machine**, and that is why it is the one a supervisor reaches for when the cause is not the fleet.

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `git.grove.prune.sh` — the verb
- `git.grove.saturation.sh` — the read that names when a prune is due

governed by:

- `rule.require.prune-runaways-before-you-blame-the-grove.md` — rung 0, before the fell ladder
- `rule.require.bound-grove-concurrency-by-saturation.md` — the ladder it precedes

## .reason

see `term=grove.prune._.choice.reason.md` — the enumeration that ruled out `reap`, `purge`, and
`kill`, and the measured case.

---

written by human + beaver 🦫
