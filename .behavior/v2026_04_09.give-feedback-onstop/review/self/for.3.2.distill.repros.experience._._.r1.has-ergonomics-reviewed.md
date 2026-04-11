# self-review: has-ergonomics-reviewed

## input/output pairs reviewed

### feedback.give

| aspect | assessment | notes |
|--------|------------|-------|
| input natural? | yes | single `--against $artifact` arg |
| can infer inputs? | no | artifact must be explicit — we can't guess |
| expressive? | yes | `--version ++`, `--open codium` |
| composable? | yes | simple CLI command |
| output natural? | yes | path shown for immediate edit |
| friction? | none | |

### feedback.take.get

| aspect | assessment | notes |
|--------|------------|-------|
| input natural? | yes | no args needed — just list |
| can infer inputs? | N/A | no inputs required |
| expressive? | N/A | single purpose |
| composable? | yes | pure read, no side effects |
| output natural? | yes | unresponded first, responded second |
| friction? | none | |

### feedback.take.get --when hook.onStop

| aspect | assessment | notes |
|--------|------------|-------|
| input natural? | yes | automatic via hook config |
| can infer inputs? | yes | mode inferred from `--when` |
| expressive? | N/A | binary pass/block |
| composable? | yes | hook composition |
| output natural? | yes | actionable command shown |
| friction? | none | |

### feedback.take.set

| aspect | assessment | notes |
|--------|------------|-------|
| input natural? | **awkward** | two long paths |
| can infer inputs? | partial | `--into` derivable from `--from` (failfast validates) |
| expressive? | N/A | explicit paths required |
| composable? | yes | single idempotent operation |
| output natural? | yes | hash verified, clear confirmation |
| friction? | **mitigated** | hook shows exact command to copy-paste |

## friction analysis

### identified friction: long paths in feedback.take.set

**the friction**:
```sh
rhx feedback.take.set \
  --from '.behavior/my-feature/feedback/execution.[feedback].v1.[given].by_human.md' \
  --into '.behavior/my-feature/feedback/execution.[feedback].v1.[taken].by_robot.md'
```

**why it's awkward**:
- paths are 70+ characters each
- to type by hand is error-prone
- brackets and dots are unusual

**why it holds (mitigated)**:
1. **hook shows exact command** — clone never types these paths
2. **copy-paste workflow** — clone copies from hook output
3. **failfast validates** — wrong path exits 2 immediately
4. **explicit is safer** — no guess, no ambiguity

**alternative considered: infer --into from --from**

could we make `--into` optional and derive it?
```sh
rhx feedback.take.set --from '.../[given]...'
# auto-derive --into via replace [given] with [taken]
```

**rejected because**:
- clone must write the [taken] file before record
- force `--into` confirms clone wrote the file
- failfast validates file exists
- explicit > implicit for audit trail

## pit of success verification

| principle | holds? | notes |
|-----------|--------|-------|
| intuitive design | yes | hook output guides clone |
| convenient | yes | copy-paste from hook |
| expressive | yes | explicit paths allow any feedback |
| composable | yes | single command per response |
| lower trust contracts | yes | validates paths at boundary |
| deeper behavior | yes | hash check, path derivation check |

## issues found

none. the identified friction (long paths) is documented and mitigated by the hook output.

## conclusion

all input/output pairs reviewed. the feedback.take.set friction is acceptable because:
1. clone never types paths manually
2. hook shows exact command
3. failfast catches errors immediately
