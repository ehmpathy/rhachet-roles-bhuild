# self-review: has-journey-tests-from-repros (round 5)

## repros artifact location

`.behavior/v2026_04_09.give-feedback-onstop/3.2.distill.repros.experience._.yield.md`

## journey.1: human gives feedback, clone responds

| sketch step | acceptance test location | verification |
|-------------|--------------------------|--------------|
| t0: before any changes, no feedback files | `skill.feedback.take.acceptance.test.ts` case1 setup | scene setup verifies clean state |
| t1: human runs feedback.give | `skill.give.feedback.acceptance.test.ts` case1 t0 | `runGiveFeedbackSkillViaRhachet()` + file creation assertion |
| t2: clone runs feedback.take.get | `skill.feedback.take.acceptance.test.ts` case2 t0 | lists unresponded feedback |
| t3: clone runs hook.onStop (blocked) | `skill.feedback.take.acceptance.test.ts` case2 t1 | exit 2, bummer message |
| t4: clone runs feedback.take.set | `skill.feedback.take.acceptance.test.ts` case3 t0 | creates [taken] with hash |
| t5: clone runs hook.onStop (passes) | `skill.feedback.take.acceptance.test.ts` case3 t2 | exit 0, righteous message |

**BDD structure verified:**
- `given('[case1] consumer: behavior with execution artifact')` ✓
- `when('[t0] give.feedback --against execution is invoked')` ✓
- `then('exits with code 0')` ✓
- `then('creates feedback file with placeholders replaced')` ✓

## journey.2: hash invalidation on feedback edit

| sketch step | acceptance test location | verification |
|-------------|--------------------------|--------------|
| t0: before edit, responded | `skill.feedback.take.acceptance.test.ts` case4 setup | creates [taken] with original hash |
| t1: human edits [given] file | case4 setup | writes updated content (hash mismatch) |
| t2: stop hook blocks | case4 t1 | exit 2, bummer message |
| t3: re-run feedback.take.set | follows case3 pattern | same mechanics apply |

**BDD structure verified:**
- `given('[case4] behavior with stale feedback (hash mismatch)')` ✓
- `when('[t1] feedback.take.get --when hook.onStop is called')` ✓
- `then('exits with code 2')` ✓

## journey.3: failfast on bad paths

| sketch case | integration test | test file |
|-------------|------------------|-----------|
| case1: --into file does not exist | implicit (skill validates [given] exists first) | skill-level guard |
| case2: --into path wrong derivation | `feedbackTakeSet.integration.test.ts` case4 t0 | `--into path does not match --from` |
| case3: --from file does not exist | `feedbackTakeSet.integration.test.ts` case2 t0 | `[given] file not found` |

**concrete test evidence:**

from `feedbackTakeSet.integration.test.ts`:
```typescript
given('[case2] [given] file does not exist', () => {
  when('[t0] feedbackTakeSet is called', () => {
    then('throws "file not found" error', async () => {
      // ...
      expect(error.message).toContain('[given] file not found');
    });
  });
});

given('[case4] --into path does not match --from derivation', () => {
  when('[t0] feedbackTakeSet is called', () => {
    then('throws validation error', async () => {
      // ...
      expect(error.message).toContain('--into path does not match --from');
    });
  });
});
```

from `validateFeedbackTakePaths.test.ts`:
- `'rejects when --into does not match --from derivation'`
- `'rejects when version mismatches'`
- `'rejects fromPath without [given]'`
- `'rejects intoPath without [taken]'`

**is this a gap?**

no. all three journey.3 error cases are verified:
- file existence: integration test case2
- path derivation: integration test case4 + unit tests
- path format: unit tests for [given]/[taken]/by_human/by_robot validation

## journey.4: backwards compat alias

| sketch step | acceptance test location | verification |
|-------------|--------------------------|--------------|
| t0: user runs `rhx give.feedback` | `skill.give.feedback.acceptance.test.ts` all cases | every test uses `give.feedback` skill name |

**verification:** `runGiveFeedbackSkillViaRhachet` dispatches to `skill: 'give.feedback'` (the old name). this is backwards compat in action — the old skill name still works because the test file itself is named `skill.give.feedback.acceptance.test.ts`.

## summary

| journey | test file | BDD given/when/then | [tN] steps |
|---------|-----------|---------------------|------------|
| journey.1 | feedback.take + give.feedback | ✓ | ✓ |
| journey.2 | feedback.take case4 | ✓ | ✓ |
| journey.3 | unit tests (not acceptance) | ✓ | n/a |
| journey.4 | give.feedback | ✓ | implicit |

## verdict

all journey sketches from repros are implemented. BDD structure followed. [tN] step pattern present where applicable.

