# domain.term.choice.reason: sponsored

## .etymology

from **sponsor** — one who takes on the cost of a project. a sponsor pays; that is the whole
sense. the word carries the **commitment of resource** inside it, which is exactly the
property that parts it from the opine. an opine is a claim about worth; a sponsor is a party
who spends.

⇒ so `sponsored` reads as *"a human put their budget on this"*, never *"someone likes this"*.
the budget is the point.

## .why not the rejected words

| rejected | why |
|---|---|
| `funded` | the closest, and it fails on tense: a row is not a fund that holds money. `sponsored` names the ACT a human took, not a pool of cash. also `fund` collides with the cash quants (`quant.gain.cash`) |
| `starred` | names the GLYPH (⭐), not the concept. a term that names its own render is the `body`/`stdout` trap — the marker is `star`, the state is `sponsored` |
| `focused` | too soft. focus is attention; sponsorship is budget. a human can attend to a row with no token spent on it |
| `pinned` / `flagged` | both name a UI gesture with no cost behind it. a pin says *"keep this visible"*; sponsorship says *"I pay for this"* |
| `championed` / `backed` | name advocacy — a person who argues FOR a row. that is closer to a raise of the opine than to a spend of the budget |
| `boosted` | implies a temporary rank nudge, which invites a reader to treat it as a tunable weight rather than a committed resource |

🔴 **`funded` is the near miss worth the record.** it reads well against a sponsored row and
fails on grammar: the row is sponsored (a state a human conferred), it is not itself funded (a
pool it holds). the same shape as `starred` — one names the act, the near-miss names a thing
the row is not.

## .evidence

### the discovery — the wisher's own split, 2026-09-13

> "lets enbrief the distinction between prioritized vs sponsored; prioritized is the org wants
> it. sponsored is some human has authorized their budget on it (time review, cash tokens +
> compute)"

one sentence, and it settled both the word and its sense. the trigger was a request to mark
the focus rows:

> "can we mark them in priorities db with :stars: to show that they're currently marked as the
> ones to focus on ?"
> "i.e., actively prioritized above all else. lets ensure the priorities db can support this
> 'sponsored' star column"

⇒ *"above all else"* is the rank claim, and *"authorized their budget"* is why: the scarce
resource on a token-capped grove is a human's spend, so the funded rows sequence first.

### why it is orthogonal to the opine, not a fifth severity

severity grades the harm if the work never lands — a property of the problem, true whether or
not anyone funds a fix. sponsorship grades whether a human committed the scarce input a fix
consumes — a property of the moment. the two vary independently: a p0 sits unsponsored, a p2
is sponsored. to fold them into one number loses the exact distinction a token-capped grove
needs — which is why `sponsored` is its own column, ranked ahead of the opine rather than
merged into it.

### the boundary

`eco`. "sponsored, of WHAT?" → of an `eco.priority`. one word, so
`rule.require.boundary-qualified-terms` is satisfied at authorship rather than after a
collision.

## .disputes

none raised.
