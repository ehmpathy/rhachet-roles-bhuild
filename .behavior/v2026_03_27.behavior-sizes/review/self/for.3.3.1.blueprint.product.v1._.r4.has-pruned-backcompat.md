# self-review: has-pruned-backcompat (round 4)

## review of: 3.3.1.blueprint.product.v1.i1.md

deeper review with fresh eyes on backwards compatibility concerns.

---

## r3 covered

r3 reviewed:
1. findsert semantics preservation - not backcompat, retained behavior
2. --guard optional - not backcompat, pre-behavior
3. medi default - explicitly requested
4. template file names - no change requested
5. giga = mega - new feature, minimal impl
6. scan for hidden backcompat - none found

---

## r4: look harder at implicit backcompat

### does the blueprint assume callers exist?

**question:** does blueprint add backcompat for callers that might break?

**analysis:**
- init.behavior is CLI entrypoint
- no known programmatic callers
- changes are additive (new --size flag)
- callers without --size get medi (sensible default)

**verdict:** ✅ no backcompat needed - additive change

### does the blueprint shim old behavior?

**question:** does blueprint keep old behavior "just in case"?

**analysis:**
- old behavior: init with all templates
- new behavior: init with size-appropriate templates
- no shim exists to invoke old behavior
- no `--size full` or `--size all` option

**is this a problem?**
- wisher said sizes should scope templates
- "stop delete so many of the stones" implies old behavior is undesired
- no backcompat shim needed

**verdict:** ✅ no shim needed - old behavior was the problem

### does the blueprint version templates?

**question:** does blueprint add versioned templates for migration?

**analysis:**
- templates use `.v1.` in names already (pre-behavior)
- no new version scheme introduced
- no v1-to-v2 migration paths
- no deprecated templates

**verdict:** ✅ no version backcompat - follows extant convention

---

## r4: devil's advocate

### what if someone depends on all templates?

**scenario:** user command expects specific template files to exist after init

**impact:** command would break for nano/mini sizes

**is this our problem?**
- no documented API for template file names
- templates are internal implementation detail
- users can add templates manually if needed
- users can use `--size mega` for all templates

**verdict:** ✅ not a backcompat concern - user chose the size

### what if init.behavior is called without CLI?

**scenario:** code imports initBehaviorDir directly

**impact:** caller must update to pass size parameter

**is this our problem?**
- size is optional with default (medi)
- callers without size get medi behavior
- this is MORE templates than before for most sizes
- wait, no - medi is FEWER templates than current "all"

**actually:** current behavior is "all templates". medi default would CHANGE behavior.

**is this backcompat concern?**
- extant callers get fewer templates
- but extant callers = init.behavior CLI only (verified via grep)
- no other callers found

**verdict:** ✅ acceptable - CLI is only caller, and medi default is explicitly requested

---

## r4: final scan

| potential backcompat | exists? | verdict |
|---------------------|---------|---------|
| caller shims | no | additive change |
| old behavior shim | no | old behavior was the problem |
| version migration | no | follows extant convention |
| template name compat | no | internal implementation |
| API compat | no | CLI only caller |

**r4 conclusion:** no unasked-for backwards compatibility. the change is intentionally NOT backwards compatible (fewer templates by default) because that's what the wisher requested.
