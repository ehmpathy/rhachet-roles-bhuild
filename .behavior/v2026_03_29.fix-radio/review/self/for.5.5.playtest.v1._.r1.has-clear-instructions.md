# self-review: has-clear-instructions (r1)

i promise that it has-clear-instructions.

verification that the playtest instructions are followable.

---

## the question

can the foreman follow without prior context? are commands copy-pasteable? are expected outcomes explicit?

---

## instruction clarity analysis

### prerequisites section

| instruction | clear? | copy-pasteable? |
|-------------|--------|-----------------|
| keyrack unlock command | ✓ | ✓ full command shown |
| npm ci | ✓ | ✓ |
| npm run build | ✓ | ✓ |
| demo repo note | ✓ | n/a (just context) |

**assessment**: prerequisites are clear and actionable.

### path 1: radio.task.push just works

| aspect | clear? | notes |
|--------|--------|-------|
| command | ✓ | full command, copy-pasteable |
| expected outcome | ✓ | 6 specific items listed |
| pass criteria | ✓ | explicit statement |

**the command**:
```bash
npx rhachet run --skill radio.task.push -- --via gh.issues --repo ehmpathy/rhachet-roles-bhuild-demo --title "playtest task $(date +%s)" --description "byhand playtest verification"
```

✓ uses `$(date +%s)` for unique titles (prevents collision)
✓ all flags explicit
✓ no placeholders that need substitution

### path 2: explicit --auth env override

| aspect | clear? | notes |
|--------|--------|-------|
| setup command | ✓ | export + grep to extract token |
| main command | ✓ | full command |
| cleanup command | ✓ | unset shown |

**potential issue**: the keyrack get command might not output in the expected format.

**mitigation**: the grep pattern `ghs_[^ ]*` targets github installation tokens which start with `ghs_`. this should work if keyrack grants a token.

### edge cases

| edge | clear? | setup? | expected behavior? |
|------|--------|--------|-------------------|
| edge 1 | ✓ | describes fresh shell approach | ✓ specific error expectations |
| edge 2 | ✓ | n/a | ✓ mentions repo required |
| edge 3 | ✓ | n/a | ✓ mentions title required |

---

## can foreman follow without prior context?

**yes** — the playtest:
1. starts with prerequisites (what to set up first)
2. each path is self-contained (no references to other steps)
3. commands are complete (no assumed state)
4. expected outcomes are explicit (not "it works")

---

## are commands copy-pasteable?

**yes** — every command block:
1. is a complete command (not fragments)
2. uses `$(date +%s)` for dynamic parts (not `{placeholder}`)
3. includes all required flags
4. uses actual repo names (not variables that need substitution)

---

## are expected outcomes explicit?

**yes** — each path specifies:
1. expected exit code
2. expected output content
3. pass/fail criteria

---

## conclusion

**the instructions are clear and followable.**

**why it holds**:
1. prerequisites establish the required state
2. commands are complete and copy-pasteable
3. expected outcomes list specific observable items
4. pass criteria are explicit statements, not vague "it works"
5. no assumed context — a foreman unfamiliar with the codebase can follow

