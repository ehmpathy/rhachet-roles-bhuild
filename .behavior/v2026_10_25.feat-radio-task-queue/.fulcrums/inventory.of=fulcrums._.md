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
