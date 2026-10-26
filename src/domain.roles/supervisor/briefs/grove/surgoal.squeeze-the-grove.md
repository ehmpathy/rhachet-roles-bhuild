# surgoal.squeeze-the-grove

## .what

> every cpu-second and every byte on a grove is either work a human asked for, or waste. know
> which. cut the second. always.

this is a **surgoal** — a target carried on every tick, never completed, never closed. no task
names it, no gate fires it. a supervisor holds it the way it holds the fleet: a permanent fact
about the job.

⚠️ note: `surgoal` now means "parent goal" elsewhere in this ecosystem (a tree relation). this
file's sense — a permanent, never-complete target — predates that and awaits a rename
(best guess `evergoal`).

## .why it is written down — the instruments are blind to the answer

measured, `grove-sandpine-v20260901`, 10.3d uptime: processes now dead = 314 cpu-h (91.4%),
processes still alive = 29 cpu-h (8.6%). `ps` sees only the 8.6% — every render in
`git.grove.saturation` is a `ps` sample, so the fleet's whole cost history is invisible to it.
one `zsh` shell read 0% cpu in every sample ever taken and had reaped 16.7 cpu-hours of dead
children: it reads idle because it is idle — its forks are the cost.

full record: `.agent/repo=.this/role=any/briefs/evidence/role=supervisor/surgoal.squeeze-the-grove.reason.md`.

## .the principle — sample COUNTERS, never GAUGES

| | what it is | sees of a 200ms fork |
|---|---|---|
| `ps %cpu`, load, `free` | a **gauge** — state at an instant | ~0%, at any sample rate |
| `cpu.stat`, `cutime`, `processes`, PSI `_total`, `memory.peak` | a **counter** — monotonic since boot | all of it |

diff a counter across two reads and you get the exact total for that window — every process
born and died between them is counted. "poll more often" does not fix a gauge; the fix is the
instrument, never the rate.

### a sampler IS a saturator

| the instrument | forks, to answer "what spends the cpu?" |
|---|---|
| a counter delta (`/proc/stat`, `cutime`) | 2 |
| a process census, 60 samples × 643 procs | 🔴 ~38,600 |

a ~19,000x ratio, for a worse answer — measured self-inflicted: a probe written to find a fork
storm forked 38,600 processes in the search, and returned a residency census, not the spawn
rate its header claimed. on a 🔴 box a sampler joins the queue it measures and degrades as its
own cost rises.

test before any probe runs: does this read a counter, or enumerate a population? an
enumeration over N processes costs O(N) forks per sample; a counter costs 1 read, whatever N is.

## .the counters — all free, no root, no install

verified readable as the grove's own login user (cgroup v2, kernel 6.8):

| counter | attributes |
|---|---|
| `/proc/<pid>/stat` `cutime`+`cstime` | 🔴 cpu of reaped children, by live parent — the 91% no `ps` sees |
| `<cgroup>/cpu.stat` `usage/user/system_usec` | cpu per slice + scope. a system share over ~5% is syscall churn, never compute |
| `/proc/stat` `processes`, `ctxt` | fork rate, context-switch rate |
| `<cgroup>/memory.peak` | 🔴 ram high-water. a gauge cannot find a spike; this cannot miss one |
| `<cgroup>/memory.events` `oom_kill` | 🔴 oom kills, with no journal access needed |
| `<cgroup>/memory.stat` `workingset_refault_*`, `pgmajfault`, `pgscan`/`pgsteal` | ram thrash vs merely full — `% available` cannot draw this |
| `<cgroup>/{cpu,memory,io}.pressure` `total` | stall, per slice rather than per box |

the `oom_kill` row needs no privilege — `cat /sys/fs/cgroup/.../memory.events` read `oom_kill 2`
on the first try, as the ordinary login user, despite `git.grove.saturation` reporting
`⚪ not measured — no journal access`.

## .the constant questions — ask these of every saturation read

1. work or waste? what share of this box went to processes nobody awaited?
2. does churn climb? fork rate now, against fork rate at boot
3. who reaps? which live parent holds the most dead-child cpu — names the culprit
4. thrash or full? refaults and major faults, never `% available` alone
5. did the box cull a clone? `oom_kill`, before a husk is read as a hang

question 1 is the one that never gets asked, because no render prints it and no gate demands
it — precisely what makes this a surgoal rather than a rule.

## .the inventory — cpu and ram select DIFFERENT clusters

the permanent list of what actually saturates is `catalog.of=saturator._.md`, axis-split on
purpose. measured, same box, same day:

| cluster | cpu share | ram share |
|---|---|---|
| `tmux: server` + `zsh` + `systemd` | 🔴 89.0% | 1.5% |
| `claude` | 8.3% | 🔴 89.4% |

cpu is a FLOW (rate × cost-per-event); ram is a STOCK (peers × footprint-each) — the two axes
are backed by near-disjoint clusters. a cut aimed at the wrong axis moves the wrong number:
fell clones on a cpu-red box and you surrender real work to reclaim 8.3%. read the axis, then
open its member: `catalog.of=saturator.axis=cpu.md` · `catalog.of=saturator.axis=ram.md`.

## .the bound — not a license to micro-optimize

the target is waste, never work. a clone that burns four cores on a review a human asked for
is the grove at its job. cut the fork nobody wanted, never the compute someone did. a tune is
a change with a measured before and after — a guess dressed as an optimization is worse than
the waste, because it spends attention and proves naught.

## .enforcement

- a tune or provision decision made off a gauge alone, where a counter was available = **blocker**
- a grove reported healthy or saturated with no waste question asked = **nitpick**
- a `⚪ not measured` accepted where a cgroup counter answers it = **nitpick**
- a cut to compute a human asked for, sold as efficiency = **blocker**
- a cut aimed at an axis the inventory does not back = **blocker** — name the axis and its
  cluster first
- a probe that enumerates a population where a counter answers the same question = **blocker**
  on a 🔴 box, **nitpick** otherwise
- a rate reported from a window whose length was not measured = **blocker**
- a cut priced from a config file rather than from the live box = **blocker** — a config
  states an interval; only the box states a rate

## .see also

- `catalog.of=saturator._.md` — the inventory this surgoal maintains; the flow/stock law and axis split
- `.agent/repo=.this/role=any/briefs/evidence/role=supervisor/surgoal.squeeze-the-grove.reason.md` — the measured record
- `rule.require.bound-grove-concurrency-by-saturation.md` — the tick that reads the grove
- `rule.require.prune-runaways-before-you-blame-the-grove.md` — the cheapest cut, once a culprit is named
- `term=grove.saturation._.choice._.md` — saturation is waiting; this surgoal targets spend
- `philosophy.pavement-saves-nature` (bhrain/learner) — the same asymmetry: paid once, saved without bound

---

written by human + beaver 🦫
