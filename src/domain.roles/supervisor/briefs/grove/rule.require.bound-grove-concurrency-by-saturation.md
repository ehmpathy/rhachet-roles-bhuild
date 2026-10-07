# rule.require.bound-grove-concurrency-by-saturation

## .what

before you **sprout onto a grove**, and on every **babysit tick** thereafter, read that
grove's saturation. bound how many crews it carries by what it measures, never by a guess.

```sh
rhx git.grove.saturation --only <grove>     # before a sprout
rhx git.grove.saturation                    # the whole forest, on the tick
```

a grove is a shared, finite machine. every crew you add takes from every crew already there.

## .why

### the degradation is invisible from inside any crew

a clone on an oversubscribed grove does not report "oversubscribed." it reports naught — turns
simply take longer, tool calls stretch, reviews time out. each crew sees a slow day; only a
grove-level read sees the cause, because the cause is the sum and no member holds the sum.

### the failure is COLLECTIVE

an over-dispatch does not degrade the crew you just sprouted — it degrades every crew on that
grove, including ones nearly done. the cost of one careless sprout is paid by work already
paid for, by a party who did not decide.

### WHICH axis binds changes with crew count — read both, let the numbers name it

measured, `grove-sandpine-v20260901`, 4 cpu · 31G ram, three reads over 3.5 days as crew count
rose from 3 to ~14+:

| axis | 3 clones | ~14 clones | later, same crew |
|---|---|---|---|
| cpu life | 5.9% | 9.3% | 8.1% (falls) |
| ram life | 0.002% | 32.8% (full 17.2h) | 🔴 44.8% (full 31.6h) |

cpu's share fell between the last two reads even as ram kept climbing — the earlier cpu peak
was never cpu binding at all; it was tasks blocked in memory reclaim, which load average counts
and the run queue does not. load near the core count beside high idle and a low run queue is a
MEMORY reading wearing cpu's clothes — linux counts uninterruptible sleep in load.

**repaired**: `git.grove.saturation` grades load only where `runq >= ncpu`; otherwise the
verdict is withheld (⚪) with the reason stated.

### `full` is a RATIO, and its denominator excludes idle tasks

`full` means "the share of time every **non-idle** task was stalled." a task blocked on a
network call is idle and leaves the denominator. on a grove mostly blocked on api calls, the
denominator shrinks to a handful — 18 clones on the network plus 2 in reclaim can report `full
100%` while those 18 are fine. treat the `any full above 0 → halt` rule as provisional.

### why it inverts — the two axes fail in different SHAPES

| | consumed how | degrades how |
|---|---|---|
| cpu | timeshared — every clone gets a thinner slice | 🟡 linearly, gently |
| ram | additive — fixed footprint, not shareable | 🔴 a CLIFF — ample, then stall, then an oom kill |

cpu binds first and recovers on its own; ram binds hard and does not. this grove has no cushion
under the cliff (swap is hibernate-reserved and idle by design), so pressure ooms rather than
thrashes. `earlyoom` is the only guard, and an oom kill produces a `husk`, hiding whatever gate
its clone had parked at. read BOTH life rows every tick; a guard wired to one axis in advance
passes every check on the day the other binds.

## .when to read it

| moment | why |
|---|---|
| before a sprout onto a grove | the one free moment — after boot it costs a fell. a 🔴 grove changes the verb to a **seed** (`rule.always.seed-when-the-grove-is-saturated`), never a cancel |
| on the babysit tick | crews accumulate; fine at tick 1 is not fine at tick 9 |
| before several "release into prod" at once | a release runs the heaviest cpu burst a crew makes |
| a clone's turns feel slow | check the grove before the clone — the two look identical from inside a duct |

## .the thresholds — read the LIFE row, not only the instant

the `life` row is cumulative since boot and does not decay. take the WORSE of the cpu and ram
life rows — the threshold is on the grove, never on one axis alone.

