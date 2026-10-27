# F11 — 5.3 holds the pre-extant skipped suites as main has them

## the fork

the 5.3 stone says "skipped test → remove the skip and make it pass NOW", no exceptions. ten suites
on this branch carry `describe.skip`; all ten are byte-identical to `origin/main`.

- **A.** unskip each and make it pass in this pr
- **B.** hold each as main has it, record its cause and owner in the yield, and let the council rule

## taken: B, and why at the time

each skip is walled by a lever this route cannot pull:

| suites | the wall | lever owner |
|---|---|---|
| `daoRadioTaskViaGhIssues` main block · `radio.task.pull via gh.issues` (acceptance) | `BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN` — `rhx keyrack status --owner ehmpath` lists no such key | human — a keyrack fill |
| `imaginePlan.brain.case1` · `decompose.behavior.brain.case1` | `invokeBrainRepl` shells `claude --print` inside a hook-laden repo; measured 432s and a failure on 2026-09-28 | an infra redesign — already a caught dream |
| `blackbox/role=behaver/skill.review.*` (5 files) | the skill shells the `claude` binary, which ci does not install; an unskip goes red in ci | ci provision |

none touches the boot budget, and A would either redden ci or open an infra seam this wish never named.

## rework: clean

a later pr unskips each the moment its lever is pulled; naught here builds on the skips.

## confidence: 75%, and why it is low

the stone's mandate reads as absolute, and a council may rule that a skip must be fixed by whoever
meets it. my read is that "fix it" cannot mean "provision a credential the keyrack lacks".

## where

`5.3.verification.yield.md` § zero skips verified, and § blockers

## raised again by a peer

two 5.3 lanes raised it: `mech-external-contracts` (i001, blocker.1) and
`ergo-acceptance-journey-coverage` (i002, blocker.1, which adds: a fulcrum is not the vision-level
waiver the rule accepts — so a "waive" verdict here should land in the vision). they graded these skips a blocker under
`rule.require.external-contract-integration-tests`. it is right that the rule reads them so. the
concern is disputed onto this fulcrum rather than argued down in a `.taken`, so the council sees
it was asked twice. the yield's § blockers now names the skips as held, not as "none".

## verdict

**out of scope — ruled by the director (efficiency), 2026-10-22. rework: clean.**

no waiver, and no edit to the vision. the 9 files were skipped on main before this pr, and this pr
touches none of them, so they sit outside its scope. a red or skipped main is still a defect,
never a reason — so the cure gets its own tree, caught as
`.dream/v2026_10_22.fix-unskip-external-contract-suites-on-main.md` (symlinked from
`$route/dreams/`): fill the GitHub token the keyrack lacks, and install the `claude` binary in ci.
