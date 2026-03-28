# self-review: has-consistent-mechanisms (r2)

## reviewed artifacts

1. `src/domain.operations/behavior/init/getAllTemplatesBySize.ts` (new)
2. `src/domain.operations/behavior/init/initBehaviorDir.ts` (modified)

## question: do new mechanisms duplicate extant functionality?

### search for related patterns

**searched for:**
- `satisfies Record` → only in new file
- `keyof typeof` → only in new file
- `as const` → 9 files use this, consistent pattern
- `computeTemplatesToProcess` → only in initBehaviorDir.ts (extant)
- `const.*CONFIG.*=` → only in new file

### artifact 1: getAllTemplatesBySize.ts

**new mechanisms:**
1. `BEHAVIOR_SIZE_CONFIG` - single source of truth for size → template map
2. `BehaviorSizeLevel` type derived from config keys
3. `BEHAVIOR_SIZE_ORDER` - order derived from config
4. `getAllTemplatesBySize()` - cumulative template list
5. `isTemplateInSize()` - membership check with guard variant handle

**why no duplication:**
- no extant size config pattern exists (this is the first implementation of --size)
- the `as const satisfies Record<...>` pattern is consistent with other TypeScript codebases
- the derived type pattern (`keyof typeof CONFIG`) is idiomatic TypeScript
- no utility libraries in this repo offer similar config → type derivation

### artifact 2: initBehaviorDir.ts

**modified mechanisms:**
1. `computeTemplatesToProcess()` - added `sizeLevel` parameter and size filter

**why consistent:**
- reuses extant `computeTemplatesToProcess()` function (no new function created)
- follows extant pattern: guard level filter already in place, size filter parallels it
- uses `isTemplateInSize()` from new module (clean separation)
- `mkdirSync(targetDir, { recursive: true })` for refs/ subdirectory uses same pattern as behavior dir creation above

### patterns checked

| new code | extant pattern? | disposition |
|----------|-----------------|-------------|
| `as const satisfies` | yes (9 files) | consistent |
| `keyof typeof` | new to this repo | idiomatic TypeScript |
| config → type derivation | new to this repo | single source of truth pattern |
| guard variant handle | yes (initBehaviorDir) | extended, not duplicated |
| mkdir recursive | yes (line 42) | reused same pattern |

## findings: no duplication

the new mechanisms are:
1. **novel** - size config is a new feature with no extant equivalent
2. **consistent** - follows extant patterns where they exist (`as const`, guard filter)
3. **minimal** - reuses extant `computeTemplatesToProcess()` rather than new parallel function

## conclusion

no extant mechanisms were duplicated. the implementation extends the extant guard level filter pattern to include size level filter in a consistent way.
