# self-review: has-questioned-assumptions

## assumption 1: users prefer inline `--wish "..."` for short wishes

**what do we assume without evidence?** that inline is the common case

**what evidence?** the wisher's example uses inline: `--wish "to do some cool feature..."`

**what if opposite?** users might always use @stdin for consistency. but then inline is still valid — it doesn't break.

**counterexamples?** power users might automate everything via stdin. but they'd still benefit from both options.

**verdict:** holds. inline is simpler for interactive use; @stdin for automation. both coexist.

---

## assumption 2: @stdin pattern is familiar from other rhx skills

**what do we assume?** users know git.commit.set -m @stdin pattern

**what evidence?** git.commit.set uses this pattern, sedreplace uses this pattern

**what if opposite?** users are new to rhx and don't know @stdin. then they discover inline `--wish "..."` first, which is intuitive.

**verdict:** holds. @stdin is power-user path; inline is discoverable fallback.

---

## assumption 3: wish file format remains `wish = \n\n<content>`

**what do we assume?** the template format won't change

**what evidence?** current 0.wish.md uses this format in templates

**what if opposite?** format changes to yaml, frontmatter, etc. then we update the write logic.

**verdict:** holds. format is stable, and if it changes, the implementation adapts — not a vision-level concern.

---

## assumption 4: --wish + --open work together (wish populated, then editor opens)

**what do we assume?** combined use is the intent

**what evidence?** wisher's example shows both: `--open nvim --name @branch --wish "..."`

**what if opposite?** they're mutually exclusive. but that would reduce flexibility for no gain.

**counterexamples?** none — combined use makes sense: pre-populate, then expand.

**verdict:** holds. directly from wisher's example.

---

## assumption 5: findsert semantics for wish file (preserve extant, error if conflict)

**what do we assume?** if wish file has content, don't overwrite

**what evidence?** none from wisher — i assumed based on init.behavior's extant directory handling

**what if opposite?** overwrite always. simpler, but might lose user's prior work if they re-run accidentally.

**did wisher say this?** no. this is inference.

**counterexamples?** user runs `--wish "new thought"` on extant behavior intentionally to update. overwrite would be correct.

**verdict:** questionable. the vision lists this in "open questions" — need wisher input. could go either way.

---

## assumption 6: empty `--wish ""` should error

**what do we assume?** empty content is invalid

**what evidence?** none — i added this for pit-of-success

**what if opposite?** empty is valid — user creates structure, then uses --open to fill in. or they just want the behavior dir.

**did wisher say this?** no.

**counterexamples?** `--wish "" --open nvim` is valid: create structure, open editor empty.

**verdict:** questionable. already flagged in requirements review. need to reconsider.

---

## assumption 7: @stdin reads entire content until EOF

**what do we assume?** user can pipe multiline via heredoc or echo

**what evidence?** this is how @stdin works in git.commit.set and sedreplace

**what if opposite?** @stdin reads only first line. but that would be inconsistent with other skills.

**verdict:** holds. follows extant pattern.

---

## assumption 8: no `--wish @file` support needed

**what do we assume?** file path input is unnecessary because @stdin covers it

**what evidence?** user can do `cat file | rhx ... --wish @stdin`

**what if opposite?** `--wish @file` would be convenient. but it adds complexity and cat piping works.

**counterexamples?** none — @stdin is sufficient.

**verdict:** holds. kiss principle. @stdin covers the usecase.

---

## hidden assumptions surfaced

| assumption | explicit in wish? | verdict |
|------------|-------------------|---------|
| inline preferred for short | yes (example uses it) | holds |
| @stdin is familiar | no (inferred) | holds |
| wish format stable | no (inferred) | holds |
| --wish + --open combined | yes (example shows it) | holds |
| findsert semantics | no (inferred) | questionable |
| error on empty | no (added for safety) | questionable |
| @stdin reads all content | no (follows pattern) | holds |
| no @file needed | no (kiss) | holds |

## issues found: 2 (same as requirements review)

1. **findsert semantics**: assumed without evidence. need wisher input.
2. **empty wish error**: assumed without evidence. may over-constrain.

## how they were addressed

both are documented in vision's "open questions & assumptions" section. the vision explicitly calls out that these assumptions need validation before implementation.

## reflection

the assumptions i made without evidence are limited to edgecase behaviors (conflict handling, empty input). the core contract (`--wish @stdin|words`) is directly from the wisher. this is appropriate scoping for vision stage — capture intent, flag questions.
