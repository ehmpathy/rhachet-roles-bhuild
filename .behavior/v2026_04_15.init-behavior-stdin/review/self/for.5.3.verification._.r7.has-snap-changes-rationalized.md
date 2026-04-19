# self-review r7: has-snap-changes-rationalized

## deeper reflection

### what story does each snapshot tell?

#### wish snapshot (new)

this file documents the user experience of `--wish @stdin|words`:

- **case1 story**: user types `rhx init.behavior --wish "my inline wish"` → sees path to created wish file
- **case2 story**: user pipes `echo "wish" | rhx init.behavior --wish @stdin` → sees path to created wish file
- **case3 story**: user tries `--wish ""` → sees ConstraintError with hint about why empty is invalid
- **case4 story**: user tries `--wish` on already-modified file → sees ConstraintError with hint about conflict
- **case5 story**: user runs same wish twice → sees no-op message (idempotent)
- **case6 story**: user runs `--wish "text" --open nvim` → sees path + editor opens

each story is intentional. the snapshots prove these stories work.

#### scaffold snapshot (modified)

**what changed**: error output moved from stdout to stderr

**why this matters**: errors belong in stderr. this is Unix convention. the previous behavior (errors in stdout) was wrong.

**before**:
```
stdout: "✋ ConstraintError: ..."
stderr: ""
```

**after**:
```
stdout: ""
stderr: "✋ ConstraintError: ..."
```

the content is the same. the stream is correct now.

### could any change be accidental?

| change | intentional? | evidence |
|--------|-------------|----------|
| wish snap added | yes | new feature |
| scaffold stderr | yes | aligns with ConstraintError handler |

no accidental changes. both align with the PR scope.

### what would a regression look like?

- error messages truncated → not present
- output structure lost → not present
- timestamps leaked → not present (masks in place)
- alignment broken → not present

## verdict

every snapshot change tells an intentional story. no regressions detected.
