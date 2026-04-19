# self-review: has-all-tests-passed

## proof of test execution

### types
```
$ rhx git.repo.test --what types
> exit 0
> passed (30s)
```

### lint
```
$ rhx git.repo.test --what lint
> exit 0
> passed (15s)
```

### format
```
$ rhx git.repo.test --what format
> exit 0
> passed (3s)
```

### unit
```
$ rhx git.repo.test --what unit
> exit 0
> 33 tests passed
> time: 3.952s
```

### integration
```
$ rhx git.repo.test --what integration
> exit 0
> 28 tests passed
> time: 3.415s
```

### acceptance (init.behavior scope)

individual suites verified:

```
$ rhx git.repo.test --what acceptance --scope init.behavior.wish
> exit 0
> 26 tests passed
> time: 136.37s
```

```
$ rhx git.repo.test --what acceptance --scope init.behavior.flags
> exit 0
> 5 tests passed
> time: 107.411s
```

```
$ rhx git.repo.test --what acceptance --scope init.behavior.scaffold
> exit 0
> 3 tests passed
> time: 61.582s
```

```
$ rhx git.repo.test --what acceptance --scope init.behavior.sizes
> exit 0
> 38 tests passed
> time: 157.358s
```

## failures found and fixed

1. **test utility argument parser**: `runInitBehaviorSkillDirect` split args on whitespace, which broke quoted strings like `--wish "my inline wish"`. fixed with `shell: true` in spawnSync.

2. **error output to stderr**: after the ConstraintError handler was added to src/index.ts, errors go to stderr. updated tests to check `result.stderr` instead of `result.stdout` for error cases.

3. **exit code 2 for ConstraintError**: scaffold test expected exit code 1 but ConstraintError uses exit code 2. updated test expectation.

4. **snapshot updates**: error snapshots now capture stderr content with `✋ ConstraintError:` prefix.

## verdict

all tests pass. failures were found, diagnosed, and fixed.
