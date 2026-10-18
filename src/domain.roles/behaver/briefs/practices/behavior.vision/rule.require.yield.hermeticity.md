# rule.require.yield.hermeticity

> **a yield stands alone. a reader with zero prior context parses every claim top to bottom, and
> never leaves to understand one.**

detail is **reachable**, never **required**. a zoom file holds the evidence; the yield holds the
claim, whole.

## .the test — strip every citation. does each claim still parse?

- yes → the citation is a **zoom**. correct
- no → the citation is a **dependency**, and the claim is a fragment

🔴 **a path does not redeem a dependency.** if the reader must jump to parse the sentence, the
citation merely names where the yield failed them.

## .the three kinds of reference

| kind | can the reader skip it? | verdict |
|---|---|---|
| **zoom** — the claim is complete; the path holds the evidence | yes | ✅ |
| **dependency** — the claim cannot be parsed without the jump | no | 🔴 blocker |
| **orphan** — a token with no claim attached | they cannot even go look | 🔴 blocker |

## .hermetic is word-NEUTRAL, and concept-dense

the repair is not a restored paragraph. it is **the claim in place of its pointer**.

- 👎 *"the shape is settled at F15"* — 5 words, and a stranger gains naught
- 👍 *"the bar is a word count, per stage"* — 8 words, and it is the whole claim

⇒ **an orphan citation spends words and transfers zero concepts.** it is the worst line in any
yield: it reads as substance and is a receipt for substance elsewhere.

🔴 **do not sell this rule as a cut.** measured over ~50 repairs on one yield: **+13 words net**,
under 0.3 per repair. some claims are shorter than the fragment plus its citation, some longer, and
they cancel. what changes is concepts-per-word, never words.

⇒ so a hermetic pass that comes back **negative** is the signal to check for a lossy cut — the
`rule.require.every-passage-earns-its-slot` failure, not this rule at work.

## .the frontload is the mirror failure

a detail at top level the reader never asked for is a dependency in the other direction: it charges
them the parse where the one-line claim would have served.

⇒ **the yield holds the DECISION at every level. the derivation zooms out.** a reader descends only
the branch they want.

| when… | then… |
|---|---|
| you write a bare id — `F15`, `#349`, `case=003`, `i034` | 🔴 the strongest cue. state the claim, then cite |
| you write *"as above"*, *"the prior section"*, *"we saw"* | a back-reference is a dependency on read order |
| you use a term this yield never declared | declare it in one clause, or drop it |
| a sentence needs a file open beside it | a fragment. finish the claim |
| you would explain a mechanism at top level | that is a zoom. state what it decides, move the how |
| a stranger would ask *"what is that?"* | they cannot ask. answer it in place |

## .the boundary

| a violation | not a violation |
|---|---|
| a bare id offered as a claim | an id **beside** its claim, as provenance |
| a term used before it is declared | a term declared in one clause, then used |
| a mechanism spelled at top level | a decision stated at top level, the mechanism zoomed |
| a back-reference to an earlier section | a forward pointer to a zoom file |

**the line that parts them: could a stranger act on this line, alone?** yes → hermetic. no → the
claim rests on the citation, and that is the defect.

blocker: a claim that cannot be parsed without a jump · a bare id offered where a claim was owed · a
term used before this yield declares it · a back-reference that assumes read order.
nitpick: a mechanism spelled at top level where its decision would serve.
false positive: an id cited beside its stated claim · a zoom pointer whose claim is complete without
it · a verbatim quote.

⇒ see also: `rule.forbid.yield.baggage` (the clamp — the shapes) ·
`rule.forbid.downstream-detail-in-a-yield` (the section grain) ·
`rule.require.every-passage-earns-its-slot` (the passage grain).
