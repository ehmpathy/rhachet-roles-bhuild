# self-review r3: has-preserved-test-intentions

## question

when you fixed failures, did you fix WHY they failed — not WHAT they test?

## review

### what tests failed

18 tests failed on initial run. categories:

1. **argument parser** — test utility broke quoted strings
2. **output stream** — tests checked stdout, errors went to stderr
3. **exit code** — test expected 1, ConstraintError uses 2
4. **snapshots** — captured empty stdout instead of stderr content

### what was fixed

| failure | root cause | fix location | intention preserved? |
|---------|------------|--------------|---------------------|
| quoted args destroyed | `split(/\s+/)` | test utility | yes — utility bug, not test intent |
| errors in wrong stream | tests checked stdout | test assertions | yes — assertions corrected to match contract |
| exit code mismatch | expected 1 | test assertions | yes — aligned with ConstraintError.code.exit |
| snapshots empty | captured wrong stream | resnap | yes — now captures actual output |

### did any test alter what it verifies?

no test altered its purpose. each test still verifies the same behavior:
- case3 still tests empty wish error
- case4 still tests pre-populated file conflict
- case7 still tests size error on too-large wish

the assertions were corrected to match the actual contract (stderr for errors, exit 2 for ConstraintError).

### could any fix hide a real bug?

checked: no.

- stderr for errors is correct — ConstraintError handler sends errors to stderr by design
- exit code 2 is correct — ConstraintError.code.exit is 2
- test utility fix is correct — bash handles quoted args, not split()

the test intentions are preserved. the fixes aligned tests with the actual contract.

## verdict

all fixes addressed WHY tests failed (test bugs, utility bugs) without alteration to WHAT tests verify.
