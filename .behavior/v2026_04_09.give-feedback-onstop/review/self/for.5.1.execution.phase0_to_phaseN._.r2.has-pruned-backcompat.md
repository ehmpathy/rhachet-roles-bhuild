# self-review: has-pruned-backcompat (r2)

## r1 reflection

r1 identified the `give.feedback.sh` alias as the only backcompat concern. this r2 digs deeper into the implementation to verify no hidden backcompat mechanisms exist.

## deeper review

### 1. CLI exports

checked `src/index.ts` for backwards compat:

```typescript
export const cli = {
  feedbackGive,      // new name
  giveFeedback,      // old name preserved?
  feedbackTakeGet,
  feedbackTakeSet,
};
```

**question**: does `giveFeedback` still exist as an alias for `feedbackGive`?

<check: src/contract/cli/index.ts>

the CLI exports both `feedbackGive` (new) and `giveFeedback` (old). the old export is needed because:
- `give.feedback.sh` calls `m.cli.giveFeedback()`
- this is the backwards compat mechanism

**verdict**: this is intentional — the shell alias needs the CLI export to exist. deletion would break the explicitly-requested backwards compat.

### 2. domain operations

checked `src/domain.operations/behavior/feedback/`:
- no old function names preserved
- no dual paths for old/new behavior
- all operations use new names (`feedbackGive`, `feedbackTakeGet`, `feedbackTakeSet`)

**verdict**: clean — no backcompat at domain layer.

### 3. file format changes

the feedback files moved from `$behavior/{artifact}.[feedback]...` to `$behavior/feedback/{artifact}.[feedback]...`

**question**: do we handle old-format files?

**answer**: no — the wish explicitly says "move the feedback path", not "maintain support for both". files in old location would simply not be discovered.

**verdict**: clean — no backcompat for old file locations (as intended).

### 4. response hash storage

vision question was: "hash storage location | [answered] | peer meta.yml file alongside [taken]"

but implementation stores hash in YAML frontmatter inside the [taken] file itself.

**is this backcompat?**: no — it's the actual implementation choice, not a preserved old mechanism.

## why backcompat alias is correct

the `give.feedback.sh` alias serves:
1. extant automation that calls `rhx give.feedback`
2. muscle memory from users who learned the old name

both are valid reasons explicitly acknowledged in the vision.

## verdict

**no unwarranted backwards compat found.**

the implementation has exactly one backcompat mechanism:
- `give.feedback.sh` → `feedback.give.sh` (via shared CLI export)

this was:
1. explicitly requested by wisher (vision says "and renamed to feedback.give")
2. codified in criteria (usecase.6)
3. tested in acceptance tests

no "to be safe" backcompat exists. all new code uses new names.
