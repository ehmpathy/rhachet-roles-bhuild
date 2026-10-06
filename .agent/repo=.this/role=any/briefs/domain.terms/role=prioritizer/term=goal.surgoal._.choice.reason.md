# domain.term.choice.reason: goal.surgoal

## .etymology

`sur-` is the french/latin prefix for **above, over** — as in *surname* (the name above the given
name), *surcharge*, *surpass*. so a **surgoal** is the goal above a goal.

the prefix was reached for because the relation needed a word that composes in **both** directions
against one root. english gives `parent`/`child`, which imports a family metaphor the domain does
not hold: a goal may have several surgoals, and a part is not owned by its whole. `sur-` says
**position** and says no more, which is exactly the claim.

## .why not the rejected words

| candidate | why not |
|---|---|
| `parent-goal` | ⛔ two words, and it imports a hierarchy of ownership the tree does not have. a goal may sit under several surgoals at once — that is the whole basis of "N birds, one stone" |
| `epic` | ⛔ jira jargon. an epic is a **tier** (epic → story → task), fixed in depth. a surgoal is a relation at **any** depth, and the same row is both |
| `supergoal` | ⛔ `super-` reads as *"greater than"* — a rank claim. a `p3` surgoal above a `p0` part is legal and common |
| `overgoal` | same defect as `supergoal`, with a clumsier surface |
| `whole` | ⚠️ the closest miss, and it stays in live prose use on purpose. `whole`/`part` is the right pair for the RELATION in the abstract; `surgoal` is the word for the whole **as a goal uri a row names**. left unforbidden — prose may say *"the whole"*, a contract says `surgoal` |

## 🔴 .the dispute this file settles — surgoal was OVERLOADED, and one sense was struck

**raised 2026-09-13, resolved by the wisher, verbatim:**

> *"Correct `term=surgoal`: it means parent goal"*

### the two senses that shared the word

| sense | what it meant | where it lived |
|---|---|---|
| 🔴 **A — a relation** | the goal one rung up in a decomposition tree | `eco.priority`: the FK, `goal.mv`, both rollup invariants, the skill help, the store's refusals |
| **B — a kind** | a permanent target with no trigger that never completes, carried as a lens on every act | `surgoal.squeeze-the-grove`, and its boot entry |

⇒ **sense A keeps the word.** it is the one written into contracts — a column, a foreign key, a
refusal message, a verb name — and `rule.forbid.domain-term-synonyms` binds contracts above prose.

🔴 **CORRECTED 2026-09-26, at the lift: sense B has TWO instances, not one.** enumerated in this
package, by the verbatim sentence each carries:

```
src/domain.roles/supervisor/briefs/surgoal.squeeze-the-grove.md:8
src/domain.roles/supervisor/briefs/surgoal.polish-the-supervisor-and-prioritizer-tools.md:9
  → both read "this is a **surgoal** — a target carried on every tick, never completed, never closed"
```

⇒ the count is load-bearing in two places below, and **it moves one of them**. see the correction
under *"what sense B is owed"*.

### why it was a genuine AMBIGUITY rather than a boundary split

`rule.forbid.domain-term-ambiguity` sorts on *"$word, of WHAT?"*:

- sense A: a surgoal **of a goal** → one answer, one boundary
- sense B: a surgoal **of a role** → a different referent entirely

two answers, and the concepts are opposite on the property that matters most: **sense A completes
and sense B cannot.** a reader who carried B into A's territory would read a decomposition tree as
a set of permanent targets and conclude a whole never closes.

🟡 and the tell that it was real rather than pedantic: the prior `.choice._.md` declared
*"never completes, never closed"* as **the whole term**, while the store's FK error message used the
same word for a row that is expected to close the moment its parts do.

### what sense B is owed

sense B is a real concept and still needs a word. 🟡 **best guess: `evergoal`** — `ever` = always,
so an evergoal is a target that is always on, never discharged. it keeps the `-goal` genus, coins
no rank claim, and composes (`evergoal.squeeze-the-grove`).

⇒ **flagged, not settled** — and 🔴 **the REASON for that changed at the lift, though the verdict
did not.** as written, the deferral rested on two grounds:

| the ground | status |
|---|---|
| `rule.require.enumerate-before-you-name` refuses a word chosen against **one** instance | 🔴 **NO LONGER HOLDS.** sense B has **two** (enumerated above). `#378` named this exact trigger — *"the trigger to settle it is a SECOND surgoal"* — and it has fired |
| the rename is **dirty** — it opens `boot.yml`, the two saturator catalogs, both briefs, and this `.reason` | ✅ **still holds**, and it now carries the deferral alone |

⇒ so the verdict survives on one leg instead of two. **that matters**, because a reader who checks
only the first ground will conclude the naming decision is still blocked when it is not — the block
is now purely the cost of the edit, which is a thing a human may simply authorize.

⚠️ **and the stale count is the defect worth naming here, not the rename.** this file asserted *"sense
B has exactly one"* while a second instance sat in the same corpus, so its own stated precondition
was satisfied and unnoticed. ⇒ **a count is a claim, and a claim that supplies its own verification
is the one that goes stale unseen.** the repair is the enumeration above — a list, never a number.

the rename of `surgoal.squeeze-the-grove`, `surgoal.polish-the-supervisor-and-prioritizer-tools`,
their `.reason`, the two saturator catalogs, and the `boot.yml` entry stays deferred with a dream
and this fulcrum rather than ridden along.

⚠️ **until it is renamed, sense B is live under a word that no longer means it.** a reader who hits
`surgoal.squeeze-the-grove` and comes here will find sense A and no tree above it. that is the cost
of the deferral, and it is stated rather than hidden.

## ⚠️ .the boundary — settled here, UNSETTLED in the prior file

the prior `.reason` recorded the boundary as unsettled and named `goal` as *"the genus, not the
boundary — `goal.surgoal` reads as a tautology."*

🔴 **that argument was correct for sense B and wrong for sense A**, and the difference is exactly
the dispute above:

- sense B named a **kind of goal**, so `goal` was its genus and the qualifier said naught
- sense A names a **position relative to a goal**, so `goal` is what it is relative TO — which is a
  boundary, not a genus

⇒ *"a surgoal, of WHAT?"* → **of a goal.** one word, and it reaches a declared root beside its peer
`term=goal.effect`.

## .evidence

the relation was not coined in the abstract. it was named because the store needed a word for what
a foreign key points AT, and the refusal message had to teach it:

> `--goal 'subrock://decost/a/b' names a part of 'subrock://decost/a', and no priority declares
> that goal yet. a part of a whole nobody declared is a leaf with no trunk.`

and the measured cost that made the reference strict, 2026-09-13: **all 10 extant rows** violated it
on the day it landed, and every one named a whole nobody had declared.

## .disputes

### dispute: the two senses of `surgoal` — raised 2026-09-13 — status: RESOLVED (sense A keeps it)

- raised.by  = human
- claim      = `surgoal` means the parent goal — the goal one rung up
- counter    = a prior cluster declared it a permanent target that never completes, coined the same
               day from a different find
- resolution = sense A (the relation) keeps the word; it is the sense written into contracts. sense
               B is renamed, best guess `evergoal`, deferred as a dream with this fulcrum. the
               forbidden-synonym list is rewritten for sense A — `north-star`, `okr`, `kpi`, and
               `mission-statement` were forbidden **against sense B** and do not bind sense A, so
               they move with sense B to whatever word it takes

---

written by human + beaver 🦫
