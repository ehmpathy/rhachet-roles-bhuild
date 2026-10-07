# rule.require.bound-grove-concurrency-by-saturation

## .what

before you **sprout onto a grove**, and on every **babysit tick** thereafter, read that grove's
saturation. bound how many crews it carries by what it **measures**, never by a guess.

```sh
rhx git.grove.saturation --only <grove>     # before a sprout
rhx git.grove.saturation                    # the whole forest, on the tick
```

a grove is a shared, finite machine. every crew you add takes from every crew already there.

## .why

### the degradation is invisible from inside any crew

a clone on an oversubscribed grove does not report *"the grove is oversubscribed."* it reports
naught at all — it simply takes longer per turn, its tool calls stretch, its reviews time out.
each crew sees a slow day. **only a grove-level read sees the cause**, because the cause is the
sum, and no member holds the sum.

⇒ so the supervisor is the only party positioned to catch it, and the only one who can act.

### the failure is COLLECTIVE, which is what makes it worth a rule

an over-dispatch does not degrade the crew you just sprouted. it degrades **every crew on that
grove**, the ones nearly done as well. so the cost of one careless sprout is paid by work that
had already been paid for — and the party who pays it is not the party who decided.

that asymmetry is exactly the shape a rule exists to correct.

### 🔴 WHICH axis binds changes with crew count — read both, name neither in advance

this section once read *"the constraint that binds is CPU, and the intuition points at ram."*
**that was measured, it was true, and two days later the same grove inverted it.** the durable
lesson is the inversion, never either endpoint.

`grove-ahbode-v20260901`, 4 cpu · 31G ram, three reads:

| axis | 2026-09-03 · **3 clones** · up 0.6d | 2026-09-05 · **~14 clones** · up 2.0d | 2026-09-06 · up 3.5d |
|---|---|---|---|
| **cpu** | 51.1 min · **5.907%** | 6.1 h · **9.291%** | 6.8 h · **8.132%** ⬇ |
| **ram** | 0.85 sec · **0.002%** | 21.6 h · **32.806%** (full 17.2h) | 🔴 37.5 h · **44.838%** (full 31.6h) |
| io | 1.4 min · 0.161% | 3.3 min · 0.083% | 4.0 min · 0.080% |

on 09-03 cpu exceeded ram by ~3000×. on 09-05 **ram exceeds cpu by 3.5×** on the life row, and on
the instant row it is not close: ram `full 73.88% @60s` against a cpu that reports **no `full` at
all**.

#### 🔴 the third read is the decisive one — cpu's share went DOWN

two columns show only that ram grew faster, which a reader can dismiss as ram catching up. the
third settles it: across ~36 h of wall clock, **cpu accumulated 0.7 h of stall and ram accumulated
15.9 h.** cpu's share *fell* — 9.291% → 8.132% — because uptime outgrew its stall.

⇒ so cpu stall **stopped accumulating**, and the 9.291% peak was never cpu binding at all. it was
tasks blocked in memory reclaim, which the load average counts and the run queue does not. the
instant read on 09-06 says so outright:

```
load 3.32 / 4 = 83%   ·   idle 89%   ·   runq 2
```

⚠️ **a load average near the core count, beside a high idle and a run queue UNDER it, is a MEMORY
reading wearing cpu's clothes.** linux counts uninterruptible sleep in its load average, so tasks
blocked on reclaim inflate the load while no core is contended — 2 runnable on 4 cores at 89%
idle. a supervisor who reads only the load line diagnoses the wrong resource and adds cores that
fix naught — the `false-report` shape (`term=false-report`), where a true number answers a
question the reader never asked.

⇒ and the instrument itself produced it: the skill graded cpu **🔴 off the load row** while its
own instant row read `idle 89%, runq 0`. **the verdict was accurate and it named the wrong axis.**
read the run queue beside the load average, always.

✅ **repaired 2026-09-07 — the instrument now enforces this rather than merely documents it.**
`git.grove.saturation` grades the load only where `runq >= ncpu`; otherwise the load is withheld
from the verdict (⚪) and the render states the reason on its own line. the same grove that read
🔴 now reads 🟡, which is what its stall and life rows said all along.

⚠️ **a documented discriminator that the instrument does not apply is a rule with no teeth.** this
brief said *"read the run queue"* for a full day while the skill kept its verdict on the load — and
the 🔴 it emitted is what a supervisor actually sees.

#### ⚠️ `full` is a RATIO, and its denominator excludes idle tasks

a second misread, of the very metric this brief's `full > 0 → 🔴 halt` row rests on. the kernel's
definition is *"the share of time in which every **non-idle** task was stalled"* — and **a task
blocked on a network round trip is idle**, so it leaves the denominator entirely.

⇒ on a grove of clones that spend most of a turn blocked on an api call, the denominator is a
handful of tasks. **18 clones on the network and 2 in reclaim reports `full 100%`** while those 18
are perfectly fine.

measured 2026-09-07: ram `full 48.78% @60s`, ~15 clones, and the human's own report — *"seems
speedy still."* **both true.** the number was honest; the gloss *"no work progressed at all"* was
not — and that gloss sat in the skill's legend and in four of this beaver's reports.

🔴 **so `full` reads as CONTENTION AMONG THE RUNNABLE, never as throughput**, which weakens the
`any full above 0 → halt` row above considerably. that row stands until the calibration retires
it: a measured replacement is owed, and a keyboard one is what this experiment exists to end.

#### 🔴 why it inverts — the two axes fail in different SHAPES

| | how a clone consumes it | how the grove degrades |
|---|---|---|
| **cpu** | timeshared — every clone gets a thinner slice | 🟡 **linearly.** everyone slows together, and the slope is gentle |
| **ram** | additive — each clone's footprint is roughly fixed and cannot be shared | 🔴 **as a CLIFF.** ample, ample, ample — then `full` stall, then an OOM kill |

⇒ so **cpu binds FIRST and ram binds HARD.** a small fleet is cpu-bound and recovers on its own;
a large one is ram-bound and does not.

⚠️ **and this grove has no cushion under the cliff.** its swap is hibernate-reserved and idle by
design, so pressure does not thrash — it **ooms**. `earlyoom` is the only guard, and an OOM kill
produces a `husk`, which conceals whatever gate its clone had parked at
(`term=duct.pane.husk`). the memory cliff is therefore also a **visibility** failure.

⇒ 🔴 **read BOTH life rows every tick and let the numbers name the axis.** any guard wired to one
axis in advance will pass every check on the day the other one binds — which is exactly what the
prior version of this section would have done today.

## .when to read it

| moment | why |
|---|---|
| **before a sprout onto a grove** | the one moment the decision is free. after boot it costs a fell. 🔴 and a 🔴 grove does not cancel the work — it changes the VERB to a **seed** (`rule.always.seed-when-the-grove-is-saturated`) |
| **on the babysit tick** | crews accumulate; a grove fine at tick 1 is not fine at tick 9 |
| before you tell several trees *"release into prod"* at once | a release runs a full test suite — the heaviest cpu burst a crew makes |
| when a clone's turns feel slow, or reviews time out | check the grove before you diagnose the clone |

⚠️ **the last row is the one that saves the most time.** a slow clone and a slow grove are
indistinguishable from inside the duct, and the grove read costs one call. diagnose the shared
resource before you diagnose the member.

## .the thresholds — read the LIFE row, not only the instant

the `life` row is cumulative since boot and does **not** decay, so it survives a spike the 60s
averages have already forgotten. a point read answers *"right now?"*; the concurrency question is
about a distribution, and only the cumulative counter answers it.

🔴 **take the WORSE of the cpu and ram life rows** — the threshold is on the grove, never on one
axis, and which axis is worse changes with the crew count (see above).

| stall, lifetime — worse axis | verdict | what to do |
|---|---|---|
| **< 2%** | 🟢 headroom | sprout freely |
| **2–10%** | 🟡 tight | sprout with a reason. prefer to wait for a crew to fell |
| **> 10%** | 🔴 saturated | **do NOT sprout.** fell or wait first |
| any `full` above 0 | 🔴 | the grove stopped outright. halt dispatch now |

⚠️ **the last row is the one that fires first on a ram-bound grove**, and it is easy to skim past
because the other three read as a gradient. `full` is not a worse shade of `some` — it means **no
work progressed at all**, which no amount of patience recovers.

and the instant read, as the second gate:

| signal | do not sprout when |
|---|---|
| run queue (`runq`) | sustained above the core count |
| idle % | below ~20% across two ticks |
| load per core | above 100% and the trend still climbs (1m > 5m > 15m) |

**both gates must pass.** the lifetime row catches a grove abused for hours and briefly quiet;
the instant row catches a grove fine on average and under load right now.

## .what to do when it says no

### 🔴 rung 0 — first ask whether the fleet is even the cause

**before any rung below, read the top-process list.** every rung here spends a real cost — a crew's
progress, a wait, or money — and all of them are the wrong price if the load is one runaway process
rather than the crews.

```sh
rhx git.grove.prune <grove> --process nvim          # plan — list, kill naught
```

measured 2026-09-07 on `grove-ahbode-v20260901`: **11 `nvim` held ~6.2G ram and ~43% cpu** while
the grove sat at `runq 35` on 4 cores with `idle 0%`. the ladder below would have felled real work
and cured none of it. **`nvim` is the known repeat offender on this fleet** —
`rule.require.prune-runaways-before-you-blame-the-grove` carries the list and the discipline.

⚠️ **gated on the run queue.** a full run queue means the cpu is genuinely contended, so a runaway
is plausible. an *empty* one with a high load is the memory axis, and a prune there kills a process
for a defect it did not cause.

⇒ then, in order — cheapest first, and **never** just sprout anyway:

1. **wait** — a crew that is route-complete will fell shortly and return its share
2. **fell what is done** — `rhx git.crew.poll --fellable` names them; a merged tree holds cpu for naught
3. **sprout onto a different grove** — the forest has more than one; `rhx git.grove.list`
4. **sprout locally** — `--grove local`, when the work is small and this machine is idle
5. **raise it to the human** — a grove persistently 🔴 with no fellable crews is an undersized
   grove, and that is a provision decision, never a dispatch one

⚠️ rung 5 is a real answer, not a defeat. **the lever for a chronically saturated grove is its
instance size, and that lives with whoever provisions it** — a supervisor who keeps work queued
onto a box that cannot carry it is not resourceful; it hides a capacity problem inside latency
every crew pays.

## .the honest bounds of the instrument

state these rather than let a reader over-trust the tool:

- **it is a poll, never a monitor.** between two ticks it sees naught. the `life` row is the
  partial cure — it is cumulative — but it resets at every reboot, and a grove that hibernates
  and wakes reports a fresh, kinder denominator
- **`up 0.6d` beside `0 oom kills` is a weak claim.** always read the count against the uptime
- **it cannot attribute.** it says the grove was contended, never which crew did it. the top
  process list is a weaker, instantaneous hint alongside — never a verdict
- **one grove's numbers say naught about another's.** read the grove you intend to sprout onto

## 🔬 .the thresholds are UNCALIBRATED — and a deliberate over-sprout is the calibration

⚠️ **the four rows in the threshold table are an author's judgment, never a derived number.** no
outcome was ever measured against them. 2% / 10% / `full > 0` were reasoned from the shape of the
two failure modes, which is a good way to pick a first guess and no way at all to defend one.

⇒ that is a real defect in this brief, and it is the kind that hides: a threshold that has never
fired against a known outcome reads exactly like a threshold that has.

### the wisher's call — 2026-09-06

> *"lets give it a shot on that grove anyway. lets see how it reacts under saturation limits so we
> can adjust our thresholds based on experience, rather than theory"*

⇒ so a sprout onto a 🔴 grove, **taken deliberately to produce the measurement**, is a
**sanctioned reason** under this rule's own enforcement clause — not a violation, and not a
loophole either. what makes it sanctioned is that the record exists **before** the boot and names
what it expects to learn.

🔴 **and it is bounded, or it is not an experiment.** a calibration sprout owes all four:

