# self-review r2: has-questioned-assumptions

## why r2?

first pass was too fast. slow down. re-read vision line by line.

---

## re-read vision, line by line

### line 7: "vlad has an idea while he reviews code"

**hidden assumption:** the primary usecase is quick capture amid other work

**evidence:** wisher's example mentions "type it into the terminal" — suggests spontaneous capture

**what if opposite?** user plans the wish ahead of time in a document, then pastes. still works via inline or stdin.

**verdict:** holds. vision supports both spontaneous and planned capture.

---

### line 19: "wait for editor to open | immediate"

**hidden assumption:** editor startup is slow/annoyed

**evidence:** wisher says "so that i can write my words down before i hit execute" — implies they want to capture before any wait

**what if opposite?** editor is fast (nvim). but even fast editor is context switch — terminal to editor and back.

**verdict:** holds. even with fast editor, inline is less friction.

---

### line 66: "wish file contains `wish = \n\n<content from --wish>`"

**hidden assumption:** we prepend the `wish = ` prefix

**evidence:** none from wisher — i assumed based on extant template format

**what if opposite?** user provides full content with prefix. but that's awkward for inline use.

**counterexample:** what if user wants custom format? they could edit after. or use --open.

**verdict:** holds. prepend prefix is ergonomic default. user can edit if needed.

---

### line 109: "populate wish file before editor opens — fully solved"

**hidden assumption:** the sequence is: write file, then open editor (if --open provided)

**evidence:** wisher's phrase: "before it gets opened"

**what if opposite?** open editor, then write. but that contradicts the wish.

**verdict:** holds. sequence is explicit in wish.

---

### line 141: "wish file format remains `wish = \n\n<content>`"

**hidden assumption:** we know the exact format

**evidence:** i should verify this against actual template

**action:** check the current template format

---

## verification: template format

<pause to check template>

i realize i should verify the wish file format against the actual template before i assume.

from the init.behavior implementation, the template creates `0.wish.md`. i assumed `wish = \n\n<content>` but should verify.

**verification needed:** what does the template actually contain?

this is a gap — i assumed format without check. flag this.

---

## deeper assumptions i missed in r1

### assumption 9: stdin is available (not redirected elsewhere)

**what if:** user runs in a context where stdin is already consumed (e.g., piped from another command)

**edge case:** `some-command | rhx init.behavior --wish @stdin` — works if stdin has wish content

**but:** `some-command | rhx init.behavior --wish "inline"` — stdin is consumed but --wish uses inline, so fine

**verdict:** edge case but covered. inline fallback when stdin not available.

### assumption 10: wish content doesn't need escape in the file

**what if:** wish contains markdown that affects the file format

**example:** `--wish "wish = fake header"` — would create confuse content

**verdict:** low risk. user writes their own wish; if they write confuse content, they own it.

### assumption 11: the wisher's example is representative

**what if:** wisher's example is one usecase but not the primary one

**re-read wish:** the example is illustrative. the core ask is `@stdin|words` support.

**verdict:** holds. example supports but doesn't limit the vision.

---

## issues found in r2

1. **template format unverified**: i assumed `wish = \n\n<content>` but didn't verify against actual template
2. **findsert semantics still unresolved**: flagged in r1, still needs wisher input
3. **empty wish error still unresolved**: flagged in r1, still needs wisher input

## how i address template format

add to vision's open questions: "verify wish file template format before implementation"

but for vision stage, this is acceptable — implementation will verify.

## reflection

r2 was slower. i caught one new gap: template format verification. the core assumptions from r1 remain valid. the questionable items (findsert, empty wish) are appropriately flagged.

the vision is sound for vision stage. details will solidify in criteria/blueprint.
