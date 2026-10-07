# define.invariant.eco.gain-sums-up-never-down

## .what

gain flows UP, from parts to the whole they compose — never down. where a whole carries its OWN
figure, that figure WINS outright; its parts' sum is discarded, never added. a root's figure is
the portfolio figure; a part's figure is its own, whatever it serves.

🔴 this SUPERSEDES `define.invariant.eco.gain-propagates-down-and-sums`, which states the
opposite direction. the reversal is deliberate — the old brief could not answer the arithmetic in
`.why` below. read the old one for the record of what was traded away; do not act on it.

## .kind

| clause | kind | why |
|---|---|---|
| gain sums UP, parts → whole | nature | a whole's value is delivered when its parts complete — that is what a decomposition IS |
| own and children's-sum are ONE quantity, never two | nature | two estimates of one quantity; to add them counts one dollar twice |
| a figure never flows DOWN onto a part | nature | a part stamped with its whole's figure makes every total wrong by construction |
| when both exist, OWN wins | nurture | a direct measurement preferred over a derived one — defensible, reversible, the weakest clause here |
| a derived figure must be MARKED | nurture | a render choice; the alternative is a separate column no total touches |

## .the invariant

```
gain(G)  =  gain.own(G)                        when gain.own(G) is declared
         =  Σ gain(C)   over every child C     otherwise
         =  null                               when neither
```

`children(G)` = every goal whose path parent is `G`, plus every goal that declares `G` as an
extra surgoal — the two halves of the DAG. a leaf with no own figure contributes naught, never
zero. the recursion terminates because the graph is acyclic by refusal at write time; a cycle
reached mid-walk contributes naught rather than an error, so one bad edge cannot fail every read.

## .why — the double-count, as arithmetic

a parent's own figure and its children's sum are two ESTIMATES of one quantity, never two
quantities — to add them counts the same dollar twice. the parts' sum is the whole, measured
from below; the parent's own figure is the whole, measured from above; `own + Σ children` is
`whole + whole`.

what this buys: additivity. the old rule put the parent's figure on the parent AND on every
child, which forced it to forbid a portfolio total outright — the one number a human wants most
could not be computed. up-summation is additive by construction: a root's figure IS the
portfolio figure, and any cut of the graph totals honestly.

## .what it gives up — the N-birds-one-stone signal

the old rule's purpose was that a goal that advances three roots rose on the rank with no
advocate. up-summation removes that: a goal's own rank is now its own figure, whatever it
serves. a multi-parent goal reads identical to a single-parent one on the rank.

open fulcrum, not a settled trade. candidate repair: surface the serve COUNT as a visible rank
input (a goal that advances three roots shows `×3`) rather than a propagated figure. a count is
not a dollar, so it never enters a total, yet carries the old signal. unbuilt — until it lands, a
human who ranks a multi-parent goal must hold the connection in their head.

## .the counter-argument

OWN-wins can be the worse estimate, and discards the better one silently — a root priced
`USD 1000.00` from a gut call, whose children measure `USD 2400.00` from below, reports only
`USD 1000.00`. a bottom-up total from fully-decomposed parts is often better than a top-down
guess, and this rule prefers the guess. the defense: the override is visible — the parent's
absence of a `derived` mark says plainly a human wrote it, so a human can strike the parent's
figure to let the sum through. the real repair, where this bites, is to report BOTH rather than
flip precedence. marked as the weakest clause in this brief.

## .what would overturn it

- the sum-up direction (nature) — a whole whose value is NOT delivered by its parts means it was
  never a decomposition; the repair is the edge, not the rule
- the down-ban (nature) — a use for a parent's figure ON a child that the serve-count cannot
  serve — exactly the open fulcrum above
- own-wins (nurture) — evidence derived sums beat measured own figures often enough to demote the
  human's figure; the repair then is to report BOTH, never flip
- the marked-derived clause (nurture) — a separate stored column no total touches would let the
  mark go

## .enforcement

- a total that adds a parent's own figure to its children's sum = **blocker**
- a figure propagated DOWN onto a part = **blocker**
- a derived figure rendered indistinguishably from a measured one = **blocker**
- a sev or urg that rolls up = **blocker**
- a cycle accepted at write time = **blocker**
- a multi-parent goal with no note of the absent N-birds signal = **nitpick**

## .see also

- `define.invariant.eco.gain-propagates-down-and-sums` — superseded by this brief; kept for its argument
- `define.invariant.eco.cost-rolls-up-and-sums` — the cost side, which rolls up already
- `define.eco.rock-lifecycle-and-treestruct` — the DAG this computes over
- `rule.forbid.fabricated-opines` — why gain rolls and judgment does not
- `define.cost-gain-matrix` — `gain per cost` is what this numerator feeds

---

written by human + beaver 🦫
