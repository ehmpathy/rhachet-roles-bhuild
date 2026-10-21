# F21 — the 14 red dispatcher cases are a credential wall, not a deferral

## .the fork

`behavior-intent-coverage` i003 blocker.1: 14 acceptance cases in
`role=dispatcher/skill.radio.task.push.via-gh-issues` fail on `EHMPATH_BEAVER_GITHUB_TOKEN
(status: absent)`. `rule.require.external-contract-integration-tests` says "get them, or fail the
gate".

- **A** — leave the cases red. name the credential and its owner, and hold the merge on them
- **B** — mock the gh boundary so the cases pass without the token
- **C** — skip the cases while the token is absent

## .taken — A, and why at the time

- the rule offers two moves: get the credential, or fail the gate. A fails the gate. the cases
  stay red, the yield says the tree is not mergeable until they pass, and nothing is skipped
- B needs a vision-cited mock exception, and the vision has none. a mock would also prove only the
  mock (`rule.forbid.acceptance.mocks`)
- C is a failhide (`rule.forbid.failhide`, code.test)
- the token is the commander's. a standing order holds all robot-token and radio grants until
  robot-token auth lands, so the driver may not fill it or route around it
- the dispatcher suite is not part of this delta. it is red on every branch where the token is
  absent, main included

## .rework — clean

once the commander fills the token (`rhx keyrack fill --owner ehmpath`), re-run the acceptance
tier. no code change.

## .confidence — 90%, and why it is not higher

the wisher may want a vision-cited mock exception (B) so the gate can go green without the token.

## .where

`blackbox/role=dispatcher/` · yield `.caveats for the human`

## .verdict

open — for the wisher / commander.
