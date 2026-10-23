# F9 — two edits outside the wish ride along: the depcheck `.claude` ignore, the ehmpathy bump

## .the fork

- (a) split both into their own pr
- (b) keep them in this one

## .taken — (b), and why at the time

- `.depcheckrc.yml` ignores `.claude`: a tracked symlink into `.agent/.actors/…`, through which
  depcheck walked the plugin cache, so `test:lint` failed on a file this package does not own.
  without it, this pr's own lint is red — it is a precondition, not a side quest.
- `rhachet-roles-ehmpathy` 1.39.5 → 1.39.7: a routine tool bump. `rule.require.git-release-confidence`
  (ehmpathy/mechanic) puts such bumps in scope by default; a split is churn, not caution.

## .rework — clean

a revert of one line in `.depcheckrc.yml`, or one `rhx set.package.upgrade`.

## .confidence — 85%, and why it is not higher

the arch lane asks for a split; the scope call is the council's.

## .where

`.depcheckrc.yml`, `package.json`, `pnpm-lock.yaml`

## .verdict

(open — for the council)
