# self-review r5: has-pruned-yagni

## why r5?

r4 audited each component but didn't deeply articulate WHY each holds. this r5 provides detailed justification for why each component is not YAGNI.

---

## the yagni test

for each component: "if we removed this, would the feature still work as specified?"

---

## component 1: schema `wish: z.string().optional()`

**if removed**: `--wish` flag would not be recognized by zod parser. args would fail validation.

**traces to**: vision line 37 — `--wish "inline words"` is the primary usecase.

**why it holds**: the schema change is the minimum entry point for any new flag. without it, the flag cannot exist. one line, no abstraction.

---

## component 2: getWishContent transformer (inline, 5 lines)

**if removed**: `--wish @stdin` would pass `"@stdin"` as literal content instead of read from stdin.

**traces to**: vision line 38 — `echo "..." | rhx ... --wish @stdin`

**why it holds**: the @stdin pattern is explicitly in the original wish: "want to be able to `rhx init.behavior ... --wish @stdin|words`". the `|` means OR — both modes must work.

**why inline not separate file?** r3 asked this. answer: 5 lines of code, used in one place. separate file adds indirection without benefit.

---

## component 3: validateWishContent transformer (inline, 4 lines)

**if removed**: `--wish ""` would silently create empty wish file.

**traces to**: vision line 129 — `--wish ""` → error: wish content required

**why it holds**: pit-of-success design. if user types `--wish ""`, they made a mistake. silent acceptance would confuse them. the vision explicitly specifies this error case.

---

## component 4: validateWishFileState transformer (inline, 6 lines)

**if removed**: re-run with `--wish` would silently overwrite user's prior work.

**traces to**: vision lines 150-151 — "error if wish file has non-template content"

**why it holds**: pit-of-success design. user might have hours of work in that file. overwrite would destroy their work. the vision explicitly addresses this as a resolved question.

**why no `--force` flag?** r3 asked this. musk's step 2 says delete first. user can `rm` the file manually — simpler than add complexity.

---

## component 5: writeWishFile (1 line)

**if removed**: wish content would never be written to file. feature would not work.

**traces to**: vision line 66 — wish file contains `wish = \n\n<content>`

**why it holds**: this is the core action of the feature. one writeFileSync call.

---

## component 6: exit(2) for constraint errors

**if removed**: exit code would be 1, which means "malfunction" not "constraint".

**traces to**: brief `rule.require.exit-code-semantics` (not vision)

**why it holds**: this follows repo standards. exit(2) tells caller "you must fix this" vs exit(1) "server must fix this". not YAGNI because it's adherence to established pattern, not new feature.

---

## component 7: wishPathRel in error message

**if removed**: error would show absolute path or just "wish file has been modified".

**traces to**: pit-of-success principle — error should tell user how to fix

**why it holds**: the error says `rm ${wishPathRel}` — this is the recovery command. without relative path, user must figure out the path themselves. this is usability, not feature bloat.

---

## component 8: test helper stdin extension

**if removed**: could not test @stdin cases without manual pipe setup in shell.

**traces to**: criteria usecase.2 — stdin non-empty must be tested

**why it holds**: tests require ability to pipe stdin. extend extant function (not create new function) is minimum change. r3 confirmed this is simpler than create new function.

---

## component 9: seven test cases

each case traces directly to vision or criteria:

| case | removes if... | why it holds |
|------|--------------|--------------|
| inline non-empty | usecase.1 not tested | core happy path |
| stdin non-empty | usecase.2 not tested | @stdin pattern must work |
| inline empty error | usecase.5 not tested | error case specified in vision |
| stdin empty error | usecase.5 not tested | same error, different input mode |
| modified wish error | usecase.4 not tested | pit-of-success case specified in vision |
| inline + open combined | usecase.3 not tested | explicit in wisher's example |
| absent --wish | usecase.7 not tested | backwards compat is explicit |

---

## the "while we're here" check

did we add extras not in requirements?

| potential addition | added? | why not |
|--------------------|--------|---------|
| `--wish @file` | no | vision line 155 says no |
| `--force` flag | no | musk step 2 — manual rm is simpler |
| verbose mode | no | not requested |
| config support | no | not requested |
| content length limit | no | not requested |
| multiline detection | no | not requested |

---

## verdict

no YAGNI violations. every component:
1. is required for the feature to work as specified
2. traces to vision or criteria with explicit line references
3. is minimum viable (inline transformers, extend extant function)
4. has no "for future flexibility" abstraction
5. has no "while we're here" additions

the blueprint is lean — remove any component and the feature fails or degrades.

