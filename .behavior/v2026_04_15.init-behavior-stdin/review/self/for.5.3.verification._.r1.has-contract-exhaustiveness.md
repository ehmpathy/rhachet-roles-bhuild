# self-review r1: has-contract-exhaustiveness

## question

does every user-faced contract have exhaustive snapshot coverage?

## review

### the contract: `--wish @stdin|words`

users interact via:
```bash
rhx init.behavior --wish "inline words"
rhx init.behavior --wish @stdin  # with piped input
echo "my wish" | rhx init.behavior --wish @stdin
```

### positive paths

| input | expected | snapped? |
|-------|----------|----------|
| `--wish "inline"` | wish file created | yes |
| `--wish @stdin` | wish file from stdin | yes |
| `--wish @stdin` via heredoc | wish file from heredoc | yes (via stdin tests) |
| `--wish` + `--open` | wish file created, editor opens | yes |

### negative paths

| input | expected | snapped? |
|-------|----------|----------|
| `--wish ""` empty | ConstraintError, exit 2 | yes |
| `--wish` on modified file | ConstraintError, exit 2 | yes |

### edge cases

| input | expected | snapped? |
|-------|----------|----------|
| `--wish "same content"` twice | idempotent, no error | yes |
| large wish content | accepted (within size limit) | yes (via sizes tests) |
| wish exceeds size limit | ConstraintError, exit 2 | yes |

### coverage matrix

| dimension | covered? |
|-----------|----------|
| happy path | yes |
| error path | yes |
| idempotent | yes |
| size boundaries | yes |
| combined flags | yes |

## verdict

contract coverage is exhaustive. all paths exercised with snapshots.
