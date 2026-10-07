# F19 — does the guards-journey split owe back its five-stone continuity claim

**raised at** = `5.3.verification`, self-review 4/8 (`has-preserved-test-intentions`)
**rework** = clean
**confidence** = 80%
**status** = best-guessed

---

## .the fork, stated fairly

`F13` was ruled by the wisher — *"split them now"* — and the guards journey monolith was one of the
eight files cut. **that verdict is settled and I do not reopen it.**

but the split had a **consequence the verdict did not name**, and I found it only by a leaf-level
census at this stone:

| | before | after |
|---|---|---|
| routes driven | **one** repo, one `passage.jsonl` | **three** independent repos |
| stones per route | **five**, in order | **two**, **two**, **one** |
| the claim `[t9]` made | *"one route carries all five stones"* | ⛔ **no test makes it** |

the old `[t9] journey complete` asserted, in a single `passage.jsonl`:

```ts
expect(passedStones).toContain('1.vision');
expect(passedStones).toContain('2.1.criteria.blackbox');
expect(passedStones).toContain('3.3.1.blueprint.product');
expect(passedStones).toContain('4.1.roadmap');
expect(passedStones).toContain('5.1.execution.phase0_to_phaseN');
```

the three new suites each assert only their own pair or singleton:
`vision + criteria` · `blueprint + roadmap` · `execution`.

### the two options

| | option | cost |
|---|---|---|
| **A — taken** | accept the narrower claim. all five stones remain exercised; only the *single-route continuity* claim drops from 5 to 2 | the 5-stone claim goes unproven |
| **B** | add a fourth suite that drives all five stones in one route | re-imposes the ~90-call serial chain the split removed — the exact cost `F13`'s split bought away |

---

## .what I took, and why at the time

**A.** three reasons, weakest first:

1. **aggregate coverage is unchanged.** every one of the five stones is still driven and still
   asserted — three of them now with a *stronger* assertion than before (the roadmap's exit code
   is asserted for the first time; `[t9]` had driven it and checked only the log).
2. **continuity is still proven, at n=2.** two of the three suites drive **two** stones in one
   route and assert that `passage.jsonl` accumulates both. so *"a route carries more than one
   stone"* is proven twice. what shrank is the **quantity**, not the kind.
3. 🔴 **the strongest, and the one I lean on: the lost claim was about bhrain, not bhuild.** this
   suite is `skill.init.behavior.guards` — its subject is whether **bhuild's guard templates**
   gate correctly at each stone. each stone's gate is independently verified, and *that* is fully
   preserved. the five-in-one-log claim exercised **bhrain's** passage accumulation, which is a
   dependency's concern and has its own suite.

⇒ **and the scenes prove the prerequisite chain was never load-bearing.** `genGuardedBehaviorScene`
starts each suite from a **fresh** behavior with no prior stone passed, and the blueprint and
execution suites pass from that cold start. so bhrain does not gate a stone on its predecessors —
the old serial order was *incidental*, never an asserted invariant.

## .why the confidence is only 80%

the residual risk is real and I will not round it away: a defect that appears **only past the
second stone of one route** — a `passage.jsonl` append that corrupts at n≥3, a guard that reads
accumulated prior state — is caught by option B and missed by option A. I judge it unlikely, but
I cannot call it impossible, and *"I judge it unlikely"* is exactly the sentence a fulcrum exists
to expose.

I am also aware I am the party who benefits from option A: it is the option that requires no work.
that is precisely why it is on this list rather than settled in silence.

## .why it is clean

a test suite is additive. option B is a new file; to reverse it is a delete. no caller hardens
against it, no later work builds upon it.

## .where

- `blackbox/role=behaver/skill.init.behavior.guards.journey.{vision,blueprint,execution}.acceptance.test.ts`
- `blackbox/role=behaver/.test/skill.init.behavior.guards.journey.ts` — `genGuardedBehaviorScene`
- the verdict it descends from: `inventory.of=fulcrums.case=F13-*`

## .the verdict

*(unruled)*
