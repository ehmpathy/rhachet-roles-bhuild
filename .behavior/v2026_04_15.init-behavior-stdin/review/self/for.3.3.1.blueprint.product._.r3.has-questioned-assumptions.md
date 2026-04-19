# self-review r3: has-questioned-assumptions

## the question

are there any hidden technical assumptions the junior made?

---

## assumption 1: readFileSync(0) reads stdin correctly

**blueprint assumes**: `readFileSync(0, 'utf-8').trim()` reads stdin content

**what if opposite were true?**
- if stdin fd 0 doesn't work, the pattern would fail
- if the process is run without stdin pipe, it might block indefinitely

**evidence check**:
- research citation [1] confirms this pattern is used in `feedback.take.set.ts`
- the pattern is proven to work in this codebase

**potential issue found**: what happens when `--wish @stdin` is used without a pipe?

**analysis**:
- if user runs `rhx init.behavior --wish @stdin` without a pipe
- `readFileSync(0)` will block, wait for stdin input
- user must ctrl+d or ctrl+c to exit
- this is standard unix behavior for stdin read

**is this a problem?**: no — this matches unix conventions. `cat` does the same. the `@stdin` pattern is explicit about expected piped input.

**verdict**: assumption holds — evidence-based, follows unix conventions

---

## assumption 2: wish template content is exactly `wish =`

**blueprint assumes**: `content.trim() === 'wish ='` detects untouched template

**what if opposite were true?**
- if template has different whitespace, check would fail
- if template has a newline after `wish =`, check would fail incorrectly

**evidence check**:
- research citation [4] says template detection via this exact check
- need to verify actual template content

**verification needed**: check what the actual template file contains

**action**: verify template file content matches assumption at implementation time

**potential issue**: template might be `wish =\n` (with newline) which `.trim()` would reduce to `wish =`. this is fine — trim handles it.

**verdict**: assumption likely holds, but implementation must verify against actual template

---

## assumption 3: wish file always exists after initBehaviorDir

**blueprint assumes**: wish logic runs AFTER initBehaviorDir, so file exists

**what if opposite were true?**
- if initBehaviorDir doesn't create wish file, readFileSync would throw ENOENT
- if findsert fails silently, wish file might not exist

**evidence check**:
- research citation [3] confirms findsert semantics
- initBehaviorDir creates full behavior directory structure
- wish file is part of standard template

**verdict**: assumption holds — findsert guarantees file existence

---

## assumption 4: write format `wish =\n\n${content}\n` is correct

**blueprint assumes**: populated wish should be `wish =\n\n<content>\n`

**what if opposite were true?**
- if format differs from expectations, downstream consumers might fail to parse
- if double newline is wrong, wish might look incorrect

**evidence check**:
- the format places content after `wish =` header with blank line separation
- this matches typical markdown format for key-value-like structures

**question**: is there a downstream parser that expects specific format?

**analysis**: wish files are human-readable documentation, not machine-parsed. format is aesthetic.

**verdict**: assumption holds — format is reasonable for human consumption

---

## assumption 5: empty string after trim means invalid wish

**blueprint assumes**: `!wishContent` after trim means wish was empty/whitespace-only

**what if opposite were true?**
- could empty wish be intentional? (e.g., user wants to clear wish)
- could whitespace-only wish be valid?

**analysis**:
- vision explicitly says error on `--wish ""`
- whitespace-only wish has no meaningful content
- if user types `--wish ""`, they made a mistake
- if user types `--wish "   "`, they also made a mistake

**verdict**: assumption holds — empty/whitespace wish is never intentional

---

## assumption 6: test stdin spread pattern works correctly

**blueprint assumes**: `...(input.stdin && { input: input.stdin })` passes stdin only when provided

**what if opposite were true?**
- if `input.stdin` is empty string `''`, JS evaluates it as falsy
- spread would NOT include input option
- but empty string stdin would be rejected by validateWishContent anyway

**question**: should empty string stdin reach execSync?

**analysis**:
- empty string stdin → execSync gets no input → readFileSync(0) returns empty → error
- empty string stdin → execSync gets `input: ''` → readFileSync(0) returns empty → error
- both paths produce same result (error on empty)

**verdict**: assumption holds — behavior is correct regardless of edge case

---

## assumption 7: error messages should use console.error with process.exit(1)

**blueprint assumes**: errors go to stderr via console.error, exit code 1

**what if opposite were true?**
- if errors should go to stdout, pattern is wrong
- if exit code should be different (e.g., 2 for user error), pattern is wrong

**evidence check**:
- research citation [5] says error messages use same emoji prefix pattern
- extant code uses console.error for errors
- exit code 1 is standard for errors

**question**: should constraint errors (user must fix) use exit code 2?

**analysis**:
- brief `rule.require.exit-code-semantics` says exit 2 for constraint errors
- `--wish ""` is a constraint error (user must fix)
- modified wish file is a constraint error (user must fix)

**issue found**: blueprint uses exit(1) but should use exit(2) for constraint errors

**fix required**: change `process.exit(1)` to `process.exit(2)` for:
- empty wish error
- modified wish file error

---

## assumption 8: relative path in error message is available

**blueprint assumes**: `wishPathRel` variable exists for error message

**code shows**:
```ts
console.error(`  rm ${wishPathRel}`);
```

**issue found**: `wishPathRel` is used but not defined in the blueprint code

**analysis**: need to compute relative path from cwd to wish file for user-friendly error message

**fix required**: add `const wishPathRel = relative(process.cwd(), wishPath)` or similar

---

## issues found

| assumption | status | fix needed |
|------------|--------|------------|
| 1. readFileSync(0) works | holds | none |
| 2. template is `wish =` | likely holds | verify at implementation |
| 3. file exists after init | holds | none |
| 4. write format correct | holds | none |
| 5. empty = invalid | holds | none |
| 6. spread pattern works | holds | none |
| 7. exit codes | **fixed** | changed to exit(2) |
| 8. wishPathRel defined | **fixed** | added variable definition |

---

## verdict

two issues found and fixed:

1. **exit code semantics**: blueprint used exit(1) for all errors, but constraint errors should use exit(2) per brief. **fixed**: changed to `process.exit(2)` with comment "constraint error: user must fix"

2. **undefined variable**: `wishPathRel` was used in error message but not defined. **fixed**: added `const wishPathRel = relative(process.cwd(), wishPath)`

blueprint updated with both fixes. the architecture is sound.

