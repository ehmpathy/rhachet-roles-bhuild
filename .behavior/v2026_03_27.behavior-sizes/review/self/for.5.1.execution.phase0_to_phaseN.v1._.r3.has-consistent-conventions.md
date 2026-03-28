# self-review: has-consistent-conventions (r3)

## reviewed artifacts

1. `src/domain.operations/behavior/init/getAllTemplatesBySize.ts` (new)
2. `src/domain.operations/behavior/init/initBehaviorDir.ts` (modified)

## search for extant conventions

### function names

```
grep 'export const [a-z]+[A-Z]' src/domain.operations/**/*.ts
```

**extant patterns:**
- `initBehaviorDir` - verb prefix
- `findBehaviorByExactName` - verb prefix
- `expandBehaviorName` - verb prefix
- `giveFeedback` - verb prefix
- `computeOutputTree` - verb prefix
- `getBehaviorDir` - verb prefix

**convention:** camelCase with verb prefix (`get`, `set`, `find`, `compute`, `init`, `give`, `is`)

### constant names

```
grep 'const [A-Z_]+.*=' src/domain.operations/**/*.ts
```

**extant patterns:**
- `TEMPLATES_DIR` - SCREAMING_SNAKE_CASE
- `TEST_CASES` - SCREAMING_SNAKE_CASE
- `ASSETS_DIR` - SCREAMING_SNAKE_CASE

**convention:** SCREAMING_SNAKE_CASE for module-level constants

### type names

```
grep 'export type [A-Z]' src/domain.operations/**/*.ts
```

**extant patterns:**
- `BehaviorSizeLevel` - PascalCase

**convention:** PascalCase for types

## verify new names follow conventions

| new name | convention | verdict |
|----------|------------|---------|
| `BEHAVIOR_SIZE_CONFIG` | SCREAMING_SNAKE_CASE constant | ✓ matches |
| `BEHAVIOR_SIZE_ORDER` | SCREAMING_SNAKE_CASE constant | ✓ matches |
| `BehaviorSizeLevel` | PascalCase type | ✓ matches |
| `getAllTemplatesBySize` | camelCase with `getAll` verb prefix | ✓ matches |
| `isTemplateInSize` | camelCase with `is` predicate prefix | ✓ matches |
| `sizeLevel` | camelCase local variable | ✓ matches |
| `guardLevel` | camelCase local variable | ✓ matches (extant) |

## namespace consistency

| term | usage | extant equivalent |
|------|-------|-------------------|
| `size` | `--size nano\|mini\|medi\|mega\|giga` | new concept, no extant |
| `level` | `sizeLevel`, `guardLevel` | extant: `guardLevel` |
| `config` | `BEHAVIOR_SIZE_CONFIG` | extant: config suffix pattern |
| `template` | `getAllTemplatesBySize` | extant: `templateFiles` |

## structure consistency

| pattern | new code | extant pattern |
|---------|----------|----------------|
| `(input: { ... })` signature | yes | yes (throughout codebase) |
| jsdoc `.what`, `.why` comments | yes | yes (throughout codebase) |
| single export per file | yes | yes (most files) |
| `as const satisfies` | yes | yes (9 files) |

## findings: no divergence

all new names and patterns follow extant conventions:
- function names use verb prefixes
- constants use SCREAMING_SNAKE_CASE
- types use PascalCase
- input signatures use `{ ... }` object pattern
- comments use `.what`, `.why` jsdoc pattern

## conclusion

the implementation follows extant codebase conventions without divergence. no new name patterns or structural changes were introduced.
