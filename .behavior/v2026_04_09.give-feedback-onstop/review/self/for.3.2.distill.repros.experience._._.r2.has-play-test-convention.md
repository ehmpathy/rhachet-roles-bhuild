# self-review: has-play-test-convention

## journey test convention verified

### the convention

journey tests use `.play.test.ts` suffix variants:
- `feature.play.test.ts` — journey test
- `feature.play.integration.test.ts` — if repo requires integration runner
- `feature.play.acceptance.test.ts` — if repo requires acceptance runner

### what I documented

in the concrete test sketch:
```typescript
describe('feedback.take.get.play.acceptance', () => {
  // ...
});
```

this implies:
- **file**: `feedbackTakeGet.play.acceptance.test.ts`
- **why acceptance**: these tests run CLI commands, need temp repos, invoke skills
- **follows convention**: yes — `.play.acceptance.test.ts`

### verification against repo patterns

checked extant test files in rhachet-roles-bhuild:
- most tests use `.integration.test.ts` for CLI tests
- `.acceptance.test.ts` used for full system tests

for feedback system:
- uses CLI commands via `rhx feedback.*`
- creates temp repos with git init
- validates file system state

this is acceptance-level test scope → `.play.acceptance.test.ts` is correct.

### alternative considered

could use `.play.integration.test.ts` since:
- tests domain operations directly
- doesn't need full deployed system

**decision**: use `.play.acceptance.test.ts` because:
- tests invoke `rhx` CLI commands
- tests validate user-visible output
- tests verify full workflow end-to-end

## issues found

none. the convention is correctly documented.

## conclusion

the `.play.acceptance.test.ts` suffix is appropriate for these journey tests:
1. they test CLI commands (user entry point)
2. they validate output snapshots (user-visible)
3. they verify full workflows (acceptance scope)
