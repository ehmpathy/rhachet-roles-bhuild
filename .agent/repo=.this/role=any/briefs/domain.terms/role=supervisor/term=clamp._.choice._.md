# domain.term: clamp

term.chosen   = clamp
term.kind     = noun  (the verb form — *to clamp* — is the same word, per `poll`'s precedent)
term.synonyms.forbidden:
- guard
- regression test
- safety net
- canary
- lock
- latch
- smoke test
- assertion

## .what

a test whose job is to **hold a repaired defect shut** — it goes **red** while the defect is
present and **green** once it is fixed, so the defect cannot return unnoticed.

```
a test      proves the intended behavior WORKS
a clamp     proves a known defect CANNOT RETURN
```

every clamp is a test. most tests are not clamps.

## .the two demands, and neither is optional

| demand | what it requires | what it forbids |
|---|---|---|
| **it BITES** | it must have been seen **red** under the un-fixed defect | a test that passes either way |
| **it clamps a CLASS** | the boundary, the shape, the mechanism | the single value that broke |

`rule.require.clamp-edge-cases` sets both. the first is its step 2, and it is the one skipped
most, because a green reads as proof whether or not it was ever earned.

## .a clamp that cannot bite is WORSE than absent

this is the whole reason the word needs teeth of its own. an absent clamp is a known gap. a
vacuous one is a **false report** in test form: it reads as protection, and it guards naught.

three shapes on record, each green throughout:

| the clamp | why it could not bite |
|---|---|
| `[case10]` — *"NOT ONE survives its own teardown"* ✓ | it checked the socket FILE, which tmux unlinks EARLY. 43 orphans in a shared `/tmp` |
| `[case7]` — the litter sweep | it snapshotted a list still under construction. 1,786 orphan dirs under a green |
| two clamps in `define.work-primitive-hierarchy` | *"a comment-strip one step too far would have made them vacuous while they reported green"* |

so the test is not *"did it pass?"* but **"what would it have done had the defect been
present?"** where the answer is *the same*, its jurisdiction does not cover the defect
(`term=partial-audit`, the green-check cure).

## .a clamp aimed at the CLASS measures how wide the class is

the sharpest argument for demand 2, and it is not an argument from principle — the clamp
tells you.

evidenced 2026-08-31. a silent arg-parser catch-all (`*) shift ;;`) had eaten `--anyway`,
been repaired at the instance, and ~months later eaten `--await` — which left a sprouted tree
**with no bound behavior**. `[case12]` was written against that one file and came back red
over **six more wrappers** that carried the identical line.

> an instance fix would have left six loaded guns, and no reader could have named them.

a clamp on the class is therefore also an **instrument**: it does not merely hold the door,
it counts the doors.

### ⚠️ a clamp's jurisdiction is its ASSERTION, never its prose

demand 2 is easy to satisfy in appearance. a clamp can **name** the class in its `.why` —
correctly, in full, even predictively — and still assert only the instance. a reader who
meets that prose will believe the class is held. it is not.

evidenced 2026-09-01. `[case16]` clamped a guard against an ungated cross-source join, and
its own comment named the class exactly:

> *"the defect is not `shell`; it is an unguarded substitution across a source boundary.
> **any future datum joined from duct.poll — a stone, an age, a box — inherits it unless the
> guard sits on crew_state itself**"*

its assertion was one `if` line, matched **verbatim by regex**. so when a NEW consumer of
that same source landed ~170 lines below, ungated, the clamp stayed **green** — it could not
see a second consumer, because it had been pointed at the first one's text.

the prediction was right, the diagnosis was right, and the clamp held naught of either.

| | what it covers |
|---|---|
| the `.why` prose | the CLASS — *every* consumer of that source |
| the assertion | one line of one consumer, by string |

⇒ **read a clamp's assertion, then ask what ELSE could break the way its prose describes.**
where the answer is *"a second site, and this would not see it"*, the clamp is aimed at the
instance whatever its comment claims.

the cure is structural rather than a sharper string: `[case17]` walks EVERY dereference of
that source and demands a gate above each, so consumer number three is caught the day it
lands. an enumeration beats a pinned string, because **a string can only ever match what
already exists** — and a class is by definition about what does not exist yet.

this is `term=partial-audit`'s green-check cure aimed at a clamp's own scope: *a check that
could not have gone red on the defect is not evidence about the defect.* `[case16]` could not
have gone red on the consumer that broke, so its green said naught about it.

## ⚠️ .a clamp can BITE, hold the CLASS, and still clamp the WRONG CONTRACT

both failure modes above fail a **demand** — one cannot bite, the other is aimed at an
instance. this third one **meets both** and is wrong regardless, which is what earns it a
section rather than a line.

an **inverted clamp** encodes the DEFECT as the guarantee. it is a faithful, class-aimed
assertion pointed at the wrong side of the contract: it holds green while the bug lives,
and it goes **red the day the bug is fixed**.

evidenced 2026-09-02, in this repo's own crewwork suite. `[case3]` read:

```ts
then('it passes no --cwd, since it could not stat the dir', () => {
  expect(result.calls[0]).not.toContain('--cwd');
});
```

`--cwd` is the one arg that keeps a duct's pane on its tree. absent it, both ducts of a
cloud crew came up in the ssh login dir — `/home/camper` — so a crew nominally on a tree
held a shell that had never seen it, and `git branch --show-current` answered about another
repo. that clamp reported green for as long as the defect lived, and it was the FIRST
assertion to fail when the arm was repaired.

### .why the two demands cannot catch it

| demand | the inverted clamp |
|---|---|
| **it BITES** | ✅ perfectly — it went red the instant the code changed |
| **it holds a CLASS** | ✅ the whole cloud arm, not one value |

so the bite-proof of `rule.require.clamp-edge-cases` step 2 is **met and useless** here: the
author reverts, sees red, restores, sees green, and has confirmed only that the assertion
tracks the code — never that the code was right. a clamp inherits its author's conclusion,
and a wrong conclusion clamps just as tightly as a right one.

### .the tell, and it sits in the clamp's own NAME

read the sentence the `then` makes, and ask whether it states a **guarantee a caller wants**
or an **excuse the code offered**:

| the name says | verdict |
|---|---|
| *"--cwd rides, and it is the dir the grove named"* | a guarantee — sound |
| *"it passes no `--cwd`, **since it could not** stat the dir"* | ⛔ an excuse, transcribed |

the `since` / `because` / `so it cannot` clause is the signature. a guarantee carries no
apology. that clamp's own name held the code's rationalization word for word, and nobody
read it across a whole class of runs — because a green never asks to be read.

> **a clamp is only ever as right as the sentence its author believed.** the bite proves the
> assertion tracks the code; naught in the ritual proves the code deserved it.

so the third demand, owed alongside the two: **say the clamp's name out loud and ask whether
a caller would ASK for that.** where the answer is *"no, but the code does it"*, the clamp
holds a defect shut rather than a promise.

that is `term=substituted-criterion` aimed at a test: the standard the assertion judged
against was supplied by the code under test, never by the contract — and the assessor (the
clamp's author) never noticed the swap, because the code was the only source in view.

## .a clamp is NOT

- **a `guard`** — TAKEN, and the collision is total: a guard is the bhrain route gate, with
  `artifacts:` / `protect:` / `judges:` / `reviews:`. one word, two concepts
- **a regression test** — the nearest neighbour, and it is a passive CATEGORY. it carries
  neither requirement: a regression test that never bit is still a regression test, and one
  aimed at a single value is too. `clamp` names the artifact that earned both
- **a snapshot** — a mechanism, and often a WEAK clamp: `--resnap` re-blesses it, so it can go
  green with the defect still in place. a non-snapshot assertion cannot
- **a safety net** — a net catches whatever falls. a clamp holds ONE class shut
- **a canary** — a canary reports a live incident in prod. a clamp refuses a merge

## .refs

- `rule.require.clamp-edge-cases` (mechanic) — the rule named for it; all three demands
- `rule.require.test-covered-repairs` (mechanic) — the base rule it sharpens
- `.agent/repo=.this/role=any/skills/work/work.surface.remote.integration.test.ts` — `[case7]`,
  `[case10]`, `[case12]`; two of the three vacuity instances above live here
- `term=partial-audit._.choice._.md` — a green check is a subject set, and its roster is invisible
- `term=false-report._.choice._.md` — a vacuous clamp is one, in test form
- `term=replication._.choice._.md` — the bite-proof ladder (marker → residue sweep → count → kind)

## .reason

see `term=clamp._.choice.reason.md` — etymology, the rejected `guard` and `regression test`,
and why a word this heavily used waited 184 mentions for a cluster.

---

written by human + beaver 🦫
