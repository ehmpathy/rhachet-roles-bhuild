# self-review: has-questioned-questions

## review of: 1.vision.md open questions

---

## triage of open questions

### question 1: is medi the right default?

**can answer via logic?** partially - the wish explicitly said "medi = default" so we should honor that. but the rationale (why medi vs mini) is unclear.

**can answer via code/docs?** no - this is a product decision

**requires research?** no

**requires wisher input?** yes - wisher should confirm the rationale

**verdict:** [wisher] - wisher explicitly chose medi, but should confirm rationale

---

### question 2: should giga warn or block?

**can answer via logic?** wisher said "probably needs decomposition" - "probably" suggests advisory, not enforcement

**can answer via code/docs?** no

**requires research?** no

**requires wisher input?** yes - this is a UX decision

**verdict:** [wisher] - wisher's "probably" suggests warn, but should confirm

---

### question 3: should --guard compose with --size?

**can answer via logic?** yes - they are orthogonal dimensions. size = which stones, guard = how heavy the gates. a critical nano fix should be able to have heavy guards. they should compose.

**verdict:** [answered] - yes, they should compose. --size controls which milestones, --guard controls gate weight. independent axes.

---

### question 4: should nano include criteria?

**can answer via logic?** partially - wisher explicitly said "vision, blueprint, execution" which excludes criteria. but criteria defines "done" which seems important.

**can answer via code/docs?** no

**requires research?** no

**requires wisher input?** yes - wisher made explicit choice, but rationale unclear

**verdict:** [wisher] - wisher explicitly excluded, should confirm this is intentional

---

### question 5: should mega get heavy guards throughout?

**can answer via logic?** the current vision only adds heavy guard on criteria for mega. but if mega is "significant features, architectural work", shouldn't vision and blueprint also have comprehensive review?

**can answer via code/docs?** review of extant guards shows .heavy variants exist for:
- 1.vision.guard.heavy
- 2.1.criteria.blackbox.guard.heavy
- 3.3.1.blueprint.product.v1.guard.heavy

so the infrastructure supports heavy guards on all three.

**requires research?** no

**requires wisher input?** yes - this affects user experience significantly

**verdict:** [wisher] - should mega auto-select heavy guards for all checkpoints?

---

## summary

| question | triage | action |
|----------|--------|--------|
| medi as default | [wisher] | confirm rationale |
| giga warn vs block | [wisher] | confirm advisory approach |
| guard compose with size | [answered] | yes, orthogonal axes |
| nano include criteria | [wisher] | confirm explicit exclusion |
| mega heavy guards throughout | [wisher] | confirm guard auto-selection |

## updates applied to vision

✅ all questions now have triage tags in the vision:

1. ✅ added [wisher] tag to questions 1, 2, 4, 5
2. ✅ added [answered] to question 3 (guard composition)

question 3 resolved via logic: --size and --guard are orthogonal, should compose.
