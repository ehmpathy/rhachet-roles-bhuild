# self-review r5: has-contract-output-variants-snapped

## question

does each public contract have EXHAUSTIVE snapshots?

## review

### public contract: `--wish @stdin|words`

this is a CLI contract. users invoke it via terminal.

### variant coverage matrix

| variant | snapped? | test case | snapshot content |
|---------|----------|-----------|------------------|
| success: inline wish | yes | case1 | stdout with wish file path |
| success: stdin wish | yes | case2 | stdout with wish file path |
| success: idempotent | yes | case5 | stdout with "no change" message |
| success: combined flags | yes | case6 | stdout with wish file + editor invoked |
| error: empty wish | yes | case3 | stderr with ConstraintError |
| error: conflict | yes | case4 | stderr with ConstraintError |
| error: size limit | yes | sizes case7 | stderr with ConstraintError |

### checklist per variant

- [x] positive path (success) is snapped — cases 1, 2, 5, 6
- [x] negative path (error) is snapped — cases 3, 4, sizes case7
- [x] edge cases are snapped — idempotent, combined flags, size limit
- [x] snapshots show actual output — verified via grep in .snap files

### gap check

| absent variant? | status |
|-----------------|--------|
| `--help` for wish flag | not added |

the `--help` variant is not snapped. however, `--wish` is not a standalone command — it's a flag on `init.behavior`. the main `init.behavior --help` is snapped elsewhere.

### why it holds

all output variants for the `--wish` feature are exhaustively snapped:
- every success path
- every error path
- edge cases (idempotent, combined, size limit)

## verdict

contract output variants are exhaustively snapped. no blind spots for PR reviewers.
