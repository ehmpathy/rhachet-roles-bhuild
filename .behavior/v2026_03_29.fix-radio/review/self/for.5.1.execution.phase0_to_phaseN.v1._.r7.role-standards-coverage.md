# self-review: role-standards-coverage (r7)

review for standards that should be present but may be absent.

---

## briefs directories checked

relevant practices for this code:
- practices/code.prod/evolvable.procedures
- practices/code.prod/evolvable.architecture
- practices/code.prod/pitofsuccess.errors
- practices/code.prod/pitofsuccess.procedures
- practices/code.prod/readable.comments
- practices/code.test/frames.behavior
- practices/code.test/scope.unit

---

## required patterns checklist

### getAuthFromKeyrack.ts

| required pattern | present? | evidence |
|------------------|----------|----------|
| arrow function | ✓ | line 10 |
| typed input | ✓ | lines 10-14 |
| typed output | ✓ | line 14 |
| .what/.why header | ✓ | lines 3-8 |
| fail-fast on error | ✓ | lines 23, 26-30 |
| no else branches | ✓ | all early returns |
| unit test file | ✓ | getAuthFromKeyrack.test.ts |
| all status branches tested | ✓ | granted, absent, locked, blocked |

**coverage complete**.

### getGithubTokenByAuthArg.ts

| required pattern | present? | evidence |
|------------------|----------|----------|
| arrow function | ✓ | line 25 |
| (input, context) pattern | ✓ | lines 25-30 |
| typed input | ✓ | line 26 |
| typed context | ✓ | lines 27-30 |
| typed output | ✓ | lines 31-33 |
| .what/.why header | ✓ | lines 5-24 |
| fail-fast on error | ✓ | multiple throw points |
| no else branches | ✓ | all early returns |
| unit test file | ✓ | getGithubTokenByAuthArg.test.ts |
| all auth modes tested | ✓ | env, shx, via-keyrack, as-human |
| error cases tested | ✓ | absent var, empty output, test env |

**coverage complete**.

### dispatcher role keyrack.yml

| required pattern | present? | evidence |
|------------------|----------|----------|
| key declaration | ✓ | EHMPATH_BEAVER_GITHUB_TOKEN |
| env specification | ✓ | env.prep |
| mechanism declaration | ✓ | ephemeral |

**coverage complete**.

### acceptance test

| required pattern | present? | evidence |
|------------------|----------|----------|
| blackbox via skill invocation | ✓ | runRhachetSkill |
| given/when/then structure | ✓ | imports from test-fns |
| default auth path tested | ✓ | case1 |
| explicit auth paths tested | ✓ | cases 2, 3, 4 |
| error experience tested | ✓ | case1 t1 |

**coverage complete**.

---

## standards that could be absent

### integration tests for keyrack

**question**: should there be integration tests that call real keyrack?

**analysis**: the acceptance test calls the real skill which uses keyrack. this is the integration path. a separate integration test for getAuthFromKeyrack would duplicate this and require keyrack credentials in unit test scope.

**verdict**: covered via acceptance test — no additional integration test needed.

### error message documentation

**question**: are error messages documented in .throws?

**analysis**: getGithubTokenByAuthArg has `.throws` section (lines 19-23) that documents all error conditions. getAuthFromKeyrack has `.throws` (lines 7-8).

**verdict**: covered ✓

### snapshot tests for error messages

**question**: should error messages be snapshotted?

**analysis**: rule.require.snapshots says "use snapshots for output artifacts". error messages are not output artifacts (they're thrown, not returned). the error text is tested via .toThrow matchers.

**verdict**: not applicable — errors are tested via matchers.

---

## absent patterns identified

none found. all applicable mechanic standards are applied:
- all functions have proper signatures
- all functions have JSDoc headers
- all functions have tests
- all error conditions are covered
- all auth modes are tested
- acceptance test covers the blackbox path

---

## conclusion

all mechanic role standards that should be present are present:
- unit tests for both new operations ✓
- acceptance test for blackbox path ✓
- error cases covered in tests ✓
- all branches covered ✓
- proper types and comments ✓

**no absent standards detected**.

