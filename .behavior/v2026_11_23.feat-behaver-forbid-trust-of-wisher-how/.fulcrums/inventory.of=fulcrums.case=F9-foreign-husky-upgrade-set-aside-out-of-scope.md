# F9 — the foreign husky upgrade is set aside, out of this pr's scope

## .the fork

the worktree held an uncommitted upgrade before this route began: three dependency bumps, a declapract husky practice (two new hooks, four edited), `.gitattributes`, and the claude hook dispatch manifest. the 5.1 peer lanes grade `--diffs since-main`, which includes the worktree, so they graded the `.husky` files as this pr's work: 6 blockers and 4 nitpicks, none on a file this route wrote.

- (a) fix the upgrade's defects in this pr, and ship the upgrade with the rule
- (b) leave the files in place and dispute each concern every round
- (c) set the `.husky` files aside, byte for byte, so the reviewed worktree matches what the pr ships; dispute this round's concerns as out of scope; catch the upgrade and its defects as a dream

## .taken — (c), and why

(a) puts an unrelated hook rewrite and three dependency bumps into a pr that ships a behaver rule. that is a scope leak, and it would hold the rule hostage to the upgrade's own defects. it also carries a red test (`cliOfRepoSettingsHooks` fails under the upgrade).

(b) leaves the cause in place: the lanes would re-raise the same concerns each round, on code that never ships.

(c) fixes the cause, which is a reviewed tree that differs from the shipped tree. no work is lost: the six files sit in `.temp/foreign.upgrade.husky/`, and copies were checked equal before the originals were reset. the defects the lanes found are not dropped: each is listed in `.dream/v2026_11_23.chore.land-the-husky-and-rhachet-upgrade-in-its-own-pr.md`.

the snapshots do not need the upgrade. bhrain 0.43.1 (main's lockfile) renders the same `· ≤N at a time` lane-cap suffix (`asReviewLevelPourAnnounce.ts:66` at `v0.43.1`), and the other snapshot changes are renumbered lanes.

`package.json`, `pnpm-lock.yaml`, `.gitattributes`, and `.agent/.actors/*` stay in place, uncommitted. the session's own tool hooks run on them, and no lane grades those file types.

## .rework — clean

copy the six files back from `.temp/foreign.upgrade.husky/`.

## .confidence — 90%, and why it is not higher

the upgrade's owner may have wanted it to ride this pr. if so, it is a clean restore, but its defects would then need fixes before the pr is green.

## .where

`.husky/*`; `.temp/foreign.upgrade.husky/`; found at the 5.1 peer review, round i001.

## .verdict

open — flagged for the pr
