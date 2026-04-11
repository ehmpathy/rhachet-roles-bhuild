# self-review: has-pruned-backcompat

## review question

for each backwards-compat concern in the code, ask:
- did the wisher explicitly say to maintain this compatibility?
- is there evidence this backwards compat is needed?
- or did we assume it "to be safe"?

## findings

### backwards compat concerns found

| concern | location | requested? | evidence |
|---------|----------|------------|----------|
| give.feedback.sh alias | `src/domain.roles/behaver/skills/give.feedback.sh` | YES | vision: "backwards compat alias: yes — give.feedback.sh symlinks to feedback.give.sh" |

### details: give.feedback.sh

**what it does**: dispatches to the same CLI export (`m.cli.giveFeedback()`) as `feedback.give.sh`

**requested by**:
- vision (1.vision.yield.md line 240): "backwards compat alias | [answered] | yes — give.feedback.sh symlinks to feedback.give.sh"
- criteria (2.1.criteria.blackbox.yield.md usecase.6): explicit test case for backwards compat

**implementation**: executable (not symlink) that delegates to the CLI export — functionally equivalent to symlink, more portable

### search for other backcompat concerns

searched for:
- deprecated flags that weren't requested
- old file paths preserved unnecessarily
- version-specific handling

**result**: no additional backcompat concerns found. the only backcompat mechanism is the explicitly-requested `give.feedback.sh` alias.

## verdict

**no unwarranted backwards compat found.** the only backcompat concern (the `give.feedback.sh` alias) was explicitly requested in the vision and codified in criteria usecase.6.
