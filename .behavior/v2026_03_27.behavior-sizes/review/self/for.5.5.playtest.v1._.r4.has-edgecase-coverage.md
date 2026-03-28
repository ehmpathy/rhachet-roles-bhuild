# self-review: has-edgecase-coverage (r4)

## the actual question

> are edge cases covered in the playtest?

## issue found and fixed

### the problem

playtest happy path 5 said:
```
**verify:**
- mini templates created
- `1.vision.guard` has heavy content
```

this was unclear - a foreman would not know:
- what heavy content looks like
- how to check guard content
- how to distinguish heavy from light

### the fix applied

updated playtest happy path 5 (lines 148-153):
```markdown
**verify:**
- mini templates created
- `1.vision.guard` has heavy content:
  ```bash
  cat .behavior/*/1.vision.guard | head -30
  ```
  heavy guards have more self-review prompts and stricter judges than light guards
```

now the foreman has:
- explicit command to run
- explanation of what heavy means

### verification that fix works

the updated playtest now explains:
1. how to view guard content (`cat ... | head -30`)
2. what distinguishes heavy from light (more prompts, stricter judges)

## other edge cases verified

### input edge cases

| edge case | covered? | evidence |
|-----------|----------|----------|
| invalid size value | yes | edgey paths section |
| giga = mega boundary | yes | edgey paths section |
| size + guard compose | yes | happy path 5 |

### setup edge cases

| edge case | covered? | evidence |
|-----------|----------|----------|
| fresh git repo | yes | each path runs git init |
| feature branch | yes | each path runs git checkout -b |
| sandbox isolation | yes | all paths use .temp/ |

### verification edge cases

| edge case | covered? | evidence |
|-----------|----------|----------|
| file presence check | yes | all paths have ls -la commands |
| file absence check | yes | all paths have NOT extant checks |
| guard content check | yes | now has explicit cat command |

## why this holds

1. found issue: unclear guard verification
2. fixed issue: added explicit command and explanation
3. verified fix: playtest now has concrete verification for all checks
4. reviewed other edges: all other edge cases covered

## conclusion

the playtest now covers all edge cases with explicit verification steps. the guard content issue was fixed.
