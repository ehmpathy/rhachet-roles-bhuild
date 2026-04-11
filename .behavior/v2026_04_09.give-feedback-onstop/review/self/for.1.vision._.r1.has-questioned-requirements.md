# self-review: has-questioned-requirements

## requirements examined

### 1. rename `give.feedback` → `feedback.give`

| question | answer |
|----------|--------|
| who said? | wisher, in 0.wish.md line 5 |
| why? | namespace symmetry with `feedback.take.*` |
| what if we didnt? | inconsistent name: `give.feedback` vs `feedback.take.get` |
| simpler way? | no — rename is minimal change |

**verdict**: holds. name symmetry improves discoverability.

### 2. add `feedback.take.get` skill

| question | answer |
|----------|--------|
| who said? | wisher, in 0.wish.md line 9 |
| why? | clones need to see unresponded feedback and response status |
| what if we didnt? | clones would manually glob for `[given]` files |
| simpler way? | could merge with another skill, but dedicated skill is clearer |

**verdict**: holds. explicit skill to list feedback is cleaner than manual discovery.

### 3. `--when hook.onStop` mode exits 2

| question | answer |
|----------|--------|
| who said? | wisher, in 0.wish.md line 19 |
| why? | block clones from stop without address of feedback |
| what if we didnt? | feedback could be ignored; defeats the purpose |
| simpler way? | could always block (no `--when`), but that interrupts mid-work |

**verdict**: holds. hook-mode vs normal-mode distinction is essential to the non-interruptive design.

### 4. add `feedback.take.set` skill

| question | answer |
|----------|--------|
| who said? | wisher, in 0.wish.md line 25 |
| why? | record that feedback was responded to, with hash verification |
| what if we didnt? | no way to mark feedback as addressed |
| simpler way? | auto-detect `[taken]` files? but then no hash verification |

**verdict**: holds. explicit `set` command enables hash verification at response time.

### 5. hash verification for updated feedback

| question | answer |
|----------|--------|
| who said? | wisher, in 0.wish.md line 29 |
| why? | if human updates feedback, clone must re-respond |
| what if we didnt? | updated feedback could be ignored |
| simpler way? | just check file mtime? but mtime can be touched without content change |

**verdict**: holds. content-based hash is more reliable than mtime.

### 6. two-file pattern ([given] + [taken])

| question | answer |
|----------|--------|
| who said? | wisher, in 0.wish.md line 27 ("collocated") |
| why? | explicit audit trail, visible in file tree |
| what if we didnt? | could use manifest file instead |
| simpler way? | manifest is more compact but less visible |

**verdict**: holds. wisher explicitly wanted collocation. two files = explicit audit trail.

### 7. exit code 2 for constraint

| question | answer |
|----------|--------|
| who said? | wisher, in 0.wish.md line 19 |
| why? | exit 2 = ConstraintError semantics (user must fix) |
| what if we didnt? | exit 1 would suggest malfunction, not user action needed |
| simpler way? | already minimal |

**verdict**: holds. matches `rule.require.exit-code-semantics` brief.

## issues found

none. all requirements trace directly to the wish and serve the stated goals.

## open questions (not issues)

these are clarifications needed from wisher, not requirement problems:

1. hash algorithm (sha256?) — implementation detail, not requirement issue
2. hash storage location — implementation detail
3. behavior scope (bound only or all?) — clarification needed
4. hook auto-registration — clarification needed
5. backwards compat alias — clarification needed

## conclusion

all requirements hold. they form a coherent system:
- `feedback.give` creates `[given]` file
- `feedback.take.get` lists status (normal) or blocks (hook mode)
- `feedback.take.set` records response with hash
- hash verification ensures updated feedback triggers re-response
- exit 2 signals constraint that user must address
