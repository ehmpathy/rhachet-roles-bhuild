# self-review r6: has-snap-changes-rationalized

## question

is every `.snap` file change intentional and justified?

## review

### changed snapshot files

```
git diff --name-only HEAD -- '*.snap'
```

1. `skill.init.behavior.scaffold.acceptance.test.ts.snap`
2. `skill.init.behavior.wish.acceptance.test.ts.snap`

### per-file analysis

#### skill.init.behavior.wish.acceptance.test.ts.snap

**change type**: added (new file)

**rationale**: this is a new feature (`--wish @stdin|words`). the snapshots capture:
- case1: inline wish success output
- case2: stdin wish success output
- case3: empty wish error with `✋ ConstraintError:`
- case4: conflict error with `✋ ConstraintError:`
- case5: idempotent no-op output
- case6: combined flags output

**intended**: yes — new feature requires new snapshots

#### skill.init.behavior.scaffold.acceptance.test.ts.snap

**change type**: modified

**rationale**: case4 error output changed from stdout to stderr. this aligns with ConstraintError handler that sends errors to stderr.

**before**: error in stdout
**after**: error in stderr with `✋ ConstraintError:` prefix

**intended**: yes — aligns snapshot with actual contract

### regression check

| concern | status |
|---------|--------|
| output format degraded | no — same structure |
| error messages less helpful | no — same content, different stream |
| timestamps leaked | no — masks in place |
| extra output added | no — content unchanged |

## verdict

all snapshot changes are intentional and justified. no regressions.
