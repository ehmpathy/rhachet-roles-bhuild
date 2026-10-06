# domain.term: sponsored

term.chosen   = sponsored
term.kind     = adj
term.boundary = eco
term.synonyms.forbidden:
- funded
- starred
- focused
- pinned
- flagged
- championed
- backed
- boosted

## .what

a boolean field on an `eco.priority`. **TRUE means a human authorized their budget —
review time, cash tokens, compute — on this row.** it is a commitment of scarce resource,
not a judgment of worth.

## .what it is FOR

> **a sponsored row tops the rank, above every unsponsored one, regardless of sev·urg.**

that is the privilege the word confers. `ORDER_BY` sorts `sponsored DESC` first, then the
opine. on a token-capped grove the scarce input is a human's authorization to spend, so the
work a human funds sequences ahead of the work the org merely wants.

⇒ so a sponsored p2 sorts above an unsponsored p0. the p0 is not demoted in worth — it heads
the UNSPONSORED set — but the p2 is the work in flight, because a human's budget is already
on it. it renders with a ⭐ at the head of the row.

## .the pair

`prioritized` : `sponsored` :: the org wants it : a human pays for it now. orthogonal
claims, both on one row. prioritized is the opine (sev·urg); sponsored is this flag. read
them together — `define.prioritized-vs-sponsored`.

## .refs

- `.agent/repo=bhuild/role=prioritizer/skills/work/ecowork.db.schema.mjs` — `sponsored` column, the
  migration + index · `ecowork.db.read.mjs` — the `sponsored DESC` head of `ORDER_BY`
- `.agent/repo=bhuild/role=prioritizer/skills/work/ecowork.sh` — `--sponsor` / `--unsponsor`,
  the ⭐ in the rank render and the rootstruct render
- `.agent/repo=bhuild/role=prioritizer/briefs/define.prioritized-vs-sponsored.md`

## .reason

- `term=eco.sponsored._.choice.reason.md`
