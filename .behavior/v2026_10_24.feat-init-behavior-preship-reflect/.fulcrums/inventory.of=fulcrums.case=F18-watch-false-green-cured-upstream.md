# F18 · the `git.release --watch` false green: cured upstream, not in the stone

## .the fork

`git.release --watch` can report done on an empty rollup and never reads `headRefOid` (c23, read
from source: `_watch_pr_transport`, `parse_check_counts`). so a watch run at once after a push can
certify a head no check has run on. where does the cure live?

- (a) in this repo's stone text: the driver re-proves the watch with
  `gh pr view --json headRefOid,statusCheckRollup` (headRefOid = the local head, rollup non-empty
  and green). this was the blueprint's plan, as a stopgap beside a reseed dream
- (b) in the supplier's skill: `rhachet-roles-ehmpathy` `git.release --watch` waits for the pushed
  head, with its own clamp. `6.preship` asks only for the watch green for the pushed head

## .taken

(b), by the director's layer correction (2026-11-04): the false green is a hazard of
`rhachet-roles-ehmpathy` `git.release`, so its cure belongs there. #601 carries no supplier cure.
the cure is the task dispatched to `ehmpathy/rhachet-roles-ehmpathy` (#1149: `git.release --watch`
proves the head sha; shape in `dreams/2026_10_24.reseed-ehmpathy-git-release-watch-proves-the-head-sha.dream.md`),
held on the radio switch, to deliver after the switch opens.

what moves out:
- `6.preship.stone` step 3's `headRefOid` / `statusCheckRollup` proof, its "no cicd" empty-rollup
  arm, and its unproven-rollup halt (a watch with no verdict is still bounded at 3)
- the `.emit` "the `headRefOid` and rollup" line → the watch's final output
- the `gh pr view` paste in `6.preship.guard` `has-watched-the-head-green` and `7.reflect.guard`
  `has-rewatched-after-a-cure`, and the preship review's "`--watch` alone does not prove it" line
- `templates.tail` case1's `toContain('headRefOid')` → an assertion that step 3 and the tail guards
  name neither `headRefOid` nor `statusCheckRollup`
- the vision lines and catalog rows that prescribed the check (c23, c28, c36, case=3, case=17)

what stays: step 0's `gh pr view --json state,headRefOid` re-entry read. it reads `headRefOid`
only to learn whether an earlier push landed on a restart, and grades no green — resume state, not
the watch cure. the green-for-head check is what moved upstream (ruled by the director,
2026-11-04).

## .rework

clean — template text, its tests, and route prose. no contract moves. the `src/` half is planned
(to build) at `5.1.execution`: `route.bounce` seals `src/` until `3.3.1.blueprint.product` passes,
so the stone, guards and test still hold the old check in the worktree.

## .confidence

100% — the move and the step 0 boundary are both the director's rulings.

## .risk

medium — until the upstream cure lands, a preship watch run at once after a push can report a
stale or empty green, and the stone no longer catches it. the commander's merge gate is the
backstop, and the upstream task's clamp is the proof.

## .where

blueprint step 0, step 3, `### the guards`, `## test coverage`, `### critipath → proof`, q9, q11;
vision `1.vision.yield.md` edgecases + groundwork; `case=_` c23, c28, c36; `case=3`; `case=17`.

## .verdict

ruled — by the director, 2026-11-04: the green-for-head check moves upstream; step 0's re-entry
read stays as resume state.