1. a **baseline** read, captured before the boot
2. a **named prediction** — which axis binds, and what you expect to see if the threshold is right
3. a **follow-up** read at the next tick, and the delta
4. a **stated abort** — the observation that ends the experiment rather than continues it

⚠️ **the abort clause is the one that gets skipped**, and it is what parts an experiment from a
rationalized over-sprout. an OOM kill produces a `husk`, which conceals whatever gate its clone
had parked at — so the cost of "one more tick" is not paid in latency, it is paid in a **crew that
looks alive and is not** (`term=duct.pane.husk`).

### run 1 — 2 nano crews onto a 🔴 ram-bound grove

**baseline**, `grove-ahbode-v20260901`, 4 cpu · 31G ram, up 3.5d:

| axis | instant @60s | life |
|---|---|---|
| cpu | load 7.69/4 = **192%** · idle **1%** · runq **3** · blocked 0 · some 32.37% | 7.0h · **8.210%** |
| ram | **5.7G** available of 31G (19%) · 81% committed · some 69.11% · 🔴 **full 22.37%** | 38.6h · **45.448%** · full 32.5h |
| io | some 0.03% · full 0.00% | 4.1m · 0.081% |

both gates fail, and they fail differently — which is itself the point:

- the **life** gate fails on ram at 45.448%, 4.5× the 🔴 line
- the **instant** gate fails on cpu at idle 1% and runq 3, where the 09-06 read hours earlier had
  `idle 89%, runq 2` ⇒ 🔴 **the cpu axis is now genuinely contended**, where earlier that same day
  it was a memory read in cpu's clothes. the discriminator in the section above works — and it
  swings both ways

**the prediction.** ram is the axis that binds and it fails as a cliff, so 2 more clones ought to
surface as an OOM within the first turns rather than as a gentle slowdown. if the 10% line is
roughly right, this sprout kills a clone. **if 2 nano crews land and the fleet keeps pace, the
line is too tight** and the real one sits well above 45%.

**the abort.** the first OOM kill, or the first husk not explained by a quota cap. at that point:
fell these two, record the ram figure at the moment of the kill, and that figure is the first real
calibration point this brief has ever had.

#### run 1, read at T+2min — ⚠️ MID-INSTALL, not steady state

| | baseline | +2 crews |
|---|---|---|
| ram available | 5.7G (19%) | 5.3G (17%) |
| ram committed | 81% | 83% |
| ram `some` @60s | 69.11% | 70.50% |
| 🔴 ram **`full`** @60s | 22.37% | 🔴 **42.41%** |
| ram **life** | 45.448% | **45.478%** |
| cpu runq (4 cores) | 3 | 🔴 **9** |
| cpu idle | 1% | 13% |
| io `some` @60s | 0.03% | **3.21%** |
| iowait | 0% | **5%** |
| 🔴 **oom kills** | 0 | 🟢 **0** |

fleet at the same moment: **31 crews, 16 at work, 12 of those `frozen`.**

**the prediction did NOT come true.** 2 nano crews landed on a grove 4.5× over the 🔴 line and
killed no clone. ⇒ the 10% figure is, on this one data point, **too tight** — though see the
caveat, which is larger than the result.

🔴 **and the cost the rule predicts DID appear, on a different row than the gate reads.** ram
`full` nearly doubled — 22% → 42% of each minute in which **no work progressed at all** — and that
is paid by all 31 crews, not by the 2 that caused it. `12 frozen of 16 at work` is that number
seen from the fleet side. **the collective-harm claim is now measured, not merely argued.**

##### 🔴 the sharpest result — the LIFE row cannot see the act this rule governs

the gate this brief leans hardest on is the **life** row. across a sprout that doubled `full`
stall, it moved **45.448% → 45.478%** — 0.03 points.

⇒ of course it did: it is cumulative over 3.5 days, so a 2-minute event is 0.04% of its
denominator. **a counter that averages over 3.5d cannot answer a question about the next 3
minutes.**

🔴 **so the threshold table is wired to the wrong instrument for the sprout decision.** the life
row is the right gate for *"is this grove chronically abused"* and the wrong one for *"can it take
one more crew right now"* — and this brief currently uses it for both. the instant `full` row
moved by 20 points on the same event, and the run queue moved 3 → 9.

⇒ owed: **part the two questions.** a chronic gate on the life row, a marginal gate on instant
`full` + runq. that is a real change to the table above, and it needs a second run before it is
made — the point of the experiment is to retire keyboard-derived numbers, so one measurement does
not get to author the replacement either.

##### ⚠️ what this does NOT establish

- **T+2min is the INSTALL, not the work.** two `pnpm`/`npm` installs are io+cpu heavy; the ram
  footprint of two live claude clones has not landed yet. the io row proves it — `some` went
  0.03% → 3.21%, a hundredfold, on an axis that is otherwise the quietest on the box
- **no OOM YET is not no OOM.** the cliff is a cliff; it does not announce itself in advance
- **n=1, one grove, one crew size.** what comes out of this is a bound, never a curve

🔴 **do not promote this to a threshold.** the honest state is: *the 10% line did not fire on a
real kill, and the instrument that line reads is provably blind to the event.* the second half is
durable; the first is one draw.

⚠️ **the temptation here is exactly the one that got a claim retracted on 2026-09-05** — an early
read, taken as settled, against a criterion the measurement did not actually test. the criterion
is *"does the grove survive 2 more crews at steady state"*, and what was measured is *"does it
survive their installs."* record the next tick before any verdict.

#### run 1, read at T+~40min — ✅ STEADY STATE, and it is worse than the install

| | baseline | +2 crews, T+2min | ✅ **T+40min, steady** |
|---|---|---|---|
| ram available | 5.7G (19%) | 5.3G (17%) | 5.3G (17%) |
| ram committed | 81% | 83% | 83% |
| ram `some` @60s | 69.11% | 70.50% | **84.54%** |
| 🔴 ram **`full`** @60s | 22.37% | 42.41% | 🔴 **68.93%** |
| ram **life** | 45.448% | 45.478% | 45.607% |
| cpu load | 192% | — | 99% |
| cpu runq (4 cores) | 3 | 9 | **3** |
| cpu idle | 1% | 13% | 5% |
| io `some` @60s | 0.03% | 3.21% | **0.01%** |
| 🔴 **oom kills** | 0 | 0 | 🟢 **0** |

both experiment crews **alive and productive** at this read: `declastruct-aws` mid-turn on its
fulcrum inventory, `infrastructure` at a permission modal, since answered.

##### 🔴 the T+2min caveat was right about the cause and WRONG about the direction

that row warned the install was io+cpu heavy and *"the ram footprint of two live claude clones has
not landed yet."* it landed. **and it is larger than the install was:**

- the install spike **cleared** — runq 9 → 3, io 3.21% → 0.01%, exactly as predicted
- 🔴 the ram stall **did not clear. it tripled from baseline** — `full` 22% → 69% of every minute

⇒ so the transient verdict on the T+2min row was itself too generous. the honest shape: **an
install is a spike; a live clone is a floor, and the floor is higher than the spike.**

##### 🔴 the harm is LATENCY, and it does not appear in this table at all

no clone died. what happened instead, measured on the same box at the same moment:

| clone | one turn took |
|---|---|
| `declastruct-aws…demo-trusts-ahbode-grove` mechanic | **17m 43s** |
| `rhachet-roles-bhrain…feat-telepath-role` mechanic | **35m 59s** |

⇒ **the grove degrades before it breaks, and the degradation is the whole cost.** `full 68.93%`
says two thirds of every minute advanced no work at all — that is not an abstraction, it is those
two turn times. a gate that fires only on a kill would have passed this grove all day.

⚠️ and it is paid by **all 31 crews**, not by the 2 that caused it. `11 frozen` at this tick.

##### 🔴 the oom counter CANNOT refute an earlyoom kill — a named instrument gap

the table above prints `oom 🟢 no kills`, and the same block names the guard as **`earlyoom`**.
those two facts do not compose:

- the kernel oom killer increments a kernel counter, which is what this row reads
- **`earlyoom` kills in USERSPACE, with `SIGTERM`, and never touches that counter**

⇒ so `oom: 0` establishes *"the kernel never oom-killed"* and says **naught** about the guard that
this grove actually relies on. a clone felled by earlyoom exits `143` (128+15) and leaves a shell
husk, which the poll renders `😴 unread` — the exact state 10 crews render right now.

🔴 **and one such husk was observed on this grove this session** — a mechanic on
`rhachet-roles-bhrain.beav.feat-subconscious-term-distill` at `💥143`, surfaced by the human, not
by any instrument here. **unattributed:** `143` is plain `SIGTERM` and has other senders. it is
recorded because the experiment's abort condition is *"the first husk not explained by a quota
cap"*, and this instrument cannot tell me whether that condition fired.

⇒ owed, and it now outranks the threshold work: **read `earlyoom`'s own kill log**, not the kernel
counter. until then the abort condition on this experiment is **unmeasurable**, and every
`no kills` in this brief must be taken as *"no KERNEL kills."*

##### 🔴 2026-09-07 — the kernel counter went dark too, and the instrument SAYS SO

every read in this run to this point printed `🟢 no kills in N.Nd uptime`. it now prints:

```
oom  ⚪ not measured — no journal access on this box  ·  guard: earlyoom
     (a kill here is INVISIBLE to us, never absent — grant the
      grove user the journal groups, or read it with sudo)
```

⇒ so the blind spot is now **two layers deep**: the kernel counter was always mute on `earlyoom`
(above), and the kernel counter is itself no longer readable. **this experiment can no longer
detect its own abort condition by any instrument it holds.**

⚠️ this is a **material shift and not a metric one** — no ram or cpu row left its band on the read
that surfaced it. an append is owed regardless, because the axis that moved is the one the abort
is defined on.

✅ **and the instrument earned its keep on the way down.** it did not silently render `0`; it
rendered `⚪ not measured`, named the cause, and prescribed the fix. that is the exact opposite of
`term=partial-audit` — a read that reports the bound it could not cross, rather than a narrowed
answer with a confident face. **had it printed `🟢 no kills`, every prior verdict in this run would
have been indistinguishable from a true one.**

⇒ the fix is a grant, so it is the human's: **add the grove user to the journal groups**, or give
the read `sudo`. until then, treat every `no kills` in this file — before and after — as
*"unmeasured"*, never as *"none."*

#### run 1, the SUBTRACTION — one crew felled, measured across the fell

every read above adds crews. this one removes one: `svc-jobs.beav.fix-queue-addressed-by-access`
was felled at 21:26, its route complete and its 15 dispatches seeded out. the reads bracket it.

| | before the fell | **after** |
|---|---|---|
| cpu badge | 🔴 | 🟡 **— the first non-red cpu of this experiment** |
| cpu load | 169% | **98%** |
| cpu idle | 72% | 42% |
| cpu runq | 1 | **0** |
| cpu `some` @60s | 23.56% | **11.54%** |
| cpu life | 8.512% | 8.545% |
| ram available | 5.5G (18%) | **6.4G (21%)** |
| ram committed | 82% | **79%** |
| 🔴 ram `full` @60s | 38.76% | 🔴 **55.18%** |
| ram life | 45.990% | 46.052% |
| disk free | 311G | 312G |

##### ⚠️ read the ram `full` row before you take the good news

five of the six instant rows improved, and the cpu badge crossed out of red for the first time
since the sprout. **and `ram full` went the other way — 38.76% → 55.18% — while available ram
ROSE by 0.9G.** those two cannot both be a trend, so at least one is noise.

⇒ **it is the instant rows that are noisy, and this is now evidenced from BOTH directions.** the
addition of 2 crews moved `full` 22% → 42% → 69% → 27% → 41% → 53% → 39% → 55% across successive
reads, with no act at all between most of them. a row that moves 30 points on its own cannot
attribute a 30-point move to a crew.

🔴 **so the earlier verdict sharpens rather than reverses.** the instrument problem is not *"the
life row is too slow"* alone — it is that **neither** row can answer the marginal question:

