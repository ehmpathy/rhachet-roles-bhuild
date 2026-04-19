# self-review: has-vision-coverage (r2)

## question

does the playtest cover all behaviors?
- is every behavior in 0.wish.md verified?
- is every behavior in 1.vision.md verified?
- are any requirements left untested?

## review

### is every behavior in 0.wish.md verified?

**yes, because:**

the wish asks for `--wish @stdin|words`. this is a union of two capabilities:

1. **`--wish words`** — inline content. covered by happy path 1:
   ```sh
   rhx init.behavior --name happy-inline --wish "capture my thought inline"
   ```

2. **`--wish @stdin`** — piped content. covered by happy path 2:
   ```sh
   echo "piped content from stdin" | rhx init.behavior --name happy-stdin --wish @stdin
   ```

both capabilities are explicitly tested with copy-pasteable commands and explicit expected outcomes.

### is every behavior in 1.vision.md verified?

**yes, because:**

walked through each usecase and edgecase in the vision:

| vision behavior | why it holds |
|-----------------|--------------|
| inline quick capture | happy path 1 exercises this exact command pattern |
| stdin pipe | happy path 2 uses `echo "..." \|` exactly as vision shows |
| heredoc multiline | same @stdin mechanism as pipe — once stdin works, heredoc works |
| branch-derived name | edgey path 4 tests @branch on protected branch (error case) |
| combined with --open | happy path 3 tests `--wish` + `--open cat` together |
| empty wish error | edgey path 1 tests `--wish ""` produces error |
| wish conflict error | edgey path 3 tests re-init with different content |
| idempotent same content | happy path 4 tests re-init with same content passes |

### are any requirements left untested?

**no, because:**

1. every usecase from the vision usecases table is covered
2. every edgecase from the pit-of-success table is covered
3. both positive (success) and negative (error) paths are tested
4. acceptance test citations link each playtest step to automated verification

the only behavior not explicitly in the playtest is `--name @branch` on a non-protected branch — but that's tested in the at-branch acceptance tests and isn't specific to --wish.

## verdict

the playtest achieves complete coverage of wish and vision behaviors. each behavior traces to a playtest step, and each playtest step traces to an acceptance test.
