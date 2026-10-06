# define.invariant.eco.a-surgoal-must-be-declared-first

## .what

a goal may name a surgoal only if some priority already declares it. the tree is referential,
and the reference is checked.

`--goal subrock://sandpine/decost/pg-upgrade` claims "this is a part of
`subrock://sandpine/decost`." that claim is checked: if no row declares `subrock://sandpine/decost`,
the write is refused. the check runs at every rung, up to the root by induction — a row sits at
depth four only if depth three is declared, and so on down to a `bigrock://` or `altrock://`
that answers to naught.

## .kind: nurture

nature permits the opposite, and most trackers take it — a free-text `epic` field points at
naught, and the tool stays coherent. we refuse the orphan for what it costs, and would refuse it
again. (contrast: the peer invariant `a-part-gates-its-whole` is nature — this one is a choice,
overturnable on evidence.)

## .the invariant, stated

```
surgoals(subrock://R/a/b)  = { subrock://R/a }
surgoals(subrock://R/a)    = { bigrock://R, altrock://R }      — either kind serves
surgoals(bigrock://R)      = ∅                                  — a root owes naught

declared(G)   ⟺  ∃ P : P.goal = G

write(P, G)   ⇒  surgoals(G) = ∅  ∨  ∃ Q ≠ P : Q.goal ∈ surgoals(G)
```

the other end of the same reference:

```
P is the last declarant of G  ∧  ∃ Q : G ∈ surgoals(Q.goal)
  ⇒  P may neither MOVE nor be DELETED
```

consequences: a `set` validates the merged goal against the store; a `set` that moves a goal may
not strand its parts; a `del` is a departure and obeys the same guard; a rename is a subtree
fact, so it earns its own verb (`goal.mv --from --to`).

the surgoal set has two members at the root rung, and only there — a subrock names the root's
SLUG and never its KIND, so it cannot tell whether its parent is `bigrock://R` or `altrock://R`,
and must not have to. to demand one kind would break the alt↔big flip the uri shape exists to
survive.

## .why — three silent costs

the shape check alone is not integrity. `subrock://never-declared/a/b` passes the format regex
cleanly and would read `ready: true` — a leaf of a tree with no trunk.

| cost | what it looks like |
|---|---|
| rollup under-reports | an orphan under an undeclared root is in no rollup; every objective read is short by rows it never counts |
| gates go quiet | `partsOpen` is derived from `--goal`; an orphan is beneath naught, above naught — it holds no one and is held by no one, reads startable forever |
| a typo is unrecoverable by read | `sandpine.decost` vs `sandpine.dcost` both pass the shape check, land in two trees, and no query flags the second — only the FK can |

the FK is what makes the goal tree a tree rather than a naming convention.

## .the rename verb is forced by the FK

under a strict FK a rename is unreachable one row at a time: retype the parent and every
descendant is stranded; retype descendants first and each is refused for a parent not yet there.
a rename is not a property of a row, it is a property of a subtree — so `goal.mv --from --to` is
the shape the invariant demands, not a convenience bolted on. and the split repays its cost:
`set --goal` now has exactly one sense — "this row belongs under that whole" — and cannot
reshape the tree for rows the caller never named.

## .the counter-argument

a strict FK makes the first write harder, and the burden lands on the cheapest call — to record
one priority you must first declare every whole above it. and free-text has a virtue: an orphan
is visible, a human reads the uri and knows what it meant. what we buy for the friction: a typo
becomes catchable, the rollup becomes complete, the tree becomes something a query can walk
rather than a convention a reader must honor. the remedy for the friction — a verb that declares
a whole path in one call — is not yet built; until it lands, the friction is real.

## .what would overturn it

nurture, so overturnable by evidence:

- the friction measurably stops humans from recording priorities at all — an empty correct tree
  beats an unused one
- a legitimate orphan appears — a priority that fits an objective this store should not hold (a
  one-off, someone else's mainquest) — likely repaired by a third root kind, not a relaxed FK

a tedious backfill would NOT overturn it — every extant row violated it the day it landed, which
is the invariant at work, not a cost of it.

## .scope

binds the `goal` column and every write path that touches it — `set`, `del`, `goal.mv`. does
not bind the gate table — a `--gates` edge may cross roots freely, and ties two declared goals
by construction. does not claim a goal is an entity — there is no goal table; a goal exists iff
some row carries it, computed in one place so the write check and the departure guard can never
disagree. does not enforce that a whole is useful — a root declared to satisfy a child is a real
row with a real sev/urg that may need a second look later.

## .enforcement

- a `--goal` written with an undeclared surgoal = **blocker**
- a `set --goal` that moves a row out from under its parts = **blocker**
- a `del` of the last declarant of a goal that has parts = **blocker**
- a rename performed as N `set --goal` calls rather than one `goal.mv` = **blocker**
- a second place that computes "is this goal declared?" = **blocker**

## .see also

- `define.invariant.eco.a-part-gates-its-whole.md` — the nature counterpart to this nurture one
- `rule.require.rock-goal-treestruct.md` — why `--goal` stands for decomposition
- `define.eco.decomposition-vs-orchestration.md` — the two relations; this binds only the first
- `term=partial-audit._.choice._.md` — the under-reported rollup, named
- `rule.require.errors-name-the-fix` (ehmpathy/ergonomist) — why each refusal carries its fix

---

written by human + beaver 🦫
