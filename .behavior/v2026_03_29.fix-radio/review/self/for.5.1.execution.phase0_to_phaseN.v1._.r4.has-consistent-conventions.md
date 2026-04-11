# self-review: has-consistent-conventions (r4)

deeper reflection on name conventions.

---

## why getAuthFromKeyrack is correctly named

the name follows two patterns:

1. **verb prefix**: `get*` is used for retrieval operations in this codebase
   - getGithubTokenByAuthArg
   - getBranchBehaviorBind
   - getRadioPath
   - getLatestFeedbackVersion

2. **source suffix**: `From[Source]` indicates where data comes from
   - extractTaskFromGhIssues
   - extractTaskFromOsFileops

combined: `getAuthFromKeyrack` = get auth data from keyrack

**alternative considered**: `getKeyrackAuth` — but this loses the `From` pattern that indicates source.

**verdict**: name is optimal

---

## why via-keyrack matches extant auth modes

extant auth mode patterns:
- `as-robot:shx(command)` — shell execution
- `as-robot:env(VAR)` — environment variable
- `as-human` — gh cli session

the pattern is `as-[role]:[method]([param]?)`:
- role = robot or human
- method = how to get the token
- param = optional parameter for the method

new mode `as-robot:via-keyrack(owner)` follows this exactly:
- role = robot
- method = via-keyrack (get from keyrack)
- param = owner (which keyrack owner to use)

**verdict**: pattern is consistent

---

## why the name uses "via" not another preposition

"via" indicates transit or intermediary:
- "token via keyrack" = token obtained through keyrack as intermediary
- "token from keyrack" = token stored in keyrack

keyrack is an intermediary (it translates github app json to ephemeral token), so "via" is semantically accurate.

**verdict**: preposition choice is intentional and correct

---

## additional check: test file names

the test file follows convention:
- `getAuthFromKeyrack.test.ts` — unit test collocated with source
- matches extant pattern: `*.test.ts` for unit tests

**verdict**: consistent

---

## conclusion

all names follow extant conventions:
- function name uses `get*` prefix and `From[Source]` suffix
- auth mode uses `as-[role]:[method]([param])` pattern
- preposition "via" semantically accurate for intermediary
- test file follows `*.test.ts` convention

no divergence detected.
