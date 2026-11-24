# F27 — a peer point on a change that main already carries

rework = clean · status = open · confidence = 95% · risk = rework only, no harm

## the fork

two lanes graded changes this branch did not make: the role `onBoot` hooks gone from six role
definitions (r010 nitpick.3), mode 755 on `.husky/check.timestamps.integration.test.ts` (r009
nitpick.3), and the unsnapped pass paths of that same test (r010 nitpick.1). at i005, r009 raised three more on
the same files: the `onBoot` drop again (blocker.2), the dispatcher `onStop` import with no
`.catch` (blocker.1), and dreamer `inits.dirs: undefined` (nitpick.1). `git diff origin/main` over
those role files shows no change to any of those lines. the branch sits behind `origin/main`, so the diff from the merge base carries main's own
commits.

- **A — dispute, and cite main** (taken)
- **B — concede, and restore the hooks and the mode here**

## taken, and why at the time

A. `git diff HEAD..origin/main` over the six role files is empty, and `git ls-tree` shows
the same blob (`9abc658`, mode `100755`) for the husky test on both `HEAD` and `origin/main`. both states came from main's #499
(`efed995`). a restore here would revert main, which this pr has no warrant to do.

the since-main diff shows the edit because the merge base is v0.23.2, which predates #499. this
branch's `a2fca07` carries #499's edit verbatim:
- `git show --stat efed995 -- src/domain.roles` lists the same six `get*Role.ts` files
- `git show --stat efed995 -- .agent` lists the move of `AGENTS.md` + `CLAUDE.md` into `actor.via.repo=ambient`
- `git diff HEAD origin/main` over those eight files is empty

⇒ at merge time the edit nets to zero against main.

## rework, and why clean

B is a revert of a few lines in a pr of its own, owed to main's authors rather than to this route.

## confidence, and why it is not 100

the reviewer may intend the point at main itself. that is a question for #499, never this route.

## where

`src/domain.roles/*/get*Role.ts` · `.husky/check.timestamps.integration.test.ts`

## verdict

open — rides to the pr.
