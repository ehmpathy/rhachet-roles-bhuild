# self-review: has-ergonomics-reviewed (r2)

## review continued from r1

the r1 review identified one friction point (long paths in feedback.take.set) and documented the mitigation. this r2 review verifies that assessment.

## re-verification of friction point

### the friction: long paths in feedback.take.set

```sh
rhx feedback.take.set \
  --from '.behavior/my-feature/feedback/execution.[feedback].v1.[given].by_human.md' \
  --into '.behavior/my-feature/feedback/execution.[feedback].v1.[taken].by_robot.md'
```

### mitigation effectiveness

| mitigation | effective? | why |
|------------|------------|-----|
| hook shows exact command | yes | clone copies from terminal |
| copy-paste workflow | yes | no manual path entry |
| failfast validates | yes | wrong path exits 2 |

### could we do better?

**option A: infer --into**
- make `--into` optional
- derive from `--from` via `[given]` → `[taken]`
- **rejected**: clone must write [taken] file first; force `--into` confirms file exists

**option B: shorter aliases**
- allow `--from execution.v1` instead of full path
- **rejected**: ambiguous in multi-behavior repos; explicit paths are safer

**option C: interactive mode**
- show list, let clone select
- **rejected**: hook already shows exact command; interactive adds complexity

### conclusion on friction

the friction is **acceptable** because:
1. the workflow is copy-paste, not type
2. the hook shows the exact command
3. the failfast catches mistakes immediately
4. explicit paths prevent ambiguity

## pit of success principles re-verified

| principle | holds? | verification |
|-----------|--------|--------------|
| intuitive design | yes | hook output guides clone — no docs needed |
| convenient | yes | copy-paste from hook output |
| expressive | yes | explicit paths allow any feedback file |
| composable | yes | single command per response |
| lower trust contracts | yes | validates paths at boundary |
| deeper behavior | yes | hash check, path derivation check |

## issues found

none. the friction is documented and mitigated.

## conclusion

the ergonomics review is complete. the one friction point (long paths) is acceptable because the workflow is copy-paste from hook output, not manual entry.
