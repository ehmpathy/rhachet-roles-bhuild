# domain.term.choice.reason: eco.ask

## .etymology

from the wisher, 2026-09-13, as a challenge to the word the store shipped with:

> "asks instead of hits ? i.e., how many times its been asked"

⇒ the question names the whole argument. the store counts `set` calls. a `set`
call is a human who **reached for** the record. `hits` names an occurrence of
the defect and measures a reach for a record — two different events, one word.

## 🔴 .why `hits` was wrong, precisely

it is a **false report** in the reader-inference family
(`term=false-report._.choice._.md`): the number is correct about its own
question and false about the caller's.

| the number | is a true count of | reads to a human as |
|---|---|---|
| `hits: 3` | three `set` calls | three times the defect bit someone |

no instrument in this repo watches a defect fire. so the second sense is not
merely unsupported — it is **unobtainable**, and a word that implies it makes a
promise the schema can never keep.

⚠️ and the failure is silent by construction. a `hits` count looks exactly like
an occurrence count, and the two only diverge in a direction nobody can see.

## .why `ask` survives its collision

`ask` is already declared at the DUCT layer, with a narrow sense in a four-way
taxonomy of supervisor→clone messages:

| duct term | transfers |
|---|---|
| `nudge` | MOTION |
| `steer` | a ROUTE |
| `ask` | a THOUGHT |
| `escalate` | a DECISION |

and that term carries an **OPEN dispute** (raised 2026-09-03, against telepath's
wider sense in `ehmpathy/rhachet-roles-bhrain#407`) whose own note reads: *"one
word, two senses, at two layers — which is the `--mode` overload's exact shape."*

⇒ so a naive third sense would be a real `rule.forbid.domain-term-ambiguity`
violation, and a blocker.

🔴 **the boundary segment is what makes it legal, and it is the repair the open
dispute already proposes.** `rule.require.boundary-qualified-terms` holds that a
word with two senses at two layers is not an overload once each sense carries
its ancestry — the flat namespace has one slot per word, a qualified one has as
many as the domain does.

| term | boundary | sense |
|---|---|---|
| `duct.ask` | duct | a message that hands a clone the work of an answer |
| `eco.ask` | eco | one reach for a priority record |

⇒ this term is filed qualified **from birth**, which means the duct one is now
the only flat member of the family — and that is a strictly better position for
the dispute than the one it was in.

## .why not the alternatives

| rejected | why |
|---|---|
| `hits` | see above — claims an occurrence, counts a reach |
| `occurrence` | names the very event no instrument measures. the honest failure, stated outright |
| `encounter` | same defect as `hits`, one syllable longer |
| `count` | the genus. every quant is a count of one event or another |
| `frequency` | a rate, and this is a total. a rate needs a window the record does not carry |
| `bite` | vivid, and it names the defect's action rather than the human's |
| `raises` | 🟡 the strongest runner-up. this repo already says "raise a blocker" and "raised 2026-09-03", so the word is discovered rather than invented. rejected only because the wisher named `asks`, and it is their vocabulary. the rework stays clean — one column, one constant |

## .evidence

### the timeline that motivated the whole axis

a `grepsafe` defect, re-encountered three times and independently re-filed:

| date | event | asks | rung | prompt |
|---|---|---|---|---|
| 2026-08-29 | seeded as `#598` | 1 | 1 | — |
| 2026-09-04 | re-encountered, seeded **again** as `#622` | 2 | 2 | ⚠️ fires |
| 2026-09-13 | re-encountered a third time | 3 | 3 | 🪃 fires |
| *(next)* | a fourth ask | 4 | 3 | **silent** — 4 is not a rung |

🔴 **the duplicate seed IS the signal.** `#622` exists only because its author
searched, did not find `#598`, and filed the same defect twice. an independently
re-filed defect is by definition one that recurs AND whose record is unfindable.

⇒ note what the table proves and what it does not. it proves three **asks**. the
defect itself may have fired far more often, and the store has no idea. that gap
is exactly why the word had to change.

### the ladder, verified 2026-09-13

run against `/tmp/eco.v2.db`: ask 1 silent, ask 2 → `askCrossed: 2`, ask 3 →
`askCrossed: 3` and `askRung: 3`, and `get` returned the row with a rung-3 mark.

## .disputes

### dispute: raises — raised 2026-09-13 — status: OPEN

- raised.by = beaver, at authorship
- claim     = `raises` is this repo's own word for the act ("raise a blocker",
              "dispute raised 2026-09-03"), so it is discovered rather than
              adopted, and it carries no collision with an extant term
- counter   = `asks` was named by the wisher, and the glossary binds contracts,
              never the wisher's speech. the collision it does carry is fully
              settled by the boundary segment, and the qualification improves the
              extant `duct.ask` dispute rather than worsens it
- resolution = unsettled. the rework is one column and one constant while the
              table is small; it grows dirty once a real `.eco/priority.db`
              carries rows
