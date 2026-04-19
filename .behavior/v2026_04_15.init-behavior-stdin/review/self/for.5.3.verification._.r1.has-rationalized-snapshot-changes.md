# self-review r1: has-rationalized-snapshot-changes

## question

for each .snap file changed, is the change intended or accidental?

## review

### snapshot files changed

| file | change | intended? | rationale |
|------|--------|-----------|-----------|
| skill.init.behavior.wish.acceptance.test.ts.snap | added | yes | new feature requires new test snapshots |
| skill.init.behavior.flags.acceptance.test.ts.snap | modified | yes | date masks stabilized snapshots |

### added: wish acceptance snapshots

this file was created because `--wish @stdin|words` is a new feature. the snapshots capture:
- success output format
- error output format with `✋ ConstraintError:` prefix
- idempotent behavior output

all additions are intentional — they document the new contract.

### modified: flags acceptance snapshots

modification was date mask stabilization. the test replaces dynamic dates with `[MASKED_DATE]` for deterministic snapshots. this is maintenance, not behavior change.

### accidental changes?

none. both changes align with the PR scope:
- new feature → new snapshots
- test stabilization → updated masks

## verdict

all snapshot changes are rationalized. no accidental drift.
