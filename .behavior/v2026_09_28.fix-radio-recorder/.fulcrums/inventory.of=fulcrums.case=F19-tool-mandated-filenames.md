# F19 — `AGENTS.md` / `CLAUDE.md` under `.agent/.actors/`

- **the fork:** keep the all-caps names · lowercase them
- **taken:** keep. claude code loads `CLAUDE.md` by that exact name (and `AGENTS.md` for the
  agents convention); a lowercase file is never read. the files are stamped by `rhachet` actor
  setup, not authored by this wish — the exemption `rule.forbid.shouts` asks to document is the
  loader's contract
- **rework:** clean — but a rename breaks the loader, so it is no real option
- **confidence:** 95%
- **where:** `.agent/.actors/actor.via.slug=.default/brain/.claude/`; peer r9 nitpick.2
- **verdict:** —
