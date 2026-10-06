# F23 — may an acceptance test touch internals in its **setup** and **verify** phases?

| | |
|---|---|
| **rework** | ✅ **clean** |
| **status** | disputed with `mech-test-scope-purity` (i004 r009 blockers **2–6**) |
| **confidence** | **95%** |
| **where** | 5 acceptance suites · `…r009._.taken.by_self.mech-test-scope-purity.md` |

⚠️ **blocker.1 of that same lane is NOT in this fulcrum — I conceded it and fixed it.**
see the taken. this fulcrum covers only the five I dispute.

## .the fork, stated fairly

`mech-test-scope-purity` raised 6 blockers under `rule.require.acceptance.blackbox`. five
of them (2–6) flag `fs.writeFileSync` / `fs.mkdirSync` in **given** blocks, and
`readFileSync` / `readdirSync` / `existsSync` in **then** blocks.

| option | the call |
|---|---|
| **A — concede** | an acceptance test may touch no internal in any phase. every fixture must be built through the CLI, and every assertion must read only stdout |
| **B — dispute** (taken) | the rule permits internals in **setup** and **verify**; it constrains the **action** alone |

## .why I took B — the rule's own summary table

```
## .summary

| phase           | internal access | contract access |
|-----------------|-----------------|-----------------|
| setup (given)   | allowed         | allowed         |
| action (when)   | forbidden       | required        |
| verify (then)   | allowed         | allowed         |

the **action** must go through the contract. setup and verify can use internals.
```

and its enforcement table names three violations, every one about the **subject**:

```
| action via internal operation in acceptance test | blocker |
| import from `domain.operations/` for test subject | blocker |
| direct dao call as test subject                   | blocker |
```

each cited location is a `given` or a `then`. **not one is an action.**

## 🔴 .the citation problem

the reviewer quoted, as the rule:

> *"acceptance tests verify CONTRACTS, never internals. the test must invoke the subject
> through its published surface (CLI, API, shell skill) and judge only what that surface
> emits."*

I read the rule end to end. **that sentence is not in it.** its final lines are:

> *acceptance tests verify the contract.*
> *if you bypass the contract, you verify what users never touch.*

which says the same as the table: do not bypass the contract **for the action**.

⇒ five blockers rest on a quotation the source does not contain. that is what moved me
from "argue the balance" to "dispute".

## .what option A would actually cost

blocker.5 flags the prioritizer test's check that `.eco/priority.csv` was written. the
skill's contract *is* that file — it is the artifact a consumer commits to git
(`define.invariant.eco.the-csv-is-truth-the-db-is-a-cache`). under A, the one assertion
that proves the store persisted would have to be deleted, and the suite would verify only
that stdout said so.

⇒ **A weakens the guard it means to strengthen.** the same holds for blocker.6, where the
whole subject is whether the rsync allowlist delivered the files — a fact no stdout emits.

## .why 95%, and not higher

the instinct beneath the reviewer's read is sound, and it earned a real concession
elsewhere in the same lane: blocker.1 found a genuine grain defect I had not seen. a
reviewer that right about one point may be reading an intent the table has since drifted
from.

and I am the party under review. "the rule permits what I already did" is the conclusion
most convenient to me, which is precisely why it belongs in front of a council rather
than settled by me.

## .the rework, if overturned

**clean** but not cheap: 5 suites, each needs its fixtures rebuilt through the CLI and
its assertions narrowed to stdout. no published contract changes and no caller ripples,
so the blast radius stays inside `blackbox/`.

⇒ if the council rules for A, **amend the rule first** — its summary table and
enforcement list would otherwise still say the opposite, and the next traveler
re-litigates this.

## .the verdict

> _(pending council)_
