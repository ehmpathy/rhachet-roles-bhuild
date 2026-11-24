# F29 — an integration case held on a credential the global blocker withholds

- rework: **clean** — run the one case once the credential lands; no code changes
- status: open — best-guessed, drive on
- confidence: **88%**
- raised: 2026-10-21, `5.1.execution.from_vision` round i002

## .the fork, stated fairly

`behavior-intent-coverage` nitpick.2 asks that `getGithubTokenByAuthArg.integration` `[case3]` run
before the pr passes. that case reads the real ehmpath keyrack for `EHMPATH_BEAVER_GITHUB_TOKEN`.

| option | for it | against it |
|---|---|---|
| hold, flagged | the director's global blockers forbid the auth paths that would provision it until robot-token auth lands; the failure paths (locked · absent · blocked) are already covered at `getGithubTokenByAuthArg.keyrackfail.test.ts` `[case1]`-`[case3]` | the real-call success path stays unproven at this stone |
| obtain it now | the case runs | needs a grant the driver may not make — a breach of a director order |

the same key holds a whole suite, found at `5.3.verification`:
`skill.radio.task.push.via-gh-issues.acceptance` — all 14 of its `then`s, `[case1]`–`[case6]` —
pushes through default keyrack auth and is held `QUEUED (upstream:auth)` with
`EHMPATH_BEAVER_GITHUB_TOKEN (status: absent)`. the hold path it lands on is the one the radio
ships; the delivered path waits on the same token. the suite is on main, and `git diff origin/main`
over it is empty.

a second key went absent by `5.3.verification`'s second pass: `rhx keyrack unlock --owner ehmpath
--env test` reports `ehmpathy.test.ANTHROPIC_API_KEY status: absent`, with `OPENROUTER_API_KEY`
and `EHMPATH_BEAVER_GITHUB_TOKEN` beside it. it holds
`initBehaviorDir.brain.claude.integration` — 4 `then`s, each a loud `ConstraintError: ANTHROPIC_API_KEY
required`. the suite passed at the first pass, when the key was filled. this route never touched
it: its last change on this branch is `28d8d9b`, the merge base. a key value is a human's to fill
(`rhx keyrack set`); the driver holds none.

## .taken, and why

hold, and flag it in the yield and the pr. the case is extant and unchanged by this route; this
route did not author `getGithubTokenByAuthArg`, so it is not a coverage gap this change opens.

## .rework, and why it is clean

once the keys are filled, `rhx git.repo.test --what integration --scope 'path://getGithubTokenByAuthArg'`
and `--scope 'path://initBehaviorDir.brain.claude'` run the cases. no file changes.

## .confidence, and why it is not higher

`philosophy.verification-strictness` treats a credential deferral as a blocker by default; the
council may rule that this pr waits on the token.

## .where

`$route/5.1.execution.from_vision.yield.md` `## flags`
