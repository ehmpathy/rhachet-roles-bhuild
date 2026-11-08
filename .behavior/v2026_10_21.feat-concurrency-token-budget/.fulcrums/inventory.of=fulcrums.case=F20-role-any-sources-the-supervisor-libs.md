# F20 · this repo's role=any skills source the supervisor's `work/` libs; never the reverse

## .the fork

`claude.statusline.caplog` and `grove.census` (role=any, this repo only) source `capwork.sh`,
`tokenwork.sh`, and `grovework.sh` from the supervisor role. the review reads this as a reach into
another role's internals, and asks for a neutral home both sides import from.

- **(a)** the dev layer (`.agent/repo=.this/`) depends on the published role, and never the reverse
- **(b)** move the libs to role=any, and have the supervisor import from there
- **(c)** a new shared package

## .taken, and why

(a). the supervisor role ships in the npm package, and `.agent/repo=.this/` does not. (b) would make a
published role depend on files no consumer receives, which breaks every install. (c) adds a package
to share three files. so the only direction that ships is .this → supervisor, the same direction any
consumer of the package takes. the reader (supervisor) owns the contract, so the writer (caplog)
follows it. if the supervisor is not linked, the sourced lib is absent, and caplog names that fault
rather than log a row in a shape no reader parses.

## .rework

clean. each lookup is one `for candidate in …` loop. a later neutral home changes those two loops.

## .confidence, and why it is low

70%. the tie is real: a rename of `skills/work/` breaks two dev skills. the `roleAnySkills` suite
catches that break at once.

## .where

`.agent/repo=.this/role=any/skills/claude.statusline.caplog.sh`, `grove.census.sh`;
`src/.test/roleAnySkills.integration.test.ts` (imports the supervisor test harness, for the same
reason).

## .verdict

open.
