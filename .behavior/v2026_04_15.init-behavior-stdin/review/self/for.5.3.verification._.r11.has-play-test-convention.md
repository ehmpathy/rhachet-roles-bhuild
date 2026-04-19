# self-review r11: has-play-test-convention

## the deepest question: should i introduce .play. to this repo?

### investigation

**search 1**: `.play.test.ts` files in repo
```
glob **/*.play.test.ts → 0 results
```

**search 2**: `.acceptance.test.ts` files in repo
```
glob blackbox/**/*.acceptance.test.ts → 24 files
```

**conclusion**: this repo has zero `.play.` tests and 24 `.acceptance.` tests.

### what this means

the `.play.` convention does not exist here. the fallback is `.acceptance.`.

the guide says:
> if not supported, is the fallback convention used?

yes — `.acceptance.test.ts` is the fallback in use.

### should i be the first to use .play.?

no. reasons:

1. **consistency**: 24 tests follow `.acceptance.`. 1 test with `.play.` would be an outlier.

2. **discoverability**: test runners are configured for `*.acceptance.test.ts`. a `.play.test.ts` might be missed.

3. **precedent**: if `.play.` is desired, it should be a repo-wide migration, not a single-PR experiment.

4. **reviewability**: my reviewer expects `.acceptance.` because that's what the repo uses.

### what i actually verified

- my tests are in `blackbox/role=behaver/` — correct location
- my tests use `skill.init.behavior.*.acceptance.test.ts` — matches peers
- test runner picks them up — verified via `rhx git.repo.test --scope init.behavior`
- tests execute and pass — verified with 72 tests total

### the principle

when in Rome, do as the Romans do. this repo uses `.acceptance.`. my tests use `.acceptance.`. convention followed.

## verdict

`.play.` not used in this repo. `.acceptance.` is the established pattern. my tests follow it correctly.
