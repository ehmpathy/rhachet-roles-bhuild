# self-review: has-questioned-requirements

## review of: 1.vision.md

---

### requirement: five sizes (nano|mini|medi|mega|giga)

**who said this?** wisher, in 0.wish.md

**why?** to stop deletion of stones after init

**what if we didn't do this?** status quo continues - users delete 30+ files per behavior

**is scope right?** yes - five sizes covers the spectrum from trivial to massive

**could we simplify?** possibly three sizes (small/medium/large), but wisher explicitly wants five tiers. the granularity matches real-world behavior scopes.

**verdict:** ✅ requirement holds

---

### requirement: medi as default

**who said this?** wisher explicitly: "medi = default"

**why?** most behaviors are medium-scope

**what if we didn't do this?** without a sensible default, users must always specify --size

**is scope right?** reasonable assumption - mini might also work, noted as open question

**could we simplify?** no, a default is needed

**verdict:** ✅ requirement holds, but open question about whether mini should be default

---

### requirement: nano = vision + blueprint + execution only

**who said this?** wisher: "nano doesn't need research at all, just vision, blueprint, execution"

**why?** minimal ceremony for trivial changes

**what if we didn't do this?** nano would have unnecessary stones

**is scope right?** yes - aligns with "maybe even a 1liner" description

**could we simplify?** could skip vision entirely for nano, but vision is fast and provides documentation value

**verdict:** ✅ requirement holds

---

### requirement: mini includes criteria, codepaths, access

**who said this?** wisher: "mini should addon criteria, codepaths, access, maybe some others"

**ambiguity:** what does "access" mean?
- interpretation A: external API access research (3.1.1.research.external.product.access)
- interpretation B: how to access/navigate the code

**my interpretation:** B - the context "codepaths, access" suggests internal code navigation, not external API research. external API research feels like mega-scope work.

**what if interpretation is wrong?** can adjust stone map in criteria phase

**verdict:** ⚠️ ambiguous - noted in open questions, will proceed with interpretation B

---

### requirement: mini includes execution verification

**who said this?** wisher: "it should also include the execution verification step"

**my map:** includes 5.2.evaluation, 5.3.verification stones/guards

**is scope right?** yes - verification ensures the fix actually works

**verdict:** ✅ requirement holds

---

### requirement: medi includes reflection and playtest

**who said this?** wisher: "medi should include the reflection stones and execution playtest step"

**my map:** includes 3.1.5.research.reflection.*, 5.5.playtest

**is scope right?** yes - reflection prevents blind spots, playtest ensures usability

**verdict:** ✅ requirement holds

---

### requirement: factory only for mega+

**who said this?** wisher: "factory is only needed for mega+"

**my map:** 3.1.2.research.external.factory.*, 3.1.4.research.internal.factory.*, 3.3.0.blueprint.factory

**is scope right?** yes - factory work (testloops, blockers, opports) is heavy ceremony

**verdict:** ✅ requirement holds

---

### requirement: giga signals decomposition

**who said this?** wisher: "giga = huge, probably needs decomposition"

**my map:** advisory message that suggests split

**is scope right?** yes - but should it block instead of advise?

**verdict:** ✅ requirement holds, but open question about block vs advise

---

## summary

| requirement | verdict | notes |
|-------------|---------|-------|
| five sizes | ✅ holds | matches wisher's explicit request |
| medi default | ✅ holds | open Q: mini might be better default |
| nano minimal | ✅ holds | vision+blueprint+execution |
| mini adds criteria/codepaths | ⚠️ ambiguous | "access" interpretation unclear |
| mini adds verification | ✅ holds | 5.2/5.3 stones |
| medi adds reflection/playtest | ✅ holds | 3.1.5/5.5 stones |
| mega adds factory | ✅ holds | 3.1.2/3.1.4/3.3.0 stones |
| giga signals decomposition | ✅ holds | open Q: block vs advise |

## issues found

1. **"access" ambiguity** - documented in open questions section
   - fix: none needed, interpretation is reasonable, can adjust in criteria

## non-issues confirmed

1. five sizes is right (not 3, not 7)
2. latin-rooted names (nano/mini/medi/mega/giga) is consistent
3. stone inheritance is implicit but acceptable
4. medi as default is reasonable start point
