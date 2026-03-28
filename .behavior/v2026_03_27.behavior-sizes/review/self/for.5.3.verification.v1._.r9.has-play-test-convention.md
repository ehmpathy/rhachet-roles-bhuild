# self-review: has-play-test-convention (r9)

## the actual question

> are journey test files named correctly?

the guide suggests `.play.test.ts` suffix for journey tests.

## repo convention check

### search for .play.test.ts files

```
$ find . -name '*.play.*.ts'
(no results)
```

this repo does NOT use the `.play.test.ts` convention.

### extant test conventions

```
$ git ls-files '*.test.ts' | head -20
blackbox/init.behavior.at-branch.acceptance.test.ts
blackbox/role=behaver/skill.init.behavior.scaffold.acceptance.test.ts
blackbox/role=behaver/skill.init.behavior.bind.acceptance.test.ts
...
```

this repo uses:
- `.acceptance.test.ts` for blackbox/journey tests
- `.test.ts` for unit tests
- `.integration.test.ts` for integration tests

### is the fallback convention used?

**yes.** the guide says "if not supported, is the fallback convention used?"

the fallback convention in this repo is `.acceptance.test.ts`:
- tests in `blackbox/` directory
- tests via real CLI invocation (`runInitBehaviorSkillDirect`)
- tests with snapshot assertions
- tests that create temp repos and run skills

## journey tests for this behavior

### test files for size feature

| file | type | purpose |
|------|------|---------|
| `getAllTemplatesBySize.test.ts` | unit | size→template logic |
| `initBehaviorDir.test.ts` | unit | size param flows |
| `skill.init.behavior.scaffold.acceptance.test.ts` | acceptance | CLI contract |
| `skill.init.behavior.bind.acceptance.test.ts` | acceptance | bind variant |
| `skill.init.behavior.flags.acceptance.test.ts` | acceptance | flags variant |
| `skill.init.behavior.idempotent.acceptance.test.ts` | acceptance | idempotent variant |

### are they in the right location?

| file | location | correct? |
|------|----------|----------|
| unit tests | `src/domain.operations/behavior/init/` | yes (collocated) |
| acceptance tests | `blackbox/role=behaver/` | yes (blackbox dir) |

### do they have the expected suffix?

| file | suffix | convention? |
|------|--------|-------------|
| `*.test.ts` | unit | yes |
| `*.acceptance.test.ts` | acceptance | yes (fallback) |

## conclusion

this repo does NOT use `.play.test.ts` convention. it uses `.acceptance.test.ts` as the fallback for journey tests. all test files follow the repo's established convention:
1. unit tests collocated with source
2. acceptance tests in `blackbox/` directory
3. correct suffixes used throughout
