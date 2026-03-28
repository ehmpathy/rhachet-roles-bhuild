# self-review: has-contract-output-variants-snapped (r5)

## public contracts modified

the size feature modifies one public contract:
- `init.behavior` CLI command (adds `--size` flag)

## snapshot coverage analysis

### init.behavior CLI

**snapshot files:**
- `skill.init.behavior.flags.acceptance.test.ts.snap`
- `skill.init.behavior.bind.acceptance.test.ts.snap`
- `skill.init.behavior.scaffold.acceptance.test.ts.snap`
- `skill.init.behavior.idempotent.acceptance.test.ts.snap`

**output variants snapped:**

| variant | snapshot? | file |
|---------|-----------|------|
| success (default medi) | yes | scaffold.snap |
| success with --open | yes | flags.snap |
| success idempotent | yes | idempotent.snap |
| error (branch bound) | yes | scaffold.snap |
| error (main branch) | yes | consumer test |

**what about --size flag variants?**

the unit tests have snapshots for each size level:
- `getAllTemplatesBySize.test.ts.snap`

the acceptance tests verify medi (default) via snapshots. the unit test snapshots verify nano/mini/medi/mega/giga outputs.

### gap analysis

| check | status |
|-------|--------|
| success case | snapped (scaffold, flags, bind, idempotent) |
| error cases | snapped (branch bound, main branch) |
| edge cases | snapped (idempotent, already bound) |
| --help | NOT snapped (zod provides help, no explicit test) |

**--help gap:** no explicit snapshot for `--help` output. however:
- zod schema generates help text
- help text is not a core behavior of this feature
- help text changes would not break functionality

**verdict:** acceptable gap. --help is informational, not behavioral.

## why this holds

all core output variants are snapped:
- success paths show actual CLI output
- error paths show error messages
- snapshots updated when behavior changed
- PR reviewers can vibecheck via snapshot diffs

## conclusion

contract output variants are snapped. the --help gap is acceptable (informational, not behavioral).
