# rule.require.rock-goal-treestruct

## .what

every rock goal uri follows one shape, split by `/` at every level:

```
{org}/{category}/$slug[/$slug…]
```

- `{org}` — the org that owns the objective: `sandpine`, `rhachet`, …
- `{category}` — the mainquest kind, a closed set: `decost` | `ensell` | `entool`
- `$slug[/$slug…]` — the decomposition treestruct: the initiative, then its build pieces, each
  its own `/` level

```
sandpine/ensell/book-a-lesson/spot-forecast-widget
sandpine/decost/sms-tune/waste-audit
rhachet/entool/route-efficiency/dispute-or-concede
```

no dot as a level separator. one separator — `/` — from org down to the deepest piece.

## .why

- **rollup at any level** — `sandpine` gathers all product work; `sandpine/decost` all cost work;
  `sandpine/decost/sms-tune` one initiative. a dot-joined root can only roll up at the root.
- **one separator, no boundary guess** — a mixed `sandpine.decost/sms-tune` forces a reader to
  know which dots bind the root and which is a level. all-`/` removes the question.
- **every level is addressable and promotable on its own.**

## .the category set

| category | drives | pattern |
|---|---|---|
| `decost` | cost **down** | de-cost |
| `ensell` | revenue **up** | en-sell |
| `entool` | tools **up** | en-tool |

a category outside this set is a new mainquest kind — a taxonomy decision, never a free-form
slug (`define.eco.rock-taxonomy`).

## .the store roots at the ORG

the store roots a subrock at its first `/` segment — the org. `sandpine/decost/sms-tune/waste-audit`
roots at `sandpine`; `decost` is the first mid-tree level beneath it. rollup by category is a
mid-tree filter (`{org}/{category}`), not a root filter — `sandpine/decost` gathers all cost work,
`sandpine` gathers all product work.

## .enforcement

- a rock goal with a dot as a level separator = **blocker** (hides a level from the rollup)
- a `{category}` outside `{decost, ensell, entool}` = **blocker**
- a `{category}` promoted to the root slot, ahead of the org = **blocker**

## .see also

- `define.eco.rock-taxonomy` — the three mainquest roots and the org split
- `define.eco.rock-lifecycle-and-treestruct` — the root/path store behavior and the kind lifecycle
- `define.eco.decomposition-vs-orchestration` — the treestruct is the decomposition half

---

written by human + beaver 🦫
