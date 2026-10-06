# domain.term.choice.reason: quant

## .etymology

from **quantity** — a value with a magnitude and a unit. the clip to `quant`
buys two properties the full word does not:

- it is **four letters**, so `quant.gain` and `opine.sev` line up in a render
  and a reader sees the two families as a pair rather than a list
- it reads as a **noun for the field**, not for the act. "a quant" names a
  column on one row; "a quantity" names an amount of whatever else is at hand

## .why not the rejected words

| rejected | why |
|---|---|
| `metric` | names an instrument, not a field. a metric is emitted and charted; a quant sits on one row |
| `measure` | the verb and the noun are the same word, so `measure.gain` reads as an imperative (`rule.forbid.domain-term-ambiguity`) |
| `fact` | too strong. `quant.gain` is often an ESTIMATE — "about $150/mo" — and the word must not claim more than the data does |
| `signal` | already carries a sense in this repo's fleet vocabulary (a cue a supervisor reads off a poll) |
| `score` | implies a derived composite. a quant is an input, never a verdict |
| `stat` | statistics summarize a population; a quant describes one item |

`fact` is the near miss and the instructive one. it fails on the same axis
`hits` failed on for `eco.ask`: **a word must not claim more than the number
supports.** an estimated gain is defensible, not certain, and `quant` says
exactly that — it has a magnitude, and it makes no claim about its provenance.

## .evidence

### the discovery — the wisher's own split, 2026-09-13

the word arrived as a correction, in five messages, after a proposal to rename
`hits` to `asks`:

> "and yeah, asks = a quant, the rest = an opine"
> "urg and sev gets informed from the quants like asks"
> "but also like gain & cost estimates"
> "which we should also track"
> "as quant.{gain,cost,asks} vs opine.{sev,urg}"

⇒ the taxonomy was **not** derived from the schema. the schema was rebuilt to
match a distinction the wisher already held, which is what
`def.domain-discovery` calls a discovery rather than an invention: the term was
already in the domain and the code had no word for it.

### the defect it names — measured 2026-09-13

before the split, the store shipped a field called `hits` that sat in the same
flat namespace as `sev` and `urg`. a reader had no way to tell that two of the
three were opinions and one was a count. and the sort placed all three in one
`ORDER BY`, which reads as though they are commensurable. they are not.

the split makes the incommensurability **visible in the shape**, so a future
edit that sorts by a quant has to move it out of the quant family first — which
is the moment a human would notice the change of kind.

### the boundary

`eco`, because `quant` is a field family on an `eco.priority` and carries no
sense outside it. a bare `term=quant` would be a flat term in a repo that
already has `grove.saturation` and `duct.box.*` — and
`rule.require.boundary-qualified-terms` answers "quant, of WHAT?" in one word.

## .disputes

none raised.
