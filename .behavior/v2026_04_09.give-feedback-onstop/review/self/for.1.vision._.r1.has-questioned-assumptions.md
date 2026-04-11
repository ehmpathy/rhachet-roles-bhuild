# self-review: has-questioned-assumptions

## assumptions examined

### 1. clones run the stop hook

| question | answer |
|----------|--------|
| evidence? | none explicit — wisher assumes hooks work |
| what if opposite? | system fails silently if clone bypasses hooks |
| wisher said? | implicit in "hook.onStop" mention |
| counterexamples? | clones could disable hooks, use different harness |

**verdict**: holds but fragile. the system depends on hook enforcement. if clones bypass hooks, feedback guarantee breaks. this is acceptable — hooks are the enforcement mechanism.

### 2. feedback files follow `[given]`/`[taken]` naming

| question | answer |
|----------|--------|
| evidence? | template in refs/ uses `.[feedback].v1.[given].by_human.md` |
| what if opposite? | different naming would break glob patterns |
| wisher said? | "only change being 'given' -> 'taken' in the filepath" (line 27) |
| counterexamples? | none — pattern is established |

**verdict**: holds. wisher explicitly confirmed the naming convention.

### 3. hash is computed from `[given]` file content

| question | answer |
|----------|--------|
| evidence? | wisher said "check that the feedback given file's hash is still valid" (line 29) |
| what if opposite? | hash of metadata? filename? would be less reliable |
| wisher said? | "given file's hash" — implies content hash |
| counterexamples? | could hash just the feedback items, not header/boilerplate |

**verdict**: holds. content hash is the natural interpretation. could clarify with wisher if partial hash is preferred.

### 4. `[taken]` path derived by replacing `[given]` → `[taken]`

| question | answer |
|----------|--------|
| evidence? | wisher said "only change being 'given' -> 'taken' in the filepath" (line 27) |
| what if opposite? | different location would break collocation |
| wisher said? | explicit in wish |
| counterexamples? | none — this is exactly what the wish says |

**verdict**: holds. direct quote from wish.

### 5. output uses treestruct format

| question | answer |
|----------|--------|
| evidence? | extant skills use treestruct (see `rule.require.treestruct-output` brief) |
| what if opposite? | plain text output would work but be inconsistent |
| wisher said? | no mention of output format |
| counterexamples? | none — treestruct is the repo standard |

**verdict**: holds. follows repo conventions, not a requirement from wisher.

### 6. `--when hook.onStop` flag name

| question | answer |
|----------|--------|
| evidence? | wisher wrote: "`rhx feedback.take.get --when hook.onStop`" (line 19) |
| what if opposite? | `--mode hook` or `--hook` would also work |
| wisher said? | exact flag name specified |
| counterexamples? | none |

**verdict**: holds. direct from wish.

### 7. `--to` and `--at` arg names

| question | answer |
|----------|--------|
| evidence? | wisher wrote: `--to '$feedback.given.file.path' --at '$feedback.taken.file.path'` (line 25) |
| what if opposite? | `--given`/`--taken` or `--from`/`--into` might be clearer |
| wisher said? | exact arg names specified |
| counterexamples? | vision notes this feels awkward |

**verdict**: holds as specified, but flagged as awkward in vision. may revisit in criteria phase.

### 8. hash storage location

| question | answer |
|----------|--------|
| evidence? | none — I assumed it could be in [taken] file, manifest, or filename |
| what if opposite? | different storage affects implementation |
| wisher said? | no mention of where hash is stored |
| counterexamples? | all three options are valid |

**verdict**: **issue found** — this is genuinely unspecified. added to open questions in vision.

## issues found

### issue 1: hash storage location unspecified

the wisher said to "check that the feedback given file's hash is still valid" but did not specify where the hash is stored.

**options:**
1. in the `[taken]` file as frontmatter
2. in a separate manifest file
3. in the `[taken]` filename itself

**fix:** already flagged as open question in vision. no code impact yet — clarify before implementation.

## assumptions that hold

all other assumptions are either:
- directly from the wish (naming, flags, exit code)
- following repo conventions (treestruct, exit codes)
- reasonable inferences with supporting evidence

## conclusion

one genuine gap found (hash storage location), already captured in vision open questions. all other assumptions are grounded in wish or conventions.
