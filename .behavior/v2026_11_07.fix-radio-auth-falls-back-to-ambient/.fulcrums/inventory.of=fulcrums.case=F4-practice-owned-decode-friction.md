# F4 — decode-friction in practice-owned files: fix upstream, not here

## the fork

the mech-decode-friction lane (5.1, i001) raised 2 blockers and 1 nitpick, all in files the declapract `tests-node` practice writes:

- `src/.test/useWakeOfTestdb.ts`
- `src/.test/assets/database/useTestdbPortOverride.ts`
- `jest.integration.env.db.ts`

two options:

- (a) concede, and extract the named transformers here
- (b) dispute here, and dispatch the fix to the practice

## taken: (b), and why

- the files are new on this branch only because `declapract.upgrade` wrote them. none of them is in the wish
- the next `declapract apply` overwrites them, so a local fix is undone and the drift resurfaces on every repo that adopts the practice. that fails the CLEAN test (`rule.always.fix-forward-under-scouts-honor`)
- the review's own suggested shape (`asTestConfigFromFile`, `isTestConfigComplete`, `asTestdbPortDeclared`, `asPsqlStderr`, `asTestdbConnectionFix`) was dispatched verbatim as ehmpathy/declapract-typescript-ehmpathy#787
- harm test: none ships. these are test-setup files, and the review names readability, not a behavior defect → `better`

## the same call, for the i002 lanes

the 5.1 i002 lanes flagged more points in files the declapract upgrade wrote: `jest.integration.env.db.ts`, `src/.test/useKeyrack.ts`, `.github/workflows/report-slow-tests.sh`, the jest configs, `provision/github.repo/resources.ts`, and the `.husky/` hooks. the same call holds: dispute here, dispatch upstream. the one exception is the `as` cast in `resources.ts`: a type annotation replaced it here, since that fix is one line and cannot drift.

## rework

clean: if the wisher prefers (a), it is a local extract of ~5 small transformers in 3 files, with no callers outside them.

## confidence

75%. it is low because a reviewer may hold that a file in the diff is the diff's to fix, regardless of who wrote it.

## verdict

open
