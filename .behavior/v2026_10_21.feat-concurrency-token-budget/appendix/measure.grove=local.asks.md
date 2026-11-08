# measure · grove local · the reads the director runs

local is the commander's box (`pop-os`, 12 cpu, 31G). 0901 cannot reach it, so the director runs
these each cycle and drops the output where 0901 can read it (a radio task, or a file pushed to
this branch's PR).

## .preferred — the same instrument as 0901

the census skill ships on this branch at `.agent/repo=.this/role=any/skills/grove.census.sh`. it is
one self-contained bash file: read-only, needs only bash, jq, and bc, and prints no clock time. it
also reads the actor config dirs and works around the EPIPE that `git.crew.tokens` hit.

| cadence | command | why |
|---|---|---|
| each cycle (~1h) | `bash grove.census.sh --window 60 --sample 60` | cpu, ram, forks per crew; tokens per crew over 1h |
| every 3h | `bash grove.census.sh --window 180 --sample 60` | a steadier token rate per crew |
| one read with directors at a review ladder | `bash grove.census.sh --window 60 --sample 60` | the ladder state, for the directive crew cost |

a read is worth most when the crew mix differs from the last one: a quiet hour, a busy hour, an
hour with a review ladder live.

## .fallback — the extant commands

if the census cannot run on local:

| command | window |
|---|---|
| `rhx git.grove.saturation` | at each cycle |
| `rhx git.grove.saturation.spend --window 60` | each cycle; cpu spend per crew |
| `rhx git.crew.tokens` | its 3h window, each cycle |
| `cat /proc/meminfo /proc/pressure/cpu /proc/pressure/memory /proc/loadavg` | each cycle |
| a count of live claude seats per worktree | each cycle |

## .the one read only a human can take

the cap %. `/usage` in an interactive claude session shows the 5h and 7d %, and no command can read
it (Q2). per account, each cycle:

- **local's account**: the commander's `/usage`, 5h % and 7d %, and the reset time of each window
- **jelly@ehmpath.com (0901)**: the same, from any session on that account

one read plus the window's reset time calibrates that window (C1). a pair ~1h of burn apart, in
one window, does too.

## .where to put the output

each read's raw output, with a datestamp and the crew mix in one line of prose, no clock time. on
the PR branch: `$route/appendix/measure.grove=local.read.<n>.md`, with `<n>` the read's sequence.
