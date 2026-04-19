# self-review r9: has-play-test-convention

## question

are journey test files named correctly?

## review

### repo convention

this repo uses `.acceptance.test.ts` suffix, not `.play.test.ts`:
- `skill.init.behavior.wish.acceptance.test.ts`
- `skill.init.behavior.scaffold.acceptance.test.ts`
- `skill.init.behavior.sizes.acceptance.test.ts`

### why not `.play.test.ts`?

the repo predates the `.play.` convention. all acceptance tests follow the established pattern:
- `skill.{name}.acceptance.test.ts` for CLI skills
- `role.{name}.acceptance.test.ts` for role-level tests

### verification

| test file | convention | correct? |
|-----------|------------|----------|
| skill.init.behavior.wish.acceptance.test.ts | `.acceptance.` | yes |
| skill.init.behavior.scaffold.acceptance.test.ts | `.acceptance.` | yes |
| skill.init.behavior.sizes.acceptance.test.ts | `.acceptance.` | yes |
| init.behavior.at-branch.acceptance.test.ts | `.acceptance.` | yes |

### should we migrate to `.play.`?

no — consistency with the repo is more valuable than a new convention for one PR.

if the repo migrates to `.play.` later, these tests can be renamed then.

## verdict

tests follow repo convention (`.acceptance.test.ts`). no name issues.
