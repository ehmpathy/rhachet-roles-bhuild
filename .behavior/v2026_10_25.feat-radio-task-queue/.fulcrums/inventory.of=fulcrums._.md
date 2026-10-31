# inventory of fulcrums — feat-radio-task-queue

| case | title | rework | status | confidence |
|---|---|---|---|---|
| F1 | halt scope: a transient fault halts the drain, as today (#511); every other fault sets one record aside — an exception to the wish's "no head-of-line block", flagged to the wisher | clean | best-guessed, [wisher] | 85% |
| F2 | a set-aside record retries once on every drain | clean | best-guessed | 70% |
| F3 | a send replays with the record's own auth; `drain --auth` overrides per drain; a push's implicit drain does not lend its auth | clean | best-guessed | 65% |
| F4 | `del` marks the record DROPPED in place, body + why kept; no archive dir | clean | best-guessed | 75% |
| F5 | `set` amends `--auth`, `--description`; `--title` refused (del + re-push); `--via` out (no ask) | clean | best-guessed | 70% |
| F6 | `radio.task.held` stays one release as an alias of `queue get`, with a notice | clean | best-guessed | 85% |
| F7 | the pr closes #604, #511, #513, #603; each part left named on its line | clean | set by the director | — |
| F8 | new reasons `upstream:access` (403 / not accessible), `upstream:not-found`, `upstream:transient` (network, 5xx) | clean | best-guessed | 80% |
| F9 | an `--exid` update to a non-radio issue stays refused, now named plainly; a verbatim edit is out of v1 | clean | best-guessed | 55% |
| F10 | `queue get` shows each record's last fault as its reason code (`upstream:access`), not gh's verbatim stderr; the drain output still prints the verbatim text when it happens | clean | best-guessed | 75% |
| F11 | the fault-path clamps live at integration grain (stub gh), not in the os.fileops acceptance journey | clean | best-guessed | 80% |
| F12 | 5.1 peer concerns held as-is: pre-extant shapes outside the diff, the role-file convention, the onStop exit semantics, two misreads | clean | best-guessed | 80% |
| F13 | l3 structural reworks (typed faults + one reason table, authOverride in input, try-acquire and per-record locks, `drain --key`, 401 as a wall) deferred to a dream; each shipped harm got a clamped stopgap | clean | best-guessed | 75% |
| F14 | seven l1 nitpicks, each answered in its `.taken`, disputed out of the stone tally since their lanes are exhausted and none earns budget | clean | best-guessed | 90% |
| F15 | 9 pre-extant `describe.skip` suites (none touched by this pr) left as-is at 5.3, each cause recorded and its fix caught in a dream | clean | best-guessed, [wisher] | 80% |
| F16 | 5.3 peer concerns held as-is: real-gh coverage proven in ci, deliberate output shapes, rhachet's own banner, misreads | clean | best-guessed | 80% |
