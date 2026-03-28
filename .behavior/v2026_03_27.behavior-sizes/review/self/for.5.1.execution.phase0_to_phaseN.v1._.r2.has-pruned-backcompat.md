# self-review: has-pruned-backcompat (r2)

## reviewed artifacts

1. `src/domain.operations/behavior/init/getAllTemplatesBySize.ts`
2. `src/domain.operations/behavior/init/initBehaviorDir.ts`
3. `src/contract/cli/init.behavior.ts` (schema change)

## question: did we add backwards compatibility that was not requested?

### artifact 1: getAllTemplatesBySize.ts

**scanned for backcompat patterns:**
- deprecated aliases for size names? **no**
- legacy mode detection? **no**
- version flags? **no**
- "if old behavior detected" logic? **no**

**why it holds:** this file is entirely new. it defines the `BEHAVIOR_SIZE_CONFIG` as single source of truth. no backwards compatibility was added because there's no prior state to be compatible with. the `giga` level with empty `adds: []` is not backcompat - it's explicitly documented as "reserved for future decomposition subroutes".

### artifact 2: initBehaviorDir.ts

**scanned for backcompat patterns:**
- `--legacy` flag? **no**
- detection of old behavior format? **no**
- migration logic? **no**
- conditional defaults based on "what users expect"? **no**

**why it holds:** the `size` parameter is optional with default `medi`. this is not backwards compatibility - it's standard optional parameter behavior. the default was chosen based on the vision document's statement that medi is "sensible middle ground", not based on "what users had before".

the findsert semantics (skip files that already exist) is pre-extant behavior from before this feature, not new backcompat.

### artifact 3: init.behavior.ts schema

**scanned for backcompat patterns:**
- deprecated parameter names? **no**
- `--level` alias for `--size`? **no**
- warning messages for "old" usage? **no**

**why it holds:** schema simply adds `.optional()` size parameter. no aliases, no deprecation warnings, no special handling.

## findings: no backwards compatibility violations

| concern | found | why it's not backcompat |
|---------|-------|-------------------------|
| optional size param | yes | standard pattern for new features |
| medi default | yes | chosen for sensibility, not "what users had" |
| findsert semantics | yes | pre-extant, not new for this feature |
| giga empty adds | yes | future expansion, not legacy support |

## open questions for wisher

none. no backwards compatibility concerns were identified that need wisher confirmation.

## conclusion

the implementation adds `--size` as a clean new feature. no backwards compatibility shims, aliases, or migration code was added. the design follows "add new capability" rather than "maintain old behavior" pattern.
