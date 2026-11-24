# F5 — which gate grades the rule

## .the fork

- (a) a self-review `has-restated-the-wisher-how` only, on `1.vision.guard.{light,heavy}` and `2.1.criteria.blackbox.guard.heavy`
- (b) a peer review lane `wisher-how` that loads the rule and counts blockers, on the vision guards; the self-review on all three guards
- (c) a peer lane on the criteria guard too

## .taken — (b), and why

a read of `src/domain.operations/behavior/init/templates/`: no guard's `--rules` glob reaches any `behavior.wish/` rule. so under (a), the rule's blocker levels would be graded by no reviewer at all: a blocker on paper. the vision guards already gate on `reviewed? --allow-blockers 0`, so a peer lane there turns a blocker into a held stone. the lane copies the extant `dimensional-decomposition` lane: `--mode hard`, one rule, `$route/0.wish.md` at refs, `budget: 3`, `level: 1`.

the self-review stays on all three guards, because it prompts the writer to apply the strike test before the peer lane runs.

not (c): `2.1.criteria.blackbox.guard.heavy` has `peer: []` and no `judges:`. a lane there would count blockers that gate naught, so it would need a new judge as well. that changes how the criteria stage gates, which the wish does not ask for.

## .rework — clean

one guard block per vision variant. to drop it is one delete per variant.

## .confidence — 75%, and why it is low

the lane adds one brain call to every vision stone of every route. the council may judge the self-review enough.

## .where

`src/domain.operations/behavior/init/templates/1.vision.guard.{light,heavy}` · `2.1.criteria.blackbox.guard.heavy`

## .verdict

approved with 1.vision by the director; a clean rework the commander may still strike at the pr
