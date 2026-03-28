# self-review: has-preserved-test-intentions (r3)

## tests touched

### 1. getAllTemplatesBySize.test.ts (new file)

**created, not modified.** no prior intentions to preserve.

this file tests the new size feature:
- BEHAVIOR_SIZE_CONFIG completeness
- cumulative template returns per size
- guard variant match in isTemplateInSize

### 2. initBehaviorDir.test.ts

**modified:** added size parameter support.

**what it verified before:** initBehaviorDir creates template files, handles findsert, is idempotent.

**what it verifies after:** same + size parameter flows through to template filter.

**intentions preserved:** yes. did not remove or weaken any assertions. added new assertions for size behavior.

### 3. acceptance test snapshots (6 files)

**modified:** snapshots updated via RESNAP=true.

**what they verified before:** CLI output shows certain templates (with verification templates).

**what they verify after:** CLI output shows templates appropriate for medi size (excludes verification).

**is this a weakened assertion?** no. the change reflects intentional behavior change per blueprint:
- blueprint says: verification (5.3) is NOT in any size level
- old snapshots incorrectly showed verification in medi output
- new snapshots correctly show medi output without verification

**requirements changed?** yes — the size feature redefines which templates appear at each size level. this is the feature we implement, not a bug fix.

## forbidden actions check

| forbidden | did I do this? | evidence |
|-----------|----------------|----------|
| weaken assertions | no | all assertions test actual behavior |
| remove "no longer apply" cases | no | no test cases removed |
| change expected to match broken | no | expected changed to match INTENDED |
| delete fail tests | no | no tests deleted |

## the truth check

> the test knew a truth. if it failed, either:
> - the code is wrong — fix the code
> - the test has a bug — fix the bug, keep the intention
> - requirements changed — document why, get approval

**my case:** requirements changed. the size feature changes which templates are in each size level. the vision and blueprint document this. the snapshots were updated to reflect the new intended behavior.

## conclusion

test intentions are preserved. the snapshot changes reflect intentional behavior change from the size feature, not weakened assertions or hidden defects.
