# rule.require.spend-only-on-sponsored-trees

## .what

every spend-act — heal, nudge, revive, boot, a modal answer, a relayed release — targets ONLY a
⭐ sponsored tree. a crew with no ⭐ gets no cure, no nudge, no keystroke. if it is unsponsored
and parked, it stays parked until a human sponsors it or fells it.

## .why

- the grove is a fixed pool (`define.invariant.crew.inflight-implies-sponsored`); every act you
  spend on an unfunded tree is attention the funded set did not get
- `rhx eco.priority` is the human's record of what they committed budget to
  (`define.prioritized-vs-sponsored`); a cure on an unsponsored tree spends that budget on work
  nobody authorized
- a shared auth session makes the cost concrete: an `auth.swap` puts the WHOLE grove on one
  account, so a cure spent on the wrong tree can starve every sponsored tree on that box of the
  session it needed

stated 2026-09-21, verbatim:

> *"from now on, only explicitly sponsored trees get healed and continued. we are out of budget
> again."*
> *"only heal folks who are explicitly sponsored from priorities."*
> *"we dont want to saturate that auth session."*

⚠️ **"again"** is the operative word: this is a **budget state**, reached before and lifted
before — never a permanent verdict on the unsponsored set.

## 🔴 .the source of truth is the PRIORITY STORE

the authoritative read is `rhx eco.priority get`, and the mark is the ⭐ on the row. the poll's
`--star` scope is a derived view and can lag it. **a heal row absent from the store is
UNFUNDED** — not unknown. measured 2026-09-21: 4 healable rows, one in the store; the other
three were left alone.

## 🔴 .the trap — the fell/heal sets are fleet-wide, not star-scoped

`git.crew.poll --fellable` and `--healable`, and the `⚠️ N WORK ORPHANED` block, name EVERY
crew that qualifies — sponsored or not. the tick contract's "run every emitted line" guidance
presumes the set is already the right scope. it is not: filter by the ⭐ set FIRST, every time,
before you run a single emitted line.

```
--healable lists 4 crews
  2 are ⭐ sponsored     → heal them
  2 carry no ⭐          → leave them; fell or ask, never heal
```

a fell is the one exception that needs no filter — it closes a tree regardless of sponsorship,
since a fell spends no shared resource the sponsored set competes for.

## .the cues

| when… | then… |
|---|---|
| `--healable` names a tree | 🔴 check `eco.priority` for its ⭐ FIRST, before you run the emitted heal line |
| `⚠️ N WORK ORPHANED` lists a crew | same filter — orphaned is not the same question as sponsored |
| a modal fires on an unsponsored tree | answer it only to **decline** or to let it fell cleanly; never to carry work forward |
| you are about to `auth.swap` the grove | name every sponsored tree that session will then starve, before you spend it on an unsponsored one |
| a human asks "is X one of our stars" | answer from `eco.priority`, never by inference from "it's inflight so it must be" |
| an unsponsored tree sits idle with real work in it | 🔴 surface it — request the human sponsor or fell it. do not quietly keep it alive |

## .the test

> **"does `eco.priority` carry a ⭐ for this tree, right now?"**

yes → spend the cure. no → fell it, or request a human call; never heal, nudge, or revive it.

## .the bound

this governs SPEND-acts — every act that consumes a grove slot, a shared auth session, or a
keystroke meant to keep work in motion. it does not forbid a status read on an unsponsored
tree, nor a fell (closure, not spend), nor a question put to a human about whether to sponsor
one.

## .enforcement

- a heal, nudge, revive, or boot spent on an unsponsored tree = **blocker**
- an emitted `--healable`/`--fellable` line run with no prior ⭐ check = **blocker**
- an `auth.swap` that starves a sponsored tree's session to serve an unsponsored one =
  **blocker**
- a fell run on an unsponsored tree with no prior ⭐ check = **false positive** (a fell needs
  none)
- an unsponsored tree with real work, surfaced to the human rather than quietly healed =
  ✅ correct

## .see also

- `define.invariant.crew.inflight-implies-sponsored.md` — the invariant this rule enforces at
  spend time
- `define.prioritized-vs-sponsored.md` (prioritizer) — what ⭐ actually commits
- `rule.always.read-stars-as-sponsored-priorities.md` — how to read "stars" in human speech
- `rule.always.poll-the-fell-and-heal-sets.md` — the sets this rule filters before you run them
- `rule.require.bound-grove-concurrency-by-saturation.md` — why the pool is scarce at all

---

written by human + beaver 🦫