| the row | why it cannot gate a sprout |
|---|---|
| **life** | cumulative over 3.6d; a 2-minute act moves it 0.03 points. too SLOW |
| **instant `full`** | moves 30 points unprompted between adjacent reads. too NOISY |

⇒ owed, and this supersedes the *"part the two questions"* note above: a marginal gate needs a
**smoothed** read — a trend across several reads, or the 5m/15m averages the cpu block already
prints and the ram block does not. one sample of an instant row is not a measurement, and this
brief has treated it as one throughout.

##### .what the subtraction DOES establish

the cpu block prints a trend (`1m 3.90 · 5m 4.45 · 15m 5.53`) and all three fell monotonically
across the fell. **that is a smoothed row, and it moved the way the act predicts.** so the signal
is real; only the single-sample rows are unreliable.

⇒ one nano crew, felled, is worth roughly the difference between a red and a yellow cpu badge on a
4-core grove. **that is a bound, not a curve** — n=1, one crew, one grove, and the crew sat idle at
`route complete` rather than mid-turn, which is the cheapest crew there is to remove.

#### run 1, the first HONEST red — `runq 12 · blocked 0`

| row | this read | every prior read this run |
|---|---|---|
| cpu load | 108% | 98% – 169% |
| 🔴 cpu **`runq`** | 🔴 **12** | `0, 0, 1, 1, 3, 5, 0` |
| cpu **`blocked`** | **0** | — |
| cpu idle | 27% | 42% – 72% |
| cpu stall `some` @60s | 13.58% | 3% – 42% |
| cpu **life** | 8.556% 🟡 | 8.24% – 8.545% 🟡 |
| ram available | 6.1G (20%) | 5.3G – 6.4G |
| ram `some` @60s | 71.45% | — |
| ram `full` @60s | 53.70% | 22% – 69% |
| ram life | 46.131% | 45.448% – 45.607% |
| io `some` @60s | 0.00% | 0.00% |
| 🟢 oom kills | **0** | 0 |

🔴 **this is the first read of the run where the red cpu badge is TRUE**, and the two rows that
prove it are the two the badge does not grade: `runq 12` against 4 cores, with `blocked 0`. twelve
runnable tasks and none in `D`-state — so this red is cpu contention, not a memory-reclaim verdict
dressed as a cpu one.

⚠️ **that does NOT vindicate the grader.** the badge read 🔴 on `load` in every prior read too,
where `runq` was 0 or 1. an instrument that is right on read 8 and wrong on reads 1-7, off the same
arm, has not become correct — it has coincided. the repair is unchanged and is caught in
`.dream/2026_09_06.cpu-badge-grades-load-which-counts-blocked-tasks.dream.md`.

⇒ and it sharpens that dream's fix: **`runq` and `blocked` are a PAIR, and the pair is the
diagnosis.** high `runq` + low `blocked` = a real cpu verdict. low `runq` + any load = a ram verdict
mis-slotted. neither row is graded today.

##### .the abort condition did not fire, and one arm of it stays unmeasurable

`0` oom kills, `0` husks. but per the instrument gap recorded above, that `0` is a **kernel** count
and `earlyoom` — this grove's actual guard — kills in userspace with `SIGTERM` and never touches it.
⚠️ so *"the abort condition did not fire"* means *"no KERNEL kill and no husk seen"*, which is
weaker than the condition as written.

##### 🔴 .the very next read shows that `runq 12` was a SPIKE — do not read it as steady state

| row | the "honest red" read | 15 minutes later |
|---|---|---|
| cpu badge | 🔴 | 🟡 |
| cpu load | 108% | **62%** |
| cpu `runq` | **12** | **0** |
| cpu `blocked` | 0 | 0 |
| cpu idle | 27% | **65%** |
| cpu trend | `1m 4.31 · 5m 4.28 · 15m 4.60` | `1m 2.46 · 5m 3.36 · 15m 3.99` |
| ram available | 6.1G | 6.0G |
| ram `full` @60s | 53.70% | **61.20%** |

⇒ `runq` fell 12 → 0 with **no act between the two reads**, so it is a single-sample instant row
and carries the same defect as instant PSI: **too noisy to gate on**. the smoothed row is the one
that told the truth — the cpu trend fell monotonically across all three windows.

⚠️ **and the ram rows moved the OTHER WAY** — `full` rose 53.70% → 61.20% while every cpu row
improved. that is the split this whole run keeps at the center: **the grove is ram-bound, never
cpu-bound**, and any read that says otherwise is one sample of a noisy row.

⇒ so the *"first honest red"* above is a real observation about the GRADER, and **not** a claim
about the grove's steady state. the steady state is `runq 0-1`.

#### run 1, STEADY STATE — 2026-09-07, at 31 crews

⚠️ the T+2min row above is **mid-install** and was never a verdict. these two reads are, taken
fifteen minutes apart on an otherwise quiet fleet, and they bracket a sprout — a 31st crew was
booted between them.

| row | before the sprout | after the sprout |
|---|---|---|
| ram available | 6.5G (21%) | **5.9G (19%)** |
| ram committed | 79% | **81%** |
| ram `some` @60s | 51.87% | 54.43% |
| ram `full` @60s | 20.31% | 20.37% |
| ram life | **48.520%** | **48.524%** |
| 🟢 oom kills | **0** | **0** |
| cpu `runq` · `blocked` | 11 · 0 | 9 · 0 |
| cpu idle | 34% | **3%** |
| cpu `some` @60s | 41.54% | 41.59% |
| cpu life | 8.758% 🟡 | **8.774%** 🟡 |
| io `some` @60s | 0.06% | 0.77% |
| io life | 0.094% 🟢 | 0.094% 🟢 |

🔴 **the abort condition has NOT fired.** zero oom kills across 4.0 days of uptime, and no husk
that a quota cap does not explain. so the run continues and no threshold is promoted.

⇒ **the lifetime rows are the ones that hold still, and they are the ones to gate on.** across a
sprout, `cpu life` moved 8.758% → 8.774% and `ram life` moved 48.520% → 48.524% — four
thousandths of a percent, over four days of accumulation. every instant row moved by ten to
thirty points across the same interval, and `cpu idle` moved **34% → 3%**, which read alone would
look like a catastrophe and is merely one sample.

⚠️ **and the halt condition did not fire on the read that looks worst.** `cpu idle 3%` under a
🔴 badge is exactly the shape that invites a panic-halt; the rule gates on **lifetime** cpu stall,
which is 8.774% — 🟡, below the 10% red. **that gap is where the rule earns its keep**, and it is
the strongest evidence so far that the lifetime row was the right choice of gate.

⇒ still ram-bound, still not cpu-bound. `ram life` sits at **48.5%** — the grove has spent
roughly half its life with at least one task waited on memory — while `io life` is 0.094%. a
grove that thrashed would show io; this one does not, because there is no swap cushion to thrash
into (it is hibernate-reserved). **it does not thrash. it ooms.**

#### 🔴 the clean separation — 2026-09-07, an idle cpu beside a 61% ram `full`

a **material** shift, appended for that reason rather than as a per-tick row. the axes came apart
completely, which is the strongest evidence the run has produced:

| row | the prior reads | this read |
|---|---|---|
| cpu **idle** | 34% → 3% → 31% | **96%** |
| cpu **runq** · blocked | 11 · 0 → 9 · 0 → 2 · 0 | **0 · 0** |
| cpu `some` @60s | 41.5% → 41.6% → 42.8% | **12.44%** |
| cpu **life** | 8.758% → 8.887% | **8.502%** 🟡 |
| ram `full` @60s | 20.31% → 20.37% → 22.36% | 🔴 **61.12%** |
| ram **life** | 48.520% → 48.600% | 🔴 **52.403%** |
| 🟢 oom kills | 0 | **0** |

⇒ **the cpu is idle by every row it prints** — `runq 0`, `idle 96%`, its lifetime stall DOWN —
while the ram row hit a new extreme, `full` at three times any prior read. `full` means **no work
progressed**, so for 61% of that window the box made no forward progress on memory alone, beside
an idle cpu.

🔴 **and the badge still reads `🔴 cpu`.** at `runq 0` and `idle 96%` no cpu contention exists by
any measure the tool prints — the badge is driven by `load_pct` (173%), which counts `D`-state
tasks blocked in memory reclaim. **this read is the cleanest possible demonstration of the grader
defect** recorded in `.dream/2026_09_06.cpu-badge-grades-load-which-counts-blocked-tasks`: load
high, cpu idle, ram saturated. the load was never about the cpu.

⚠️ **the abort still has NOT fired** — `earlyoom` has taken zero kills across 4.4 days, through a
window where memory stalled 61% of the time. the guard holds at a pressure that reads alarming,
which is a fact about `earlyoom`'s headroom rather than about the fleet's safety margin, and it is
the reason no threshold is promoted off this run.

⇒ so the two-axis rule earns its keep a second way. a one-axis reader of the **cpu** row halts a
healthy fleet; a one-axis reader of the **ram** row panics at 61% while zero processes have died.
**read both life rows, and let the measurement name the axis.**

#### 🔴 the RECONVERGENCE — 2026-09-07, both axes loaded at once

a **material** shift, and specifically the **reversal** of the separation row above. that row
caught the axes at their furthest apart — an idle cpu beside a saturated ram. this one catches
them back together, at 36 crews.

| row | the separation read | this read |
|---|---|---|
| cpu **idle** | 96% | 🔴 **0%** — a new low; prior range 3%–96% |
| cpu **runq** · blocked | 0 · 0 | **11 · 0** |
| cpu `some` @60s | 12.44% | **33.76%** |
| cpu **life** | 8.502% 🟡 | **9.217%** 🟡 |
| ram available | — | **6.0G of 31G (19%)** · 81% committed |
| ram `some` @60s | — | 🔴 **85.48%** — a new high; prior recorded max 54.43% |
| ram `full` @60s | 🔴 61.12% | **33.74%** |
| ram **life** | 52.403% | 🔴 **53.369%** — a new high |
| io `some` @60s | — | 0.61%  ·  io life 0.106% 🟢 |
| ⚪ oom kills | unmeasured | **unmeasured** |

⚠️ **`cpu life` at 9.217% is NOT the run's high, and the near miss matters.** it is the highest of
the 09-07 series (8.502% – 8.887%) and it still sits under the **9.291%** recorded on 09-03 in the
three-date table above. so the honest read is *"back to the 09-03 band"*, never *"a new extreme"* —
and the halt did not fire either time, 0.78 and 0.71 points under the 10% red respectively.

🔴 **the separation row is one draw, not a law.** read alone it invites the gloss *"this grove is
ram-bound, so the cpu row can be discounted"* — and this read refutes that gloss. the axes can
load together, and when they do the **cpu** row is the one nearer its own gate.

⇒ what holds across both reads is the gate itself. the **lifetime** rows moved by hundredths while
`cpu idle` swung **96% → 0%** and `ram full` swung **61.12% → 33.74%**. a reader of `cpu idle 0%`
alone halts a fleet that its lifetime row says is fine — the same defect the separation read
demonstrated, from the opposite direction.

⚠️ **the abort has still NOT fired.** no husk, and both experiment crews were verified alive in the
same tick: `feat-demo-trusts-ahbode-grove` at `1.vision, review.peer, l1@i005`, churned 9m19s, and
`feat-grove-reach-ehmpathy-demo` addressable on the same grove. the oom row stays ⚪ **unmeasured**,
so *"no kill"* means *"none seen"* and never *"none happened"* — no threshold is promoted.

#### 🔴 the CPU ROW TAKES THE LEAD — 2026-09-07, a new all-time high on the gate row

a **material** shift, and the first one that lands on the row the halt gate actually reads. three
consecutive ticks, one direction:

