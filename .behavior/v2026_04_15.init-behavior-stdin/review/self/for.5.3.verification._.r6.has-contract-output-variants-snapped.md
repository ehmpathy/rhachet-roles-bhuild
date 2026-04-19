# self-review r6: has-contract-output-variants-snapped

## deeper reflection

### what is the contract?

`rhx init.behavior --wish @stdin|words` is a CLI flag that populates the wish file.

callers experience:
- stdout on success (file path, status)
- stderr on error (ConstraintError with hint)
- exit code 0 on success, 2 on error

### what variants exist?

| variant | user action | expected output |
|---------|-------------|-----------------|
| inline wish | `--wish "my wish"` | stdout: path to 0.wish.md |
| stdin wish | `echo "wish" \| --wish @stdin` | stdout: path to 0.wish.md |
| empty wish | `--wish ""` | stderr: ConstraintError |
| conflict | `--wish` when file modified | stderr: ConstraintError |
| idempotent | same wish twice | stdout: no-op message |
| combined | `--wish` + `--open` | stdout: path + editor invoked |
| size limit | wish > 5000 chars | stderr: ConstraintError |

### snapshot verification

opened `skill.init.behavior.wish.acceptance.test.ts.snap`:
- case1: inline wish → captures stdout with file path
- case2: stdin wish → captures stdout with file path
- case3: empty wish → captures stderr with `✋ ConstraintError:`
- case4: conflict → captures stderr with `✋ ConstraintError:`
- case5: idempotent → captures stdout with no-op
- case6: combined → captures stdout with path + open

opened `skill.init.behavior.sizes.acceptance.test.ts.snap`:
- case7: size limit → captures stderr with `✋ ConstraintError:`

### why exhaustive matters

reviewers read snapshots to vibecheck the output. if a variant lacks a snapshot:
- the reviewer cannot see what callers see
- drift goes undetected
- broken outputs ship silently

### gap analysis

all variants snapped. the only omission is `--help` which is covered by the parent `init.behavior` command, not the `--wish` flag specifically.

## verdict

exhaustive coverage achieved. every output variant has a snapshot.
