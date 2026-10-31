# F11 · what the preship commit includes (blueprint q2)

- **the fork**: `git.commit.set` refuses while any file is unstaged, unless `--unstaged include`
  (stage all) or `--unstaged ignore` (commit what is staged). the stone must name one:
  (a) `--unstaged include` — the whole worktree, stray files too;
  (b) the driver stages the change's paths with `rhx git.stage.add`, then `--unstaged ignore`;
  (c) (b), plus the stone names what must never ride along (`.log/`, `.temp/`, scratch).
- **taken**: none. reserved for the commander — the wish says a blueprint question "goes to the
  commander, never best-guessed". the worktree's stone names neither flag.
- **why it is the commander's**: (a) can sweep a stray secret or scratch file into a pr; (b)/(c)
  can leave part of the change behind. which failure the commander prefers is a policy call, not a
  fact the code reveals.
- **rework**: clean — one line of `6.preship.stone`, one `then` in `templates.tail`.
- **confidence**: n/a (not guessed).
- **risk if wrong**: medium — (a) wrong ships a stray file into a pr the commander reviews before
  merge; (b) wrong leaves a file out, caught by the full suite or the pr diff.
- **where**: `3.3.1.blueprint.product.yield.md` q2; `templates/6.preship.stone` step 2.
- **raised again by**: peer `arch-opport-decomposition` nitpick.1 (round i001), disputed to this row.
- **verdict**: open — the commander rules.
