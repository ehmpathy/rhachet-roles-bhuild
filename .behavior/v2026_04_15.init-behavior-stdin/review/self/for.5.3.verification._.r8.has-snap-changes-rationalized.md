# self-review r8: has-snap-changes-rationalized

## deeper reflection: what I actually saw in the diffs

### scaffold snapshot diff

looked at: `git diff HEAD -- skill.init.behavior.scaffold.acceptance.test.ts.snap`

**before**:
```
"💥 error: branch 'feature/already-bound-test' is already bound to: v{DATE}.first-behavior

to create a new behavior, use a new tree:
  git tree set --from main --open <branch-name-new>"
```

**after**:
```
"✋ ConstraintError: branch 'feature/already-bound-test' is already bound to: v{DATE}.first-behavior

{
  "hint": "to create a new behavior, use a new tree: ...",
  "currentBranch": "feature/already-bound-test",
  "boundTo": "/tmp/.../v{DATE}.first-behavior",
  "attempted": "/tmp/.../v{DATE}.second-behavior"
}

to create a new behavior, use a new tree: ..."
```

**observation**: the hint appears twice — once in JSON metadata and once at the end. this is redundant but not a regression. the ConstraintError handler includes metadata for programmatic access and repeats the hint for human readability.

**intended?** yes — aligns with ConstraintError handler behavior.

### wish snapshot diff

looked at: `git diff HEAD -- skill.init.behavior.wish.acceptance.test.ts.snap`

**error cases (case3, case4)**:
```
case3: "error: --wish requires content"
case4: "error: wish file has been modified\n\nto overwrite, delete..."
```

**observation**: these use simple `error:` prefix, not `✋ ConstraintError:`. this is intentional — the wish errors use `console.error()` directly in the code, not thrown ConstraintErrors.

**why two formats?**
- simple errors (wish validation): `console.error('error: ...')` — direct, inline
- structural errors (scaffold conflict): thrown ConstraintError — includes metadata

this is consistent with the codebase pattern: simple validation failures don't need full ConstraintError treatment.

### regression check

| concern | scaffold snap | wish snap |
|---------|--------------|-----------|
| format degraded | no — richer now | no — new |
| messages less helpful | no — more context | no — clear |
| timestamps leaked | no — masked | no — masked |
| redundant output | yes — hint twice | no |

the duplicate hint in scaffold is a minor ergonomics issue but not a regression from prior behavior.

## verdict

all changes are intentional. the duplicate hint could be cleaned up but is not a blocker.