| row | 09-03 peak | tick 1 | tick 2 | **tick 3** |
|---|---|---|---|---|
| cpu **life** | 9.291% | 9.217% | 9.266% | 🔴 **9.430%** |
| cpu `some` @60s | — | 33.76% | 60.26% | 🔴 **75.72%** |
| cpu **runq** · idle | — | 11 · 0% | 19 · 0% | **19 · 0%** |
| ram `full` @60s | — | 33.74% | 11.36% | **3.61%** |
| ram `some` @60s | — | 85.48% | 84.90% | 70.25% |
| ram **life** | — | 53.369% | 53.446% | **53.514%** |
| ram available | — | 6.0G (19%) | 6.3G (20%) | 6.2G (20%) |
| io `some` @60s | — | 0.61% | 0.29% | 0.20% · io life 0.107% 🟢 |
| ⚪ oom kills | — | unmeasured | unmeasured | **unmeasured** |

🔴 **9.430% exceeds the 09-03 peak of 9.291%** — the highest lifetime cpu stall this file has ever
recorded, and the halt gate sits **0.57 points** above it. the three ticks rose +0.049 then +0.164,
so the rate itself went up.

⚠️ **and this revises a claim this brief states twice.** *"still ram-bound, still not cpu-bound"*
was fair on every read that produced it. it is no longer the whole picture: across these three
ticks **ram `full` fell 33.74% → 3.61%**, near its run low, while cpu rose to an all-time high.
the two rows moved in **opposite** directions.

🔴 the correction is narrow, and the overclaim is easy here. on the **ratio** ram still dominates —
53.514% against 9.430%, 5.7×. so the honest statement is not *"it is cpu-bound now"*, it is:

> **the ram row is the larger one; the cpu row is the one in MOTION — and the cpu row is the one
> the gate reads.** a fleet judged by ram alone would read this window as an improvement.

⇒ that is the practical value of the two-axis rule stated a third way. the first appended row
caught the axes apart, the second caught them together, and this one catches them **divergent** —
each time, the axis a one-row reader would have watched was the wrong one.

⚠️ **an unpromoted observation, n=2, recorded so a third instance is legible.** two clones wedged
on `nvim` this day — a program alive and unreachable, deaf to raw keystrokes, its view repaintable
by `crew.refresh` while it consumed no input; `crew.reboot` cured both. **both on this grove; zero
on `grove-ahbode-v20260811`, which sits at 97% ram free.** an `nvim` also entered this read's top
three at **21.3% cpu · 2.5% mem**.

🔴 **this is NOT the abort's `husk`, and the difference matters.** a husk is a pane whose program
is **dead**; this is a pane whose program is **alive and unreachable**. `earlyoom` kills with
`SIGTERM`, so a kill would end nvim and hand the shell back rather than wedge it. the likelier read
is a **D-state block in memory reclaim** — the very state this file already records as the driver
of the cpu badge that misreads. the poll names neither state, so no threshold moves on it.

⇒ **the word is now paved — `term=duct.program.wedge`**, and its cluster carries the discriminator
this paragraph reaches for: a wedge is established by a **probe**, never by a read, so no poll can
flag one. ⚠️ it also retires a claim adjacent to this one — *a merely-slow process absorbs a
SIGTERM grace exactly as a wedged one does*, measured on this very grove at `runq 35`. so the
`earlyoom` argument above holds on the **outcome** (a kill ends nvim, it does not wedge it) and
must not be extended into *"a wedge is deaf to TERM"*, which is refuted.

#### 🔴 the TRIGGER went DEGENERATE — 2026-09-07, and the gate will fire on ARITHMETIC

both lifetime rows set new highs again — cpu `9.430% → 9.663%`, ram `53.514% → 53.603%`. that is
the **third consecutive tick** on which *"a new extreme on the lifetime row"* holds, and that is
the tell: a trigger true every time discriminates naught.

the mechanism is arithmetic, not fleet condition. **a lifetime row is a cumulative average over
uptime**, so it rises whenever the instant rate exceeds it — and on this box the instant rate has
sat far above the average for days:

| row | instant `some` @60s | lifetime | |
|---|---|---|---|
| **cpu** | 39.05% | 9.663% | instant is **4× the average** ⇒ the row climbs, and must |
| **ram** | 43.68% | 53.603% | instant is **below** ⇒ this row has reached its own turn |

✅ **the ram prediction CONFIRMED one tick later** — `53.603% → 53.545%`, the **first lifetime-row
reversal on record**, with instant ram `some` at 27.49% (still under the average, so it declines
further). cpu moved the other way on the same read — `9.663% → 9.758%`, instant 50.21%.

⇒ so the cumulative-average model is not merely argued, it is **tested**: it named which row would
turn and which would climb, one tick ahead, and both held. that is what licenses the rule below —
a lifetime row's direction is **derivable**, so its new highs carry no news.

the run to the gate is checkable in four lines:

```
uptime 4.6d = 110.4h ;  cpu life 9.663%   ->  10.67h stalled
the 10% gate needs                        ->  11.04h
solve  (10.67 + 0.39t) / (110.4 + t) = 0.10
                                          ->  t ≈ 1.3h
```

🔴 **so the 10% halt fires in about 1.3 hours — five or six babysit ticks — with no change in
fleet conditions whatever.** naught has to worsen. the average merely catches up to a rate the box
has held since the run began.

⇒ what that obliges, stated before it happens so the moment is legible: **when the gate fires it
is NOT evidence the grove degraded.** a supervisor who halts sprouts on it and reports *"saturation
rose"* will have reported arithmetic as a result. the honest sentence at that moment is *"the
lifetime average reached a rate this box has held for days."*

##### the two rows STOOD AT ODDS inside one read — the sharpest demonstration yet

| tick | cpu `some` @60s |
|---|---|
| 1 | 33.76% |
| 2 | 60.26% |
| 3 | 🔴 75.72% |
| **4** | **39.05%** — halved |

and the load trend declines monotonically **within this single read**: `15m 15.65 · 5m 12.71 ·
1m 8.67`. so instant cpu contention genuinely reversed **in the same read where the lifetime row
set a new high.**

⇒ the prior three appends each caught the two AXES at odds. this one catches **one axis's own two
ROWS** at odds, and it settles what each is for:

> **the instant rows carry the NEWS. the lifetime row carries the GATE.** two jobs, and this
> record had used one row for both.

⚠️ **do NOT move the threshold off this.** one run, and the observation is about a row's
**dynamics**, never about the number's correctness. what it argues is narrower, and it is a rule
for the RECORD rather than for the fleet: **a lifetime row is a poor trigger for a new-extreme
append**, because on a loaded box it is very nearly a ratchet. append on a reversal, an abort, or
a new extreme **in an instant row** — the lifetime row's new highs are expected and say naught.

##### the control, free this tick

`grove-ahbode-v20260811` woke at **uptime 0.1d** and reads 🟢 on every row — cpu life `0.088%`,
ram `30G available of 31G`, io life `0.129%`. same instance type, same fleet, same day.

⇒ a clean zero beside `53.603%`, which is what makes the work grove's figure a **load** fact
rather than an instrument artifact. the two boxes differ in one variable: crews.

##### 🔴 the gate FIRED — 2026-09-07, on schedule, and its REMEDY was empty

cpu lifetime crossed at `10.030%`, up from `9.663%`. the solve above said t ≈ 1.3h and named no
other cause; **it crossed on time, with no change in fleet conditions whatever.** so the sentence
drafted before the moment is the one kept at it: *the lifetime average reached a rate this box has
held for days.*

| the read when it fired | |
|---|---|
| cpu life | 🔴 **10.030%** — the gate |
| cpu instant | `some` 26.94% @60s · idle 1% · **runq 1** |
| ram | 7.1G of 31G (23%) · `some` 40.35% · `full` **23.00%** · life `53.394%` |
| io | `some` 0.00% · life 0.109% |
| oom | ⚪ unmeasured — invisible, never absent |

⇒ the ram lifetime row fell a **fourth** consecutive tick (`53.603 → 53.545 → 53.438 → 53.394`), so
the cumulative-average model now rests on two forward predictions and one sustained reversal.

🔴 **and the gate's own remedy named NAUGHT.** `git.crew.poll --fellable` returned *"no tree to fell
— 36 polled, none merged"*. the halt clause has two arms — stop sprouts, and fell what is fellable
— and **the second arm was a no-op at the exact moment it was reached.**

that is no defect in the clause. it is a fact about the fleet, and it is the more useful half:

> **fellability is downstream of MERGE. a grove saturated with IN-FLIGHT work has no relief valve,
> because the valve opens only on FINISHED work.**

⚠️ this joins a diagnosis made independently one tick earlier, at the duct layer, by
`rhachet-roles-bhrain.beav.fix-contemplation-gate-on-entrance`: *zero commits, so cicd has never
run, so `since-main` unions 437 files, so 5 of 8 peer lanes overflow.* **the zero-commit review
spiral and the empty fell list are one phenomenon read from two ends** — naught merges, so lanes
overflow AND no tree becomes fellable. `rule.always.break-the-zero-commit-review-spiral` names the
first end; this names the second.

⇒ so a supervisor who reaches the halt gate in expectation of reclaimed capacity should expect to
reclaim **naught**, and should read an empty fell list as a measurement rather than as an error.

⚠️ **confirmed twice more on the two reads after** — `no tree to fell — 36 polled, none merged`,
three reads, three empties. the arm is not flaky; it is structurally empty for this fleet.

##### 🔴 the RAM headroom declines monotonically — the abort's run-up, on record BEFORE it fires

three consecutive reads after the gate, and the one instant row that matters moved one direction:

| read | ram available | committed | `some` @60s | `full` @60s | ram life |
|---|---|---|---|---|---|
| gate fired | 7.1G (23%) | 77% | 40.35% | 23.00% | 53.394% |
| +1 | 6.3G (20%) | 80% | 32.81% | 11.81% | 53.347% |
| +2 | **5.6G (18%)** | **82%** | 35.34% | 16.41% | 53.312% |
| +3 | 5.2G (17%) | 83% | 42.64% | 25.84% | 53.295% |
| +4 | 🔴 **6.2G (20%)** — UP | 80% | 44.69% | 🔴 **30.18%** | 53.275% |

⇒ roughly 0.75G per read through +2. **the two stall rows dipped at +1 and turned back up at +2;
the headroom row had no dip at all.** off those three points i concluded that the stall rows carry
noise and the headroom row carries the trend.

### 🔴 .that conclusion was WRONG, and two reads later refuted it — 2026-09-07

at +3 the decline decelerated to 0.4G. at +4 the headroom row **REVERSED** — `5.2G → 6.2G`,
committed 83% → 80% — while `full` stall set a **new high at 30.18%** and page cache grew
`2.1G → 2.3G`.

⇒ so headroom rose **because the kernel reclaimed under pressure**, never because demand fell. the
cache growth is the mechanism and the stall row is the evidence, and both moved opposite to the
comfortable read.

> 🔴 **neither row alone carries the trend. a headroom row can RISE from reclaim, which is a
> SYMPTOM of pressure rather than relief.** read the pair — and read a rise in headroom beside a
> rise in stall as the WORSE of the two states, never the better.

⚠️ this is the same defect this record already catalogues one axis over, committed by the same
author two reads later: **a claim made off one row, refuted by the next read.** four points were
not enough, and the fifth inverted the conclusion — `rule.require.enumerate-before-you-name`,
which grades exactly this a blocker.

⇒ what survives is the narrower claim the enforcement clause already carries: **read both life
rows, and let the measurement name the axis.** what does NOT survive is any claim that one row is
the trustworthy one.

🔴 **the lifetime row declines throughout, and that is NOT good news.** instant `some` at 35% sits
under the 53% average, so the average must fall. it is the same arithmetic that drove the cpu row
UP to the gate, run backwards. ⇒ **a lifetime row in decline beside a headroom row in decline is
the shape to fear**, because the number that reassures is the derived one.

⚠️ this box has **no swap cushion** — the instrument repeats it on every read: *"pressure ooms
rather than thrashes."* so no gradual thrash phase precedes the kill. the sequence is headroom
down, headroom down, kill.

