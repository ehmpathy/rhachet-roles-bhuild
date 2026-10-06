# define.invariant.eco.goal-is-uuid-primary-uri-unique

## .what

> **a goal is an ENTITY with two keys, and every foreign key holds the meaningless one.**

```
Goal {
  primary = [uuid]   minted, meaningless on purpose. what every FK holds
  unique  = [uri]    the natural key. what a human says, greps, and renames
}
```

## .kind

**nature.** a goal uri is renameable (`goal.mv` cascades over a subtree), and
`rule.require.immutable-refs` (ehmpathy/mechanic) demands an immutable primary key. a
renameable value cannot satisfy that, so only a minted uuid can. no third option exists.

⚠️ the *scope* is nurture — see `.scope`.

## .invariant

```
∀ edge e, ∀ endpoint k of e  ⇒  k ∈ goal.uuid
goal.uuid is immutable for the life of the goal
goal.uri  is UNIQUE, and MUTABLE
```

operative half: **a value a human can retype is NOT a key.**

## 🔴 .why — two measured costs

**silent loss, 2026-09-14.** four priority rows were deleted. three edges pointed at them
by slug, and vanished — no refusal, no report, no trace in git. a slug-keyed edge has no
referent, so sqlite had naught to enforce. with `REFERENCES goal(uuid)` the same delete is
`FOREIGN KEY constraint failed`.

**rename cost, 2026-09-15.** one `goal.mv` moved 9 rows. keyed on uri, every edge to those 9
must be chased and repointed. keyed on uuid, the edge file came out **byte-identical** — a
one-column edit per goal instead of a graph rewrite, and a graph rewrite is where a silent
drop hides.

## .the five tables

```
priority              the row a human ranks. slug PRIMARY, one per tree
goal                  the IDENTITY. uuid PRIMARY, uri UNIQUE
goal_orchestration    before -> after     ORDER      "what must happen first?"
goal_decomposition    part   -> whole     PART-OF    "what is this a part of?"
goal_sponsorship      an EPISODE          BUDGET     "who funded this, why, since, until?"
```

### `goal` — extracted, never designed

a goal was once a TEXT column on `priority`, and the edge tables keyed on two namespaces —
one on a priority slug, one on a goal uri. one graph, two keyspaces, no join. now both key on
`goal.uuid`. `slug === goal` (`rule.require.rock-goal-treestruct`) made the merge exact.

### `goal_sponsorship` — the same extraction, run again

`priority.sponsored` was a 0/1 flag until 2026-09-15 — two homes for one fact. now it is an
**episode** on the goal, and the `priority_live` view derives `sponsored`.

| the flag said | the episode says |
|---|---|
| `1` | **who**, **why**, **since**, **until** — and it survives the unsponsor |

⇒ a bare `--sponsor` is refused: `--sponsor-who` and `--sponsor-why` are required. an
unsponsor closes the episode (`until = now`), never deletes it. it keys on the goal, so it
outlives any one priority row.

### the two edge tables are orthogonal

| | `goal_orchestration` | `goal_decomposition` |
|---|---|---|
| relation | A must-precede B | A is part-of B |
| datastruct | a timeline | a rootstruct |

`paint` is part of a house and precedes naught; `walls` precede `roof`, and neither is part
of the other. one implication holds — a part precedes its whole
(`define.invariant.eco.a-part-gates-its-whole`) — and that edge is **derived, never stored**.

### 🟡 each table holds only the EXPLICIT half

| table | holds | does NOT hold |
|---|---|---|
| `goal_orchestration` | edges a human decided | the derived part-precedes-whole |
| `goal_decomposition` | the **extra** parents that make a DAG | the path-implied parent |

a uri carries one path — a tree — which cannot express a goal that serves two roots
(`define.invariant.eco.gain-propagates-down-and-sums`). so only the extra parent moves out of
the string. to store the implied one too would give it two homes, and make a promotion
rewrite every descendant instead of one row.

### the names conform, never coin

`gate` and `serve` until 2026-09-15. `gate` already named a check that refuses to exit 0;
`serve` already named the path-implied parent. `decomposition` and `orchestration` are the
words `define.eco.decomposition-vs-orchestration` already declared
(`rule.forbid.domain-term-inconsistency`). the `goal_` prefix carries weight
(`rule.require.boundary-qualified-terms`): bare `decomposition` and `orchestration` collide
with the architect's terms.

## .scope

covers the **edge** keys. it does not cover:

- **`priority.goal`** — stays a uri TEXT column, not an FK. under `slug === goal` it is the
  row's own natural key, and a uri keeps `priority.csv` legible in a diff
  (`define.invariant.eco.the-store-is-plaintext-in-git`). ⚠️ nurture, and an open call: it
  trades a guarantee for legibility
- the **derived** part-precedes-whole edge — stored nowhere
- the **views** (`goal_orchestration_slug`, `goal_decomposition_uri`) — they render uuids back
  into words and hold no fact

## .the litigation

2026-09-14, verbatim:

> *"so a Goal { unique = [slug], primary=[uuid] } ; where primary is used for all the foreign
> keys? this should have been a rule the rhachet-roles-ehmpathy architect enruled"*

2026-09-15, verbatim: *"i dont like gate and serve. those are ambiguous."*

⇒ dispatched upstream as `rule.require.uuid-primary-natural-unique`.

## .the counter-argument

> *"a uuid is unreadable — the edge-file diff is now unreviewable."*

true. the cost lands in ~8 lines no human reviews. the views still render slugs and uris,
and `priority.csv` — the file a human reads — still carries the uri. the alternative pays in
that very file: every rename becomes a multi-row rewrite.

## .what would overturn it

- **goal uris stop to be renameable** — then the natural key is immutable and the uuid is
  dead weight. unlikely: a rock is expected to flip (`define.eco.rock-lifecycle-and-treestruct`)
- **the store stops to be plaintext** — then the `.scope` carve-out for `priority.goal` closes

## .enforcement

- an edge column without `REFERENCES goal(uuid)` = **blocker** (the 2026-09-14 loss)
- a uuid minted anywhere but `genGoalUuid` = **blocker** (two uuids split one goal)
- `PRAGMA foreign_keys` unset on a connection = **blocker** — sqlite defaults it **OFF**
- a hand join to the uuid rather than through a view = **nitpick**
- a caller handed a uuid = **blocker** (the uuid never reaches a human)

## .see also

- `define.eco.decomposition-vs-orchestration` — the two relations, and the house
- `define.invariant.eco.a-part-gates-its-whole` — the one derived implication
- `define.invariant.eco.the-csv-is-truth-the-db-is-a-cache` — why a table rename is a file rename
- `define.eco.rock-lifecycle-and-treestruct` — the rename this key shape makes cheap
- `rule.require.immutable-refs` (ehmpathy/mechanic — **foreign**)
- `rule.require.boundary-qualified-terms` (bhrain/learner — **foreign**)
- `rule.forbid.domain-term-ambiguity` (bhrain/learner — **foreign**)

---

written by human + beaver 🦫
