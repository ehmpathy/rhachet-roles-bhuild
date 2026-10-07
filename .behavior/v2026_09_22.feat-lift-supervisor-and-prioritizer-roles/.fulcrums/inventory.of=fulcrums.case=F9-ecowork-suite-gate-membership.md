# F9 — does the ecowork suite enter this repo's required gate?

| field | value |
|---|---|
| **rework** | clean — a filename or a config line |
| **status** | 🔴 **ruled by the wisher, 2026-09-27 — "require it, fix it now."** the suite stays in the required gate and its inherited red is repaired inside this lift |
| **confidence** | 70% → 100% |
| **where** | `src/domain.roles/prioritizer/skills/work/ecowork.integration.test.ts` · `jest.integration.config.ts` |

## .the fork

`jest.integration.config.ts` matches `**/*.integration.test.ts`, so the lifted suite joined the
required gate the moment it landed. it is **red**: 37 failed, 309 passed, 346 total.

| option | what it costs |
|---|---|
| **A** — carry it as-is, red | the PR cannot go green. the gate reports a true red |
| **B** — repair all 37 | 5 case-families grade the HOST REPO and cannot pass outside nheuron without a fixture store. this is no longer a lift |
| **C** — hold it out of the required gate, loudly + ratcheted | a documented exclusion. ⚠️ an undocumented one is `rule.forbid.failhide` |

## 🔴 .the fact that reframes it — the 37 are INHERITED, and I mis-diagnosed them

| measured | figure |
|---|---|
| our copy, after the sqlite repair | **37 failed / 309 passed / 346 total** |
| the source clone + our copy, before it | **77 failed / 615 passed / 692 total** |
| 692 ÷ 2 | **346** — the same suite, twice |
| 77 − 37 | **40** — the source copy's own count |

⇒ **the suite fails ~40 of its own tests in its home repo.** nheuron has zero github workflows, so
it was never gated and the red was simply never seen.

🔴 **and the sqlite fix repaired about THREE of them, not 38.** the earlier claim — *"the ~38
failures reduce to one cause"* — was a generalization off a **sample**: every failure i read
carried the experimental notice in its received stderr, so i read it as the cause of all of them.
it was the cause of a few and a **passenger** in the rest.

⇒ this is `term=partial-audit` exactly: a read complete over the scope it chose, stated as a
verdict about the whole. the corpus names the trap and i walked into it anyway.

⚠️ **the sqlite repair still stands on its own merits** — a human who runs `rhx eco.priority get`
should not meet a note about a node internal (`rule.forbid.surprises`), and it did clear the
`stderr: ''` class. it is simply not the cause of the 37.

## .the two failure classes

### 1. repo-bound — cannot pass outside nheuron by construction (5 families)

each grades its **host repo's** state, which is a `rule.require.hermetic-tests` violation the
source repo never had a gate to catch:

| family | what it grades |
|---|---|
| `[case39]` the committed store in this repo | nheuron's committed `.eco/*.csv` mirror |
| `[case53]` the text git carries | the same mirror, via `git ls-files` |
| `[case45]` the ignore rules git carries | nheuron's `.gitignore` |
| `[case46]` the pre-commit hook | nheuron's `.husky/pre-commit` |
| `[case56]` the programs that may open the store | a walk over nheuron's tree |

### 2. store-hydration — one shared cause, likely (13 families)

`[case12]` `[case13]` `[case14]` `[case22]` `[case23]` `[case26]` `[case27]` `[case31]` `[case32]`
`[case33]` `[case40]` `[case48]` `[case59]`.

🔴 this title read **`(8 families)`** over a list of **13** until 2026-09-25. a count stated beside
its own enumeration, and at odds with it — the shape the route's verification checks name, caught
when that check was run against this very file.

the shared symptom: a scene **plants** rows into `priority.csv` beside a temp db, then invokes
`eco.priority set` — and the skill answers *"a new priority needs --sev and --urg and --what"*, the
refusal for a row it has never seen. ⇒ the plant did not hydrate.

🟡 **a hypothesis, unproven**: `asStorePath` reads the mirror from `dirname(dbPath)`, which the
plant writes to — so the path is right, and the likelier gap is that hydration derives its table
set from `sqlite_master` on an **extant** db and no-ops where the db has yet to be created. one
read of `asStoreHydrated` would settle it. **not yet read.** it is also environment-independent,
which is consistent with the source copy's identical red.

## .the guess taken

**C, with teeth** — hold it out of the required gate by a mechanism that states itself, and add a
**ratchet** on the failure count so a 38th goes red. class 1 is unrepairable here without a fixture
store; class 2 is a real repair and it is a repair of **inherited** work, not of the port.

🔴 **the bound that makes it not a skip**: a bare `it.skip`, a `describe.skip`, or a silent
filename change is `rule.forbid.failhide` — *"skips — hidden lies that pass ci"*. the exclusion
must carry the count, the two classes, and the ratchet, or it is the lie the rule names.

## 🔴 .the cost this entry did not price — the GREEN it removes

every option above is weighed on the **red**. none of them asks what the exclusion costs in
coverage, and the answer is large:

| measured | figure |
|---|---|
| `given('[case` families in the suite | **46** |
| families recorded as red (5 repo-bound + 13 hydration) | **18** |
| ⇒ families that PASS and are now dark | **28** |
| ⇒ individual assertions that pass and are now dark | **309** |

🔴 **and one of the 28 is a backlog verdict's cited evidence.** `#389` — the gain-direction
reversal — names its proof by case id:

> *"`[case36]` … a priced whole reports `USD 1000.00` and explicitly **not** `USD 1500.00` …
> `[case37]` — a multi-parent part sums up BOTH its roots"*

both sit in this file (`:4553`, `:4637`), so the clamp that proves `#389` ships on disk and runs in
no gate. measured, not inferred:

```
$ rhx git.repo.test --what integration --scope path://ecowork --mode plan
   └─ matched: 0 files
```

⚠️ the `1.vision.yield` pit-of-success table lists that guard as the ONE row already solved —
*"✅ extant at source, ports with the corpus."* it ported. then `F9`, decided later and on a
different question, took it back out. **neither artifact records the interaction.**

⇒ the verdict does not change — option C is still the guess, since the alternative is a red gate or
a suite split on an unproven boundary. what changes is the **price a reviewer sees**: this is not
*"we lose sight of 37 inherited failures"*, it is *"we lose sight of 309 passing assertions,
including a clamp an issue closes against."*

🟡 the option this reframing makes newly interesting is a **split** — the 18 red families into a
peer file, gated out alone, so the 28 green run. it is rejected today on two grounds: it cuts a
ported test file, which the wish's *"ports unchanged"* leans against; and the 13 hydration families
share a cause that is **suspected and unproven**, so the split boundary would be a guess. it
becomes the obvious move the moment that cause is proven.

## .why it is not escalated as a block

the rework is **clean** — one filename or one config line — so
`rule.always.defer-fulcrums-to-last` says best-guess it and drive on. and the wisher's call is
plainly wanted here, since a suite's gate membership is a policy rather than a mechanism.

⇒ the dream carries the repair: `.dream/v2026_09_25.fix-the-ecowork-suite-grades-its-host-repo.md`
