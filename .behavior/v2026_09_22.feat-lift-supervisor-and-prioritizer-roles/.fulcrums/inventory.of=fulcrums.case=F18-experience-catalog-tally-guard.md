# F18 — defer the experience-catalog tally guard

| | |
|---|---|
| **rework** | 🔴 **dirty** |
| **status** | best-guessed |
| **confidence** | 72% (cut from 82% — see the council-premise section) |
| **where** | `review/self/for.5.3.verification._.has-behavior-coverage.md` · `.dream/v2026_09_28.clamp-the-experience-catalog-tally-against-its-matrix.md` · `1.vision.experience.case=_.md` (the passage that names the gap) |

## .the fork, stated fairly

`1.vision.experience.case=_.md` names, in its own prose, a guard it does not have:

> *"⚠️ the honest weakness: this is an argument, not a check… **no test walks this file**."*
> *"⇒ so a check that reads the matrix and its tally **together** is the single guard this contract
> most owes."*

and it carries the measured cost: the `itemized · criti` tally read **six** while the matrix
verdicted **nine**, and **survived four review rounds**. two peer lanes found it; the author never
did.

| branch | consequence |
|---|---|
| write the clamp now, in this PR | the catalog stops its silent drift while the defect is fresh; the lift's PR grows a suite that grades a route document |
| ✅ **defer — dream + this row** (the call) | the PR stays scoped to the lift; the catalog keeps a gap it has already paid for once |

## .taken, and why at the time

**defer.** the SAFE/CLEAN test (`rule.always.fix-forward-under-scouts-honor`) splits:

- **safe?** ✅ — a read-only parse of markdown; touches no shipped behavior
- **clean?** 🔴 — every suite in `src/domain.roles/` grades the **shipped package**. this one grades
  a **route document** under `.behavior/`, a dependency direction no test in this repo has today

⇒ safe-but-unclean is the row the rule sends to defer + fulcrum.

two further reasons, both scope rather than difficulty:

1. **it is behaver territory.** `rule.require.experience-catalog-evolution` is a behaver rule; the
   guard belongs beside the behaver's other catalog guards, not in a supervisor/prioritizer lift
2. **the diff is already ~77,742 lines.** a net-new suite with its own design call inside it is
   the smuggled-refactor shape `rule.require.review-test-changes` forbids

## .rework, and why it is dirty

not because the clamp is hard — the dream carries a ready five-assertion shape. because of **where
it lands**. a suite that reads `.behavior/**` establishes a precedent: that package tests may grade
route artifacts. once one exists, others follow, and the boundary between *"tests grade the
deliverable"* and *"tests grade our paperwork"* is gone.

⇒ that boundary is cheap to hold now and expensive to restore later, which is what makes the
reversal dirty rather than clean.

🟡 and the deferral's own cost is real and asymmetric: the next catalog drift is found by **a peer
lane or by no one**, and the last one took four rounds.

## .confidence, and why it is 82%

the CLEAN test lands cleanly on defer, and the role-boundary argument is independent of it. the 18%:

- 🔴 the **buttonup mandate** at this stone says *"if you detect it, you fix it"* with **no carve-out
  for route artifacts**. i read it as scoped to the deliverable's coverage. that is my read, and a
  reviewer may hold the plain text against me — it does not say "deliverable"
- the clamp is genuinely **cheap** (a markdown parse), and cheapness is the usual argument that the
  CLEAN test is applied too strictly
- the catalog is **this route's own** contract. an argument that a route must guard its own
  contract before it passes is not silly, and i cannot refute it from the rules alone
- 🟡 a glob over `.behavior/*/…` would guard **every** route, which makes the work more valuable
  than this row prices it — and more clearly out of scope at the same time

⇒ **the honest summary: i am confident about the boundary and less confident that the mandate
permits me to honour it.** that is exactly the shape a council should rule on, and why this row
exists rather than a silent skip.

## 🔴 .the premise this row rests on is the one the council has twice struck down

the summary file ends its 2026-09-27 section with a warning aimed at exactly this row:

> *"🔴 **two of three overruled, both toward MORE work inside the lift.** my guesses leaned on
> *'a lift is a move'*; the wisher reads a lift as a promotion, which owes the cleanup a move
> defers. ⇒ that premise sat under `F7`, `F13`, and `F17` alike, and **is the one to re-check on
> every open row**."*

**this row is an open row, and i re-checked it rather than let the warning pass.** the result is a
real distinction, offered for the council to accept or strike:

| row | what was deferred | did it SHIP? |
|---|---|---|
| `F13` | split eight too-large **lifted source files** | ✅ yes — they are the deliverable. **overruled** |
| `F17` | scrub org names from **lifted briefs** | ✅ yes — they publish to npm. **overruled** |
| 🟡 `F18` | a guard over `1.vision.experience.case=_.md` | ❌ **no.** `.behavior/` is route paperwork; it is in no package, no `dist/`, no npm artifact |

⇒ the overruled pair were both *"clean up what you are about to ship."* this row is *"add a guard
for our own paperwork."* **the premise the wisher struck — that a lift is a move rather than a
promotion — does not carry this row**, because the artifact is outside the promotion entirely.

⚠️ **but the pattern is 2-for-2 against me**, and a distinction i drew myself is exactly the kind a
council exists to test. ⇒ confidence cut **82% → 72%** on the strength of that record alone. if the
council reads `.behavior/` as within the promotion's reach, this defer falls the way the other two
did, and the dream carries a ready shape to execute.

## .the verdict

⏳ unruled. surfaced at `5.3.verification`; owed to the fulcrum council at route close.

---

written by human + beaver 🦫
