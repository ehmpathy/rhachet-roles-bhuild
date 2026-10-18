# F19 — verification gets the scouts-honor SELF gate, and not the peer lane

## the fork

the wisher asked for a self reviewer at execution **and** verification that forbids a deferred
dream which should have been fixed forward. that shipped as `has-fixed-forward-adjacent-fixes`.

it leaves an asymmetry the route did not have before:

| stone | peer `scouts-honor-fix-forward` | self `has-fixed-forward-adjacent-fixes` |
|---|---|---|
| `1.vision` | ✅ | ❌ |
| `5.1.execution` | ✅ | ✅ |
| `5.3.verification` | ❌ | ✅ |

## the alternatives, stated fairly

1. **self only at verification** — as shipped
2. **add the peer lane at verification too** — symmetry with execution, +1 paid lane per route
3. **add the self gate at vision too** — symmetry the other way, $0, and vision has no dreams yet

## taken, and why at the time

**option 1.**

- a self gate **cannot be overruled** (`rule.always.bear-every-self-review`) where a peer lane can
  exhaust or be overruled. at the LAST stone that can still do the fix, the unoverridable
  instrument is the stronger one
- it costs **$0** — a self review is the driver's attention, never an LLM lane
- option 2 adds a paid lane to a stone that already carries 14 peer lanes, and it would grade the
  dreams a self gate just walked one step earlier

🔴 **option 3 was rejected on a measurement, not on taste:** at vision the route has written no
code, so `$route/dreams/` is near-empty and the gate intersects to zero files. the peer lane there
is cheap for the same reason, and it is already present.

## rework, and why

**clean.** one `- slug:` block. a self gate adds no budget, mints no `.given`, and nothing
downstream keys to it.

## confidence, and why it is not higher

**84%.** the 16% is that I chose between a self gate and a peer lane on a **cost** argument when
the wisher's ask named the self one explicitly — so the fork may not be a fork at all, and this row
may record a decision that was already made for me. it is filed because the ASYMMETRY is mine: the
wisher asked for execution + verification, and vision's absence from the self column is a call I
made with no instruction.

## where

`5.1.execution.from_vision.guard` · `5.1.execution.phase0_to_phaseN.guard` ·
`5.3.verification.guard` — the `- slug: has-fixed-forward-adjacent-fixes` block in each.

clamped at `initBehaviorDir.integration.test.ts` `[case12]`, teeth proven: a revert of the slug at
`5.3` turns the clamp red.

## the verdict

open.
