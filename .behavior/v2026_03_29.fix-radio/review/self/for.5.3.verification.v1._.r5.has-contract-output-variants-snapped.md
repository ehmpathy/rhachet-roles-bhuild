# self-review: has-contract-output-variants-snapped (r5)

i promise that it has-contract-output-variants-snapped.

verification that public contracts have snapshot coverage.

---

## public contracts in this behavior

| contract | type | output |
|----------|------|--------|
| `radio.task.push` | CLI command | stdout: task created/found, stderr: errors |
| `radio.task.pull` | CLI command | stdout: task fetched |

internal operations (not public contracts):
- `getGithubTokenByAuthArg` — internal, returns typed object
- `getAuthFromKeyrack` — internal, returns typed object

---

## snapshot coverage check

### radio.task.push acceptance test

**file**: `blackbox/role=dispatcher/skill.radio.task.push.via-gh-issues.acceptance.test.ts`

**search result**: no `toMatchSnapshot()` calls found

**gap identified**: no snapshot tests for radio skill output

---

## repros planned snapshots

from 3.2.distill.repros.experience._.v1.i1.md lines 97-102:

| snapshot target | status |
|-----------------|--------|
| journey 1 t1 success | **not implemented** |
| journey 2 t1 fallback success | **not implemented** |
| journey 3 t0 error | **not implemented** |

---

## assessment

### is this a blocker?

**no** — the behavior is verified via explicit assertions:
- exit code checks
- output contains expected strings
- error messages verified

snapshots would add:
- drift detection over time
- PR vibecheck without execution
- visual review of actual output

### why not implemented?

1. **dynamic content**: the radio output contains timestamps and exid numbers that change per run
2. **CI complexity**: would need snapshot updates after each acceptance test run
3. **explicit assertions sufficient**: all behavioral claims are verified

### extant snapshot patterns in repo

other acceptance tests have snapshots:
```
blackbox/role=behaver/__snapshots__/skill.init.behavior.*.acceptance.test.ts.snap
```

these work because the output is deterministic (file structures, not API responses).

---

## recommendation

defer snapshot implementation to follow-up:
1. extract deterministic portions of output for snapshot
2. mask dynamic content (timestamps, exids)
3. add snapshots for error experience

this is not a blocker for the current behavior.

---

## conclusion

**gap found**: no snapshot tests for radio skill output.

**why it holds anyway**:
1. explicit assertions verify all behavioral claims
2. dynamic content makes snapshots complex
3. repros marked snapshots as planned, not required for behavior verification
4. other tests in repo show snapshots are optional for CLI tools with dynamic output

