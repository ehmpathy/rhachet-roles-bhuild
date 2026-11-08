# F5 — review points held by design, not fixed

## the fork

the 5.1 i002 and i003 lanes raised the points below on the fallback path that i hold rather than change:

| point | lanes | held because |
|---|---|---|
| a killed `gh auth token` throws `ConstraintError`, not `MalfunctionError` | mech-failhides n1, arch-hazards-maintenance n2 | the class is the hold-vs-halt switch. a `BadRequestError` holds the one record, named; a `MalfunctionError` would halt the whole drain on one box's slow gh login. the exit is the push's held exit 2 either way |
| `asRadioAuthBothFailedError` carries no metadata object | mech-failhides n3 | helpful-errors prints metadata as a json block inside the message, and the message IS the held record's `fix it:` tree. the context (each credential's state, kind, fix) is in the message lines |
| the 60s auth-derive cap spans the keyrack get plus `gh auth token` | arch-hazards-behavior n4 | `gh auth token` reads a local file in milliseconds; the cap is 60_000ms (`genRadioDrainSendBudget.ts:49`). a gh that hangs past the cap is a stall worth a set-aside |
| the timestamp gate lost its `.eco/*` exemption | arch-hazards-behavior n1 | the new practice hook forbids any exemption, and `check.timestamps.lock.sh` halts every commit if the hook differs from the practice. a local restore blocks every commit. the call (mask the `.eco` stamps, or an upstream exemption) is the wisher's |
| two credential-gated suites sit behind `describe.skip` | mech-failhides blocker.1 | both skips are on `origin/main` untouched (`skill.radio.task.pull.via-gh-issues.acceptance.test.ts:132` on main). this diff only reformats their imports. an unskip needs a credential the driver does not hold, and is outside the wish |
| `asRadioAuthBotMiss` parses the keyrack fault's headline (`(status: X)`) | arch-opport-decomposition n2 (i003) | the keyrack fault reaches the radio as a thrown error; its message is the one contract the derive exposes. a typed status needs the derive (`getGithubAuthViaKeyrack`) to return a shape, which ripples to every caller of it. the parse is pinned by `asRadioAuthBotMiss.test.ts [case3]`, and an unparsed status reads `not granted`, never a wrong one |
| the drain shows a held fault's first line | behavior-intent-coverage n1 (i004) | the first-line render is the drain's shape for every fault, pinned on purpose by `asRadioDrainSections` `[case4]` (`not.toContain('second line')`). the per-credential fixes now come from the record's reason, not its fault text: `asRadioQueueFixLines` names the bot-token fix and the ambient fix for a default-auth record held on an auth reason, on drain, get, and push alike (i005 repair; the i004 claim that `get` showed them was false) |
| the timestamp gate lost its `.eco/*` exemption (repo-rules blocker.1, i004) | repo-rules | as row 4 above. new evidence: `git ls-files .eco` lists only `.eco/.gitignore`, so no store row in this repo is halted today. the repo brief `rule.forbid.timestamps-in-tracked-files.md` still names the exemption; the pr names the conflict for the wisher's call |

## taken: hold, and why

each point is either a deliberate design property of the fix, or out of the wish's scope. none ships a harm the fix introduces.

## rework

clean for the first three: a class swap with a widened catch, a metadata object, or a cap bump, each in one file. dirty for the `.eco` call: it needs the practice or the prioritizer store to change.

## confidence

80%. lowest on the gh-login class: a reviewer may hold that a timeout is a malfunction regardless of what the class does downstream.

## verdict

open
