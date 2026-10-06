# F13 — does a file too large for any reviewer get split INSIDE this lift?

- **rework** = 🔴 dirty
- **status** = 🔴 **ruled by the wisher, 2026-09-27 — SPLIT THEM NOW. my defer was OVERRULED**
- **confidence** = 80% → 🔴 **85% at i010**, on a measurement rather than an inference
- **where** = **six** files, not two. `src/domain.roles/supervisor/skills/work/crewwork.sh`,
  `…/git.crew.poll.sh`, `…/prioritizer/skills/work/ecowork.integration.test.ts`,
  `…/work/ductwork.integration.test.ts`, `…/git.grove.saturation.integration.test.ts`,
  `…/work/ductwork.sh`

## ✅ .the verdict — split, inside this lift

asked outright, the wisher chose **"split them now"**, and gave the direction behind it: *"the
promotion is the work, from adhoc sphagetti to engineered durability."* ⇒ read (b) holds: a lift into
a shared package is the moment to pay the decomposition, not a move that carries the debt across.

all **eight** files are cut, each along its own seams — the six measured at i010, the seventh found
at i013, and `work.surface.integration.test.ts`, a supervisor suite of the same size class cut
alongside them:

| file | cut into | how the cut is held |
|---|---|---|
| `crewwork.sh` | core + declared parts | `getShellLibWhole` — the clamps read the lib whole |
| `git.crew.poll.sh` | entry + `work/pollwork.<stage>.sh` | `getShellSkillWhole` |
| `ductwork.sh` | core + declared parts | `getShellLibWhole` |
| `ecowork.integration.test.ts` | parts by red family + `ecowork.harness.ts` | then-count parity against the original |
| `ductwork.integration.test.ts` | parts + harness | then-count parity |
| `git.grove.saturation.integration.test.ts` | parts + harness | then-count parity |
| `work.surface.integration.test.ts` | ten parts by subject + `work.surface.harness.ts` | then-count parity; `[case58]` grades all ten |
| `ecowork.db.mjs` | entry + `ecowork.db.{vocab,goal,schema,store,read,assert,verbs}.mjs` | acyclic imports; the entry keeps the ONE `node:sqlite` door, so `[case56]` holds unchanged; `readEcoworkDbWhole` feeds the static clamps |

⇒ the corpus is still 7.5× one window, so the split does not make the **diff** fit in one read — it
makes every **file** fit, which is what `--focus push` and a human reviewer both need.

## 🔴 .SCOPE CORRECTED at i010 — the set is six files, and the window is measured

this file opened over **two** files, inferred from an i008 outcome. i009 emitted a numeric
`metrics.expected` on two lanes and the window is now derived three independent ways —
`148,416/0.742`, `146,973/0.735`, `140,636/0.703` — each lands on **200,000**.

against that window, `tokens.expected.md` (whose own header says **tokens**, never bytes):

| file | tokens | share of the window |
|---|---|---|
| `crewwork.sh` | 181.5k | **91%** |
| `git.crew.poll.sh` | 175.1k | **88%** |
| 🔴 `ecowork.integration.test.ts` | 172.2k | **86%** |
| 🔴 `ductwork.integration.test.ts` | 102.9k | 51% |
| 🔴 `git.grove.saturation.integration.test.ts` | 93.8k | 47% |
| 🔴 `ductwork.sh` | 86.3k | 43% |

**812k tokens across six files = 54% of the 1.5M corpus**, and no two of them fit in one window
together.

🔴 **i013 — a probable SEVENTH, which no bind could see.** `prioritizer/skills/work/ecowork.db.mjs`
holds **225.9k chars** (`wc -c`) — more than `crewwork.sh` — and is absent above only because every
lane's bind excluded `.mjs`. the unit here is tokens and that figure is chars, so it is **unmeasured,
not placed**: the lanes that now bind `src/**/*.mjs` are exhausted, so no run of this stone will print
its token count unless one is topped up. the defer covers it by the same table row; its decomposition verdict is `F14`'s.

⚠️ **the four added rows do not change the verdict and they do change the ask.** the council was
asked about two shell files; it is now asked about six files, four of which are **integration tests**
— so a `(b)` that demands a split reaches into the clamp corpus as well as the libs.

🟡 **and the correction is the same shape as this route's repeat lesson**: the two-file figure was
true of the lane that measured it and was never a statement about the corpus. a count taken from one
lane's scope is a claim about that lane.

🔴 **CORRECTED at i010 — this file's original claim was TOO STRONG.** it read:

> *"neither can be reviewed by `rhx review` under any option available … the child dies mid-read."*

that was inferred from a death whose true cause was the **prompt**, never these files. once
`--conversation` was dropped, two lanes lit and one ingested **363,385 distinct tokens** in a single
run — so **the 200k window bounds one context, never the agentic loop**, and a loop with that budget
can open a 181.5k file.

| the claim | verdict at i010 |
|---|---|
| *"unreviewable under any option"* | 🔴 **refuted** |
| `--focus push` refuses at 91%/88%, over its 75% failfast | ✅ **holds** — a single-context read is genuinely impossible |
| *"a single-pass EXHAUSTIVE read is not achievable"* | ✅ **holds**, and is the real gap |
| the deferral verdict | ✅ **unchanged** |

