# define.invariant.eco.quant-informs-opine

## .what

a quant INFORMS an opine. it never overwrites one. every field on an `eco.priority` belongs to
exactly one of two families, and the direction between them is one-way:

| family | fields | what it is |
|---|---|---|
| quant | `gain` · `cost` · `asks` | MEASURED — a number you would defend, or one the store counted for you |
| opine | `sev` · `urg` | JUDGED — your claim, the only pair that sets rank order |

`get` ranks by `sev` and `urg` alone, and raises a 🪃 or a ⚖️ beside any row whose evidence
disagrees with your judgment. you re-judge it, or you leave it. the store never decides.

## .kind: nurture

nature permits the opposite — a store could sort by cash-per-hour and be coherent. we choose the
opine for what a quant can and cannot see (below), and would choose it again.

## .the invariant, stated

```
rank(P)          = f(opine.sev, opine.urg)          — and of no other field
quant disagrees  ⇒ a FLAG on the row
quant disagrees  ⇏ any write to opine.sev or opine.urg
```

consequences: `ORDER BY` names sev, then urg, then `asks` as a tiebreak only; a crossed ask rung
returns `askCrossed` (a prompt, never a write); a cash-rank climb returns `quantClimb` (a flag,
never a re-sort).

## .why

a quant is NARROW by construction, and the narrowness is not visible in the number. `asks`
counts a human who reached for the record, not an occurrence of the defect — no instrument here
watches for one. `gain.cash` and `cost.time` fill two cells of a 3×2 matrix
(`define.cost-gain-matrix`); the other four are real and uncounted. a rank driven by quants
alone would rank by whatever happens to be countable, and would systematically promote cash work
over work nobody has a unit for. the human holds the rest; `opine` is where they put it.

## .the counter-argument

WSJF (value ÷ job size, Fibonacci-scored, the quotient sorts the backlog) is a real, widely used
method that would be less work. it buys a rank nobody can quietly bias. what it costs: it folds
time-criticality into the numerator, so urgency competes with cash on one axis — and a method
that needs three scores before an item enters the rank would keep out a priority whose whole
evidence is a human's judgment.

## .what would overturn it

nurture, so overturnable by evidence: the matrix fills out (if most rows measure `gain.time`,
`gain.rank`, `cost.rank` too, a quotient rank becomes defensible); the flags go unread (⚖️ fires
repeatedly and nobody acts on it — the opine then holds inertia, not judgment). a flag that was
right would NOT overturn it — that is the mechanism at work.

## .scope

binds the rank and the write path. does not claim opines are more accurate than quants, nor that
a human should ignore a flag — to re-judge after a ⚖️ honors the invariant exactly, since the
human made the write. does not bind filters — `get --sev p1` narrows by an opine because that is
what was asked, no rank computed.

## .enforcement

- a code path that writes `opine_sev` or `opine_urg` from a quant = **blocker**
- a quant promoted into the primary sort key = **blocker** (`asks` as the third tiebreak is the
  deliberate bound)
- a flag rendered as a verdict rather than a prompt = **nitpick**

## .see also

- `howto.read-eco-priority-flags.md` — the flags this invariant produces, and how to act on each
- `term=eco.quant._.choice._.md` · `term=eco.opine._.choice._.md` — the two words
- `term=eco.ask._.choice._.md` — why `asks` counts a reach rather than an occurrence
- `define.cost-gain-matrix.md` — the 3×2 the quants only partly fill

---

written by human + beaver 🦫
