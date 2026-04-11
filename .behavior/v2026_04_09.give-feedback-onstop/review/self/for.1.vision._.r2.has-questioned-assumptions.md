# self-review: has-questioned-assumptions (round 2)

fresh review after the requirements pass.

## new assumptions surfaced

### 9. feedback.take.get scans only bound behavior

| question | answer |
|----------|--------|
| evidence? | none — I assumed bound behavior scope |
| what if opposite? | could scan all .behavior/ dirs, or user-specified path |
| wisher said? | no mention of scope |
| counterexamples? | user might want to see feedback across all behaviors |

**verdict**: **issue found** — scope is unspecified. added to open questions.

### 10. the `[taken]` file content is the response

| question | answer |
|----------|--------|
| evidence? | template shows response checklist format |
| what if opposite? | could be just metadata (hash, timestamp) |
| wisher said? | "write the feedback response file" (line 33) |
| counterexamples? | none — response file implies content |

**verdict**: holds. the `[taken]` file contains the clone's response, not just metadata.

### 11. one feedback file per artifact per version

| question | answer |
|----------|--------|
| evidence? | template name: `{artifact}.[feedback].v{N}.[given].by_human.md` |
| what if opposite? | multiple feedback files per artifact version? |
| wisher said? | implied by version system (v1, v2, etc.) |
| counterexamples? | none — version increments handle multiple rounds |

**verdict**: holds. version system handles multiple feedback rounds.

### 12. clone must respond to ALL feedback before stop passes

| question | answer |
|----------|--------|
| evidence? | wisher said "if there are any unresponded to feedback files" (line 19) |
| what if opposite? | could require just latest version, or threshold |
| wisher said? | "any unresponded" — all must be addressed |
| counterexamples? | none |

**verdict**: holds. all unresponded feedback blocks stop.

## issues from round 1 still valid

- **hash storage location** — still unspecified, still in open questions

## issues found this round

### issue 1: behavior scope unspecified

added to open questions: should feedback.take.get scan bound behavior only, or all .behavior/ dirs?

**fix:** already flagged in vision open questions. no code change needed yet.

## conclusion

round 2 surfaced one additional gap (behavior scope). combined with round 1, we have two open questions for wisher:
1. hash storage location
2. behavior scope for feedback.take.get

both are captured in vision. all other assumptions hold.