⇒ recorded now so the run-up is measured rather than reconstructed afterward. **do NOT promote a
threshold off this** — one run, three points, and the decline may simply stop. what it earns is a
WATCH, never a number: the abort condition already exists, and this is its precursor.

### 🔴 .the decline DID stop — and the two axes then moved in OPPOSITE directions

the clause above allowed that *"the decline may simply stop."* it did, at +6, and the shape it
turned into is one no single-axis read can express:

| read | ram avail | `some` @60s | `full` @60s | **ram life** | **cpu life** |
|---|---|---|---|---|---|
| +5 | 4.9G (16%) | 35.10% | 14.88% | 53.187% | 10.363% |
| +6 | 5.8G (19%) | 30.10% | 7.35% | 53.117% | 10.529% |
| +7 | **6.1G (20%)** | 30.04% | 8.53% | **53.086%** | 🔴 **10.571%** |

⇒ **headroom UP, stall DOWN, ram life DOWN — together.** that combination is what parts genuine
relief from the reclaim at +4, where headroom rose while `full` set a new high. the discriminator
the repaired law demanded, met by measurement rather than by argument.

🔴 **and the axes DECOUPLED.** ram relieves across all three reads while cpu climbs through every
one of them. so *"the grove recovers"* and *"the grove degrades"* are both true, of different
resources, at the same moment — and either sentence alone is a `partial-audit`.

⇒ **this is the strongest evidence yet for the two-axis enforcement clause below.** it was written
as a guard against a wrong verdict; here it is the only vocabulary in which the state can be
*stated at all*. a one-axis reader has no sentence for this box.

#### ⚠️ .the confound — named, because it is mine

between +5 and +6 the supervisor rebooted a mechanic that had run **5h18m**, on the human's
instruction. that freed one long-lived claude, so **the +6 relief is at least partly the
supervisor's own act, never the fleet's steady state.**

what argues the reversal is more than that one process: the ram lifetime row fell again at +7, ten
minutes later, and a cumulative average over **4.9d** of uptime does not keep its decline on a
single free — the instant rate has to stay under the average to drag it down.

⇒ recorded **with** the confound rather than without it. a reversal logged as clean data, where an
intervention caused part of it, is a `false-report` that a later run would inherit and trust.

### 🔴 .the relief lasted TWO READS — and THAT is the finding, not the relief

| read | ram avail | `some` @60s | `full` @60s | ram life | cpu life | io `some` |
|---|---|---|---|---|---|---|
| +7 | 6.1G (20%) | 30.04% | 8.53% | 53.086% | 10.571% | 0.08% |
| +8 | **5.1G (16%)** | 🔴 **87.86%** | 🔴 **44.81%** | **53.130%** — UP | 10.599% | 🔴 **3.05%**, iowait 12% |

both instant stall rows set new extremes at **roughly double** the prior highs (44.69 / 30.18), the
ram lifetime average turned back up, and the io axis carried its first non-trivial load on this box.

⚠️ **the mechanism differs from +4, and the difference is the page cache.** at +4 the cache GREW
(`2.1G → 2.3G`) — the kernel reclaimed, so headroom rose while pressure did. here the cache SHRANK
(`1.9G → 1.8G`) while committed rose `80% → 84%`. ⇒ demand grew and there was no cache left to
give, which is why the stall doubled instead of the headroom.

#### 🔴 .three directional claims, three refutations — the signal has no trend at this cadence

| the claim, when made | reads it survived |
|---|---|
| *"the headroom row carries the trend, the stall rows are noise"* | 3 |
| *"a headroom rise is reclaim — the WORSE state"* | 2 |
| *"headroom up + stall down + life down = genuine relief"* | 2 |

⇒ each was true of the reads in hand and false one read later. **at a ~10-minute cadence the
instant ram rows swing fifty points; no directional story fit to three of them has survived a
fourth.** the defect is not any one claim — it is the attempt to read a trend off this row at all.

✅ **and that is precisely the instruction this run was given, now confirmed on the SECOND axis.**
the tick contract says *"gate on the LIFETIME row, never on `cpu idle` or `runq` — those are
single-sample instant rows and swing thirty points between ticks."* ⇒ the ram instant rows swing
**fifty**, and the ram lifetime row moved 0.044 points across the same interval. **the rationale
was stated for cpu and holds for ram, measured rather than assumed.**

#### ⚠️ .two confounds, both the supervisor's

1. **14 reflector ducts created** in the prior tick — 14 tmux sessions and shells that did not
   exist before. bare shells are cheap, so this poorly explains a 1G swing, and it is not zero
2. **the poll's own `unread` count rose `6 → 13`** in the same tick the stall doubled, and its
   per-role count `18 → 27`. two causes are available and this run cannot part them: pane captures
   that time out under stall, or simply 14 more panes to capture

⇒ ✅ **either way the instrument degrades in the SAFE direction.** it renders `unread` — *"we could
not look"* — rather than a state claim, which is exactly what `term=asleep` exists to protect. an
instrument that reported `frozen` here would have asserted a fact from a failed read.

⚠️ **a rise in `unread` is therefore ambiguous by construction** and must not be read as a fleet
symptom. what it does earn is a note: **the poll is a consumer of the resource it measures.**

### 🔴 .FIVE monotonic reads of the lifetime row are ONE fact, not five — 2026-09-08

both lifetime rows have now held one direction for five consecutive reads, and they held
**opposite** directions:

| read | ram life | cpu life | ram avail | committed |
|---|---|---|---|---|
| +5 | 53.187% | 10.363% | 4.9G (16%) | — |
| +6 | 53.117% | 10.529% | 5.8G (19%) | — |
| +7 | 53.086% | 10.571% | 6.1G (20%) | — |
| +8 | 53.069% | 10.786% | 6.0G (20%) | 80% |
| +9 | **53.019%** | **10.891%** | **4.7G (15%)** | **85%** |

five reads, two axes, no reversal. that reads as the strongest result this run has produced.

🔴 **it is not a result at all. a cumulative average holds one direction WHENEVER the recent rate
sits on one side of it, and it cannot do otherwise.** the lifetime row is `total stalled seconds ÷
uptime` — an integral. its DIRECTION is the sign of `recent rate − current average`, full stop.

⇒ so five monotonic reads assert exactly one fact per axis: *"recent ram stall has sat below 53%,
and recent cpu stall above 10.9%."* **that is one claim, never five confirmations of one.** each
further read that keeps the sign adds no evidence — it is arithmetic already entailed by the first.

#### ⚠️ .this does NOT overturn the tick contract's instruction — it BOUNDS it

the contract says *"gate on the LIFETIME row, never on `cpu idle` or `runq`."* ✅ **that stands, and
this section is why it stands**: an integral is stable precisely because it cannot lurch, which is
exactly what a GATE needs.

| the lifetime row used as a… | verdict |
|---|---|
| **gate** — *"is this grove saturated right now?"* | ✅ the right instrument. one sample cannot spoof it |
| **trend** — *"is it worse than last tick?"* | 🔴 the wrong one. its direction is entailed, never observed |

⇒ **one row, two uses, and it is fit for one of them.** to read a gate as a trend is an error
available to anyone who watches a stable number over time — which is the whole purpose of a stable
number, and therefore the trap it carries.

#### .what a real ram trend would take

the instant rows move fifty points at this cadence (recorded above), so one read of either row
settles neither direction. what would settle it: **a windowed rate** — stalled seconds over a fixed
recent interval, differenced between ticks — which `git.grove.saturation` does not emit and would
have to derive from two `total` samples and their uptimes.

⇒ recorded as an arrear, never a threshold. **this run has produced no ram trend, and five reads
that look like one is the reason to say so out loud.**

## 🔴 .RUN 1 ABORTED — a husk, exit 143, no cap line — 2026-09-08

the declared abort condition was *"the first OOM kill or the first husk not explained by a quota
cap."* the second arm fired.

`rhachet-roles-bhrain.beav.feat-peer-review-parallelism/mechanic`:

```
  🗿 1.vision, judge, approved? 👋
  ⏵⏵ accept edits on (shift+tab to cycle)

camper in …feat-peer-review-parallelism … took 4d11h48m55s at 03:43:41
💥143 ➜
```

a textbook husk by every row of `term=duct.pane.husk`'s discriminator: claude's chrome above, a
live shell prompt below, and the shell's own exit indicator on the line the test says to read.

| the abort test | verdict |
|---|---|
| is it a **husk**? | ✅ `143` + a shell prompt beneath the chrome |
| is it explained by a **quota cap**? | ⛔ **no cap line anywhere.** the final message is complete and coherent, then `✻ Baked for 8m 39s`, then death |
| an OOM **record**? | ⚪ unavailable by construction — `oom ⚪ not measured, no journal access` |

### ⚠️ .the ram figure at the kill is NOT recoverable — and that is a defect in the protocol

the protocol says *"record the ram figure at the moment of the kill."* **it cannot be honored.**
the kill landed at `03:43:41` and the husk surfaced only when a later poll made the pane readable
— the tree rendered `😴 unread` in the two polls before it. so what follows is the figure **at
detection**, and it is a different quantity:

| | value |
|---|---|
| ram available, at DETECTION | 6.4G of 31G (21%) |
| committed | 79% |
| page cache | 1.3G |
| ram `some` / `full` @60s | 25.84% · 2.22% |
| ram life | 52.967% |
| cpu runq · idle | 16 · 0% |
| cpu life | **11.009%** |
| io `some` @60s | 0.06% |
| OOM kills | ⚪ unmeasured |

🔴 **and the detection figure is a poor proxy for the kill figure, in the WORST direction: an OOM
kill FREES the memory it takes.** the 6.4G read here plausibly includes the ~4.5G a 4½-day claude
released when it died. so the number above may be *caused by* the event it is meant to describe.

⇒ **the protocol asked for a measurement the instrument cannot take.** to record a kill-time figure
you need a sampler that runs at the kill, never a supervisor who polls every fifteen minutes. that
is an arrear on `git.grove.saturation` — a retained sample window, or journal access so `earlyoom`
can be read directly — and it is the single most valuable repair this run identified.

### 🔴 .the `143` is a CORRELATE, and it is named as one

`term=duct.pane.husk` reads `143` as *"SIGTERM — earlyoom is this box's only guard."* that is an
inference, never a record. SIGTERM has other sources: a `crew.reboot`, a tmux kill, a shutdown.

⚠️ **no reboot was issued against this tree this session**, and the process had run `4d11h48m55s` —
which is exactly the profile earlyoom selects, since it picks by memory and a long-lived clone holds
the most. so the inference is well supported and it is still an inference.

⇒ **the abort arm was written for precisely this** — it tests for a **husk without a cap**, never
for a confirmed OOM, because the confirmation is unavailable on this box. ✅ **the condition is
sound as drafted**, and a condition that demanded the unreadable record would never have fired at
all. that is the design lesson worth a carry into run 2.

### ⚠️ .what the abort does NOT settle

- **no threshold is promoted.** one run, one kill (`do NOT promote any threshold off one run`)
- **the kill is not attributed to the over-sprout.** two nano crews were added to a grove already
  🔴 on ram; the grove also carried 11 `nvim` at **14.6% mem (~4.5G)** and a fleet of 19. this run
  cannot part those causes, and a claim that the sprout did it would be a correlate dressed as a record
- 🔴 **the victim was a PARKED clone** — `1.vision, judge, approved? 👋`, waited on a human gate.
  that is the husk spiral of `term=duct.pane.husk`, not a ram verdict: a parked clone loops its stop
  hook, grows, and dies. **the grove chose the fattest process, and the fattest was the idlest.**

### 🔴 .the ram "RECOVERY" after the abort is CORPSES — measured one poll later

the abort section above hedged: *"the 6.4G read here **plausibly** includes the ~4.5G a 4½-day
claude released."* the next poll measured it, and the hedge was too weak.

