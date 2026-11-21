# fulcrums

| case | title | rework | status | confidence |
|---|---|---|---|---|
| F1 | gate covers gh.issues only, not os.fileops | clean | ruled: as best-guessed (director, at 1.vision approval) | 85% |
| F2 | a nudged push's own record is dropped; a drained one is held | clean | ruled: as best-guessed (director, at 1.vision approval) | 85% |
| F3 | drain `--promise` vouches for every public record in that drain | clean | ruled: as best-guessed (director, at 1.vision approval) | 85% |
| F4 | `internal` visibility sends as private | clean | ruled: as best-guessed (director, at 1.vision approval) | 90% |
| F5 | the nudge opens with `🦫 hold up`, not `✋ ConstraintError:` | clean | open (disputed at 3.3.1, mech-failhides blocker.1) | 80% |
| F6 | the domain term is `promise`, in code as on the cli | clean | open (disputed at 3.3.1, arch-ambiguous-terms blocker.1) | 85% |
| F7 | record keys in snapshots need no mask; they are stable hashes | clean | open (disputed at 3.3.1, ergo-acceptance-journey-coverage blocker.1) | 95% |
| F8 | no real-github read of a private repo in the integration suite | clean | open (disputed at 3.3.1, ergo-acceptance-journey-coverage nitpick.2) | 85% |
| F9 | the branch name a status-only push publishes is named, not fixed, in #675 | dirty | open (r012 round 4, blocker.1) | 70% |
| F10 | the nudge's command prints flush-left below the tree, not in its last leaf | clean | open (r012 round 4, blocker.3) | 85% |
| F11 | the uncommitted `.husky` / `package.json` / lockfile edits are not this route's, and stay out of its pr | clean | open (5.1 i001: repo-rules, ergo-friction-hazards, arch-hazards-*) | 95% |
| F12 | `asRadioTaskRecordPath` reads the record file name from the dao | clean | open (5.1 i001: arch-smell-scopeleaks nitpick.1) | 85% |
| F13 | the nudge's backlog branches stay a named transformer, with one caller | clean | open (5.1 i001: arch-opport-decomposition nitpick.2) | 85% |
| F14 | a visibility read that meets a rate limit or an outage halts the drain; it is not nudged | clean | open (5.1 i001: behavior-intent-coverage blocker.2) | 85% |
| F15 | the reprinted command leaves a word that opens with `-` unquoted | clean | open (5.1 i001: ergo-friction-hazards nitpick.1) | 90% |
| F16 | the nudge render reads the push args from `radio/cli/` | clean | open (5.1 i002: arch-smell-scopeleaks nitpick.1) | 80% |
| F17 | the record-path renders read `process.cwd()`, not a cwd input | dirty | open (5.1 i003: arch-opport-decomposition nitpick.1) | 75% |
| F18 | the refused and delivered branches keep their re-push guard inline | dirty | open (5.1 i003: arch-opport-decomposition nitpick.2) | 80% |
| F19 | the shared cli parser keeps `--flag ''` as an empty string, not `true` | clean | open (5.1 i004: enroll-impl-arch-defects blocker.1) | 85% |
| F20 | the "will owe --promise" note shows at the shut gate and the read wall, not under other faults | clean | open (5.1 i004: enroll-impl-behavior-intent item 2) | 80% |
| F21 | the promise gate composers sit in `record/`, not `promise/` as the blueprint drew them | clean | open (5.2 evaluation) | 85% |
| F22 | the two extant radio suite skips (since 2026-02-20) stay skipped; cure in the extant unskip dream | dirty | open (5.3 verification) | 75% |
| F23 | init.behavior's bare `error:` wish messages stay as they are; the qualified-header fix is a dream | dirty | open (5.3 verification, snap review) | 80% |
| F24 | the live real-github promise case asserts its lines, with no live snap; the nudge layout is snapped in the stub journey | clean | reversed at 5.3 i003: masked live snaps authored; ci holds the token and compares them | 75% → reversed |
| F25 | a `fix it:` / `fault:` child line drops the doubled class header; the run header and exit code keep the class | clean | open (5.3 i004: enroll-verif-test-intent blocker.1; asked for by i003 r006) | 75% |
| F26 | the send-timeout test kills its stalled stub at 2s, not 300ms | clean | open (5.3 i004: enroll-verif-test-intent blocker.3) | 80% |
| F27 | the auth-cause nudge prints the `--auth as-human` command; the `--promise` path is its child branch | clean | open (5.3 i004: enroll-verif-snapshot-blemishes nitpick.4) | 80% |
| F28 | a sent push prints no `promise:` line; the promise lives on the record | clean | open (5.3 i004: enroll-verif-snapshot-blemishes nitpick.7) | 75% |
| F29 | `eco.seed gen` passes no `--promise`; a seed into a public repo stops at the nudge; passthrough is a dream | clean | open (5.3 i005: enroll-verif-snapshot-coverage nitpick.3) | 80% |
