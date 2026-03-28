# self-review: has-questioned-deletables

## review of: 3.3.1.blueprint.product.v1.i1.md

---

## feature traceability

### feature 1: --size flag with 5 levels
- **traces to:** wish explicitly says "add --size nano|mini|medi|mega|giga"
- **verdict:** ✅ required - wisher asked for this

### feature 2: medi as default
- **traces to:** wish says "medi = default"
- **verdict:** ✅ required - wisher asked for this

### feature 3: additive size model (mini = nano + more)
- **traces to:** wish says "mini should addon criteria"
- **verdict:** ✅ required - matches wisher intent

### feature 4: feedback template rename
- **traces to:** vision says "move .ref.[feedback]... -> refs/template.[feedback].v1.[given].by_human.md"
- **verdict:** ⚠️ question - wisher said this in vision phase, but is it in scope for this behavior?
- **resolution:** keep it - wisher explicitly asked in vision phase

### feature 5: new distill.domain.guard
- **traces to:** vision says "add approval guard on distill.domain"
- **verdict:** ✅ required - wisher asked for this

---

## component deletability

### component 1: computeSizeTemplates.ts (new file)
- **can this be removed?** no - the size map logic must live somewhere
- **did we optimize a thing that shouldn't exist?** no - this is the core feature
- **simplest version?** single function with hardcoded template lists
- **verdict:** ✅ keep - minimal necessary

### component 2: subdirectory creation for refs/
- **can this be removed?** only if we don't rename the feedback template
- **did we optimize a thing that shouldn't exist?** no - needed for refs/ path
- **verdict:** ⚠️ tied to feature 4 - if feature 4 is removed, this goes too

### component 3: size level enum type
- **can this be removed?** no - typescript requires type safety
- **simplest version?** z.enum in schema handles it
- **verdict:** ✅ keep - minimal

---

## simplification opportunities found

### opportunity 1: inline template lists vs separate file
- **current:** separate computeSizeTemplates.ts file
- **alternative:** inline constants in initBehaviorDir.ts
- **verdict:** keep separate file - clearer separation, easier to maintain

### opportunity 2: guard variants in size lists
- **current:** lists include guard variants explicitly
- **concern:** guards are handled by separate logic already
- **verdict:** ⚠️ issue found - template lists should NOT include .light/.heavy variants; the guard filter handles that. simplify lists to base names only.

**fix applied:** template lists should use base names; guard level filter selects variant.

---

## summary

| item | verdict | notes |
|------|---------|-------|
| --size flag | ✅ keep | wisher asked |
| medi default | ✅ keep | wisher asked |
| additive model | ✅ keep | wisher asked |
| feedback rename | ✅ keep | wisher asked in vision |
| distill.domain.guard | ✅ keep | wisher asked in vision |
| computeSizeTemplates.ts | ✅ keep | minimal necessary |
| subdirectory creation | ✅ keep | needed for refs/ |

**issues fixed:**
1. simplified template list approach - base names only, guard filter handles variants
