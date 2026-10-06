# define.invariant.eco.cost-rolls-up-and-sums

## .what

a whole's cost is its own cost plus the cost of every DISTINCT goal beneath it — and it is two
totals, never one: what it costs to CLAMP the whole, and what it costs to SOLVE it. gain travels
down and sums across parents; cost travels up and sums across the distinct set. the two mirror
each other, and one has a trap the other does not.

## .kind

**nature** on the direction and the sum — a whole completes only when every part does
(`a-part-gates-its-whole`, itself nature), so the price of the whole necessarily includes the
price of every part; to do N parts costs what each costs, added. **nurture** on the split — a
store could carry one cost column and be coherent; we carry two because one figure cannot answer
the only two questions a human asks of a tree (`define.eco.solve-vs-clamp`).

## .the invariant, stated

```
descendants(G)   =  every goal beneath G, DISTINCT — a shared child appears ONCE

cost.solve(G)    =  Σ  cost.own(D)    over  D ∈ {G} ∪ descendants(G),  kind(D) = solve
cost.clamp(G)    =  Σ  cost.own(D)    over  D ∈ {G} ∪ descendants(G),  kind(D) = clamp

cost(G)          =  ⛔ undefined.  there is no single number
```

a leaf has no descendants, so its rollup is its own `quant.cost` — the recursion terminates. the
graph is acyclic by refusal at write time, and the FK guarantees every descendant edge resolves
(`a-surgoal-must-be-declared-first`), so a rollup cannot silently drop a branch it could not
reach.

## .the asymmetry with gain

| | direction | across a shared child |
|---|---|---|
| gain | down, parent → child | SUMS — a child that serves two roots carries both roots' gain |
| cost | up, child → parent | COUNTS ONCE — you build it once, pay once |

you pay a shared goal's cost one time; you reap its gain in every root it serves. that asymmetry
is the entire arithmetic behind "one stone, many birds" — `gain per cost` rises, by construction,
with each additional parent.

⚠️ so the two rollups take different shapes, and a symmetric implementation is a defect. gain
sums over edges (a goal with three parent paths draws three times); cost sums over distinct nodes
(counted once). an implementation that walks edges for both double-counts every shared branch's
cost.

## .why split by kind

a human asks a tree two questions one number cannot answer: "what does it cost to stop the
bleed?" (`cost.clamp`) and "what does it cost to make this go away?" (`cost.solve`). the pair is
what makes a sequence decision legible:

```
subrock://sandpine.decost/sms-waste
  ├─ cost.clamp   2h      ⇒ bound the horizon this afternoon
  └─ cost.solve   3w      ⇒ schedule the repair
```

a blended figure (`3w 2h`) answers neither — too large to justify the afternoon, too small to
plan the quarter — and it makes the clamp look expensive, so a reader declines two hours of real
work. the split keeps a cheap bound off its solve's price tag.

## .what it does NOT settle

- **a whole with a clamp and no itemized solve has a `cost.solve` that is a LIE** — the sum omits
  the work that matters and returns a small, confident, wrong number. an absent solve must render
  `unknown`, never a total — a rollup over an incomplete set reported as a fact about the whole.
- **does `cost.own` on a whole double-count its itemized parts?** unsettled; likely repair:
  `cost.own` on a non-leaf is a placeholder the rollup discards once any part exists.
- **does an opine roll up?** no — not open. `sev`/`urg` are human-authored
  (`rule.forbid.fabricated-opines`); quant rolls, judgment does not.

## .the counter-argument

two cost columns is twice the record work, and most goals are one kind or the other — a single
`quant.cost` plus a `kind` tag could derive both totals with a filter. correct about storage,
wrong about the render: both figures must be computed and shown, whether in two columns or one
column plus a predicate is an implementation choice this invariant does not bind.

## .what would overturn it

- the direction — a whole that completes with an unfinished part would overturn `a-part-gates-its-whole` first
- the distinct-set rule — a shared goal genuinely built twice would mean it was two goals under one slug
- the split (nurture) — evidence humans read a blended figure correctly in practice

## .enforcement

- a cost rollup that sums over edges rather than distinct nodes = **blocker**
- a single blended `cost` returned for a whole = **blocker**
- a `cost.solve` returned as a number where no solve is itemized = **blocker** (report `unknown`)
- a rollup figure rendered indistinguishably from a measured `cost.own` = **blocker**
- a sev or urg that rolls up = **blocker**

## .see also

- `define.invariant.eco.gain-propagates-down-and-sums` — the mirror; read together
- `define.eco.solve-vs-clamp` — the kind this rollup splits on
- `define.invariant.eco.a-part-gates-its-whole` — the nature fact the direction follows from
- `define.cost-gain-matrix` — the ratio these denominators feed
- `term=partial-audit._.choice._.md` — what an incomplete rollup becomes as a reported total

## .upstream

⚠️ the store does not yet implement the rollup — the `kind` column lands with this brief; the
two totals are owed. until they land, every total in any render is computed by hand and must say
so.

---

written by human + beaver 🦫
