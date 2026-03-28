# self-review: has-consistent-mechanisms (round 4)

## review of: 3.3.1.blueprint.product.v1.i1.md

review for new mechanisms that duplicate extant functionality.

---

## inventory of new mechanisms in blueprint

1. `computeSizeTemplates.ts` - new file
2. `computeSizeTemplates(size: SizeLevel)` - new function
3. `isTemplateInSize(templateName, size)` - new function
4. `SizeLevel` type - new type
5. subdirectory creation for refs/ - new logic

---

## mechanism 1: computeSizeTemplates.ts

**what it does:** returns list of templates for a given size level

**extant mechanisms in codebase:**
- searched for "computeTemplates", "getTemplates", "filterTemplates" - none found
- searched for size-related logic - none found
- no prior size concept in behavior init

**verdict:** ✅ no duplication - novel functionality

---

## mechanism 2: computeSizeTemplates function

**what it does:** maps size → cumulative template list

**extant patterns:**
- initBehaviorDir has `computeTemplatesToProcess` (local function)
- this is a composition, not duplication

**could we reuse extant?**
- computeTemplatesToProcess handles guard levels
- size filter is orthogonal concern
- new function appropriate

**verdict:** ✅ no duplication - composes with extant

---

## mechanism 3: isTemplateInSize function

**what it does:** predicate to check if template is in size level

**extant patterns:**
- initBehaviorDir has `isGuardLevelTemplate` check inline
- blueprint follows same pattern

**could we reuse extant?**
- guard check is different concern (suffix match)
- size check is membership test (array.includes)
- different logic, no reuse possible

**verdict:** ✅ no duplication - follows extant pattern

---

## mechanism 4: SizeLevel type

**what it does:** union type 'nano' | 'mini' | 'medi' | 'mega' | 'giga'

**extant patterns:**
- GuardLevel type exists: 'light' | 'heavy'
- blueprint follows same pattern

**could we reuse extant?**
- GuardLevel is different concept
- no generic "Level" type to extend
- follows established pattern

**verdict:** ✅ no duplication - follows extant convention

---

## mechanism 5: subdirectory creation for refs/

**what it does:** creates refs/ directory if template path includes /

**extant patterns:**
- searched for mkdir patterns in behavior/init
- initBehaviorDir creates behaviorDir itself
- no subdirectory creation extant

**could we reuse extant?**
- no extant subdirectory creation to reuse
- uses standard mkdirSync({ recursive: true })
- follows node.js convention

**verdict:** ✅ no duplication - uses standard node pattern

---

## cross-check: could size use guard mechanism?

**question:** does size duplicate guard's filter logic?

**analysis:**
- guard filter: match suffix (.light or .heavy)
- size filter: membership check against template list
- fundamentally different operations

**verdict:** ✅ different mechanisms for different concerns

---

## summary

| mechanism | duplicates extant? | verdict |
|-----------|-------------------|---------|
| computeSizeTemplates.ts | no | novel functionality |
| computeSizeTemplates fn | no | composes with extant |
| isTemplateInSize | no | follows extant pattern |
| SizeLevel type | no | follows extant convention |
| subdirectory creation | no | standard node pattern |

**conclusion:** no mechanisms duplicate extant functionality. new code follows established patterns where applicable.
