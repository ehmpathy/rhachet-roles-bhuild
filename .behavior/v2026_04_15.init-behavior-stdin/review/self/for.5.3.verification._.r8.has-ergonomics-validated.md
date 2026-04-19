# self-review r8: has-ergonomics-validated

## question

does the actual input/output match what felt right at vision?

## review

### input comparison

| vision input | implemented? | notes |
|--------------|--------------|-------|
| `--wish "inline words"` | yes | case1 tests this |
| `--wish @stdin` (piped) | yes | case2 tests this |
| `--wish @stdin` (heredoc) | yes | handled by stdin test |
| `--wish "..." + --open nvim` | yes | case6 tests this |
| `--wish ""` → error | yes | case3 tests this |
| `--wish` on modified file → error | yes | case4 tests this |

### output comparison

| vision output | implemented? | notes |
|---------------|--------------|-------|
| wish file contains `wish = \n\n<content>` | yes | verified in case1, case2 |
| behavior dir created | yes | all success cases verify |
| route bound | yes | output shows bind message |
| footer shows wish file path | yes | snapshot shows path |

### ergonomic feel check

**vision said**: "captures thought at the speed of thought"

**implementation delivers**:
- single command → wish captured
- no editor dance required
- error messages include recovery hints

**vision said**: "like git commit -m"

**implementation delivers**:
- `--wish "text"` mirrors `git commit -m "text"`
- `--wish @stdin` mirrors `-m @stdin` pattern

### drift analysis

| aspect | vision | implementation | drifted? |
|--------|--------|----------------|----------|
| error format | not specified | `error: ...` prefix | no drift — not specified |
| exit codes | not specified | 0 success, 2 error | no drift — not specified |
| idempotent | "don't silently overwrite" | error if modified | matches |
| combined flags | "both work together" | yes | matches |

### what could have drifted but didn't

- error messages could have been less helpful — they include hints
- idempotent could have been silent — it errors with explanation
- combined flags could have conflicted — they work together

## verdict

ergonomics match vision. no drift between planned and implemented experience.
