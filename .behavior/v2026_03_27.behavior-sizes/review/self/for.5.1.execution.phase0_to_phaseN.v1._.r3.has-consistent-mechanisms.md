# self-review: has-consistent-mechanisms (r3)

## reviewed artifacts

1. `src/domain.operations/behavior/init/getAllTemplatesBySize.ts` (new)
2. `src/domain.operations/behavior/init/initBehaviorDir.ts` (modified)

## thorough search for extant mechanisms

### search 1: config patterns

```
grep 'satisfies Record' → 1 file (new file only)
grep 'keyof typeof' → 1 file (new file only)
grep 'as const' → 9 files (consistent usage)
grep 'const.*CONFIG.*=' → 1 file (new file only)
grep 'order.*:.*[0-9]' → only in new file
grep 'adds.*:.*\[' → only in new file
grep 'Level|Size.*=' → no matches
```

**conclusion:** no extant config pattern for size → template map exists. the `as const` pattern is used consistently across 9 files. the `BEHAVIOR_SIZE_CONFIG` pattern is novel but idiomatic.

### search 2: template utilities

```
glob 'src/**/template*.ts' → no files
grep 'template.*filter|filter.*template' → only new files
grep 'computeTemplatesToProcess' → only in initBehaviorDir.ts
```

**conclusion:** no extant template utility module exists. the `computeTemplatesToProcess` function in initBehaviorDir.ts is the only template filter logic, and we extended it rather than a duplicate.

### search 3: membership check patterns

```
grep 'isTemplateIn|getTemplates' → only new files + test
```

**conclusion:** the `isTemplateInSize()` function is novel. it parallels the extant guard variant check in `computeTemplatesToProcess()` but operates on a different dimension (size vs guard).

## why each mechanism holds

### mechanism 1: BEHAVIOR_SIZE_CONFIG

**what:** single source of truth with `{ order, adds }` per size level

**why it holds:**
- no extant size config exists
- pattern mirrors idiomatic TypeScript "enum-like config" pattern
- `order` field enables sorted iteration without separate array
- `adds` field enables cumulative semantics (mini = nano + mini adds)

### mechanism 2: type derivation via keyof typeof

**what:** `type BehaviorSizeLevel = keyof typeof BEHAVIOR_SIZE_CONFIG`

**why it holds:**
- compiler enforces that every config key has a type
- prevents typos in size level strings
- no extant type derivation mechanism to reuse

### mechanism 3: isTemplateInSize()

**what:** checks if template name (with optional guard suffix) is in size level

**why it holds:**
- guard variant handle (`templateName.replace(/\.(light|heavy)$/, '')`) parallels extant guard variant handle in `computeTemplatesToProcess()`
- the function is new because no extant membership check existed
- clean separation: size logic in getAllTemplatesBySize.ts, not scattered

### mechanism 4: extended computeTemplatesToProcess()

**what:** added `sizeLevel` param and `isTemplateInSize()` call

**why it holds:**
- reused extant function rather than new parallel function
- filter order: guard variant first, then size level
- follows extant pattern: filter by criterion, skip non-matches

## findings: no duplication

every new mechanism was verified against extant codebase:
1. **BEHAVIOR_SIZE_CONFIG** - no extant equivalent
2. **type derivation** - no extant pattern to reuse
3. **isTemplateInSize** - no extant membership check
4. **computeTemplatesToProcess** - reused, not duplicated

## conclusion

the implementation introduces mechanisms only where no extant equivalent exists. where patterns exist (`as const`, guard variant handle, mkdir recursive), they are followed consistently.
