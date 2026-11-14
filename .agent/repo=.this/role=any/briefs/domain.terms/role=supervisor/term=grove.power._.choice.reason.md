# domain.term.choice.reason: grove.power

## .etymology

`power` names the **motive**: the one job aws still has for a grove, which is to switch its
box on. an operator says "power it up" and "it has no power switch"; the word needs no gloss.

### why not `cloud` or `provider`

they name **where** the box lives, not what the supervisor can do to it. the route that coined
this term (`v2026_11_13.feat-supervisor-reach-over-tailnet`) removed every reason the supervisor
had to know a grove's cloud: reach is the tailnet for all. what is left is one question, *"is
there a lever to switch it on?"*. a box in aws that never hibernates would answer `none` in
spirit while `cloud` would still say aws, so `cloud` would mislead.

### why not `type`

the rows already hold `type: ec2`. that is a fact about the machine, read by other skills;
`power` is derived from `account`, the field the aws legs need to find the box. two words keep
two facts apart.

this invariant is new with this route, not found in the prior code: the single-axis wake ran
its aws legs for every row and checked `account` only when present. so a row that says
`type: ec2` and holds no account is refused as contradictory, with the fix to name its account,
rather than read as power `none` — a box that sleeps must never be told it has no lever.

## .evidence

### the decomposition

the vision walked 8 axes (`1.vision.experience.dimensions.md` in that route). power was the
first; every cell on `power = none` × `grove state = asleep` is **impossible** (a box with no
lever does not sleep), which is the invariant this term carries.

### invariants

- `power = aws` ⟺ the row holds a non-empty `account`
- `type = ec2` ∧ no `account` ⇒ the row is unreadable (ConstraintError), never power `none`
- `power = none` ⇒ wake runs no aws call
- `power = none` ∧ alias on disk ⇒ the no-answer cure never names `git.grove.wake`
- `power = none` ∧ no alias on disk ⇒ the cure names the wake as the alias writer, first, and says it touches no aws (only the wake writes the alias every crew verb rides)

### measured

2026-11-13, the hetzner grove (`grove-ahbode-hetzner-v20261022-1` on the tailnet) holds no aws
instance; under the prior single-axis wake it died at the keyrack leg. split into power `none`
and tailnet reach, it needs no aws credential at all.
