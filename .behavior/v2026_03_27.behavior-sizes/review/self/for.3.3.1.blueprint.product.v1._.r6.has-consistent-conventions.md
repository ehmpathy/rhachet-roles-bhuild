# self-review: has-consistent-conventions (round 6)

## review of: 3.3.1.blueprint.product.v1.i1.md

deeper convention review with devil's advocate lens.

---

## r5 covered

r5 reviewed 6 names and 7 terms, all found consistent:
- computeSizeTemplates, isTemplateInSize, SizeLevel, constants, sizeLevel, refs/

---

## r6: challenge each conclusion

### challenge 1: why "compute" not "get"?

**r5 said:** computeSizeTemplates follows compute* pattern

**devil's advocate:** should it be `getSizeTemplates` or `getTemplatesForSize`?

**analysis:**
- compute implies derivation/calculation
- get implies retrieval from source
- this function derives a list based on size input
- no external lookup, pure computation

**verdict:** ✅ compute is correct - it derives, not retrieves

### challenge 2: why "InSize" not "ForSize"?

**r5 said:** isTemplateInSize follows is* pattern

**devil's advocate:** should it be `isTemplateForSize` or `isInSizeLevel`?

**analysis:**
- "in" implies membership (template is in the size's template list)
- "for" implies purpose (template is for this size)
- both are semantically valid
- extant: no "isXForY" or "isXInY" pattern to follow
- "in" reads naturally: "is template in nano size?" vs "is template for nano size?"

**verdict:** ✅ "In" is acceptable - reads naturally

### challenge 3: why "Level" not "Tier" or "Category"?

**r5 said:** SizeLevel mirrors GuardLevel

**devil's advocate:** should it be `SizeTier`, `SizeCategory`, or just `Size`?

**analysis:**
- Level implies order (nano < mini < medi < mega < giga)
- Tier also implies order
- Category implies grouped without order
- `Size` alone is too generic

**extant:** GuardLevel uses Level, which implies ordered options

**verdict:** ✅ Level is correct - implies ordered options like GuardLevel

### challenge 4: why not SIZE_TEMPLATES object?

**r5 said:** separate NANO_TEMPLATES, MINI_ADDS constants

**devil's advocate:** should it be `SIZE_TEMPLATES = { nano: [...], mini: [...] }`?

**analysis:**
- separate constants: explicit, easy to grep, easy to extend
- object: more structured, single source of truth
- blueprint uses additive model (each size adds to prior)
- object would need SIZE_ADDS.mini, SIZE_ADDS.medi anyway

**implementation note:** computeSizeTemplates returns cumulative list, so internal structure doesn't matter to callers

**verdict:** ✅ separate constants are acceptable - implementation detail

### challenge 5: why "refs/" not "references/"?

**r5 said:** refs/ is short for references, matches lowercase convention

**devil's advocate:** is abbreviation appropriate? should it be full word?

**analysis:**
- vision explicitly used "refs/template.[feedback]..."
- wisher chose "refs", not "references"
- git uses refs/ convention (refs/heads, refs/tags)
- short names reduce path length

**verdict:** ✅ refs/ is correct - matches wisher's choice and git convention

---

## r6: look for missed conventions

### blueprint file extension

**question:** does blueprint specify file extensions correctly?

**check:**
- .stone files: ✅ matches extant
- .guard files: ✅ matches extant
- .md files: ✅ matches extant

**verdict:** ✅ file extensions consistent

### test file names

**question:** does blueprint follow test file conventions?

**check:**
- initBehaviorDir.test.ts: ✅ matches *.test.ts pattern
- initBehaviorDir.integration.test.ts: ✅ matches *.integration.test.ts pattern

**verdict:** ✅ test file names consistent

---

## r6 summary

| challenge | initial verdict | r6 verdict |
|-----------|-----------------|------------|
| compute vs get | compute | ✅ upheld |
| InSize vs ForSize | InSize | ✅ upheld |
| Level vs Tier | Level | ✅ upheld |
| constants vs object | constants | ✅ acceptable |
| refs vs references | refs | ✅ upheld |

**r6 conclusion:** all conventions verified under challenge. no changes needed.
