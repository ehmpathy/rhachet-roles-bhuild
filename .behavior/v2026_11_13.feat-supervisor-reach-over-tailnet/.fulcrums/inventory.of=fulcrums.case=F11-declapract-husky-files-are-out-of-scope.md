# F11 — declapract-owned `.husky/*` files are out of this route's scope

## .the fork
peer reviewers raised concerns on `.husky/check.timestamps.lock.sh` (positional args) and
`.husky/check.secrets.sh` (key-shape order). both sit uncommitted in this worktree.

- (a) edit them here
- (b) leave them as declapract renders them; reseed any defect to the practice that owns them

## .taken — (b)
- they are no part of the wish (#653, #652: supervisor reach over the tailnet)
- they are declapract artifacts: `check.timestamps.lock.sh` names its own fix as
  `npx declapract apply --practice husky`. they arrived with the uncommitted role/practice upgrade,
  beside the `rhachet-roles-bhrowser` / `-ghlitch` devDeps
- a hand edit here is overwritten by the next `declapract apply`, and the timestamp lock itself
  refuses a changed hook — so a local fix is both temporary and self-refused

## .rework — clean
the defects reseed into declapract-typescript-ehmpathy, caught as
`.dream/2026_11_13.reseed-declapract-husky-named-args-and-key-shape-order.dream.md`; no code in this
route depends on them. best guess: the upgrade's `.husky/*` files stay out of this branch's commit
(staged-only at the route's finish), so this pr adds none of them; they ride a declapract upgrade
of their own. if the council would rather they ride here, the named-arg fix is a clean edit.

## .confidence — 85%
the provenance is read from the file's own fix line and its arrival with the upgrade. the files
show in the review's diff because they sit in this worktree (`git status`: `??` and ` M`), not
because of a stale `main` — a review of the worktree sees them either way.

## .where
`.husky/check.timestamps.lock.sh`, `.husky/check.secrets.sh`.

## .verdict
awaited — the council rules on the dispute.
