# self-review: has-play-test-convention (r10)

## the actual question

> are journey test files named correctly?

let me examine the repo's test infrastructure to understand what convention applies.

## repo test infrastructure

### jest config files

```
$ git ls-files 'jest.*.config.*'
jest.acceptance.config.ts
jest.integration.config.ts
jest.unit.config.ts
```

three separate configs = three test categories.

### acceptance test config (jest.acceptance.config.ts line 27)

```ts
testMatch: ['**/*.acceptance.test.ts', '!**/.yalc/**', '!**/node_modules/**'],
```

**this config explicitly matches `.acceptance.test.ts` files.**

this is the repo's established convention for blackbox/journey tests. the `.play.test.ts` convention is NOT used here.

### why `.acceptance.test.ts` instead of `.play.test.ts`?

1. **established pattern** - 17+ acceptance test files use this convention
2. **jest config enforces it** - testMatch pattern requires `.acceptance.test.ts`
3. **separate runner** - `npm run test:acceptance` runs only these files

if i created a `.play.test.ts` file, it would NOT be run by any of the extant jest configs.

## test files for this behavior

### new tests in this branch

| file | convention | correct? |
|------|------------|----------|
| `getAllTemplatesBySize.test.ts` | `.test.ts` (unit) | yes |
| (no new acceptance tests) | n/a | n/a |

### extant acceptance tests (cover size feature)

| file | convention | correct? |
|------|------------|----------|
| `skill.init.behavior.scaffold.acceptance.test.ts` | `.acceptance.test.ts` | yes |
| `skill.init.behavior.bind.acceptance.test.ts` | `.acceptance.test.ts` | yes |
| `skill.init.behavior.flags.acceptance.test.ts` | `.acceptance.test.ts` | yes |
| `skill.init.behavior.idempotent.acceptance.test.ts` | `.acceptance.test.ts` | yes |

### test location

| category | location | correct? |
|----------|----------|----------|
| unit tests | `src/.../` (collocated) | yes |
| acceptance tests | `blackbox/role=behaver/` | yes |

## why `.play.test.ts` does not apply

the guide says: "if not supported, is the fallback convention used?"

**evidence that `.play.test.ts` is not supported:**
1. `jest.acceptance.config.ts` testMatch excludes `.play.test.ts`
2. no extant `.play.test.ts` files in repo (0 results)
3. would require new jest config to run

**evidence that fallback is used:**
1. all journey tests use `.acceptance.test.ts`
2. 17+ files follow this convention
3. tests run via `npm run test:acceptance`

## conclusion

this repo uses `.acceptance.test.ts` as the fallback convention for journey tests. the `.play.test.ts` convention is not supported by the jest configuration. all test files in this branch follow the repo's established convention:
- unit tests use `.test.ts`
- acceptance tests use `.acceptance.test.ts`
- tests are in correct locations
