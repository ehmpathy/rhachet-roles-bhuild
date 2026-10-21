# F6 — the size gate ships with its tty guard only; no permission deny

## .the fork

`git.tree.size.uses`'s header claims the clone is denied `allow` and Edit/Write on `.meter/*` in
`.claude/settings.json`. measured: no tracked file in nheuron (its `settings.json` was deleted in
`ee30458` when `.claude` moved to the actor brain dir) nor in this package declares that deny. the
published supervisor declares no `inits` at all. the real gate is the skill's tty guard: off a tty,
`allow` demands the human's verbatim words and records them.

- **A.** ship as the source behaves — tty guard + audit trail; report the stale header claim
- **B.** also add a supervisor `inits/init.claude.permissions.jsonc` that denies the clone `allow`
  and writes to `.meter/git.tree.size.uses.jsonl`, the way the mechanic ships its deny for
  `git.commit.uses set`

## .taken — A, and why

B is new design the source does not have, and it adds a role init surface the supervisor has never
carried — a scope step past "match the source". A keeps parity; the tty guard already turns an
invented grant into a recorded fabrication. the gap is caught as a dream so it is not lost.

## .rework — clean

B is additive: one inits dir and one permissions file, no edit to the skill.

## .confidence — 70%, and why it is low

the wisher may judge an unenforced meter worse than a scope step. a direct `.meter/` write by a clone
leaves no `--approval` words, so it is detectable, but not prevented.

## .where

`src/domain.roles/supervisor/skills/git.tree.size.uses.sh`, `getSupervisorRole.ts` (`inits`)

## .verdict

**overruled by the wisher, 2026-10-12: B — add the deny now.**

the shape, on the mechanic's paved path for `git.commit.uses set`:

- new `src/domain.roles/supervisor/inits/init.claude.permissions.jsonc`; `getSupervisorRole.ts`
  wires `inits.dirs`
- it denies the clone, in both `npx rhachet run --skill …` and `rhx …` forms:
  `git.tree.size.uses allow` / `revoke`, `git.crew.commit.sponsor set` (F1), and `Edit` / `Write`
  on `.meter/git.tree.size.uses.jsonl` and `.meter/git.crew.commit.sponsor.json`
- the tty guard stays inside each skill as the second wall — a deny a human forgot to init leaves
  the guard; a guard alone leaves the deny
- the skill header's stale claim is corrected to name the deny that now exists
- clamped by an init integration test (as the mechanic's `init.claude.permissions.integration.test.ts`)
  that asserts each deny entry is emitted

the dream `v2026_10_12.fix.supervisor-size-gate-meter-has-no-permission-deny` is pulled into this
tree's scope and retired.
