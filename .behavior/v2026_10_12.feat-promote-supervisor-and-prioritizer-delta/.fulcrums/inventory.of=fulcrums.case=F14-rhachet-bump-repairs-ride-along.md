# F14 — the rhachet 1.49.2 bump's repairs ride this tree, across all six roles

## .the fork

the tree carries a routine bump (rhachet 1.48.1 → 1.49.2, bhrain 0.39.3, ehmpathy 1.39.5).
1.49.2 breaks two things outside the wish's two roles:

1. `npx rhachet repo introspect` (in `build:complete:repo`) refuses every role whose onBoot hook
   is `rhachet roles boot --role <self>` — boot.md already renders it. all six roles had one, so
   the build failed.
2. `roles init` writes repo-level hooks into `.claude/settings.of.repo.json`; the behaver init
   and dispatcher recorder acceptance suites read `.claude/settings.json` and went red.

- **A** — repair both here: drop the six self-boot hooks, repoint the two suites
- **B** — revert the bump and leave both for a separate tree

## .taken — A, and why at the time

the build cannot pass without it, and the routine bumps ride a release by default. each repair
is a deletion or a path swap in a file already reached by the diff's checks — safe and clean.
the behaver's second onBoot hook (`sessionstart.boot-behavior`) stays; only the self-boot goes.

## .rework — clean

restore six hook entries and two path constants, or revert the bump.

## .confidence — 85%, and why it is not higher

the repair leaves the wish's two-role scope. a wisher who wants this tree to be the delta alone
would rather see the bump and its repairs ship apart.

## .where

`src/domain.roles/*/get*Role.ts` · `blackbox/role=behaver/role.init.acceptance.test.ts` ·
`blackbox/role=dispatcher/skill.radio.task.recorder.acceptance.test.ts`

## .verdict

open.
