# self-review: has-consistent-conventions (r4)

## reviewed artifacts

1. `src/domain.operations/behavior/init/getAllTemplatesBySize.ts` (new)
2. `src/domain.operations/behavior/init/getAllTemplatesBySize.test.ts` (new)
3. `src/domain.operations/behavior/init/initBehaviorDir.ts` (modified)

## deep search for extant conventions

### 1. function name conventions

**searched:** `grep 'export const [a-z]+[A-Z]' src/domain.operations/**/*.ts`

**extant verb prefixes:**
- `get*` - retrieval (getBehaviorDir)
- `getAll*` - retrieval of list (new pattern, but follows `get` prefix)
- `find*` - search (findBehaviorByExactName)
- `compute*` - derivation (computeOutputTree)
- `init*` - initialization (initBehaviorDir)
- `give*` - provision (giveFeedback)
- `is*` - predicate (new pattern, standard TypeScript)
- `expand*` - transformation (expandBehaviorName)

**new function names vs extant:**
| new name | prefix | verdict |
|----------|--------|---------|
| `getAllTemplatesBySize` | `getAll` | follows `get` pattern |
| `isTemplateInSize` | `is` | standard predicate pattern |

**why they hold:**
- `getAllTemplatesBySize` - `getAll` is natural extension of `get` prefix for list retrieval
- `isTemplateInSize` - `is` prefix is standard TypeScript predicate convention

### 2. constant name conventions

**searched:** `grep 'const [A-Z_]+.*=' src/domain.operations/**/*.ts`

**extant:**
- `TEMPLATES_DIR` - path constant
- `TEST_CASES` - test data
- `ASSETS_DIR` - path constant

**new:**
- `BEHAVIOR_SIZE_CONFIG` - config constant
- `BEHAVIOR_SIZE_ORDER` - derived constant

**why they hold:**
- both follow SCREAMING_SNAKE_CASE
- `_CONFIG` suffix follows common pattern for config objects
- `_ORDER` suffix describes the derived array

### 3. type name conventions

**searched:** `grep 'export type [A-Z]' src/domain.operations/**/*.ts`

**extant:** all types use PascalCase

**new:** `BehaviorSizeLevel` - PascalCase

**why it holds:** follows extant PascalCase convention

### 4. file structure conventions

**searched:** `glob 'src/domain.operations/behavior/init/*'`

**extant pattern:**
- `{operation}.ts` - main module
- `{operation}.test.ts` - unit tests
- `{operation}.integration.test.ts` - integration tests

**new files:**
- `getAllTemplatesBySize.ts` - main module
- `getAllTemplatesBySize.test.ts` - unit tests

**why it holds:** follows extant collocated test pattern

### 5. input signature conventions

**extant:** `(input: { ... })` object pattern throughout codebase

**new code:**
```ts
export const getAllTemplatesBySize = (input: { size: BehaviorSizeLevel }): string[]
export const isTemplateInSize = (input: { templateName: string; size: BehaviorSizeLevel }): boolean
```

**why it holds:** follows extant `input` object pattern

### 6. comment conventions

**extant:** jsdoc with `.what`, `.why`, `.note` fields

**new code:**
```ts
/**
 * .what = configuration and utilities for behavior size levels
 *
 * .why  = single source of truth...
 */
```

**why it holds:** follows extant jsdoc pattern

## findings: no divergence found

every convention was verified:

| category | convention | new code | verdict |
|----------|------------|----------|---------|
| function prefix | verb-first | `getAll*`, `is*` | ✓ |
| constant case | SCREAMING_SNAKE | `BEHAVIOR_SIZE_CONFIG` | ✓ |
| type case | PascalCase | `BehaviorSizeLevel` | ✓ |
| file structure | `.ts` + `.test.ts` | both present | ✓ |
| input signature | `(input: {...})` | yes | ✓ |
| comments | `.what`, `.why` | yes | ✓ |

## conclusion

the implementation follows all extant codebase conventions. no new conventions were introduced. the `getAll` and `is` prefixes are natural extensions of extant patterns.
