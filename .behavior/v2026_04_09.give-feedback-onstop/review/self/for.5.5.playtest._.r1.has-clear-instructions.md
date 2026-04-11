# self-review: has-clear-instructions

## question

can the foreman follow without prior context? are commands copy-pasteable? are expected outcomes explicit?

## findings

### issues found and fixed

1. **sandbox setup was vague**
   - before: "use `.temp/` directory with a fresh consumer repo"
   - after: full bash block with exact commands to create sandbox, behaviors, and test artifacts

2. **variable placeholders were unexplained**
   - before: `$behavior`, `$empty_behavior`, `$feedback_given_path`
   - after: `$BEHAVIOR`, `$EMPTY_BEHAVIOR` defined in sandbox setup; step 4 shows exact variable derivation

3. **step 10 lacked setup commands**
   - before: "bind branch to behavior A" without how
   - after: full bash block that creates BEHAVIOR_B with explicit commands

4. **step 9 had inconsistent variable casing**
   - before: `$behavior` (lowercase)
   - after: `$BEHAVIOR` (uppercase, matching sandbox setup)

5. **step 7 was vague about modification**
   - before: "modify the `[given]` feedback file content" with numbered steps
   - after: full bash block with explicit echo command and both verification commands

6. **step 8 mentioned hook.onStop without the command**
   - before: single action command, expected mentioned hook.onStop
   - after: bash block with both status and hook.onStop commands

7. **step 10 had confusing comment about implicit bind**
   - before: "already done in sandbox setup implicitly by working with it"
   - after: explicit `rhx bind.behavior set` command

8. **expected outputs mismatched test assertions**
   - before: step 2 expected "output shows '🦫 roight,' format"
   - after: step 2 expected `output contains "feedback status"` and `output contains "unresponded"` (matches `toContain()` assertions in tests)
   - before: step 3 expected "stderr shows '🦫 hold up...' format"
   - after: step 3 expected `output contains "bummer"` (matches actual test assertion)

9. **step 4 used wrong argument names**
   - before: `--to "$FEEDBACK_GIVEN" --at "$FEEDBACK_TAKEN" --behavior "$BEHAVIOR"`
   - after: `--from "$FEEDBACK_GIVEN" --into "$FEEDBACK_TAKEN" --response "acknowledged. will fix."`
   - the skill uses `--from`, `--into`, `--response` not `--to`, `--at`
   - also added `--response` which is required by the skill

10. **wrong feedback filename format in steps 1 and 4**
    - before: `for.5.1.execution.v1.i1.[feedback].v1.[given].by_human.md`
    - after: `5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md`
    - the `for.` prefix does not exist in implementation
    - the `.md` extension belongs after artifact name, before `.[feedback]`
    - verified against `computeBehaviorFeedbackName.ts` and acceptance tests

11. **step 8 expected was vague**
    - before: "first command shows empty state"
    - after: `output contains "no feedback files found"` and `output contains "righteous"`
    - now matches exact test assertions from case1

### verified as clear

- expected outcomes explicit for all 10 steps
- citations trace to acceptance test cases
- pass/fail criteria unambiguous

## conclusion

instructions are now copy-pasteable. foreman can follow without prior context.