⇒ **the gap is narrower and sharper than first stated.** the loop CAN reach these files; whether it
DID is unknown, because a `0/0` verdict does not report which files were opened. ⇒ what is missed is
not the read — it is the **evidence of the read**.

🟡 and the measurement that forces the care: `mech-failhides` reported `total: 1,601,900` against a
1.5M corpus, which reads as *"it opened the whole corpus."* it does not. `cache.get` (1,223,966) is
a cached prefix re-charged across turns; **`cache.set` (363,385) is the distinct ingest** — ~24% of
the corpus. **a number read without its definition, twice in one stone.**

| read | the claim | consequence |
|---|---|---|
| **(a)** — taken | a lift moves files. a file that was too large at source is too large here, and that is a **pre-extant defect the lift inherits**, never one it creates | defer. catch a dream, note the gap, land the lift |
| **(b)** | a file no reviewer can read is a file no reviewer can clear. to land it is to ship 356.6k tokens of shell **past** the review gate the stone exists to satisfy | split both files inside this diff, then re-run every lane |

## .taken, and why — (a), on four grounds

1. 🔴 **the files are NOT unreviewed, only incompletely reviewed.** lanes that lit at i003 and
   i007 raised **real blockers inside `crewwork.sh`** — r011's, and all three of i007's race
   blockers. so the corpus has had eyes on it; what it lacks is an *exhaustive* single-pass read.
2. **the split is neither safe nor clean, so `rule.always.fix-forward-under-scouts-honor`'s own
   table sends it to a dream.** it ripples into the `source` lines of 46 entrypoints and demands
   all 145 work-primitive clamps be re-run. that is unsafe AND unclean — the row the rule marks
   *defer, and raise a fulcrum*, which is this file.
3. **the wish bounds this lift to a move.** *"do NOT move what §5 says stays"* and *"ports
   unchanged, both of them"* fix the register: this stone relocates a corpus, it does not refactor
   it. a 4,500-line decomposition is the largest possible departure from that register.
4. **the size predates the lift by two years.** `crewwork.sh` was 180.5k at i004's measurement and
   grew by 1.0k since — my own race clamps. the lift did not make it unreviewable; it made its
   unreviewability *visible*, which is a gain the lift can claim rather than a debt it incurred.

## ✅ .why the confidence ROSE to 85% at i010

the two grounds that moved, and both are measurements rather than arguments:

1. 🔴 **the corpus, not these files, is the wall.** the corpus is **1.5M tokens against a 200,000
   window — 7.5× over**. even a split of all six files removes 812k and leaves 688k, still **3.4×**.
   ⇒ so `(b)`'s split does **not** make the diff reviewable. it was the strongest claim on `(b)`'s
   side and it is now known to buy no gate that a deferral loses.
2. ✅ **the real term was the prompt, and it is repaired.** `<conversation>` was 94.1% of every
   prompt (~143k of ~147k), so headroom was 51,584 against a 1.5M corpus. dropped at i010 → headroom
   ~196,000. ⇒ a reviewer can now open 74 of 80 files and **skip** these six, which is partial
   coverage that is honestly bounded rather than a lane that dies with no verdict at all.

⇒ **the deferral now costs a NAMED and BOUNDED gap** — six files, 54% of the corpus, listed above —
where before i010 it cost an unbounded one. that is what moved the number.

## 🔴 .why it is 85% and not higher

- 🔴 **read (b) names a real harm and it is not cosmetic.** *"the review gate did not read 356.6k
  tokens of the diff"* is a sentence a reviewer can write about this PR, and no `.taken` of mine
  refutes it — I can only argue the cost of the repair.
- **the vision already flagged this shape.** its own cons list says *"the test corpus has never run
  in ANY ci"* and *"review is the bottleneck"*. an unreviewable file is the same defect class, and
  the vision did not enumerate it — so (b) has the vision's own argument on its side.
- 🟡 **and `arch-hazards-maintenance` is one of the lanes that cannot read them**, which is a
  circularity worth a name: **the rubric that would grade a 4,500-line file as a maintenance
  hazard is the rubric the file's size defeats.** a defect that hides from its own detector.

## .why the rework is DIRTY

reversal is a teardown, not a rename:

- the split creates new lib paths that 46 entrypoints `source`
- the 145 clamps in `crewwork.integration.test.ts` (234.0k) bind to function names whose file
  moves
- later work would build on the new decomposition, so an un-split means a re-merge

⇒ a reviewer who takes **(b)** overrules a deferral and buys hours of work plus a full re-run of
every peer lane. that is the definition of dirty.

## .the council's question, in one line

> **may a lift land two files that the review gate cannot read, on the grounds that their size
> predates the lift — or does an unreviewable file owe a split before it enters a shared package?**

## .the dream that carries the work

`$route/dreams/v2026_09_26.split-the-two-unreviewable-supervisor-shell-files.md`, symlinked from
`.dream/`. it holds the measurement, the two candidate seams, and the clamp-rerun cost — so the
next traveler does not re-derive the 200k arithmetic.

## .see also

- `…i008…r002._.taken.by_self.mech-failhides.md` — the measurement and the read-overflow mechanism
- `rule.always.fix-forward-under-scouts-honor` — the safe/clean table that sends this to a dream
- `F9` — the other open call about what a gate must accept from this lift

---

written by human + beaver 🦫
