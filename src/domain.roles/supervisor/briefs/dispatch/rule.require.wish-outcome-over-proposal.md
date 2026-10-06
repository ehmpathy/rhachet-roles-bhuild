# rule.require.wish-outcome-over-proposal

## .what

a wish owns the WHAT and the WHY. the HOW belongs to the mechanic.

any HOW a wish proposes — signatures, snippets, tables, file layouts, storage choices — is
ADVISORY, a salty guess from the wisher's far-away eyes, never a spec to copy. the
authoritative core of a wish is the desired OUTCOME (`.what` / `.why` / acceptance). every wish
that carries a proposed HOW must label it advisory, so the mechanic optimizes for the outcome,
not a literal match of the sketch.

## .why

a wish is authored with partial context. the wisher knows the OUTCOME with high confidence, but
any proposed implementation is a guess made from outside the repo. if the mechanic treats the
proposal as gospel, two failures follow: it copies a worse design (a better in-repo fit was
available, but only visible if the mechanic knew it was free to diverge), or it satisfies the
letter and misses the intent (it mirrors a signature but drops the behavior the outcome
needed). the outcome is the promise; the proposal is one path to it, and the path is the
mechanic's to choose.

## .the split

| concern | owner | authority |
|---------|-------|-----------|
| WHAT (the outcome) | wisher | authoritative |
| WHY (the motivation) | wisher | authoritative |
| HOW (the implementation) | mechanic | mechanic's call; wisher may offer a salty sketch |

## .how to apply

to author a wish: lead with the OUTCOME — `.what` (one sentence), `.why`, acceptance (what
proves it done). these are authoritative. label any proposed HOW as advisory ("proposed
signature (advisory)" or "one way to do this, take with a grain of salt"); never present a
sketch as the contract. where a shape is genuinely load-carrying (a real external contract a
consumer depends on), it is no longer a HOW — move it into acceptance and say so plainly.

to drive a wish (mechanic): own the HOW, optimize for the acceptance criteria, not a literal
match of the sketch. where a proposed shape clashes with a better in-repo pattern, prefer the
in-repo pattern and note why in the yield. if the OUTCOME itself is ambiguous, that is worth a
question; the HOW is not.

## .the test

"if i deliver the outcome with a different shape than the wish sketched, is the wisher happy?"

- yes → the shape was a proposal. diverge freely when it serves the outcome.
- no → the shape is actually part of the OUTCOME. move it into acceptance, and fix the wish to
  say so.

## .enforcement

- a wish that presents a proposed signature/snippet as the authoritative spec, no advisory
  frame = **nitpick** (reframe as a salty HOW)
- a mechanic that copies a proposed shape into a worse design when a better in-repo pattern was
  available, and defends it with "the wish said so" = **blocker**

## .see also

- `rule.require.handoffs-at-source.md` — the authoritative spec lives at source; the wish
  points to it and carries the outcome
- `rule.require.behaviors-over-adhoc.md` — the wish bounds scope; vision/blueprint stones are
  where the mechanic settles the HOW

---

written by human + seaturtle 🐢
