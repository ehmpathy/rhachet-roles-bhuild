# domain.term: prioritized

term.chosen   = prioritized
term.kind     = adj
term.boundary = eco
term.synonyms.forbidden:
- wanted
- important
- ranked
- graded
- rated
- weighted

## .what

the state of an `eco.priority` that carries an opine — **the org wants it, at a stated
severity and urgency.** it is a judgment of worth, held in `opine.sev` and `opine.urg`. every
row in the store is prioritized by construction; the word names the WORTH half of a row, in
contrast to the RESOURCE half (`sponsored`).

## .what it is FOR

> **prioritized answers "is this worth the work, and how soon?"**

it is the opine, and the opine alone sets the rank among unsponsored rows: sev first, then
urg, then the quants as a tiebreak. a prioritized row is one the org has judged worth a place
in the queue — regardless of whether a human has yet committed budget to it.

## .the pair

`prioritized` : `sponsored` :: the org wants it : a human pays for it now. the two are
orthogonal claims on one row, and they answer different questions — worth vs resource. a p0
can sit prioritized-but-unsponsored; a p2 can be both. read them together —
`define.prioritized-vs-sponsored`.

⇒ the distinction matters because a reader who conflates them picks work off the top of the
opine list and spends the grove's scarce budget on what the org WANTS rather than on what a
human FUNDED.

## .refs

- `.agent/repo=bhuild/role=prioritizer/skills/work/ecowork.db.schema.mjs` — the `opine_*` columns ·
  `ecowork.db.read.mjs` — the opine half of `ORDER_BY`
- `.agent/repo=bhuild/role=prioritizer/briefs/define.prioritized-vs-sponsored.md`
- `term=eco.opine._.choice._.md` — the field that holds the judgment this word names

## .reason

- `term=eco.prioritized._.choice.reason.md`
