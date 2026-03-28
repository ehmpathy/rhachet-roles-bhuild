# self-review: has-questioned-assumptions

## review of: 1.vision.md

---

### assumption: sizes should be additive (nano ⊂ mini ⊂ medi ⊂ mega ⊂ giga)

**what do we assume?** each size includes all stones from smaller sizes plus more

**evidence?** this is how the wish describes it ("mini should addon criteria")

**what if opposite were true?** sizes could be independent (nano = minimal, mega = different set entirely). but this would confuse users and make it harder to "upgrade" a behavior.

**did wisher say this?** yes, implicitly via "addon" language

**verdict:** ✅ assumption holds - additive model is intuitive and matches wish

---

### assumption: medi is the "most common" size

**what do we assume?** most behaviors are medium-scope

**evidence?** none provided by wisher - this is inferred

**what if opposite were true?** most behaviors might be small fixes (mini/nano). if so, mini should be default.

**did wisher say this?** wisher said "medi = default" but didn't justify why

**counterexamples?** review of extant behaviors in .behavior/:
- many are bug fixes (nano/mini scope)
- some are features (medi scope)
- few are architectural (mega scope)

**verdict:** ⚠️ assumption uncertain - documented as open question for wisher

---

### assumption: five sizes is the right number

**what do we assume?** five gradations (nano/mini/medi/mega/giga) are needed

**evidence?** wisher explicitly specified five sizes

**what if opposite were true?**
- three sizes (small/medium/large) might be simpler
- seven sizes might be more granular

**did wisher say this?** yes, explicitly

**counterexamples?** t-shirt sizes (XS/S/M/L/XL) work well with five levels

**verdict:** ✅ assumption holds - wisher explicitly wants five, and five is reasonable

---

### assumption: nano should include vision stone

**what do we assume?** even the smallest behavior needs vision documentation

**evidence?** wisher said "vision, blueprint, execution" for nano

**what if opposite were true?** nano could skip vision entirely - go straight to blueprint. but then there's no "why" documentation.

**did wisher say this?** yes, explicitly included vision

**verdict:** ✅ assumption holds - vision provides documentation value even for tiny fixes

---

### assumption: guards should still apply at all sizes

**what do we assume?** nano behaviors still need self-review guards

**evidence?** not explicitly stated by wisher

**what if opposite were true?** nano could be "guard-free" for maximum speed

**did wisher say this?** no - wisher only talked about stones, not guards at sizes

**verdict:** ⚠️ assumption uncertain - but makes sense: guards ensure quality regardless of size. can adjust if wisher disagrees.

---

### assumption: factory research is "heavy" (mega+ only)

**what do we assume?** testloops, blockers, opports research is too much for medi

**evidence?** wisher: "factory is only needed for mega+"

**what if opposite were true?** even small features might benefit from factory analysis

**did wisher say this?** yes, explicitly

**verdict:** ✅ assumption holds per wisher's explicit guidance

---

### assumption: giga should warn, not block

**what do we assume?** giga prints advisory but allows proceed

**evidence?** inferred - wisher said "probably needs decomposition" (not "must decompose")

**what if opposite were true?** giga could refuse to create behavior until user confirms decomposition plan

**did wisher say this?** no explicit guidance on block vs warn

**verdict:** ⚠️ assumption uncertain - documented as open question

---

### assumption: stone groups are correct

**what do we assume?** current categorization (which stones in which size) matches developer mental model

**evidence?** based on wisher's descriptions and logical groups

**what if opposite were true?** some stones might belong in different sizes

**counterexamples?**
- roadmap in medi? could argue it's mini (quick plan) or mega (detailed phases)
- distill.domain in medi? could be mini (quick summary)

**verdict:** ⚠️ assumption needs validation - documented in open questions, will validate in criteria

---

## summary

| assumption | verdict | notes |
|------------|---------|-------|
| additive sizes | ✅ holds | matches wish "addon" language |
| medi most common | ⚠️ uncertain | no evidence, open Q |
| five sizes right | ✅ holds | wisher explicit |
| nano needs vision | ✅ holds | wisher explicit |
| guards at all sizes | ⚠️ uncertain | not discussed by wisher |
| factory mega+ only | ✅ holds | wisher explicit |
| giga warns not blocks | ⚠️ uncertain | wisher ambiguous |
| stone groups correct | ⚠️ uncertain | needs validation |

## issues found

none that require immediate fix - all uncertainties are documented in open questions section of vision

## non-issues confirmed

1. additive model is correct approach
2. five sizes matches wisher intent
3. vision included even in nano
4. factory is appropriately mega-level
