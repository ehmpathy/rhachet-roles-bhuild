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

## .a token lever seen in the reads — a one-word smoke test loads the boot briefs

the `brain-claude-ask` rows are not reviewer asks. they are this repo's brain smoke test
(`initBehaviorDir.brain.claude.integration.test.ts`): it spawns `claude -p 'reply with exactly
the word: ok'` per prescribed brain, from a fresh temp cwd. over one 60 min span:

| calls | cache write 5m | cache read | weighted |
|---|---|---|---|
| 15 | **3.45M** | 0.11M | **4.3M** (~9% of the grove's hour) |

⇒ cause: the spawn inherited `CLAUDE_CONFIG_DIR`, so each ask loaded the actor's `CLAUDE.md →
@boot.md` (648KB, ~216K tokens) as user memory. the temp cwd varies per ask and the asks
alternate models, so no ask read another's cache: ~230K written fresh, every attempt.

⇒ **cured in this branch**: the spawn now gets an empty `CLAUDE_CONFIG_DIR`. the suite passes
(4/4, 13s). gain ≈ the whole row, **~4M weighted per hour that crews run integration tests**.

⇒ the wider lesson, for every crew: **any `claude` spawn that inherits an actor's config dir pays
~216K tokens of boot briefs before its first word.** the real `rhx review` does not — it calls
the api (or the agent sdk) with a static-first prompt, never the cli

## .the boot toll — what a seat or fork pays before its first word

instrument: `rhx grove.boot.cost` (since folded into `rhx grove.census`, its `boot toll` branch) — the first api call of every transcript on the grove.
boot briefs: 93 of 121 config dirs carry a `boot.md`, median 384KB, max 950KB.

| window | seat boots | fork boots | first prompt, median | written fresh, median | toll, weighted |
|---|---|---|---|---|---|
| 24h | 56 | 55 | 169 – 174K | 158 – 161K | **1.1M/h** |
| 7d | 446 | 111 | 163 – 168K | 155 – 156K | **0.69M/h** |

- each boot, seat or fork, writes **~160K tokens** fresh: **~0.2M weighted per boot**. a fork
  pays the same as a seat, so a fork costs its parent's whole context, never a slice of it
- per hour it is small: **~1 – 2% of the grove's 40 – 55M/h** burn. a slimmer boot lowers the
  toll per clone, not the fleet's cap — it ranks as a lever only for short-lived seats
  (review lanes, forks, probes), where ~0.2M is a large share of the seat's whole life
- the boot count is an upper bound: a resumed transcript counts once more

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

## .read 2 — 2026-10-26, under heavy load

one `rhx grove.census --window 180 --sample 5`. a 5s cpu sample is too short to rank cpu per
crew; the grove-wide rows and the 180 min token rows stand.

| measure | read 1 (2026-10-21) | read 2 (2026-10-26) |
|---|---|---|
| cpu busy | 3.84 of 4 | **4.01 of 4** |
| load (1m / 5m) | up to 12.34 / 7.97 | **23.11 / 24.75** |
| cpu psi some avg60 | 40 – 63% | **96.6%** |
| ram avail | 9.5 – 11.1G | 13G · psi some 2.3%, full 0.06% |
| forks | 86 – 172/s | 226/s |
| live crews | 42 | 31 worktrees with a live seat |
| burn, 180 min | 117.8M weighted · 728M raw · 12 crews | **124.2M** weighted · 848M raw · 10 crews |
| top crews, weighted/h | up to 12.5M/h | 5 – 6.3M/h each, 6 crews |
| cpu in crews / outside | 2.5 / 0.05 (a later read) | 2.04 / 0.36 |

- the grove burns **~41M/h weighted** again, on fewer crews: a second read in another condition
  for the grove's burn (39M/h in read 1). the cpu wall reads harder: pegged, psi near 100%
- ram does not bind on either read
- the boot toll over this span: 91 seat boots, 1 fork boot. **first prompt median 11K, written
  fresh median 5K** — far below read 1's ~160K. toll 6.6M (2.2M/h). the median cannot tell a slim
  boot from a resume (a resume counts as a boot, and pays only its tail); the per-boot drop is
  unexplained, so the boot lever stays unranked
- a 30 min read right after (load 29.9, psi 98.6%): 5 seat boots, first prompt median **111K**,
  written fresh median **96K**, 2.5M/h. near read 1's per-boot size, so the 180 min span's 11K
  median likely holds a wave of resumes, not a slimmer boot

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

1. one more 0901 census read with a full cpu sample (`--window 60 --sample 60`), to promote
   cpu/crew from one read to measured (read 2 confirms grove burn and the cpu wall, not cpu/crew)
2. ~~one probe: does this grove's claude (2.1.280) hand `rate_limits` to the statusline?~~ the
   static probe (`rhx claude.statusline.probe`) reads yes: the 2.1.280 statusline input builds
   `...(five_hour || seven_day || spend_limit) && { rate_limits }`, so the field arrives whenever
   the api returns a limit. one live tick on a seat is still owed to see the values. the ledger
   is `rhx claude.statusline.caplog`: it wraps bhrain's `routeStatusLine`, and logs (account,
   5h %, 7d %) per change to the gitignored `.log/role=any/skill=claude.statusline.caplog/`.
   one seat first, via its own `.claude/settings.local.json`; a fleet rollout is a later call
3. local's reads from the director (see `appendix/measure.grove=local.asks.md`)