| stall, lifetime — worse axis | verdict | do |
|---|---|---|
| < 2% | 🟢 headroom | sprout freely |
| 2–10% | 🟡 tight | sprout with a reason; prefer to wait for a fell |
| > 10% | 🔴 saturated | do not sprout — fell or wait first |
| any `full` above 0 | 🔴 | the grove stopped outright — halt dispatch now |

the last row is easy to skim past — it does not mean "worse," it means no work progressed at
all, which no patience recovers.

instant read, as the second gate — both must pass:

| signal | do not sprout when |
|---|---|
| run queue (`runq`) | sustained above core count |
| idle % | below ~20% across two ticks |
| load per core | above 100% and still climbing (1m > 5m > 15m) |

lifetime catches a grove abused for hours and briefly quiet; instant catches one fine on
average and loaded right now.

## .what to do when it says no

### rung 0 — rule out a runaway process first

before any rung below, read the top-process list — every rung below spends a real cost (a
crew's progress, a wait, money), the wrong price if the load is one runaway rather than the
crews.

```sh
rhx git.grove.prune <grove> --process nvim          # plan only — list, kill naught
```

measured: 11 `nvim` held ~6.2G ram and ~43% cpu while the grove sat at `runq 35` on 4 cores
with `idle 0%`. the ladder below would have felled real work for naught
(`rule.require.prune-runaways-before-you-blame-the-grove`). gated on run queue — a full queue
means cpu is genuinely contended; an empty one with high load is the memory axis, where a prune
kills a process for a defect it did not cause.

then, cheapest first:

1. **wait** — a route-complete crew will fell shortly and return its share
2. **fell what is done** — `rhx git.crew.poll --fellable` names them
3. **sprout onto a different grove** — `rhx git.grove.list`
4. **sprout locally** — `--grove local`, for small work on an idle machine
5. **raise it to the human** — a grove chronically 🔴 with no fellable crews is undersized; a
   provision decision, never a dispatch one

## .the honest bounds of the instrument

- a poll, never a monitor — between ticks it sees naught. `life` is cumulative since the last
  reboot, so a hibernate-and-wake grove reports a fresher, kinder denominator
- `up 0.6d` beside `0 oom kills` is a weak claim — read the count against the uptime
- cannot attribute — says the grove was contended, never which crew did it
- one grove's numbers say naught about another's

## .the thresholds are uncalibrated

the rows are an author's judgment, not a derived number. a deliberate over-sprout to calibrate
needs, written down before the boot: a baseline read, a named prediction, a follow-up delta,
and a stated abort (first oom kill, or first husk no quota cap explains) — the abort is the
clause most often skipped, and skipping it costs a crew that looks alive and is not. one run
settled: gate on the LIFE row, never the instant; cpu life climbs under a large fleet.

full record: `rule.require.bound-grove-concurrency-by-saturation.reason.md`, in this package's
source repo (`ehmpathy/rhachet-roles-bhuild:.agent/repo=.this/role=any/briefs/evidence/role=supervisor/`).

## .enforcement

- a sprout onto a grove whose saturation was never read = **blocker**
- a sprout onto a grove 🔴 on either life axis, with no reason recorded = **blocker**
- a concurrency judgment made on one axis alone = **blocker** — read both; let the numbers name
  the axis
- a babysit tick that never reads grove saturation across a long session = **nitpick**
- a slow clone diagnosed at the duct layer with no grove read first = **nitpick**

## .see also

- `git.grove.saturation.sh` — the instrument
- `glossary.of=supervisor.md` — `grove.saturation` and `grove.saturation.stall`
- `rule.require.babysit-cron-per-dispatch-fleet.md` — the periodic vehicle this rides on
- `define.sprout-vs-seed.md` — a seed costs a grove naught; only a sprout takes a share
- `sandpine/infrastructure` — prior art that owns groves; a persistent capacity verdict belongs
  there as a seed

---

written by human + beaver 🦫