| | at detection | one poll later |
|---|---|---|
| ram available | 6.4G (21%) | **9.5G (31%)** — a new high on the whole run |
| committed | 79% | **69%** — a new low |
| `nvim` processes | **11**, at 14.6% mem (~4.5G) | 🔴 **1**, at 5.9% mem (~1.8G) |

**ten editors gone between two polls, ~2.7G released** — and one pane recorded the death in its
own words, which no exit code can:

```
➜ nvim
Nvim: Caught deadly signal 'SIGTERM'
Nvim: Finished.
…
💥1 ➜
```

🔴 **so the new high is not a recovery. it is the memory of ten dead editors and one dead clone.**
a reader who follows `4.7G → 6.4G → 9.5G` across three polls reads a grove that healed. **the
grove did not heal; its tenants died.**

⚠️ **and the direction of the error is the dangerous one.** every other misread in this file makes
a healthy grove look sick. this one makes a grove that actively reaps its tenants look **well** —
and `ram available` is the very row a sprout decision reads.

#### ⚠️ the sender of that SIGTERM is STILL not recorded

`Nvim: Caught deadly signal 'SIGTERM'` is a record that a SIGTERM **arrived**. it is not a record
of **who sent it**, and three senders are available:

| candidate | what it would explain |
|---|---|
| `earlyoom` | all ten, and it fits a 🔴 grove with a fresh claude husk |
| the human | closed terminals — one was closed by hand this session |
| a `crew.reboot` | **at most one pane.** one was issued, to an unrelated tree |

⇒ **this run cannot part them**, and to write *"earlyoom reaped ten nvim"* would be the correlate
dressed as a record for the sixth time. what IS settled needs no attribution at all: **ten
processes died, the memory they held is what the `available` row now reports, and the row says so
in a word that means the opposite.**

#### 🔴 the survivor is the tell that undercuts the tidy story

`pid 1791658`, up `1-12:06:54`, **5.9% mem — the fattest nvim on the box, and it lived.** a
memory-ranked reaper would have taken this one first. so either the sender was not memory-ranked,
or it was not one sender. **the one process that most looks like a runaway is the one that
survived**, and that fact is what keeps the attribution open.

⇒ ✅ no prune is owed: one idle editor at 1.8G, on a grove now at 31% headroom, after a reap it
already survived.

## 🔴 .THREE NEW EXTREMES, and the abort did NOT fire — 2026-09-08

a material shift on september. recorded per the run protocol's *"append on a new extreme, a
reversal, or an abort"* — the first arm throughout, never the third.

⚠️ **it opened on the ram axis and later crossed to cpu**, which is the section's own finding rather
than a change of subject: see *"column seven"* below. the table carries both axes for that reason —
they are one event, and either axis read alone reports a grove with room to spare.

| row | the series across four prior ticks | 🔴 the RAM extreme | re-measure | re-measure | 🔴 a NEW low | 🔴 the CPU extreme | 🔴 low | ✅ RAM REVERSAL | ✅ CPU REVERSAL | 🔴 RAM RECORD | 🔴 CPU LIFE RECORD |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ram available | 9.3G → 8.6G → 7.7G → 7.2G | **6.2G** | 6.2G — **flat** | 6.2G — **flat** | **5.1G** | 5.1G — **flat** | **3.9G** | ✅ **6.0G** | 5.9G | 5.2G | 6.8G |
| ram committed | — | — | — | 80% | **84%** | 83% | **88%** | 81% | 81% | 83% | 78% |
| ram stall `some` @60s | ~35% | **61.96%** | **74.72%** | 74.72% | 52.65% | **25.30%** | 24.43% | 24.29% | 34.31% | 🔴 **84.44%** | 24.27% |
| ram stall `full` @60s | ~17% | **53.00%** | **69.08%** | 69.08% | 40.97% | **1.18%** | 0.03% | **0.00%** | 13.93% | 🔴 **81.81%** | **0.00%** |
| ram **life** | — | 52.734% | 52.777% | 52.794% | 52.664% | 52.614% | 52.558% | 52.503% | 52.375% | 🔴 **53.035%** | ⬇ **52.972%** |
| cpu load · idle · runq | 5.49 · 1% · 16 | 1.60 · **90%** · **0** | 1.98 · 94% · 1 | — | 3.01 · 28% · 1 | **20.59 · 0% · 28** | **28.95 · 0% · 26** | 🔴 **37.65 · 0% · 36** | ✅ **10.50 · 71% · 1** | 5.19 · **100%** · 0 | 28.63 · 0% · 23 |
| cpu stall `some` @60s | — | — | — | — | — | **85.31%** | **96.52%** | 🔴 **98.99%** | ✅ **46.94%** | ✅ **2.02%** | 98.25% |
| cpu **life** | — | 11.411% | 11.389% | 11.393% | **11.772%** | **11.916%** | 12.073% | **12.244%** | 12.591% | ⚠️ **12.474%** | 🔴 **12.762%** |

io `some` `0.34%` → `0.00%` → **1.26%** · OOM ⚪ unmeasurable throughout.

⚠️ **every column after the second is a re-measure, never a second event** — they are carried in
this one table rather than in a section apiece, because a section per tick is the accretion this
protocol forbids. and the series settles which rows to trust: **`available` and the two LIFE rows
held flat across three reads while both instant stall rows moved ~13 points, then ~22 points back.**
the instant `@60s` rows are one 60-second sample; the state they describe did not shift at all.

⇒ so a threshold promoted off an instant stall row would fire and clear on a grove that never
changed. **the life row is the one to gate on**, which is what the enforcement clause below already
says for a different reason.

⚠️ **6.2G was already below the 6.4G that run 1 recorded at its abort** — and run 1's figure was
itself inflated by the corpses of a dead clone and ten dead editors. **5.1G is the true low of the
whole experiment**, taken on a grove that has not just reaped anyone, with 84% of ram committed.

🔴 **column six is the one that breaks the flat run.** the three prior reads held `6.2G` exactly;
that one drops 1.1G while both instant stall rows *fall* by twenty points and cpu `idle` drops from
94% to 28%. ⇒ **the axes swapped back** — the grove runs work again, and it draws that work's cost
from the headroom rather than from stall time. `cpu life` set a new high on the same read
(`11.393% → 11.772%`), the first cpu-life rise after two flat ticks.

### 🔴 column seven — the swap COMPLETED, and it is the inversion's mirror image

the read above named a swap **in progress**. one tick later it is total, and in the direction that
column predicted:

| axis | at the ram extreme | 🔴 now |
|---|---|---|
| ram stall `full` @60s | **69.08%** | **1.18%** — collapsed by 68 points |
| ram stall `some` @60s | 74.72% | 25.30% |
| cpu load / 4 | 40% | 🔴 **515%** · runq **28** · idle **0%** |
| cpu stall `some` @60s | — | 🔴 **85.31%** |

⚠️ **`20.59 · 0% · 28` is a new extreme outright** — nearly 4× the prior worst load on record
(`5.49`) and nearly 2× its runq (`16`). so the append is licensed by the protocol's first arm on a
**second** axis, and the section's own title — *"on the ram axis alone"* — no longer holds.

🔴 **this is the third instance of the inversion this file records, and the FIRST in the opposite
direction.** the two prior instances both read *ram loud, cpu quiet*; this one reads *cpu loud, ram
quiet*, on the same box, three ticks apart. ⇒ so the inversion is **symmetric** rather than a
one-way artifact of how PSI accounts a page fault, which is what a single direction left open.

> **a grove trades its saturation between two axes, so a gate on one axis misses the half that
> moved.** at the ram extreme, cpu read `1.60 / 90% idle / runq 0` — a grove with room to spare. at
> the cpu extreme, ram `full` reads `1.18%` — a grove with memory to spare. **both reads were taken
> on a grove at 5–6G of 31G, and both single-axis verdicts were wrong.**

⇒ this is why the enforcement clause below demands the two axes be read **together**, and it is now
demonstrated in both directions rather than argued in one.

📜 **and neither direction is a new concept — both are the fifth cause of `term=false-report`**, the
QUANTITY-KIND cause, which already enumerates *"a stock … or a ratio whose denominator moves."* the
pair is recorded there as rows three and four of its table, with the axis each one lied about. ⇒ so
the durable lesson lives in the term cluster and this file holds the measurement — the split
`rule.always.scope-onetime-lessons-to-the-behavior` prescribes.

⚠️ ✅ **and the ram LIFE row held through all of it** — `52.794% → 52.664% → 52.614%`, a drift of
0.18 points across a shift that took instant ram `full` from 69% to 1%. the life-row rule stated
above survives its hardest test: **the row that ignored the swap is the row that was right.**

### ✅ column nine — the descent REVERSED, and a reaper is why

`available` ran `6.2 → 5.1 → 3.9`, then went **UP 2.1G to 6.0G**. that is the run protocol's second
arm, and it lands on the axis that had looked most like a trend.

🔴 **the cause is on the record, in a foreman pane** —
`svc-gateway.beav.feat-rec-marketplace-lead-capture`, ~08:59, minutes after a `pnpm install` of 968
packages was kicked off by a sprout onto this grove:

```
➜ nvim
Nvim: Caught deadly signal 'SIGTERM'
Nvim: Finished.
```

⇒ so the box **regulates its own headroom**. a reaper takes a fat process when the floor is
approached, and the stock recovers. **the descent was a report about the reaper's threshold, never
about exhaustion**, and no extrapolation through it was ever licensed.

📜 **the durable lesson is not here — it is `term=false-report`, the fifth cause, row one.** i drew
that line one tick after i paved the row that forbids it, and that self-catch is recorded there
rather than in this file (`rule.always.scope-onetime-lessons-to-the-behavior`). the transferable
form:

> **before a line through a stock: WHO ELSE MOVES THIS NUMBER?**

⚠️ **and the cpu axis rose further while ram recovered** — `20.59 → 28.95 → 37.65` load, runq to 36,
`some` to 98.99%. ⇒ note the asymmetry before that is read as its own trend: **cpu load and runq are
instant samples**, so they fall under the very caution above. the row that carries a real claim is
`cpu life`, which has risen every read since the swap — `11.772 → 11.916 → 12.073 → 12.244`. that
one is a cumulative, so a rise means the instant rate has stayed above the average throughout. it is
a durable statement; the others are not.

### ✅ column ten — the CPU axis reversed too, and the LIFE row did NOT

both axes have now completed a full excursion and returned, with **no fell, no sprout, and no act by
the supervisor on either.**

| row | at the CPU extreme (col 9) | one tick later | 🔴 now |
|---|---|---|---|
| cpu load / 4 | 37.65 = **941%** | 18.92 = 473% | ✅ **10.50 = 262%** |
| cpu runq | **36** | 27 | ✅ **1** |
| cpu idle | **0%** | — | ✅ **71%** |
| cpu stall `some` @60s | **98.99%** | — | ✅ **46.94%** |
| cpu **life** | 12.244% | 12.440% | 🔴 **12.591%** |

⚠️ **the middle read was measured and deliberately NOT appended** — no new extreme, no reversal yet,
so the protocol licensed no column. it is carried here as prose because it is the first half of this
reversal, and a two-point series that omits its own midpoint invites the exact extrapolation this
file spends its length to forbid.

🔴 **the last row is the whole finding. four instant cpu rows fell by 27-to-52 points; the cumulative
rose on every one of those same reads.** so:

- the instant rows say *"the cpu pressure is over"*
- `cpu life` says *"the instant rate is STILL above the 5.1-day average"* — which is what a rise in a
  cumulative means, and it admits no second read
- ⇒ **both are true.** the burst ended; the box remains, on aggregate, more cpu-stalled than it has
  been across its whole life, and the debt that burst added is not repaid

⇒ so the LIFE gate held through the entire excursion — `12.244 → 12.440 → 12.591`, above the 10%
threshold at the extreme AND at the apparent recovery. **a gate on `runq` or `idle` would have fired
at column nine and cleared here, on a grove whose cumulative cost only went up.** that is the third
independent confirmation of the enforcement clause, and the first from the recovery side.

