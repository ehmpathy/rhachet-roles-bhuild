# F28 · the repo-local `brain.claude.probe` skill owes no acceptance suite (5.3 peer, ergo-acceptance-journey-coverage i001 nitpick.1)

## .the fork

- (a) add an acceptance suite with snaps for `brain.claude.probe.sh`
- (b) leave it as a repo-local diagnostic, with no suite

## .taken

(b), disputed.

## .why, at the time

- it lives under `.agent/repo=.this/role=any/skills/`: a repo-local tool for this repo's own
  operators. it is not under `src/domain.roles/`, so it never ships in the package and no
  consumer calls it.
- its one job is a diagnosis: it asks the pinned claude cli once per brain id with the test key
  (`8a67962`). each call is a real, paid api call, so a suite that runs its positive path costs
  money on every run; its negative paths (`--help`, an unknown flag) are a header and two lines.
- the wish names `init.behavior`'s tail; this skill is outside it.

## .rework

clean — one acceptance file, if the council rules (a).

## .confidence

85% — a council may hold that every cli in the diff owes a snap, repo-local or not.

## .where

`.agent/repo=.this/role=any/skills/brain.claude.probe.sh`.

## .verdict

built, i002: a second lane (ergo-contract-snapshots i002 blocker.3) showed the deterministic arms
cost naught, and the cost argument held only for the paid positive arm.
`blackbox/repo=.this/skill.brain.claude.probe.acceptance.test.ts` snaps `--help` and the three
refusals; the positive arm stays an operator's hand run. the fork is closed.
