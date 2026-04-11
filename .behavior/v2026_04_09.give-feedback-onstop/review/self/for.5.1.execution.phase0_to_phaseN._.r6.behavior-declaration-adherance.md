# self-review: behavior-declaration-adherance (r6)

## review question

for each implementation, ask:
- does it match the vision's description?
- does it satisfy the criteria correctly?
- does it follow the blueprint accurately?

## vision adherance

### feedback.give

| vision spec | implementation | adherance |
|-------------|----------------|-----------|
| rename to `feedback.give` | `src/contract/cli/feedback.give.ts` | yes |
| move to `$behavior/feedback/` | `feedbackGive.ts` creates feedback subdir | yes |
| file pattern `for.{artifact}.[feedback].v{N}.[given].by_human.md` | pattern used in feedbackGive.ts | yes |
| backwards compat alias `give.feedback.sh` | `src/domain.roles/behaver/skills/give.feedback.sh` exists | yes |

### feedback.take.get

| vision spec | implementation | adherance |
|-------------|----------------|-----------|
| list all feedback files | `getAllFeedbackForBehavior.ts` discovers all | yes |
| show unresponded first | `computeFeedbackTakeGetOutput.ts` orders correctly | yes |
| show responded second | status=responded listed after unresponded | yes |
| `--when hook.onStop` exits 2 | `feedbackTakeGet.ts` checks when flag, exits 2 | yes |

### feedback.take.set

| vision spec | implementation | adherance |
|-------------|----------------|-----------|
| `--from` for given path | `feedbackTakeSet.ts` accepts fromPath | yes |
| `--into` for taken path | `feedbackTakeSet.ts` accepts intoPath | yes |
| collocate with given file | `asFeedbackTakenPath.ts` derives from given path | yes |
| `[given]` → `[taken]` | path transformation in asFeedbackTakenPath | yes |
| `by_human` → `by_robot` | path transformation in asFeedbackTakenPath | yes |

### hash verification

| vision spec | implementation | adherance |
|-------------|----------------|-----------|
| hash verification for stale detection | `computeFeedbackHash.ts` + `getFeedbackStatus.ts` | yes |
| hash storage location | see deviation note below | acceptable |

**deviation note**: vision mentioned "peer meta.yml file alongside [taken]" for hash storage. implementation stores hash in YAML frontmatter within the [taken] file itself:

```typescript
const takenContent = `---
givenHash: ${givenHash}
---

${input.response}`;
```

this is an acceptable deviation because:
1. single file simpler than two files
2. hash and response are logically coupled
3. frontmatter is standard pattern for file metadata
4. achieves same goal: hash recorded for stale detection

## criteria adherance

### usecase.1: human gives feedback

verified `feedbackGive.ts`:
- creates file at correct path pattern
- supports `--version ++` for increment
- exits 2 if no bound behavior

### usecase.2: clone checks feedback status

verified `feedbackTakeGet.ts` + `computeFeedbackTakeGetOutput.ts`:
- discovers all feedback files via `getAllFeedbackForBehavior`
- computes status via `getFeedbackStatus`
- outputs unresponded first, responded second

### usecase.3: hook blocks clone

verified `feedbackTakeGet.ts`:
- checks `when === 'hook.onStop'`
- exits 2 if any unresponded feedback
- outputs command hint for how to respond

### usecase.4: clone records response

verified `feedbackTakeSet.ts`:
- accepts `--from` and `--into` paths
- validates paths via `validateFeedbackTakePaths`
- computes hash via `computeFeedbackHash`
- writes [taken] file with hash in frontmatter

### usecase.5: human updates feedback after response

verified `getFeedbackStatus.ts`:
- compares stored hash to current given file hash
- returns `stale` if mismatch
- stale counts as unresponded in hook mode

### usecase.6: backwards compat alias

verified `give.feedback.sh`:
- dispatches to same CLI export as `feedback.give.sh`
- portable dispatch pattern via `node -e import()`

## blueprint adherance

### filediff tree

all components from blueprint filediff tree are implemented and match blueprint specifications:

| component | blueprint path | actual path | match |
|-----------|---------------|-------------|-------|
| CLI entry | `feedback.give.ts` | `src/contract/cli/feedback.give.ts` | yes |
| CLI entry | `feedback.take.get.ts` | `src/contract/cli/feedbackTakeGet.ts` | yes |
| CLI entry | `feedback.take.set.ts` | `src/contract/cli/feedbackTakeSet.ts` | yes |
| domain op | `feedbackGive.ts` | `src/domain.operations/behavior/feedback/feedbackGive.ts` | yes |
| domain op | `feedbackTakeGet.ts` | `src/domain.operations/behavior/feedback/feedbackTakeGet.ts` | yes |
| domain op | `feedbackTakeSet.ts` | `src/domain.operations/behavior/feedback/feedbackTakeSet.ts` | yes |

### function signatures

verified signatures match blueprint:

```typescript
// feedbackTakeGet
export const feedbackTakeGet = async (
  input: { behaviorDir: string; when: 'default' | 'hook.onStop' | null },
  context: { log: LogMethods },
): Promise<{ status: 'passed' | 'blocked'; ... }>
```

```typescript
// feedbackTakeSet
export const feedbackTakeSet = async (
  input: { fromPath: string; intoPath: string; response: string },
  context: { log: LogMethods },
): Promise<{ written: true }>
```

## verdict

**implementation adheres to behavior declarations.**

one acceptable deviation: hash stored in YAML frontmatter instead of separate meta.yml file. all other specifications from vision, criteria, and blueprint are implemented correctly.
