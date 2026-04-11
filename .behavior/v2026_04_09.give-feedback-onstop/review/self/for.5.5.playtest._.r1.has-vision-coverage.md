# self-review: has-vision-coverage

## question

is every behavior in 0.wish.md verified? is every behavior in 1.vision.md verified? are any requirements left untested?

## findings

### wish coverage (0.wish.md)

| wish requirement | playtest step | verified |
|------------------|---------------|----------|
| `rhx feedback.give` | step 1 | yes |
| `rhx feedback.take.get` (list status) | steps 2, 5 | yes |
| `rhx feedback.take.get --when hook.onStop` (block) | step 3 | yes |
| `rhx feedback.take.get --when hook.onStop` (pass) | step 6 | yes |
| `rhx feedback.take.set` | step 4 | yes |
| hash verification for stale feedback | step 7 | yes |
| feedback in `$behavior/feedback/` | all steps | yes |
| `[given]`/`[taken]` filename pattern | steps 1, 4 | yes |

all "main skills to exercise" from wish are covered.

### vision coverage (1.vision.yield.md)

| vision goal | playtest step | verified |
|-------------|---------------|----------|
| clones never forget feedback (hook blocks) | step 3 | yes |
| clones not interrupted mid-work | step 3 fires only on stop | yes |
| feedback has paper trail ([given] + [taken]) | steps 1, 4, 5 | yes |
| updated feedback re-triggers (hash) | step 7 | yes |

all four evaluation goals from vision are covered.

### vision features

| feature | playtest step | verified |
|---------|---------------|----------|
| feedback.give creates file | step 1 | yes |
| feedback.take.get shows unresponded | step 2 | yes |
| feedback.take.get shows responded | step 5 | yes |
| feedback.take.set records with hash | step 4 | yes |
| --version flag | step 9 | yes |
| --force flag | step 10 | yes |
| empty behavior case | step 8 | yes |
| --open flag | not covered | deferred |
| --template flag | not covered | deferred |

### deferred features

the `--open` and `--template` flags are:
- documented in vision's "contract inputs & outputs"
- implemented in feedback.give.sh
- tested in acceptance tests (case7 for --template)
- NOT in playtest

**rationale**: these are UI convenience flags for humans, not core behaviors. the playtest verifies the happy paths and critical behaviors that clones depend on. acceptance tests cover the edge cases and optional flags.

### verified as complete

the playtest covers:
- all 4 main skills from wish
- all 4 evaluation goals from vision
- the core day-in-the-life workflow from vision:
  1. human gives feedback → step 1
  2. clone checks status → step 2
  3. hook blocks if unresponded → step 3
  4. clone records response → step 4
  5. hook passes after response → step 6
  6. stale hash re-triggers → step 7

## conclusion

all requirements from wish and vision are covered. deferred features (--open, --template) are covered by acceptance tests, not playtest — appropriate for optional UI convenience flags.
