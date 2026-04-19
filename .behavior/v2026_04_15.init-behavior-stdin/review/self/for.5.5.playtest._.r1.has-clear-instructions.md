# self-review: has-clear-instructions

## question

are the instructions followable?
- can the foreman follow without prior context?
- are commands copy-pasteable?
- are expected outcomes explicit?

## review

### can the foreman follow without prior context?

**yes, because:**

1. **prerequisites are self-contained** — the foreman doesn't need to know what rhachet is or how init.behavior works. the prerequisites give them the exact commands to set up the environment from scratch.

2. **no implicit assumptions** — each step says what to do and what to expect. the foreman doesn't need to guess what "success" means because it's explicit: "exit code: 0", "stdout contains: X", "file contains: Y".

3. **acceptance tests are cited** — if the foreman wants deeper context, they can read the test file. but they don't need to — the playtest stands alone.

### are commands copy-pasteable?

**yes, because:**

1. **each command is a complete shell invocation** — includes the `cd` to ensure correct work directory.

2. **no placeholder variables** — every command is literal. no `$NAME` or `<your-value-here>`.

3. **heredocs and pipes are explicit** — the stdin test uses `echo "..." |` which is copy-pasteable.

**potential issue caught and fixed:** the protected branch test originally required switch to main, which might not exist in the temp repo. added note that this requires the main branch to exist.

### are expected outcomes explicit?

**yes, because:**

1. **exit codes are specified** — "exit code: 0" or "exit code: 2" or "exit code: non-zero".

2. **stdout/stderr patterns are quoted** — `stdout contains: "🦫 oh, behave!"` leaves no ambiguity.

3. **file content is shown verbatim** — the expected wish file content is in a code block with exact format.

## verdict

instructions are clear, copy-pasteable, and cite acceptance tests for each step. the foreman can follow this playtest cold, without prior rhachet knowledge, and verify each behavior explicitly.
