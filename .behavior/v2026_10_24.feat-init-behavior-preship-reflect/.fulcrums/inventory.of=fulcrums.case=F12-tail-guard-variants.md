# F12 · one guard per tail stone, or `.light` / `.heavy` variants (blueprint q4)

- **the fork**: (a) one guard each for `6.preship` and `7.reflect`, the same on light and heavy
  routes; (b) a `.light` / `.heavy` pair each, which (since F5 rules self-reviews only) could
  differ only in roster size.
- **taken**: (a) is what the worktree holds; the choice is reserved for the commander (q4).
- **the evidence for (a)**:
  - `rule.require.guard-variant-consistency` says "when you modify guard templates, apply changes
    to all variants of that guard". it binds a guard that HAS variants; it does not require every
    guard to have them. its own table lists three guards with variants, not all.
  - the repo ships guards with no variant today: `5.2.evaluation.guard`, `5.3.verification.guard`,
    `5.5.playtest.guard`, `3.2.distill.domain._.guard`, `3.2.distill.repros.experience._.guard`.
    the variant select (`getAllTemplatesBySize`) passes a guard with no suffix through to both.
  - with no peer lane and no judge (F5), a heavy variant could only add self-reviews — the
    commander may want that (q5 asks about the rosters), so it stays a question, not a rule call.
- **rework**: clean — two more template files and two registry entries.
- **confidence**: 85% that (a) is the commander's pick; not guessed — the worktree holds (a) as
  the simplest shape and q4 asks.
- **risk if wrong**: low — a heavy route gets the light roster on two stones; a later add.
- **where**: `3.3.1.blueprint.product.yield.md` q4; `templates/{6.preship,7.reflect}.guard`.
- **raised again by**: peer `repo-rules` blocker.1 (round i001), disputed to this row.
- **verdict**: open — the commander rules.
