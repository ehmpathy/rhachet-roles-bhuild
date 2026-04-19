# self-review r1: has-snapshot-coverage

## question

do all user-faced contracts have snapshot coverage for outputs?

## review

### cli contract snapshots

| contract | positive path | negative path | edge cases |
|----------|--------------|---------------|------------|
| `--wish "inline"` | yes | n/a | n/a |
| `--wish @stdin` | yes | n/a | n/a |
| `--wish ""` empty | n/a | yes (ConstraintError) | n/a |
| `--wish` conflict | n/a | yes (ConstraintError) | n/a |
| `--wish` idempotent | yes | n/a | yes (same content no-op) |
| `--wish` + `--open` | yes | n/a | n/a |

### snapshot file verification

```
blackbox/role=behaver/__snapshots__/skill.init.behavior.wish.acceptance.test.ts.snap
```

contents verified:
- case1: inline wish → wish file created with content
- case2: stdin wish → wish file created with piped content
- case3: empty wish → error message in stderr
- case4: conflict → error message in stderr
- case5: idempotent → no-op message
- case6: open with editor → wish file created, editor invoked

### gap check

- all behaviors from vision have snapshots
- positive paths: covered
- negative paths (errors): covered
- edge cases (idempotent, combined flags): covered

## verdict

snapshot coverage is complete. all contract outputs are captured for PR review.
