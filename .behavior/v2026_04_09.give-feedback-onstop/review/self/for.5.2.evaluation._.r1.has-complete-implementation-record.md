# self-review: has-complete-implementation-record

## issue: BLOCKER

the evaluation yield incorrectly marks several files as `[+] new` when they already existed on `origin/main`.

### files incorrectly marked as new

these files existed on main and should NOT be marked `[+]`:

| file | correct marker | reason |
|------|----------------|--------|
| computeBehaviorFeedbackName.ts | (omit or unchanged) | existed on main |
| computeBehaviorFeedbackName.test.ts | (omit or unchanged) | existed on main |
| getBehaviorDirForFeedback.ts | (omit or unchanged) | existed on main |
| getBehaviorDirForFeedback.test.ts | (omit or unchanged) | existed on main |
| getLatestArtifactByName.ts | (omit or unchanged) | existed on main |
| getLatestArtifactByName.test.ts | (omit or unchanged) | existed on main |
| initFeedbackTemplate.ts | (omit or unchanged) | existed on main |
| initFeedbackTemplate.test.ts | (omit or unchanged) | existed on main |

### files correctly marked

| file | marker | reason |
|------|--------|--------|
| feedback.give.ts | [+] | new CLI entry |
| feedback.take.get.ts | [+] | new CLI entry |
| feedback.take.set.ts | [+] | new CLI entry |
| feedbackGive.ts | [+] | new (rename of giveFeedback.ts) |
| feedbackTakeGet.ts | [+] | new orchestrator |
| feedbackTakeSet.ts | [+] | new orchestrator |
| getAllFeedbackForBehavior.ts | [+] | new transformer |
| getFeedbackStatus.ts | [+] | new transformer |
| computeFeedbackHash.ts | [+] | new transformer |
| asFeedbackTakenPath.ts | [+] | new transformer |
| validateFeedbackTakePaths.ts | [+] | new transformer |
| asFeedbackVersionFromFilename.ts | [+] | new transformer |
| getAllFeedbackVersionsForArtifact.ts | [+] | new transformer |
| getLatestFeedbackVersion.ts | [~] | modified (was on main) |
| give.feedback.ts | [-] | deleted |
| giveFeedback.ts | [-] | deleted |

### root cause

the evaluation yield was created from the compaction summary which assumed all files in the feature were new. did not verify against `git ls-tree origin/main` to distinguish new vs extant files.

### fix

update the filediff tree to remove incorrectly marked [+] files that already existed on main. these files are support infrastructure that was already in place.

---

## fix applied

### how it was fixed

1. ran `git ls-tree --name-only origin/main src/domain.operations/behavior/feedback/` to verify which files existed on main
2. updated filediff tree in 5.2.evaluation.yield.md:
   - removed incorrect [+] markers from extant files
   - added comment noting which files were reused from main
   - corrected [~] marker on skill.give.feedback.acceptance.test.ts (was marked [+])
3. updated codepath tree:
   - marked extant dependencies with [←] (extant) notation
   - added note section for reused files
4. updated test coverage section:
   - added (new files only) qualifier
   - marked test files with [+] or [~] appropriately
   - added note about extant test files
5. updated divergence section:
   - corrected transformer count from "11 transformers" to "9 new transformers"

### lesson learned

always verify filediff tree against `git ls-tree origin/main` before claiming files are new. compaction summaries may contain stale assumptions about what files exist.

---

## verdict

**blocker found and fixed**: filediff tree now accurately reflects what was changed vs main.
