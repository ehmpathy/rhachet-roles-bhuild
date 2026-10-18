# rule.forbid.downstream-detail-in-a-yield

> **a yield holds the decisions its own stage owns. detail a later stage owns is neither terse nor
> verbose — it is MISPLACED, and no condensation rule can see it.**

## 🔴 .why a SECTION rule is owed, when a passage rank already runs

`rule.require.every-passage-earns-its-slot` ranks passages, and it converged. measured over three
rounds on one yield, one variable per round:

| round | floor | ranked | cut/eject | KEEP | words | per ranked passage |
|---|---|---|---|---|---|---|
| i032 | none | 4 | 2 | 2 | −71 | 17.8 |
| i033 | 10 | 10 | 10 | 0 | −422 | 42.2 |
| i034 | 25 | 25 | 8 | **17** | −150 | **6.0** |

⇒ at the third round **17 of the 25 weakest passages were honest KEEPs** — decisions, measurements,
and caveats that earn their slot. the marginal return fell to 6 words per ranked passage.

🔴 **a passage rank cannot see a section that is wholly owed elsewhere.** it ranks lines WITHIN a
section and never asks whether the section belongs at this stage — so every line in a misplaced
section is individually defensible, and the section survives every round.

⇒ measured on the same yield at the SECTION grain, deterministically, for $0
(`.agent/.notes/tool.probe-yield-section-shares.js`):

| share | words | the section | the stage that owns it |
|---|---|---|---|
| **20.9%** | 1155 | the peer lanes — a `$rubric-of-$subject` grid | `3.3.blueprint` — it is a component design |
| **18.3%** | 1015 | the second half of terseness: offload, do not compress | the size bar's own fulcrum record |

**two sections carry 39.2% of the file**, and the passage rank found 8 cuts in 25 across the whole
of it. the top 3 sections carry 50%; the top 8 carry 80%.

⇒ **confirmed by application: four stubs, −680 words (−12.1%)**, each destination read before its
stub shipped. the passage rank's best pass cut −422 across ten proposals; the stubs cut −680
across four. and each stub replaced `declare-once` drift —

| what was stubbed | where it already lived, in full |
|---|---|
| a size-bar derivation | that fulcrum's own entry, which held every claim **fuller** |
| a 12-row rubric grain table | the canon table the same page cited **twice** |
| a 15-row fulcrum table, 13 of them closed | the fulcrum inventory, same five columns |

🔴 **every stubbed row was one true line, already correctly cited, and individually defensible** —
which is precisely why three rounds of passage rank passed over all of them.

## .the test — per SECTION, one question

> **which STAGE owns this content?**

- this stage → keep it
- a later stage → 🔴 this defect. stub it, and point at where the derivation lands
- no stage, and it is evidence for a claim made here → it is archaeology. eject it to an appendix
  (`rule.require.archaeology-in-notes`)

🟡 **not *"is this section too long?"*** — length is the passage rule's question, and it passes a
misplaced section whose every line is tight.

## .who owns what

| stage | what it decides | what it does NOT hold |
|---|---|---|
| `1.vision` | the shape of the outcome, and the forks still open | the component design that delivers it |
| `2.1.criteria` | the checkable acceptance statements | the mechanism that satisfies them |
| `3.3.blueprint` | the design — components, contracts, the wire-up | the code |
| `5.1.execution` | the code | a re-derivation of the design |

⇒ a `1.vision` yield that spells a lane grid, a flag matrix, or a file layout has written the
blueprint inside the vision. the content may be correct and the stage is wrong.

## .what a reviewer emits — a RANK over SECTIONS

the same shape `rule.require.every-passage-earns-its-slot` demands, one grain up. a whole-file
property cannot be a point defect, so it takes the form of a list of locations.

per section, four fields:

1. **the section** — its `##` header and its start line
2. **its share** — words, and percent of the yield
3. **the stage that owns it** — named, from the table above
4. **the verdict** — `keep` · `stub+pointer` · `eject`

close with the total: N sections, X words → Y words.

🔴 **the rank has a FLOOR: every section over 5% of the yield, or the top eight, whichever is MORE.**

- a rank lands ON its floor and never above it — measured, in the passage rule
- a share threshold alone lets a yield of many small sections escape
- a fixed count alone lets a yield of few large ones escape
- ⇒ the `or` is what closes both

## .the STUB is the repair, and it has a bound

a stub keeps the **decision** and moves the **derivation**.

- 👍 *"the gate grades density and structure. the lane grid, the rubric membership, and the two flag
  choices: `$route/3.3.blueprint.yield.md`"*
- 👎 the same section, one paragraph shorter

🔴 **a pointer must dereference.** a stub that cites a file which does not hold the passage is a
phantom path — it reads authoritative and answers naught. so the destination is written BEFORE the
stub ships, or the stub names a **stage** rather than a file that does not yet exist.

🟡 and the eject hazard applies unchanged: a stub is new prose, written from recall of a passage on
its way elsewhere, and no check compares the two. re-read the source before you generalize
(`rule.require.every-passage-earns-its-slot`).

## .it composes with the passage rank; it does not overlap it

| | `require.every-passage-earns-its-slot` | this rule |
|---|---|---|
| grain | a passage | a `##` section |
| question | could this be said in fewer words? | which stage owns this content? |
| repair | cut · eject | stub + pointer · eject |
| blind to | a section wholly owed elsewhere | a bloated section correctly placed |

⇒ run both. neither reaches the other's defect, and the two cues cannot disagree — they can only
both miss, or one catch (`rule.require.a-cue-is-not-a-claim`).

## .severity

**nitpick** for a placement call — a stage boundary is arguable, and a driver who states why a
section belongs here has answered it.

**blocker** for two shapes, and each loses information rather than merely misplaces it.

blocker: a section stubbed with its decision removed rather than moved · a pointer to a destination
that does not hold the passage · a rank that names fewer sections than the floor.
nitpick: a section owed to a later stage, left whole · a stub that runs to the same length as the
section it replaced.
false positive: a section that derives a decision THIS stage makes · a section whose length its
purpose genuinely demands (`rule.require.purpose-first`).

⇒ see also: `rule.require.every-passage-earns-its-slot` (the passage grain) ·
`rule.require.archaeology-in-notes` (the third verdict, one grain down) ·
`rule.always.yield-the-output-not-the-archaeology` (bhrain/driver — the parent) ·
`.agent/.notes/tool.probe-yield-section-shares.js` (the $0 measurement).
