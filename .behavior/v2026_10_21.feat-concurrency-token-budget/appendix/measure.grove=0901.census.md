# measure · grove 0901 · census

the first reads of grove 0901 (`ip-10-20-2-103`), seats across seven accounts. evidence for the
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

## .the grove's burn (all 42 crews, every account)

| window | cost-weighted | raw | crews that burned |
|---|---|---|---|
| 60 min | ~39M | ~232M | 6 |
| 180 min | **117.8M** (~39M/h) | **728M** (~243M/h) | 12 |

- raw is ~6× weighted: cache reads dominate the raw count and weigh 0.1
- the burn above is the **grove's**, not one account's. 0901 runs seats on many accounts (below)
- a second 60 min read, hours later: **49.6 – 54.5M** weighted (~292 – 315M raw), 10 crews that
  burned. the top crew alone (a route-upgrade crew at a review ladder) burned **20.3M/h**, 3 seats

## .a token lever seen in the reads — reviewer brain asks write, never read

the reviewer's `brain-claude-ask` calls run in a temp config dir, one dir per ask, so the census
pools them in one row (`(brain asks, crew unknown)`). over one 60 min span:

| calls | cache write 5m | cache read | weighted |
|---|---|---|---|
| 15 | **3.45M** | 0.11M | **4.3M** (~9% of the grove's hour) |

⇒ each ask writes its whole prompt to cache fresh (~230K) and no later ask reads it back. a
cache write weighs 1.25, a read 0.1: were the shared prefix (rubric + briefs) read rather than
rewritten, the same 15 asks would cost ~0.5M. **estimated gain: ~3.8M/h on 0901**, about the burn
of one crew at work. one read; the ask's prompt layout must be checked before this ranks

## .accounts — the grove burns on seven, and swaps between them

no transcript line names its account (zero hits across every field). the only record is each
config dir's `.claude.json` → `oauthAccount`, which holds the account signed in **now**. a swap
overwrites it, and the operators swap accounts on purpose, before a cap hits.

burn since the 7d window opened, attributed by each config dir's **current** sign-in:

| account | config dirs | weighted |
|---|---|---|
| vlad@ahbode.com | 4 | 326.8M |
| owl@ehmpath.com | 8 | 317.3M |
| vlad@ahction.com | 3 | 205.5M |
| beaver@ehmpath.com | 4 | 187.8M |
| optimizer@ahbode.com | 2 | 62.9M |
| jelly@ehmpath.com | 3 | 38.4M |
| seaturtle@ehmpath.com | 2 | 19.8M |

⇒ **this table cannot calibrate a cap.** jelly reads 38.4M against a 73% cap use, which would
make a ~53M weekly cap, an absurd figure. the 73% was spent in dirs since swapped to other
accounts, and the current sign-in reassigns all of a dir's history. the per-account burn needs
a per-call account, and the census cannot supply one from what is on disk.

## .the cap — one read, possibly stale

read by the director via `/usage` in this seat's pane, 2026-10-21, account jelly@ehmpath.com:

| window | read | note |
|---|---|---|
| 7d (all models) | **73% used**; resets 2026-10-24, 78.5h after the read | the panel printed *"Could not refresh usage data"* — the % may be stale |
| 5h | no bar shown | 5h stays ⚪ uncalibrated |
| this seat's session | $25.16, 35m of API time | context only |

a second read via a clone (`rhx enroll claude --as @:cap-probe`, then `rhx clone say @:cap-probe
--what /usage`) opened the panel and failed: *"Error: Failed to load usage data"*. two reads,
two load faults: the usage panel on 0901 does not load reliably.

⇒ **tokens.7d and tokens.5h stay ⚪ uncalibrated on 0901** for now. per-call attribution is not
needed to fix that (F8): the count rests on the **pool** of accounts in rotation, calibrated from
each account's % at two instants against the fleet's total burn between them. each seat's
statusline already receives that % (`rate_limits.*.used_percentage` + `resets_at`), so a ledger
of it replaces `/usage`.

## .the limits on 0901 — first estimate, one read

| limit | estimate | binds? |
|---|---|---|
| grove.cpu | 4 cores ÷ ~1.0 core per crew at work ≈ **4 crews at work** | yes, at any instant — at 4 now, psi 🔴 |
| grove.ram | 9.5G avail ÷ ~1.2G per crew at work ≈ 7–8 more at work | no |
| tokens.5h / tokens.7d | ⚪ uncalibrated, per account | unknown |

⇒ **0901 affords ~4 behavior crews at work at once, and cpu binds**, as far as is measured. the
token limits are per account, and burn spreads across seven, so the token wall is the sum of
seven caps, less whatever the swaps leave unused.

⇒ crews at a gate or idle cost ~0 cpu and ~0 tokens; each holds ~0.2–0.4G of ram, which does not
bind. so on 0901 a fell or park of idle crews buys **+0 crews** (the aha, measured once).

## .caveats

- **one read.** cpu per crew is one 60s sample; the crew mix moves minute to minute. a second
  and third read in other conditions are owed before any lever ranks
- **cpu per crew in the first read overcounts ~15%** (4.47 in crews against 3.84 busy): a child
  reaped mid-sample added its whole life to its parent's cutime. the census now charges each pid
  `b − a` over a span it measures end to end, and names the cpu outside every crew; a later read
  attributes 2.5 + 0.05 of 3.13 busy cores
- **forks per crew** is grove-wide ÷ live crews; per-crew fork rate is not yet split
- **cost weights** are api price ratios (F3): input 1 · cache write 5m 1.25 · 1h 2 · cache read
  0.1 · output 5
- **crew = worktree.** reviewer or test clones whose cwd sits in a crew's worktree count as that
  crew's seats; their transcripts may live in a temp config dir the census does not scan, so
  "no burn" on such seats is a lower bound
- **a cap calibration, once attribution exists, still leans on three estimates.**
  - burn from felled worktrees whose transcripts were deleted is absent, so burn is a lower bound
  - usage outside claude code transcripts on an account is not counted
  - the plan may weigh token types apart from api price ratios (F3)
- **no directive crews on 0901**: every director seat runs on local, so directive crew costs
  must come from local's reads

## .reads owed next

1. two more 0901 census reads at other loads (`--window 60 --sample 60`), to promote cpu/crew
   from one read to measured
2. ~~one probe: does this grove's claude (2.1.280) hand `rate_limits` to the statusline?~~ the
   static probe (`rhx claude.statusline.probe`) reads yes: the 2.1.280 statusline input builds
   `...(five_hour || seven_day || spend_limit) && { rate_limits }`, so the field arrives whenever
   the api returns a limit. one live tick on a seat is still owed to see the values. the ledger
   is `rhx claude.statusline.caplog`: it wraps bhrain's `routeStatusLine`, and logs (account,
   5h %, 7d %) per change to the gitignored `.log/role=any/skill=claude.statusline.caplog/`.
   one seat first, via its own `.claude/settings.local.json`; a fleet rollout is a later call
3. local's reads from the director (see `appendix/measure.grove=local.asks.md`)
