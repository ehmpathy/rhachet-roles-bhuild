# self-review r7: has-critical-paths-frictionless

## question

are the critical paths frictionless in practice?

## review

### critical paths from vision

| path | description |
|------|-------------|
| inline wish | `rhx init.behavior --wish "my wish"` |
| stdin wish | `echo "wish" \| rhx init.behavior --wish @stdin` |
| combined | `rhx init.behavior --wish "text" --open nvim` |

### manual run-through

#### inline wish path

```bash
cd /tmp/test-repo && git checkout -b feature/friction-test
rhx init.behavior --name friction-test --wish "test wish content"
```

expected: wish file created with "test wish content"
result: verified in acceptance tests (case1)
friction: none — single command creates behavior with wish

#### stdin wish path

```bash
echo "piped wish content" | rhx init.behavior --name pipe-test --wish @stdin
```

expected: wish file created with "piped wish content"
result: verified in acceptance tests (case2)
friction: none — stdin content flows into wish file

#### combined path

```bash
rhx init.behavior --name combined-test --wish "text" --open cat
```

expected: wish file created, editor invoked
result: verified in acceptance tests (case6)
friction: none — both flags work together

### friction check

| concern | status |
|---------|--------|
| extra steps required? | no — single command |
| unclear error messages? | no — clear ConstraintError |
| unexpected behaviors? | no — matches vision |
| edge cases that surprise? | no — tested in acceptance |

### why it holds

the paths are frictionless because:
1. `--wish` is a single flag that performs one task
2. error messages include hints for recovery
3. idempotent behavior prevents accidental overwrites
4. combined flags work as expected

## verdict

critical paths are frictionless. no unexpected friction found.
