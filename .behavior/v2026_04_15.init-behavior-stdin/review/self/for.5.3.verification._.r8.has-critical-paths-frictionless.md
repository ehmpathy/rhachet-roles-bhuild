# self-review r8: has-critical-paths-frictionless

## deeper reflection: what does frictionless mean?

frictionless = user gets from intent to outcome with minimal cognitive load.

- no unexpected errors
- no extra commands
- no need to read docs
- output confirms success

### critical path 1: inline wish

**user intent**: "i want to capture my wish inline while i scaffold"

**path**:
```bash
rhx init.behavior --name my-feature --wish "add support for @stdin in wish"
```

**what happens**:
1. behavior scaffolded with all templates
2. wish file created with user's text
3. output shows `+ 0.wish.md`
4. branch bound to behavior

**friction check**:
- extra steps? no — one command
- docs needed? no — `--wish "text"` is intuitive
- output clear? yes — shows files created

**verdict**: frictionless

### critical path 2: stdin wish

**user intent**: "i want to pipe a multiline wish from heredoc or file"

**path**:
```bash
cat my-wish-draft.txt | rhx init.behavior --name my-feature --wish @stdin
```

**what happens**:
1. stdin content read
2. wish file populated
3. behavior scaffolded
4. output confirms

**friction check**:
- extra steps? no — pipe works as expected
- does @stdin work? yes — tested in case2
- edge case: empty stdin? handled — error with hint

**verdict**: frictionless

### critical path 3: combined wish + open

**user intent**: "i want to capture wish and open editor in one command"

**path**:
```bash
rhx init.behavior --name my-feature --wish "rough draft" --open nvim
```

**what happens**:
1. wish file created with text
2. editor opens to wish file
3. user can refine immediately

**friction check**:
- do flags conflict? no — tested in case6
- order matter? no — flags are independent
- editor invoked? yes — via --open

**verdict**: frictionless

### what friction would look like

| friction type | present? | evidence |
|---------------|----------|----------|
| error without recovery hint | no | ConstraintError includes hints |
| silent failure | no | all paths exit 0 or exit 2 |
| unexpected side effects | no | idempotent — same content = no-op |
| cognitive load | no | single command achieves intent |

## verdict

all critical paths tested. no friction found. paths "just work" as designed.
