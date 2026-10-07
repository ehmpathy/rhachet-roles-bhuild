# define.eco.solve-vs-clamp

## .what

every goal aimed at a problem does one of two things to it: REMOVES it, or BOUNDS it. different
acts, different costs, different delivered quantities — the store names which.

| | 🔨 **solve** | 🗜️ **clamp** |
|---|---|---|
| what it does | removes the problem at cause | bounds the problem where it is |
| after it lands | bleed stops | bleed continues, capped |
| delivers | the cost, removed | the variance, removed |
| typical cost/latency | high/long | low/short |
| problem persists? | no | yes |
| discharges the goal? | yes | no |

a solve is the repair. a clamp is the bound around a problem not yet repaired — a cap, a
detector, an alert, a quota, a timeout, a regression test.

## .worked pair — twilio waste

| row | kind | what it does |
|---|---|---|
| `sms-waste-alert` | 🗜️ clamp | learn of a spend anomaly within a day instead of at the next invoice |
| `sms-waste-audit` | 🔨 solve | find what bleeds, and stop it |

the alert removes no waste, not one cent. it removes the **unbounded tail** — before:
`rate × (time until noticed)`, unknown; after: `rate × 1 day`, known. that is the whole value of a
clamp: it does not shrink the rate, it truncates the horizon.

## .why it earns its own dimension

1. **the two gains are different quantities** — a solve's gain is cash per period, removed; a
   clamp's gain is exposure, truncated. to sum them is to add a rate to a duration-times-rate
   (the same category error `rule.forbid.sev-from-cash-alone` already forbids, one level up)
2. **gain/cost ranks correctly only if the kind is visible** — a clamp is cheap and fast, so it
   usually wins on gain-per-cost (`define.cost-gain-matrix`), often rightly: take the cheap bound,
   buy time, schedule the repair. but a rank blind to kind stacks clamp after clamp at the top and
   buries the solve beneath
3. **a clamped problem reads as a closed one** — the alert ships, the row goes `done`, the
   dashboard is green, but the waste is still there at the same rate, and no row says a solve is
   owed. a clamp with no solve behind it in the tree is a silent open cost dressed as closed work.

## .the relation between a clamp and its solve

a clamp is NOT a part of its solve. a part must complete for its whole to complete
(`define.invariant.eco.a-part-gates-its-whole`); a clamp does not have to exist for the solve to
land. both are parts of the **problem**, which is the whole:

```
subrock://sandpine.decost/sms-waste            the problem            (the whole)
  ├─ .../sms-waste/alert       🗜️ clamp       bound the horizon
  └─ .../sms-waste/audit-fix   🔨 solve       remove the rate
```

the whole is not discharged when the clamp is — `partsOpen` already computes that correctly; the
kind just makes the reason visible.

## .the test

"after this lands, is the problem GONE, or merely BOUNDED?" gone → solve. bounded, capped,
detected, or merely visible → clamp. can't tell → the goal is not decomposed enough to
prioritize yet.

"it reduces the cost a lot" is a SOLVE, not a clamp — a partial repair still attacks the rate; a
clamp leaves the rate untouched and attacks the exposure window. the discriminator is which term
of `rate × window` moved, never how much.

## .caveat — a clamp is not lesser work

a clamp is often the correct first move: lands in a day where the solve takes a month; caps the
loss while the solve is built; often produces the measurement the solve needs to be designed at
all. an unclamped unsolved problem is the worst state. the mandate is not "prefer solves" — it's
"say which, so the other is not forgotten."

## .enforcement

- a goal aimed at a problem, with no kind declared = **blocker**
- a clamp marked `done` where no solve for the same problem exists in the store = **blocker**
- a clamp's gain summed with a solve's gain into one figure = **blocker**
- a clamp filed as a part of its solve via `--goal` = **blocker**
- a partial repair filed as a clamp = **nitpick**

## .see also

- `define.invariant.eco.cost-rolls-up-and-sums` — the peer that splits the rollup by this kind
- `define.invariant.eco.gain-propagates-down-and-sums` — gain goes the other way
- `define.invariant.eco.a-part-gates-its-whole` — why a clamp is a peer, never a part
- `define.cost-gain-matrix` — the ratio a clamp reliably wins, and why that is a trap
- `rule.forbid.sev-from-cash-alone` — the same category error, one level down
- `rule.require.clamp-edge-cases` (ehmpathy/mechanic) — the word's origin

---

written by human + beaver 🦫
