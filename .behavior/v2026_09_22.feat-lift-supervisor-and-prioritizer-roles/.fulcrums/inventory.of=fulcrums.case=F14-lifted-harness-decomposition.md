# F14 — does a LIFTED test harness owe a one-export-per-file split inside this lift?

| | |
|---|---|
| **rework** | 🔴 **dirty** |
| **status** | best-guessed at **5.1.execution** — **defer** |
| **confidence** | 82% |
| **where** | `src/domain.roles/supervisor/skills/work/work.harness.ts` (26 exports, ~900 lines) · peer i010 `arch-opport-decomposition` **blocker.2** |

## .the fork, stated fairly

`arch-opport-decomposition` raised it at i010, and cited `single-responsibility`, whose own text is
unambiguous:

> *"👍 required — each file exports exactly one named procedure · filename matches exported
> procedure"*

`work.harness.ts` exports **26 names** across every grain the rule separates:

| grain | exports |
|---|---|
| orchestrator | `runCrew` · `runDuct` · `runTerm` |
| getter | `getSocketPath` · `getTestServerPids` · `getTestServerProcs` · `getTmuxSessions` · `getPaneText` · `getTestTermPids` · `getTestTermProcs` |
| generator | `genTermSocketDir` |
| checker | `hasTmuxServer` · `hasTmux` |
| deleter | `delTmuxServer` · `delStaleTestServers` · `delStaleTestSockets` · `delTestTerms` · `delStaleTestDirs` |
| constant / type | `DIR_WORK` · `PATH_CREWWORK` · `PATH_DUCTWORK` · `PATH_TERMWORK` · `PREFIX_TEST_SOCKET` · `PREFIX_TEST_TERM` · `MS_STALE_TEST_DIR` · `RunResult` |

⇒ **the concern is correct on the letter of the rule, and is not disputed.** what is disputed is
whether the repair belongs in THIS diff.

| read | the claim | consequence |
|---|---|---|
| **(a)** — taken | this is **lifted** code. the wish fixes the register: *"this stone relocates a corpus, it does not refactor it"* | defer. raise this fulcrum, catch a dream |
| **(b)** | a 26-export module enters a shared package and the package's own rule forbids it | decompose inside this diff, then re-run every `*work` clamp |

## .taken, and why — (a), on four grounds

### 1. 🔴 the wish bounds this lift to a MOVE, and this file is on the move side

`tempDir.ts` (blocker.1, conceded and repaired) was **authored by this execution** — its own
header says `.found by = peer review i003` — so no register protected it and the fix landed at
once. `work.harness.ts` is the opposite case: it arrives from `uladkasach/nheuron` with its
nheuron header intact (*"the test harness for the `*work` shell libs"*, the crewwork-vs-ductwork
clamp strategy, the tmux socket note). **the two blockers cite one rule and sit on opposite sides
of the lift's own boundary**, and that is the whole of the split verdict.

### 2. the reviewer PRICED the repair at 8 exports; it is 26

the given lists eight and writes *"etc."*. a one-file-per-export split is therefore **~26 new
files**, not the ~8 the concern's own snippet implies. ⇒ a repair whose cost the raise understates
by 3× is a repair whose scope was never weighed.

### 3. 🔴 the natural seam is by SUBJECT, not by grain — so the prescription is not the right repair

the 26 cluster cleanly on the three libs the harness drives:

| cluster | n | exports |
|---|---|---|
| crew | 2 | `PATH_CREWWORK` · `runCrew` |
| duct | 13 | `PATH_DUCTWORK` · `runDuct` · `getSocketPath` · `hasTmuxServer` · `delTmuxServer` · `getTestServerPids` · `getTestServerProcs` · `delStaleTestServers` · `PREFIX_TEST_SOCKET` · `delStaleTestSockets` · `getTmuxSessions` · `getPaneText` · `hasTmux` |
| term | 7 | `PATH_TERMWORK` · `PREFIX_TEST_TERM` · `genTermSocketDir` · `runTerm` · `getTestTermPids` · `getTestTermProcs` · `delTestTerms` |
| shared | 4 | `DIR_WORK` · `RunResult` · `MS_STALE_TEST_DIR` · `delStaleTestDirs` |

⇒ **a 4-file subject split is the defensible decomposition** (`rule.require.group-by-noun-not-verb`,
`rule.prefer.most-common-denominator`), and it is NOT what blocker.2 asks for. so to concede the
concern as written is to commit to a 26-file split that the better answer contradicts.

⚠️ **and the subject seam is not free either, which is why it needs its own round.** two edges cross
it:

- `runCrew`'s bash driver **redefines the duct and term verbs as recorders** — to fake its peers is
  its entire purpose, so a crew file names duct and term regardless
- `delStaleTestDirs` (shared) reads `PREFIX_TEST_TERM` (term) and `tempDirs.prefix`

### 4. the rework is DIRTY, and `rule.always.fix-forward-under-scouts-honor` sends that to a defer

