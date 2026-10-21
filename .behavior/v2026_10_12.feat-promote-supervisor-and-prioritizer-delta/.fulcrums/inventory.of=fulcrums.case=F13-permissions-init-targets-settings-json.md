# F13 — the F6 permissions init writes `.claude/settings.json`, not `settings.of.repo.json`

## .the fork

rhachet 1.49 (a routine bump in this tree) splits claude settings by scope. in this repo the
`permissions` block now lives in `.claude/settings.of.repo.json` (104 deny / 198 allow), and
`.claude/settings.json` holds hooks only.

- **A** — write the deny into `.claude/settings.json`, as the paved upstream init does
- **B** — write it into `.claude/settings.of.repo.json`, where this repo's permissions now sit

## .taken — A, and why at the time

`rhachet-roles-bhrain@0.39.3`'s own `init.claude.permissions.route.sh` — the init F6 mirrors —
still targets `.claude/settings.json`. claude code reads `settings.json` natively. a role that
guesses a rhachet-internal file name ahead of the upstream role that owns the pattern risks a
write to a file no reader composes.

## .rework — clean

one path constant in `inits/init.claude.permissions.sh` and one in its test.

## .confidence — 65%, and why it is low

not verified whether rhachet 1.49 regenerates `settings.json` from the `settings.of.*` files on
a later `roles init`. if it does, a deny written into `settings.json` could be dropped on the
next init. the same risk holds for the bhrain driver's own init, so the fix belongs with the
pattern owner, then here.

## .where

`src/domain.roles/supervisor/inits/init.claude.permissions.sh`

## .verdict

**reversed to B, by evidence** (peer `enroll-impl-arch-defects` blocker 1, round i001). the low-
confidence guess was wrong, and worse than the guess allowed: under rhachet 1.49
`.claude/settings.json` is an arrow, `settings.json → settings.of.grove.json →
~/.claude/settings.json`. a write there read the human's home settings, copied them into a
`.bak` in the worktree, and moved a real file over the arrow, which rhachet then put back. so the
deny never held.

- the init now writes `.claude/settings.of.repo.json`, refuses it if a symlink, and re-reads
  after the write
- clamps: `init.claude.permissions.integration` [case3] (an arrow to a fake home is left
  untouched) and [case4] (a symlinked target is refused); teeth: 5 of 13 red with the old target
- consumer proof: `blackbox/role=supervisor/role.init.acceptance` — all 22 denies land via
  `roles init`, and a second init neither drops nor doubles one
- the bhrain driver's inits carry the same defect: reseed dream
  `v2026_10_19.reseed.bhrain-driver-inits-write-through-the-settings-arrow`
