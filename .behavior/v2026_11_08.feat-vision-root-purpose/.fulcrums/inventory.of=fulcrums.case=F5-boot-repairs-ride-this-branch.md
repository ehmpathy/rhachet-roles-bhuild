# F5: the boot repair rides this branch

## .the fork

- **A — ride along.** the tree boot failed; its repair is in this worktree: `declapract` 0.13.13 → 0.13.27 (the practice package `0.50.0` peers `>=0.13.26`), the `rhachet-roles-ehmpathy@1.39.9` patch retired (1.42.0 ships the backported `git.pull.comment` skills upstream), two `@declapract{check.minVersion(…)}` placeholders the practice wrote into `package.json` set to exact versions, and a paved `.agent/repo=.this/role=any/skills/declapract.apply.sh`
- **B — split out.** land the boot repair as its own pr first, and keep this branch to the wish

## .taken, and why at the time

A. the boot is a precondition of this tree, and its changes already sit in the worktree; a split asks for a second branch and a commit no stone asked for.

## .rework

clean. the repair touches `package.json`, the lock, `patches/`, practice-owned files, and one new skill; none of the wish's files depend on it.

## .confidence, and why it is low

75%. the practice apply also rewrote `.gitignore`, `.gitattributes`, `.husky/*`, the `.this` boot (a `not:` on `term=*.choice.reason.md` refs), and removed old `.behavior/*/.reviews/*peer-review*` artifacts. those are upstream's calls, and they widen the pr. ⚠️ the new `.husky/check.timestamps.sh` drops this repo's `.eco/*` exemption and a lock hook forbids its return — which contradicts `rule.forbid.timestamps-in-tracked-files`. the wisher should rule on that.

## .where

`package.json`, `pnpm-lock.yaml`, `patches/`, `.husky/`, `.gitignore`, `.gitattributes`, `.agent/repo=.this/role=any/{boot.yml,skills/declapract.apply.sh}`.

## .verdict

ruled by the director, 2026-11-08: A stands. a commander order has every crew boot run the
declapract apply, so the bump that boot made stays in this tree; the no-bump test is not owed.
one bound: at the done gate the bump lands in its own commit, apart from the feature, so the pr
diff reads the feature alone. the scope a reviewer sees in the uncommitted tree is that bump, and
the commit split is its answer.
