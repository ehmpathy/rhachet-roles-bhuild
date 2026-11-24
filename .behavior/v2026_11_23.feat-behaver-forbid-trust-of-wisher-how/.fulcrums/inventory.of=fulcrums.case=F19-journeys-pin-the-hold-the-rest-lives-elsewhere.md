# F19 — the held-stone journeys pin bhrain's whole render of the hold; the rest is proven elsewhere

## .the fork

5.3 peer review i003 raised six nitpicks on the `[case2.*]` held-stone journeys:

- r10 n1: light runs only the held path, not a clean pass
- r11 n1: bhrain renders one state as `awaits arrival` and as `awaits l1 terminal`
- r11 n2: the snap holds the raw judge box (empty frame labels, a verdict repeated)
- r11 n3: `[case2.light]` and `[case2.heavy]` snaps match but for their keys
- r11 n4: no recovery step after the hold; the hold's `reason` names no lane
- r11 n5: the criteria `has-restated-the-wisher-how` self-review never shows in a journey

- (a) trim the snaps to a slice, merge the variant snaps, add a light clean pass and a recovery step,
  and walk the criteria self-review live
- (b) keep the journeys as they stand

## .taken — (b), and why

- **whole render, as every journey here does.** each extant journey snaps the full
  `asCallOutput` of the call. the hold's box, labels, and repeats are bhrain's render, and this
  repo does not own it; a slice would hide a bhrain change that a driver meets
- **both variants, at a reviewer's ask.** 5.3 i001 `ergo-contract-snapshots` nitpick.1 asked for the
  light hold; the two snaps match because the lane is byte-identical, which the parity snap in
  `initBehaviorDir.integration` already states. a merged snap would no longer prove light runs
- **the allowed path is the recovery shape.** `[case1]` of each journey walks the heavy route to
  `passage = allowed`; the lane block is identical on light, so a light clean pass proves no new
  connection. the `reason` text is bhrain's judge output
- **the criteria self-review is read, not walked.**
  `rule.forbid.live-review-rosters-in-acceptance-journeys` stubs every roster in the journeys; the
  criteria block is snapped whole in `initBehaviorDir.integration`, and the roster shape is checked
  in `skill.init.behavior.guards.integration.test.ts`

## .rework — clean

each item of (a) is an add or a trim inside the two journey files and their snaps.

## .confidence — 80%

the residue: the snap diff is long, and a reader pays for its repeats.

## .where

`blackbox/role=behaver/skill.init.behavior.guards.journey.{vision,blueprint}.acceptance.test.ts`

## .verdict

open — flagged for the pr
