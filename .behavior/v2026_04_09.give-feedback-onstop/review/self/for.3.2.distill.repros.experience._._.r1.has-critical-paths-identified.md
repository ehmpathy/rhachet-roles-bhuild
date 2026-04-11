# self-review: has-critical-paths-identified

## critical paths verified

### path.1 = human gives feedback

| criterion | holds? | notes |
|-----------|--------|-------|
| happy path marked critical | yes | entry point for all feedback |
| why frictionless | yes | single `--against` arg, no extra config |
| failure mode | yes | exit 2 if no bound behavior |

pit of success:
- **narrower inputs**: `--against` required, artifact name constrained
- **convenient**: single arg, infers version from extant
- **expressive**: `--version ++` for follow-up feedback
- **failsafes**: exit 2 with hint if no bound behavior
- **failfasts**: validates behavior exists before create
- **idempotency**: creates new version if file extant

### path.2 = clone blocked on stop

| criterion | holds? | notes |
|-----------|--------|-------|
| happy path marked critical | yes | the core guarantee |
| why frictionless | yes | automatic via hook, shows exact command |
| failure mode | yes | exit 2 blocks clone |

pit of success:
- **narrower inputs**: `--when hook.onStop` is the mode
- **convenient**: automatic via hook config
- **expressive**: N/A — binary pass/block
- **failsafes**: blocks instead of silent pass
- **failfasts**: exit 2 immediately with command
- **idempotency**: can rerun, same result until responded

### path.3 = clone records response

| criterion | holds? | notes |
|-----------|--------|-------|
| happy path marked critical | yes | completes the feedback loop |
| why frictionless | yes | hook shows exact command to copy-paste |
| failure mode | yes | exit 2 with specific error |

pit of success:
- **narrower inputs**: `--from` and `--into` are explicit paths
- **convenient**: hook output shows exact command
- **expressive**: explicit paths allow any feedback file
- **failsafes**: hash stored for future verification
- **failfasts**: exit 2 if `--into` not exist, `--from` not exist, or path mismatch
- **idempotency**: re-run updates hash, safe to retry

### path.4 = hash invalidation

| criterion | holds? | notes |
|-----------|--------|-------|
| happy path marked critical | yes | feedback updates re-addressed |
| why frictionless | yes | automatic via hash comparison |
| failure mode | yes | feedback shows unresponded |

pit of success:
- **narrower inputs**: automatic via hash check — no user input
- **convenient**: automatic — no extra command
- **expressive**: N/A
- **failsafes**: feedback shows as unresponded
- **failfasts**: N/A — detection is automatic
- **idempotency**: re-respond with updated hash works

## issues found

none. all critical paths have pit of success verified.

## conclusion

all four critical paths are:
1. marked as critical with clear rationale
2. verified for pit of success on all six criteria
3. frictionless for the primary flows
