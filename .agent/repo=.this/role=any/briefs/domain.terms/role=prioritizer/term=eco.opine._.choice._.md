# domain.term: opine

term.chosen   = opine
term.kind     = noun
term.boundary = eco
term.synonyms.forbidden:
- judgment
- opinion
- call
- claim
- grade
- assessment

## .what

an **opine** is a field on an `eco.priority` whose value is a HUMAN'S CLAIM —
asserted, defensible, and owned by the person who typed it.

two today: `opine.sev` (how bad it is if unfixed) and `opine.urg` (by when it
stops to be worth it).

## .what it is FOR

> **the opine, and the opine alone, sets the rank order.**

that is the privilege the word confers. `get` sorts by `opine.sev`, then
`opine.urg`, and the quants sort last as a tiebreak. an opine can be wrong, it
can be stale, and it still wins — because it is the only field that holds what
no instrument here can count.

⇒ so an opine is never auto-written. a quant that disagrees with one raises a
mark and stops there.

## .the pair

`opine` : `quant` :: judged : measured. the two names are near-symmetric in
length and shape on purpose, so a render can stack them and a reader sees a
pair rather than a list (`rule.prefer.symmetric-term-pairs`).

## .refs

- `.agent/repo=bhuild/role=prioritizer/skills/work/ecowork.db.schema.mjs` — `opine_*` columns · `ecowork.db.read.mjs` — `ORDER_BY`
- `.agent/repo=bhuild/role=prioritizer/skills/work/ecowork.sh` — the `opine ─` render line

## .reason

- `term=eco.opine._.choice.reason.md`
