# measure · grove 0901 · census

the first reads of grove 0901 (`ip-10-20-2-103`), account jelly@ehmpath.com. evidence for the
criteria and blueprint stones. every number here is **one read** (yield tier: `1 read ·
unranked`) until a later read in another condition confirms it.

instrument: `rhx grove.census` (`.agent/repo=.this/role=any/skills/grove.census.sh`), read-only.
it reads `/proc` for cpu, ram, pressure, and forks, and every claude config dir for token usage.

## .the grove

| measure | read | note |
|---|---|---|
| cpu | **4 cores** | not 12. the wish's 12 cores is local (`pop-os`) |
| cpu busy | **3.84 of 4** over a 60s sample | pegged |
| cpu pressure (psi some avg60) | 40.4% · 40.7% · **62.6%** across three reads | 🔴 on each read |
| load (1m / 5m) | 4.15 → 6.56 → 12.34 / 7.97 | rose across the session |
| ram | 30.9G total · **9.5–11.1G avail** · no swap | |
| ram pressure (psi some / full avg60) | ≤ 0.27% / ≤ 0.20% | no ram stall |
| forks | 86 · 164 · **172/s** | grove-wide; ~4/s per live crew |
| live crews | **42** worktrees with a live claude seat | all `beav.*` — behavior crews |

## .per crew, by state (3h token window, 60s cpu sample)

| state | crews | cpu per crew | ram per crew (pss) | tokens per crew, cost-weighted |
|---|---|---|---|---|
| work (cpu ≥ 0.5) | 4 | **0.65 – 1.34 cores** (avg ~1.0) | 0.39 – **1.22G** (a crew mid test run: 13 procs) | 1.6 – 12.5M/h (3 of 4 above 5M/h) |
| low burn (tokens, ~0 cpu) | 8 | 0 – 0.13 cores | 0.19 – 0.52G | 0.3 – 3.6M/h |
| idle (no burn in 3h) | 30 | ~0 cores | **0.14 – 0.56G**, median ~0.22G | 0 |

- the idle 30 hold **~11G** of ram between them, and ~0 cpu
- one idle crew (`rhachet-roles-ehmpathy.beav.fix-cap-role-boot-budgets`) holds **2.91G** in 14
  claude seats, 12 with a `node` parent: orphan clones of a test or review run, no burn in 3h
  (A1-adjacent: a parked or orphan seat holds its ram)

## .the account (jelly@ehmpath.com, all 42 crews)

| window | cost-weighted | raw | crews that burned |
|---|---|---|---|
| 60 min | ~39M | ~232M | 6 |
| 180 min | **117.8M** (~39M/h) | **728M** (~243M/h) | 12 |

- raw is ~6× weighted: cache reads dominate the raw count and weigh 0.1
- the cap is **uncalibrated**: no read of the 5h or 7d cap % exists for this account yet (Q2,
  C2). so the token limit on 0901 reads ⚪ until a cap % pair lands

## .the limits on 0901 — first estimate, one read

| limit | estimate | binds? |
|---|---|---|
| grove.cpu | 4 cores ÷ ~1.0 core per crew at work ≈ **4 crews at work** | **yes** — at 4 now, psi 🔴 |
| grove.ram | 9.5G avail ÷ ~1.2G per crew at work ≈ 7–8 more at work | no |
| tokens.5h / tokens.7d | ⚪ uncalibrated | unknown |

⇒ **0901 affords ~4 behavior crews at work at once, and cpu binds.** crews at a gate or idle
cost ~0 cpu, so they do not count against it; each holds ~0.2–0.4G of ram, which does not bind
here. so on 0901 a fell or park of idle crews buys **+0 crews** (the aha, measured once): ram is
not the wall.

## .caveats

- **one read.** cpu per crew is one 60s sample; the crew mix moves minute to minute. a second
  and third read in other conditions are owed before any lever ranks
- **cpu per crew overcounts ~15%**: the per-crew sum read 4.47 cores against 3.84 grove busy. a
  child reaped mid-sample adds its whole life to its parent's cutime
- **forks per crew** is grove-wide ÷ live crews; per-crew fork rate is not yet split
- **cost weights** are api price ratios (F3): input 1 · cache write 5m 1.25 · 1h 2 · cache read
  0.1 · output 5
- **crew = worktree.** reviewer or test clones whose cwd sits in a crew's worktree count as that
  crew's seats; their transcripts may live in a temp config dir the census does not scan, so
  "no burn" on such seats is a lower bound
- **no directive crews on 0901**: every director seat runs on local, so directive crew costs
  must come from local's reads

## .reads owed next

1. two more 0901 census reads at other loads (`--window 60 --sample 60`), to promote cpu/crew
   from one read to measured
2. a cap % pair for jelly@ehmpath.com, both windows, ~1h of burn apart, to calibrate tokens
3. local's reads from the director (see `appendix/measure.grove=local.asks.md`)
