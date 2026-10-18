# rule.forbid.yield.baggage

> **baggage is what the yield asks the reader to CARRY that is not theirs to carry.**

the clamp on `rule.require.yield.hermeticity` — that rule names the target, this names the shapes.

## .the four shapes

| shape | what the reader is asked to carry | the repair |
|---|---|---|
| **chronological accretion** | the doc's own history — what an earlier draft said, what a round changed | state what IS. git holds the rest |
| **the overzoom** | a derivation at top level that belongs in a zoom file | the decision stays, the how zooms out |
| **prior-route baggage** | a bare id — `F15`, `#349`, `case=003`, `i034` — that means naught to a stranger | state the claim, then cite |
| **read-order baggage** | *"as above"*, *"the prior section"*, *"we saw"* | say it where it is used |

⇒ **each is a demand for context the reader does not hold**, and each renders as a well-formed
sentence, which is why no density rule fires on any of them.

## .the test

> **what does this line assume the reader already carries?**

naught → hermetic · a fact, a file, a round, a read order → **baggage**, and the shape table says
which.

🟡 **not *"is this too long?"*** — a bare id is four characters and is the worst offender there is:
it spends words and transfers zero concepts.

## .the two directions

| direction | the shape | what it costs |
|---|---|---|
| the reader must **leave** | prior-route · read-order | a jump, per claim |
| the reader must **wade** | overzoom · accretion | a parse they never asked for |

⇒ one rule, because one intent produces both: the author writes from the context they hold rather
than the context the reader has.

## .the overzoom is the shape a careful author ships

accretion reads as history and gets cut on sight. **an overzoom reads as thoroughness** — every line
true, tight, and correctly placed *for someone who wants the derivation*.

⇒ so the question is never *"is this right?"* but **"did the reader ASK for this depth?"**

| when… | then… |
|---|---|
| you would spell a mechanism at top level | state what it decides. the how zooms out |
| you would write *"an earlier draft"*, *"this round"*, *"we first tried"* | accretion. state what holds |
| you write a bare id | 🔴 the strongest cue. a stranger cannot look it up and cannot ask |
| a section grew on a round where no decision changed | that growth is baggage by construction |
| you reach for shorthand you and one reviewer share | in-group shorthand is baggage with a smaller in-group |
| a claim reads fine to you and you hold the route in mind | 🔴 that is the whole failure mode |

## .the boundary

| a violation | not a violation |
|---|---|
| a bare id offered as a claim | an id cited **beside** its claim, as provenance |
| a derivation at top level | a decision at top level, its derivation zoomed |
| *"an earlier draft said…"* | a caveat the reader must **act** on |
| a back-reference to an earlier section | a forward pointer to a zoom file |

**the line: does the reader need it to ACT, or merely to follow how you got here?** act → it stays.
follow → baggage.

blocker: a bare id offered where a claim was owed · a derivation at top level where its decision
would serve · a time-ordered account of the doc's own drafts · a back-reference that assumes read
order.
nitpick: in-group shorthand a stranger cannot expand.
false positive: an id beside its stated claim · a caveat the reader must act on · a verbatim quote.

⇒ see also: `rule.require.yield.hermeticity` (the target) ·
`rule.forbid.chronological-accretion` (`ehmpathy/role=mechanic` — the accretion shape, in full) ·
`rule.forbid.downstream-detail-in-a-yield` (the overzoom at the SECTION grain).
