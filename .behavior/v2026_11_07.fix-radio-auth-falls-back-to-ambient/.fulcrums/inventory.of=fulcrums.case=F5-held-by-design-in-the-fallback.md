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
| the `check.timestamps` snapshot pins a halt with no brief path and no fix line, while `[case1]` still asserts the brief (mech-test-intent blocker.2, 5.3 i001) | mech-test-intent | same locked hook as row 4. the snapshot pins the practice's output as it is, which is a snapshot's job. `[case1]`'s brief assert is kept and left red on purpose: it is the clamp that shows the loss, so a weaker assert would hide it. the reconcile is on record: 5.3 yield (snapshot table) and handoff item 1, options (a)/(b)/(c) |
| the both-failed fault's raw `.detail` draws each `└─ fix:` at its bullet's indent (ergo-snapshot-visual-blemishes nitpick.3, 5.3 i002) | ergo-snapshot-visual-blemishes | the raw detail is the record's stored fault text, read by `asRadioErrorHintLines`, which folds each `└─ fix:` under its bullet; every human surface (push, get, drain) renders it nested (`│  └─ fix: …`). a deeper indent changes stored bytes and the fold, for a string no human reads raw |

## taken: hold, and why

each point is either a deliberate design property of the fix, or out of the wish's scope. none ships a harm the fix introduces.

## rework

clean for the first three: a class swap with a widened catch, a metadata object, or a cap bump, each in one file. dirty for the `.eco` call: it needs the practice or the prioritizer store to change.

## confidence

80%. lowest on the gh-login class: a reviewer may hold that a timeout is a malfunction regardless of what the class does downstream.

## verdict

ruled (director, 2026-11-08): **option (a)** for the `.eco` / timestamps rows (4, 8, 9).

- the practice paths stay as the boot's `declapract apply` left them: a commander order has every crew boot run the apply, so each tree carries the latest rhachet and husky protections. an excision to `origin/main` was ruled first, then rescinded the same day for that order
- this tree forks `.husky/check.timestamps.sh`: the `.eco/*` exemption, the `fix:` line, the `why:` brief path, the read-fault header that names its file, and the mask-ask halt header return. `.husky/check.timestamps.lock.sh` re-pins to the fork's blob (`4071be2c…`), with the practice's own id kept in a comment
- result: `check.timestamps` 24/24 against `origin/main`'s own assertions and snapshot, byte for byte, no resnap; `ecowork.commit` `[case46]` green. the one test edit left is the practice's harness change (copy every hook `pre-commit` sources)
- durable cure: `ehmpathy/declapract-typescript-ehmpathy#788`. its apply rewrites hook and lock at once and retires the fork
- at the done gate, the practice upgrade lands as its own commit, apart from the radio fix

the other rows stand as held above.