### 🔴 column eleven — a ram RECORD, and the first LIFE row to move against its own run

two shifts in one read, and the second is the one worth the column.

**the instant record.** `some 84.44%` and `full 81.81%` beat the prior worst — `74.72%` / `69.08%`
at the ram extreme — by ten and thirteen points. so the hardest ram contention of the whole
experiment is measured **here**, at `5.2G` available: a figure the record has been below **twice**
(`3.9G`, `5.1G`). ⇒ **the stock and the stall peak on different reads**, which is the stock-vs-flow
split stated as plainly as it can be stated.

🔴 **and `ram life` REVERSED.** it had fallen on every read of this run — `52.794 → 52.664 → 52.614
→ 52.558 → 52.503 → 52.375` — and now reads **`53.035%`**, a new high for the run and a rise of 0.66
points in one tick.

⚠️ **that is a bigger event than any instant row here, and the reason is the arithmetic.** a
cumulative over 5.3 days moves 0.66 points only if the instant rate ran far above the average for a
sustained stretch. the absolute figure says it: **`64.7h → 67.2h` of stall, 2.5 hours accrued.**
⇒ **the grove spent roughly 2.5 of the last 3 hours stalled on memory.**

⇒ so the row this file trusts is the row that finally moved, and it moved **against** every instant
ram row of the two prior columns. ✅ the life-row rule is what caught it; a reader who tracked `full`
saw `0.00%`, then `13.93%`, then `81.81%`, and could conclude whatever they pleased from that.

🟡 **the cpu LIFE row fell** — `12.591% → 12.474%` — the first fall in this run, and it needs the
same care in the other direction: a cumulative falls when the instant rate runs **below** the
average, which `cpu some 2.02%` confirms. the two life rows moved in opposite directions on one
read. **that is the inversion, measured at last on the only rows that carry a claim** — every prior
instance of it was on instant rows, which is why it was arguable.

⚠️ **the supervisor was absent for this one, and that is the honest caveat.** the REPL ran long, so
eight cron ticks queued and roughly three hours passed unobserved. this column is therefore the
**endpoint** of that window, never a sample from within it — the 2.5 stalled hours are read off the
cumulative, which is exactly the row that survives an unwatched gap. **an instant row measured after
a three-hour blind spot would have carried no information at all.**

### 🔧 the rule CLIMBED A RUNG — the instrument now says it itself

`git.grove.saturation` printed this, unprompted, beside the load figure:

> ⚠️ load ungraded — runq 1 of 4 cores, so no task waits on cpu. linux counts uninterruptible sleep
> in the load average, so this reads the MEMORY axis. grade cpu on stall + life, never on load

⇒ that is this file's central claim, moved from 📚 rung 1 to 💪 rung 2 — a caveat every future reader
receives at the point of measure, with no brief consulted
(`philosophy.entoolment-is-the-pinnacle`).

🟡 **and the brief is not retired by it.** the tool states the RULE; it carries neither the twelve
columns, nor the inversion, nor the reaper — the evidence that makes the rule arguable. *"we entooled
it, delete the brief"* is the defect that philosophy names: the climb mechanized the **capacity** and
no concept at all.

### 🔴 column twelve — a cpu LIFE record, and the divergence is NOT what it looked like

`cpu life` reads **`12.762%`**, past the prior high of `12.591%`. the first new extreme this run
has set on a **cumulative** row rather than an instant one.

⚠️ **two ticks sit between column eleven and this one, and they were deliberately not appended.**
they read `12.481 / 53.070` and `12.540 / 53.044` — every row inside its record, so each was judged
immaterial on its own tick, which the protocol demands. ⇒ they are named here rather than columned,
because a **trend claim needs its intermediate points** and a per-tick column would have been the
accretion this protocol forbids. the two series, in full:

```
cpu  life   12.474 → 12.481 → 12.540 → 12.762     (up, now a record)
ram  life   53.035 → 53.070 → 53.044 → 52.972     (down, off its record)
```

🔴 **so the inversion is now a TREND, not a single read.** column eleven measured it once and called
that the first instance on rows that carry a claim. three consecutive reads move the two cumulatives
in opposite directions. that is no longer arguable as a sample artifact.

## 🔴 .and the obvious read of it is WRONG — a ratio whose denominator moves

*"ram life fell"* invites *"the ram axis eased."* **it did not.** the absolute figures say the
opposite:

| axis | absolute stall | the ratio |
|---|---|---|
| ram | 68.6h → **68.7h** — ROSE | 53.044% → 52.972% — **fell** |
| cpu | 16.2h → **16.6h** — rose | 12.540% → 12.762% — rose |

**both axes accrued more stall. only the ratios diverged.** `life` is a ratio over uptime, and
uptime advances every tick — so the denominator moves under both rows on every read.

⇒ a fall in `ram life` therefore means **"ram stalled BELOW its own 5.4-day average across this
interval"**, never *"ram stalled less than before."* the row is a comparison against the run's own
history, not against the prior read.

⚠️ **this corrects how the prior three columns were read here** — column eleven's own account among
them. the divergence is real and the direction claims stand; what does **not** follow is that either
axis got better. ⇒ it is the fifth cause of `term=false-report` — *a ratio whose denominator moves* —
caught at work on the very rows this file nominated as trustworthy. **the LIFE rows are still the
ones to gate on; they simply do not answer the question a reader assumes they answer.**

the arithmetic that settles it: uptime advanced ~0.37h between the reads (derivable from the two
ratio/absolute pairs, since the printed `5.4d` is too coarse). against that window cpu accrued
roughly 0.3–0.4h of stall — **an 85%+ stall rate over the interval**, which `cpu some 94.53% → 98.25%`
independently corroborates.

## 🔴 .the sharpest confirmation yet of the enforcement clause

on the read that sets a cumulative record, **every instant cpu row is BELOW its own record**:

| the instant row | this read | the record | verdict from that row alone |
|---|---|---|---|
| cpu load | 28.63 | 37.65 | "below record" |
| cpu runq | 23 | 36 | "below record" |
| cpu stall `some` @60s | 98.25% | 98.99% | "below record" |

⇒ **a gate on any instant row reports a calm-ish grove on the exact tick the grove hits its
worst-ever cumulative.** the three prior confirmations showed instant rows that swing *while* the
cumulative held; this one shows them **point the wrong way** at the moment of a record. that is the
failure the enforcement clause exists to prevent, caught in its most expensive form.

🟡 and the load trend row says the load is **sustained, never a spike** — `1m 28.63 · 5m 30.61 ·
15m 25.55`. so the cumulative rise is real queued work, not one unlucky sample.

## 🔴 .a cumulative's "new record" is NOT a material shift once the trend is recorded

⚠️ **read this before the next append.** the run protocol says *append on a new extreme*. for a row
that moves both ways — `ram available`, the instant stalls — that test is well posed. **for a
cumulative currently above its own average it fires EVERY tick, by construction**, since that is
precisely what such a row does.

⇒ measured the very next tick: `cpu life 12.918%`, another record, with `ram life 52.907%` still in
retreat. **the trend above, unchanged.** to column it would be a second account of one result, and
by the tick after that a third — the per-tick accretion this protocol exists to forbid.

| the cumulative does | the verdict |
|---|---|
| set its first record, and thereby establish a direction | 🔴 **material** — column it. that is column twelve |
| set another record in the same direction | ✅ **not material.** the trend is on record; a column adds a data point and no claim |
| **reverse** — fall after a run of rises, or rise after a run of falls | 🔴 **material.** the direction is the news |
| move against its own axis-pair, for the first time | 🔴 material — that is the inversion |

⇒ so the trigger for a cumulative is a **change of direction**, never a change of value. the extreme
test stays as written for the instant rows, which genuinely oscillate.

🟡 that same tick re-confirmed the enforcement clause a fifth time, and it needs no column either:
the load **trend** row read `1m 8.31 · 5m 11.55 · 15m 17.44` — monotonically down — and `cpu some`
fell 98.25% → 43.40%, while the cumulative set its record. **even the trend row, which exists to
smooth a single sample, points the wrong way at the moment of a record.**

⚠️ **the instant ram rows invert on this same read, as they always do**: `full 0.00%` — the floor —
beside `cpu some 98.25%`. a reader who checks ram first sees a grove with memory to spare, at 22%
available and 78% committed, and would never guess the cpu axis had just hit a record.

### 🔴 the CPU rows collapsed while ram tripled — and that is the signature, not a recovery

read the two axes together, exactly as the enforcement clause below demands:

> **`full 53%` means non-idle tasks spent over half their wall time stalled on memory.**

⇒ so `idle 90%` and `runq 0` are **not** a grove at rest. they are a grove where scarcely a task can
be scheduled at all, because what would run is blocked on a page. **the cpu rows went quiet because
the ram row got loud** — the identical inversion the corpse section above records, arriving on a
different pair of rows.

🔴 **and it lands in the dangerous direction again.** a reader who checks cpu first — the natural
order, since `load` is the row every unix habit reaches for — sees `1.60 / 90% / 0` and reads a
grove with room to spare. it is the most saturated the grove has ever measured.

### ✅ why the abort did not fire

the condition is *"the first OOM kill or the first husk not explained by a quota cap."* neither arm:

| arm | verdict |
|---|---|
| an OOM **record** | ⚪ unmeasurable, as it has been for the whole run — no journal access |
| a **husk** | ⛔ none. two `foreman:shell` panes surfaced in the poll; **both were read individually**, and neither is one |

- **`declastruct-aws.beav.feat-s3-backup-store-properties/foreman`** — a bare shell, prompts
  repeated `03:42 → 06:16`, **no claude chrome above it**. `term=duct.pane.husk` requires the
  chrome; a bare shell is not a husk. and it has been bare since before the spike, so it is not
  evidence of it either
- **`rhachet-roles-bhrain.beav.feat-telepath-role/foreman`** — `git release` → `git checkout -b
  beav/fix-telepath-role` → `nvim` (30m7s) → `nvim` (1h21m2s) → `💥1 ➜`. **a human at work.** a
  human-driven shell is excluded by the same term

⇒ **the two experiment crews stand.** ⚠️ a `foreman:shell` row in the poll is a **prompt to read the
pane**, never a husk verdict — the poll cannot see the chrome, which is the discriminator. two rows
that look identical in a sweep parted on the drill-in, in opposite directions.

### 🔴 .the `nvim` I flagged as a runaway for four ticks is the HUMAN'S EDITOR

this is the generalizable half, and it corrects this file's own prior sections.

