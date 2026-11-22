# F9 — the boot repair rides in this pr, as its own `chore(deps)` commit

## the fork

- (a) revert the dependency bump, the patch delete, the lock, and the regenerated settings, and
  ship the radio fix alone
- (b) keep them, in a separate `chore(deps)` commit ahead of the radio fix

## taken: (b), and why

- the wisher asked for it first, verbatim: *"repair the boot (`ERR_PNPM_UNUSED_PATCH` for
  `rhachet-roles-ehmpathy@1.39.9`), then run `rhx upgrade && rhx init --roles …`"*. the bump is
  that upgrade; the patch delete is the repair. a revert would re-break `pnpm install` on this tree
- the delete is safe: the patch added the mechanic `git.pull.comment` skills; the installed
  `rhachet-roles-ehmpathy@1.40.0` ships all five (`dist/domain.roles/mechanic/skills/git.pull.comment/*`)
  and lists them in its `boot.yml` (lines 89–91, 120). measured 2026-11-02
- `rule.require.git-release-confidence` puts routine rhachet/role bumps and `settings.of.repo.json`
  in scope by default
- the suites' numbers were run on the tree that ships, so they hold for the pr
- a separate commit lets a reader see the radio diff alone and lets the clamp-bites check revert
  only the fix
- ⚠️ the regenerated `settings.of.repo.json` is not only a reorder (r11, round 6): it drops the deny
  rule `Edit(*/**/.route/**)`, adds `Write(.route/**)` to allow, and swaps the on-stop hook from
  `radioTaskHeld` to `radioTaskQueue … get`. that is `rhx init`'s output, not a hand edit; the
  `chore(deps)` commit body names each of the three so a reader reviews the permission change on
  its own, never under a `fix(radio)` message. the stage is by name, file by file

## rework: clean

drop the `chore(deps)` commit from the pr and land it on its own; one `git` act.

## confidence: 90%

## verdict

open — for the council.
