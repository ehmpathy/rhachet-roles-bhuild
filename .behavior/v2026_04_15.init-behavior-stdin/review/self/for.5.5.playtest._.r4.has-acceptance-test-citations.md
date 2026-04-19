# self-review: has-acceptance-test-citations (r4)

## question

cite the acceptance test for each playtest step. zero unproven steps.

## review

### happy path 1: inline wish content

**playtest command**: `rhx init.behavior --name happy-inline --wish "capture my thought inline"`

**acceptance test**: `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts`
**case**: `given('[case1] --wish with inline content')`

**why it holds**: the test executes `--name wish-inline-test --wish "my inline wish"` — same flag pattern. it asserts:
- exit code is 0
- wish file contains exact format `wish =\n\n{content}\n`
- stdout/stderr snapshots verify output format

the playtest command differs only in the literal strings, not the behavior.

---

### happy path 2: stdin piped

**playtest command**: `echo "piped content" | rhx init.behavior --name happy-stdin --wish @stdin`

**acceptance test**: `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts`
**case**: `given('[case2] --wish @stdin with piped content')`

**why it holds**: the test uses `stdin: 'my piped wish content'` with `--wish @stdin` — same mechanism. it asserts:
- exit code is 0
- wish file contains the piped content
- stdout/stderr snapshots verify output format

the test framework injects stdin the same way `echo | rhx` would in a shell.

---

### happy path 3: combined with --open

**playtest command**: `rhx init.behavior --name happy-combined --wish "wish before open" --open cat`

**acceptance test**: `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts`
**case**: `given('[case6] --wish combined with --open')`

**why it holds**: the test executes `--wish "wish before open" --open cat` — exact same flags. it asserts:
- exit code is 0
- stdout contains wish content (cat output)
- wish file has correct content

the `--open cat` flag causes cat to echo the wish file after population.

---

### happy path 4: idempotent repeat

**playtest command**: `rhx init.behavior --name happy-inline --wish "capture my thought inline"` (second call)

**acceptance test**: `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts`
**case**: `given('[case5] --wish idempotent with same content')`

**why it holds**: the test runs init twice with identical `--wish "same wish"` and asserts:
- second call returns exit code 0
- wish file content unchanged
- no error message emitted

idempotence means re-run with same content is a no-op success.

---

### edgey path 1: empty inline wish

**playtest command**: `rhx init.behavior --name edgy-empty --wish ""`

**acceptance test**: `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts`
**case**: `given('[case3b] --wish with empty inline content')`

**why it holds**: the test executes `--wish ""` and asserts:
- exit code is non-zero
- stderr contains `--wish must be a string`

empty string via shell becomes undefined arg in oclif — distinct from whitespace stdin.

---

### edgey path 2: whitespace-only stdin

**playtest command**: `echo "   " | rhx init.behavior --name edgy-whitespace --wish @stdin`

**acceptance test**: `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts`
**case**: `given('[case3] --wish @stdin with empty stdin')`

**why it holds**: the test uses `stdin: '   '` (whitespace only) and asserts:
- exit code is 2
- stderr contains `--wish requires content`

whitespace-only stdin is caught by trim check — effectively empty but not undefined.

---

### edgey path 3: conflict (different content)

**playtest command**: second call with `--wish "different content"` on pre-populated behavior

**acceptance test**: `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts`
**case**: `given('[case4] --wish on pre-populated wish file')`

**why it holds**: the test runs init twice: first with `"first wish"`, second with `"different wish"`. second call asserts:
- exit code is 2
- stderr contains `wish file has been modified`
- stderr contains `rm` (resolution hint)

conflict detection prevents accidental overwrites.

---

### edgey path 4: @branch on protected branch

**playtest command**: `git checkout main && rhx init.behavior --name @branch --wish "test"`

**acceptance test**: `blackbox/init.behavior.at-branch.acceptance.test.ts`
**case**: `given('[case3] on main branch')`

**why it holds**: the test sets branchName to `'main'` and runs `--name @branch`. it asserts:
- exit code is non-zero
- stderr contains `cannot init behavior on protected branch: main`

protected branch guard fires before wish population — this is @branch behavior, not --wish behavior, but playtest includes it for completeness.

---

## verdict

all 8 playtest steps have direct acceptance test citations with explicit assertions. the test cases exercise the same code paths as the playtest commands — only literal values differ.