`nvim` is named above as a prune candidate — *"11 at 14.6% mem (~4.5G)"*, *"the one process that
most looks like a runaway is the one that survived"* — and `rule.require.prune-runaways-before-you-
blame-the-grove` names it *"the known repeat offender."* across four ticks I re-flagged it, and each
time declined to prune on the vague ground that *"it may hold unsaved work."*

**the telepath-role foreman pane settles it.** the `nvim` processes are the wisher's own editor,
opened by hand in foreman ducts on the grove.

| | what a prune would have done |
|---|---|
| the correct call I made | ✅ declined, four times |
| the reason I gave | 🔴 *"may hold unsaved work"* — a hedge, and it would have lost to any tick where the grove read worse |
| the reason that holds | **it is the human's live editing session** — never a candidate at all |

⇒ **a grove's top-cpu, top-ram process may be the human's own work.** so:

> **identify a prune candidate before you judge it.** the `--process` name and its resource share
> are a correlate of a runaway; the pane that owns it is the record.

⚠️ and the near-miss is the point. `grove.prune --process nvim` is the paved, plan-mode-first,
pre-authorized move this very file's babysit contract names by name — so the guardrail against
killing the wisher's editor was a hedge I happened to hold, four times running, against a rule that
was pushing the other way. **a right call held for a weak reason is one bad tick from being wrong.**

#### ✅ the second instance, one tick later — `MainThread` is a REVIEWER

`MainThread` has topped september's cpu list for five ticks, unidentified, at up to `68.0%`. it is
the perfect shape of a runaway: a generic name, no owner, the largest share on the box.

`rhx git.grove.prune --process MainThread` resolves it:

```
node -e import('rhachet-roles-bhrain/cli/route')
```

⇒ it is a **route reviewer at work** — the exact thing every crew on the grove is there to run. to
prune it would kill a review mid-round and hand its crew a `malfunction` to diagnose.

| the correlate | the record |
|---|---|
| `MainThread 68.0%`, top of the list, no owner | the process's own argv — a bhrain route cli |
| `nvim 10.3%`, the "known repeat offender" | the pane that owns it — the wisher's editor |

⚠️ **both were the top process, and neither was ever a candidate.** ⇒ the law above is not one
observation dressed as a rule; the very next tick produced its second instance, on a different
process, through a different instrument. and note **which instrument**: `grove.prune --process
<name>` in its default plan mode *is* the identification — it prints the argv and kills naught. the
identification and the would-be action are one command, so the cost of the check is zero and there
is no excuse to skip it.

## 🔴 .column thirteen — the ram life row REVERSED, confirmed over two reads — 2026-09-08

`ram life` fell across many consecutive ticks, down to a low of `52.813%`. the next two reads
moved the other way: `52.813% → 52.815% → 52.839%`. the first step (+0.002) read as noise on its
own — too small to call. the second step (+0.024, twelve times the first) confirms it: the
direction has changed.

| read | ram life | verdict |
|---|---|---|
| n-2 | 52.813% | the low point of the established fall |
| n-1 | 52.815% | +0.002 — ambiguous alone, held as noise the tick it was seen |
| n | **52.839%** | +0.024 — a clear step, and the second consecutive rise |

per the cumulative's own rule above — *"reverse: fall after a run of rises, or rise after a run of
falls"* — a confirmed two-step rise after a multi-tick fall is material. columned here, once, on
the direction change, never on the rises that will follow it in the same direction.

`cpu life` carries no such news on this same read: `13.506% → 13.530%`, the same rise it has held
for many ticks straight. no reversal on that row.

⇒ the single-tick lesson: a lone step that looks like noise is not a verdict — hold it, and let the
NEXT read decide whether it was noise or the start of a new direction.

## 🔴 .column fourteen — the cpu life row REVERSED too, confirmed over two reads — 2026-09-08

`cpu life` rose across many consecutive ticks, up to a high of `13.716%`. the next two reads moved
the other way: `13.716% → 13.705% → 13.699%`. the first step (-0.011) read as noise on its own —
close in size to a prior dip that turned out to be noise. the second step (-0.006, a smaller fall
in the same direction) confirms it: the direction has changed.

| read | cpu life | verdict |
|---|---|---|
| n-2 | 13.716% | the high point of the established rise |
| n-1 | 13.705% | -0.011 — held as noise the tick it was seen |
| n | **13.699%** | -0.006 — a second consecutive fall, confirms the reversal |

per the cumulative's own rule — *"reverse: fall after a run of rises, or rise after a run of
falls"* — two consecutive falls after a multi-tick rise is material. columned here, once, on the
direction change, never on the falls that follow it in the same direction.

`ram life` carries no such news on this same read: `53.035% → 53.066%`, the same rise it has held
since its own reversal above. no reversal on that row.

⇒ the second confirmation of the same lesson: hold a lone ambiguous step, and let the next read
settle whether it was noise or the start of a new direction — this time on the axis where a prior
single dip (`13.530% → 13.524%`) had already been held and correctly resolved as noise.

## 🔴 .column fifteen — cpu life set a NEW extreme, above its own confirmed reversal — 2026-09-08

after the confirmed reversal above, `cpu life` sat in a tight, noisy band for two more reads
(`13.699% → 13.701% → 13.698%`, each step held as ambiguous). the next read broke out:
`13.698% → 13.724%`, a jump of +0.026 — nine times the size of the noisy steps that preceded it,
and above `13.716%`, the highest value this metric had reached before its own reversal.

| read | cpu life | verdict |
|---|---|---|
| — | 13.716% | the prior all-time high, before the reversal in column fourteen |
| n-1 | 13.698% | the low of the post-reversal noisy band |
| n | **13.724%** | +0.026 — a NEW all-time high, clear of the noise band and of the prior peak |

this is a **new extreme**, one of the three material triggers named at the top of this brief —
material on its own terms, independent of any reversal question. columned once, here.

`ram life` set no new extreme on this same read (`53.140% → 53.158%`, inside its own established
post-reversal rise).

⇒ the lesson this adds: a metric can hold a multi-tick noisy plateau right after a confirmed
reversal, then break past its own prior high — the plateau is not the top of its range, and a read
that merely returns to the noisy band's edge is not yet the news. the new high is.

## 🔴 .column sixteen — cpu life reversed AGAIN, off the new high, confirmed over two reads — 2026-09-08

`cpu life` rose to its new high of `13.731%` (column fifteen). the next two reads moved the other
way: `13.731% → 13.728% → 13.712%`. the first step (-0.003) read as noise on its own — the same
size as prior noise. the second step (-0.016, over five times the first) confirms it: the
direction has changed again.

| read | cpu life | verdict |
|---|---|---|
| n-2 | 13.731% | the new high recorded in column fifteen |
| n-1 | 13.728% | -0.003 — held as noise the tick it was seen |
| n | **13.712%** | -0.016 — a clear step, confirms a second reversal off this high |

this is the third reversal recorded on this row inside a single session — a rise to a new extreme
(column fifteen), a brief hold near it, then a fall confirmed here. `ram life` shows no reversal on
this read (`53.209% → 53.247%`, its own rise still holds).

⇒ this metric has now shown both patterns this brief tracks, on the same row, within one session: a
lone ambiguous step correctly held twice (once it was noise, once it was the start of a fall), and a
fresh extreme that did not mark a fixed top. treat every reversal and every extreme as provisional
until the next read confirms it — the row can move again.

## 🔴 .column seventeen — cpu life jumped to a NEW extreme, far outside any noise band — 2026-09-09

the prior confirmed read (column sixteen) held `cpu life` at `13.712%`, itself a fall off a
`13.731%` high. the next read, taken after a gap of several hours with no poll between the two,
shows `15.188%` — a jump of **+1.476**, roughly 90 times the size of any step this row has shown
before (prior steps: -0.011, -0.006, +0.026, -0.003, -0.016).

| read | cpu life | verdict |
|---|---|---|
| — | 13.712% | the last confirmed value, column sixteen |
| n | **15.188%** | +1.476 — a NEW all-time high, ~90x the largest prior step |

this is material on its own terms — a new extreme, one of the three named triggers — and no
reversal question applies since no ambiguous step sat between the two reads. `ram life` moved from
`53.247%` to `52.648%`, a fall; not itself a reversal claim absent a confirmed step between them, so
held here as an observation, never columned as a direction change.

⚠️ **no cause is attributed.** the gap between reads spans several hours with no poll active; the
fleet's actual cpu-stalled time in that gap is unobserved, so this column records the MEASUREMENT,
never a diagnosis of what drove it. `rule.always.enskill-the-tactics-you-discover`'s correlate-vs-
record law applies: a wide unobserved gap plus a large jump fits several explanations (a sustained
load period, a new heavy process, one-time contention) and this brief picks none without evidence.

⇒ the lesson: a wide gap between reads can produce a step size the noise-vs-signal heuristic never
anticipated. the same hold-and-confirm posture applies forward from here — treat `15.188%` as the
new baseline until the next read confirms a continued rise, a reversal, or noise around it.

## 🔴 .column eighteen — two consecutive outsized steps confirm a real climb, not noise — 2026-09-09

column seventeen set a new baseline at `15.188%` and asked the next reads to confirm a continued
rise, a reversal, or noise. every tick since then held inside the established noise band (roughly
±0.01 to ±0.03 per tick), a slow rise to `15.286%` over about a dozen ticks. two consecutive
reads then broke that band:

| read | cpu life | step | verdict |
|---|---|---|---|
| n-2 | 15.286% | — | inside noise band |
| n-1 | 15.364% | +0.078 | ~4x the noise band; held unconfirmed, not appended alone |
| n | **15.473%** | +0.109 | ~5x the noise band; a SECOND consecutive outsized step |

one outsized step is ambiguous and was correctly held rather than columned. two in a row, both in
the same direction, both several times the noise band, is a confirmed acceleration — not the
~90x single-jump shock of column seventeen, but a real, sustained climb the noise-vs-signal
heuristic was built to catch on its second occurrence.

`ram life` moved opposite: `51.170% → 51.060% → 50.951%`, its own steady, unrelated decline holds
pace (~-0.11/tick) — no interaction claimed between the two rows.

⚠️ **no cause is attributed**, same caveat as column seventeen. the instant samples this tick show
real contention (`load` 272%, `runq` 24, `stall some` 87% @10s) — consistent with, but not proof
of, what sits behind the life-row climb. still no OOM, still no husk unexplained by a quota cap,
so the abort condition has not fired.

⇒ the new baseline is `15.473%`. hold-and-confirm applies again: the next read settles whether
this is a new steady state, a further climb, or a reversion.

## 🔴 .column nineteen — the climb itself sped up, two consecutive reads confirm a new rate — 2026-09-09

column eighteen confirmed a real climb at roughly `+0.10` to `+0.12` per tick. four reads later,
the STEP SIZE itself broke that rate:

| read | cpu life | step | verdict |
|---|---|---|---|
| n-4 | 15.473% | — | column eighteen's baseline |
| n-3 | 15.588% | +0.115 | in line with the confirmed rate |
| n-2 | 15.708% | +0.120 | in line with the confirmed rate |
| n-1 | 15.885% | +0.177 | ~1.5x the confirmed rate; held unconfirmed, not appended alone |
| n | **16.054%** | +0.169 | a SECOND consecutive read at the faster rate |

same structure as column eighteen, one level up: a single outsized step is ambiguous (could be
noise around the confirmed rate), so it was held rather than columned. a second consecutive step
at the same larger size confirms the RATE itself changed — the climb has not merely kept on, it
has sped up.

`ram life` stays its own separate course: `50.747% → 50.659% → 50.573%`, its ~-0.09/tick pace
unchanged — still no interaction claimed between the two rows.

⚠️ no cause is attributed. this tick's instant samples (`load` 400%, `runq` 14, `stall some`
91.75% @10s) again show real contention, consistent with but not proof of the faster climb.
still no OOM, still no husk unexplained by a quota cap — abort condition not fired.

⇒ the new baseline is `16.054%`, and the confirmed rate is now `~0.17`/tick rather than
`~0.11`/tick. hold-and-confirm applies again: the next reads settle whether this rate sticks,
the climb speeds up further, or it falls back toward the earlier pace.

## .enforcement

- a sprout onto a grove whose saturation was never read = **blocker** (the cost lands on crews
  that did not choose it)
- a sprout onto a grove that reads 🔴 lifetime stall **on either axis**, with no reason recorded
  = **blocker**
- 🔴 a concurrency judgment made on **one axis alone** — either one — = **blocker**. this clause
  once read *"on the ram row alone"*, and on 2026-09-05 that would have graded the **correct**
  diagnosis as a violation. read both life rows; let the measurement name the axis
- a babysit tick that never reads grove saturation across a long session = **nitpick**
- a slow clone diagnosed at the duct layer with no grove read first = **nitpick**

## .see also

- `.agent/repo=.this/role=any/skills/git.grove.saturation.sh` — the instrument
- `term=grove.saturation._.choice._.md` — saturation vs utilization, and why the split matters
- `term=grove.saturation.stall._.choice._.md` — `some` vs `full`, the two alarms
- `rule.require.babysit-cron-per-dispatch-fleet.md` — the periodic vehicle this rides on
- `define.sprout-vs-seed.md` — a **seed** costs a grove naught; only a **sprout** takes a share
- `ahbode/infrastructure` — `git.grove.stats.sh` + `howto.tend-groves.md`, the prior art that
  owns groves; a persistent capacity verdict belongs there as a seed

---

written by human + beaver 🦫
