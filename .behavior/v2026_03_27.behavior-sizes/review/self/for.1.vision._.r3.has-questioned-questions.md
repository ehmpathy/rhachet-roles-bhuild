# self-review: has-questioned-questions (round 3)

## review of: 1.vision.md open questions

final pass with fresh eyes.

---

## verification of triage completeness

### are all questions triaged?

| # | question | tag | status |
|---|----------|-----|--------|
| 1 | medi as default? | [wisher] | ✅ correct - only wisher knows intent |
| 2 | giga warn vs block? | [wisher] | ✅ correct - UX decision |
| 3 | guard compose with size? | [answered] | ✅ resolved via logic |
| 4 | nano include criteria? | [wisher] | ✅ correct - wisher made explicit choice |
| 5 | mega heavy guards? | [wisher] | ✅ correct - affects UX significantly |

**verdict:** all questions properly triaged

### is the "answered" resolution sound?

question 3: **should --guard compose with --size?**

resolution: "yes - orthogonal axes. size = which stones, guard = gate weight."

**verification:**
- size controls WHICH milestones are created
- guard controls HOW HEAVY the gates are on those milestones
- these are independent dimensions
- a nano fix could need heavy review (critical bug in production)
- a mega feature could use light guards (experimental prototype)

**verdict:** ✅ resolution is sound - orthogonality is correct

### are there hidden questions in "what is awkward"?

| awkward item | is it a question? | action |
|--------------|-------------------|--------|
| name: nano vs micro | no - documented tradeoff | none |
| stone inheritance implicit | no - documented tradeoff | none |
| medi not real word | no - documented tradeoff | none |

**verdict:** ✅ these are design observations, not blocker questions

### is "requires external research: none" correct?

potential research topics:
- how other tools handle size tiers → nice-to-have, not a blocker
- best practices for name conventions → wisher already decided
- guard mechanics → we understand current system

**verdict:** ✅ no external research needed for vision phase

---

## summary

all questions properly triaged:
- 4 questions need wisher input [wisher]
- 1 question answered via logic [answered]
- 0 questions need research [research]

no issues found in r3. triage is complete and sound.
