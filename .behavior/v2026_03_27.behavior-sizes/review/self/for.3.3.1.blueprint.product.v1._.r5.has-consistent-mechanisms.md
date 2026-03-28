# self-review: has-consistent-mechanisms (round 5)

## review of: 3.3.1.blueprint.product.v1.i1.md

deeper review with expanded codebase search.

---

## r4 covered

r4 reviewed 5 mechanisms:
1. computeSizeTemplates.ts - novel functionality
2. computeSizeTemplates fn - composes with extant
3. isTemplateInSize - follows extant pattern
4. SizeLevel type - follows extant convention
5. subdirectory creation - standard node pattern

---

## r5: deeper codebase search

### search 1: template selection patterns

**query:** how does the codebase select/filter templates elsewhere?

**findings:**
- `src/domain.operations/behavior/init/initBehaviorDir.ts` has template filter logic
- template filter checks: isGuardLevelTemplate, guardLevelChosenSuffix
- no other template selection in codebase

**implication for blueprint:**
- blueprint's size filter follows same pattern
- filter, then transform, then write

**verdict:** ✅ consistent with extant pattern

### search 2: enum/union type patterns

**query:** how does the codebase define option types?

**findings:**
- GuardLevel = 'light' | 'heavy' in initBehaviorDir
- Mode = 'plan' | 'apply' in various commands
- no shared "level" or "option" pattern

**implication for blueprint:**
- SizeLevel follows GuardLevel pattern
- inline union type, not imported from shared location

**verdict:** ✅ consistent with extant pattern

### search 3: file organization patterns

**query:** how are related operations organized?

**findings:**
- behavior/init/ contains initBehaviorDir.ts and templates/
- single operation per file
- templates in adjacent directory

**implication for blueprint:**
- computeSizeTemplates.ts as peer to initBehaviorDir.ts
- follows single responsibility pattern

**verdict:** ✅ consistent with extant structure

---

## r5: look for subtle duplication

### could computeSizeTemplates use an extant utility?

**candidates:**
- no template utilities found in codebase
- no array manipulation utilities that apply
- no configuration pattern that applies

**verdict:** ✅ no extant utility to reuse

### could isTemplateInSize reuse extant predicates?

**candidates:**
- isGuardLevelTemplate uses .endsWith() - different logic
- no membership test predicates found

**verdict:** ✅ no extant predicate to reuse

### does refs/ subdirectory duplicate extant dir creation?

**candidates:**
- initBehaviorDir creates behaviorDir via mkdirSync
- no other subdirectory creation found
- blueprint uses same mkdirSync pattern

**verdict:** ✅ uses same pattern, not duplication

---

## r5: check related repositories

**question:** does rhachet-roles-bhrain have template patterns we should follow?

**analysis:**
- bhrain is the route driver, not template manager
- bhuild owns template operations
- no cross-repo pattern to follow

**verdict:** ✅ n/a - different concerns

---

## r5: final consistency check

| aspect | extant pattern | blueprint follows? |
|--------|----------------|-------------------|
| filter logic | guard filter in initBehaviorDir | yes, size filter similar |
| type definition | inline union (GuardLevel) | yes, SizeLevel same |
| file organization | single op per file | yes, computeSizeTemplates.ts |
| directory creation | mkdirSync recursive | yes, refs/ same |
| name convention | compute*, is* predicates | yes, compute*, is* |

**r5 conclusion:** blueprint mechanisms are consistent with codebase patterns. no duplication found. no extant utilities to reuse.
