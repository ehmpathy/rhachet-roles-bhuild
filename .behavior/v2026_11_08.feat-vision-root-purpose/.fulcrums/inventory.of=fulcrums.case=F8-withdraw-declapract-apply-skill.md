# F8 — withdraw the boot's `declapract.apply.sh` from this branch; fix `check.secrets.sh` here

## .the fork

the 5.1 peer lanes refused two files the boot repair (F5) brought along, neither part of the wish:

- `.agent/repo=.this/role=any/skills/declapract.apply.sh` — a bare `--practice` leaked
  `$2: unbound variable` (exit 1, `ergo-friction-hazards` blocker); no test (`behavior-intent-coverage`
  nitpick); an unqualified npx failure (`mech-failhides` nitpick)
- `.husky/check.secrets.sh` — a broken grep passed as clean (`mech-failhides` blocker); no test
  (`behavior-intent-coverage` + `ergo-friction-hazards` blockers)

options per file: **fix + clamp here**, or **withdraw and dream it**.

## .taken, and why at the time

- **`check.secrets.sh` — fix + clamp here.** it is live on every commit of this repo the moment
  this branch merges, and the failhide lets a staged key through. that is a harm with a name, so
  it cannot wait. the fix is local (one status read, marked `repo-local:`), and the clamp has a
  home beside `check.timestamps.integration.test.ts`. reseed dream for the practice
- **`declapract.apply.sh` — withdraw.** it is a convenience for a future boot, live for no one
  today. its clamp has no home: jest excludes `.agent/`, and no `repo=.this` skill carries a test.
  to give it one is a structural call (a new test dir or config) outside the wish. an unclamped
  skill is what the lanes refused, so the honest options were withdraw, or a structural change
  the wisher never asked for. entool dream caught, with the fix shape and the trash path

## .rework: clean

restore from rmsafe's trash (path in the dream), add the absent-value guard, and land it with a
test home in its own pr. no file in this branch calls the skill.

## .confidence: 70%, and why it is low

the wisher's boot instructions may expect `declapract.apply` to persist as pavement for the next
tree boot; if so, the withdrawal costs that boot a re-pave. the call to add a test home for
`repo=.this` skills is theirs.

## .where

`.agent/repo=.this/role=any/skills/declapract.apply.sh` (removed), `.husky/check.secrets.sh`
(failhide fix, fix lines), `.husky/check.secrets.integration.test.ts` (new, 34 tests; proven to
go red under the old pipe). dreams: `dreams/v2026_11_08.reseed.check-secrets-hides-a-broken-grep.md`,
`dreams/v2026_11_08.entool.pave-declapract-apply.md`.

## .verdict

(unruled)
