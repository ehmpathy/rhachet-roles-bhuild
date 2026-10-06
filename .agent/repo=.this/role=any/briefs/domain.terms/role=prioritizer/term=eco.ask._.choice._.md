# domain.term: ask

term.chosen   = ask
term.kind     = noun
term.boundary = eco
term.synonyms.forbidden:
- hit
- occurrence
- encounter
- count
- frequency
- bite

## .what

an **eco.ask** is one event where a human REACHED for a priority — one
`eco.priority set` of a given slug. `quant.asks` is the tally of them.

it is the only field on the record that nobody types. the store counts it.

## .what it does NOT mean

🔴 **an ask is not an occurrence of the defect beneath it.** no instrument here
watches for one. a defect can fire fifty times and produce a single ask, or
produce three asks in a week it never fired at all.

⇒ so `asks` is honest about what the number is: **how many times a human asked
for this to be ranked.** that is a weaker claim than "how often it bites", and
it is the claim the data supports.

## .the ladder

`1 2 3 5 8 13` — fibonacci, for the same reason `opine.sev` is: 4 asks and 5
asks say the same about a priority, and 1 and 13 do not.

- a crossed rung **prompts** a human to re-judge `opine.urg`, and never rewrites
  it (`term=eco.quant` — a quant informs an opine)
- it fires **once per rung**, never on every set past it
- 🪃 marks a row at rung 3 or higher: the third ask is the first that is
  evidence of a pattern rather than noise

## .why the boundary segment is mandatory here

`ask` is ALREADY declared at the duct layer — `term=ask._.choice._.md`, a
supervisor's message that hands a clone the work of an answer. that term carries
an OPEN dispute (raised 2026-09-03) against a third, wider sense in telepath.

⇒ so this term is `eco.ask`, never a bare `ask`, and it must never be cited
without its segment. see the reason file for why the qualifier settles the
collision rather than deepens it.

## .refs

- `.agent/repo=bhuild/role=prioritizer/skills/work/ecowork.db.schema.mjs` — `quant_asks`
- `.agent/repo=bhuild/role=prioritizer/skills/work/ecowork.db.vocab.mjs` — `ASK_RUNGS`, `getAskRung`
- `.agent/repo=bhuild/role=prioritizer/skills/work/ecowork.sh` — the 🪃 flag, the rung prompt

## .reason

- `term=eco.ask._.choice.reason.md`