- 3 suites import it — `crewwork.integration.test.ts` (**145 clamps**), `ductwork.integration.test.ts`, `termwork.integration.test.ts`
- `crewwork`'s clamps bind to `runCrew`'s recorder behavior, which lives inside a bash driver string
- ⇒ **SAFE? no** — a move of the recorder machinery is a move of the very mechanism 145 clamps measure
- ⇒ **CLEAN? yes** — the 4 files are files this lift adds

safe-but-unclean is a defer by the rule's own table; **unsafe is a harder stop than unclean**, and
this is the unsafe row.

## .rework, and why it is dirty

reversal is a teardown, not a rename: new lib paths that 3 suites import, 145 clamps bound to
machinery that moves, and any later work built on the new decomposition. a reviewer who takes **(b)**
buys hours of work plus a full re-run of every `*work` clamp — on a corpus that has never run in
any ci (a `case=8`-adjacent fact, and F9's open question).

## .confidence, and why it is 82%

the register argument is strong and the tempDir/harness contrast makes the boundary legible rather
than convenient. the 18%:

- 🔴 **the rule says `required`, and this defers a `required`.** the defense is the wish's register
  plus the safe/clean table — both real, neither a licence. a reviewer may fairly hold that a
  shared package must not accept a 26-export module regardless of where it came from
- the harm test grades it `better` — a dev-only module excluded from `dist/` ships no harm to any
  consumer — but **`better` is not the same as `fine`**, and the maintenance cost is paid by
  whoever next reads 900 lines to find one operation
- 🟡 the subject-seam argument cuts both ways: to show a clean decomposition exists is also to show
  the repair is **cheaper than this file priced it**. a reviewer could read grounds 3 and 4 as an
  argument FOR the split now

## .the dream that carries the work

`$route/dreams/v2026_09_26.split-the-supervisor-work-harness-by-subject.md`, symlinked from
`.dream/`. it holds the 4-cluster table, the two cross-seam edges, and the clamp-rerun cost — so
the next traveler does not re-derive the clusters.

## 🔴 .the second file this row governs — `ecowork.db.mjs` (peer i013, `enroll-impl-arch-defects`)

the peer asked for a decomposition verdict on
`src/domain.roles/prioritizer/skills/work/ecowork.db.mjs` — 4,723 lines, ~65 top-level functions,
four subjects (csv serialization · schema migration · goal-graph traversal · cli dispatch). it
argued F14's register defense did not reach it, because the file *"carries no lift provenance —
it's authored fresh for this route."*

🔴 **that premise is false, and an executable read refutes it** (the `F4`/`F16` lesson, applied
before the verdict this time):

| check | result |
|---|---|
| `rhx git.repo.get files --in uladkasach/nheuron --paths '**/ecowork.db.mjs'` | ✅ `.agent/repo=.this/role=prioritizer/skills/work/ecowork.db.mjs` |
| source length | **4,663** lines |
| lifted length | **4,723** lines — **+60 (1.3%)**, the `node:sqlite` notice silencer and the filter repair this stone already records |
| `1.vision.yield.md:470` | cites `role=prioritizer/skills/work/ecowork.sh:138` → `ecowork.db.mjs` in the SOURCE layout |

⇒ it sits on the **move** side of the lift, exactly as `work.harness.ts` does. grounds 1 and 4
carry over unchanged: the wish bounds this stone to a relocation, and a split moves the very db
layer every `eco.priority` clamp measures (**SAFE? no**).

⇒ **the subject seam the peer named is the right repair, and it is recorded, not rejected** — the
same 4-subject shape ground 3 prescribes for the harness. the harness dream
(`$route/dreams/v2026_09_26.split-the-supervisor-work-harness-by-subject.md`) now names both files,
so one traveler splits both by subject.

✅ **the half of the concern that WAS a defect is repaired.** every src-bound lane's bind excluded
`.mjs` for 13 rounds, so this file was never read. the guard now carries
`--paths-with 'src/**/*.mjs'` on all eight such lanes.

⚠️ **the bind does not make the file READ this stone.** six of the eight lanes are exhausted and
cached, so the new bind applies only if a budget top-up re-runs them — and the concession is
`better`, which earns no round (`rule.always.concede-with-a-severity`). ⇒ this stone's only reader
of `ecowork.db.mjs` stays the unbound enroll lane, r011. graded as unreached, never clean.

## .see also

- `F13` — the peer call on the same corpus, on SIZE rather than decomposition. `work.harness.ts`
  at 18.8k is **not** one of F13's six files (86.3k–181.5k), so F13 does not cover it
- `rule.always.fix-forward-under-scouts-honor` — the safe/clean table that sends this to a dream
- `rule.forbid.overzealous-blockers` — the harm test that grades the concession `better`
- blocker.1 of the same given — the **conceded and repaired** half, and the contrast that draws the
  line

---

written by human + beaver 🦫
