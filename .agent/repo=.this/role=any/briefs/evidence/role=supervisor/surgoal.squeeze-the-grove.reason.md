# surgoal.squeeze-the-grove.reason

the measured record behind the surgoal. dated, sourced, reproducible.

## .the subject

```
grove   grove-ahbode-v20260901   (ip-10-20-2-103)
box     4 cpu · 31G ram · 378G disk
uptime  888,714s = 10.3d          ⇒ capacity = 3,554,856 cpu-seconds
read    2026-09-13, as `camper`, no root, no install
state   🔴 cpu (runq 30 of 4, stall 92.9% @10s)  ·  🔴 ram (18% available)
```

## 1. 🔴 the headline — 91.4% of all cpu went to processes that no longer exist

```sh
for f in /proc/[0-9]*/stat; do cat "$f" 2>/dev/null; done | cut -d")" -f2 \
  | awk '{k+=($14+$15)/100; o+=($12+$13)/100} END{print "reaped="int(k), "own="int(o)}'
```

| | cpu-seconds | cpu-hours | share of spend |
|---|---|---|---|
| reaped dead children (`cutime`+`cstime`) | 1,131,735 | **314.4** | **91.4%** |
| live processes' own (`utime`+`stime`) | 105,855 | 29.4 | 8.6% |
| **total spend** | 1,237,590 | 343.8 | 34.8% of capacity |

⇒ `ps` reads the second row alone. **the instrument sees 8.6% of the subject.**

⚠️ no double-count: a dead process's cpu is charged exactly once, to whoever reaped it. a parent
that dies rolls its own `cutime` up to *its* reaper, so a sum across live processes counts each
dead process once.

## 2. the reapers — who holds the dead-child cpu

| kids (cpu-s) | own (cpu-s) | comm | read |
|---|---|---|---|
| 92,372 | 1,504 | `systemd` | dead login sessions, charged up |
| **60,067** | **0** | `zsh` | 🔴 **16.7 cpu-hr, 0% in every sample** |
| 46,918 | 0 | `zsh` | |
| 43,516 | 0 | `zsh` | |
| 35,156 | 0 | `zsh` | |
| 27,948 | 0 | `zsh` | |
| 14,552 | 0 | `zsh` | |
| 14,171 | 94 | `sshd` | |
| 11,268 | 4,724 | `claude` | 🔴 its children cost **2.4x** itself |
| 8,960 | 4,362 | `claude` | |
| 6,824 | 3,709 | `claude` | |
| 4,338 | 1,825 | `claude` | |

**the 16 `zsh` reapers shown total 289,595 cpu-s = 80.4 cpu-hours, at 0 own cpu between them.**
68 `zsh` live on the box; this is the top quarter.

**the 6 `claude` reapers shown: 38,483 kids vs 19,292 own — a 2.0x ratio.** those children are
hooks and `rhx` calls. **we spend twice as much cpu around a clone's turns as inside them.**

## 3. the fork chain — what spawns what

parents of the newest 40 pids:

```
18  zsh              <- tmux: server
 6  claude           <- zsh
 2  MainThread       <- run.bun.rhachet
 1  run.bun.rhachet  <- zsh
 1  run.bun.rhachet  <- sh
 1  sh               <- MainThread
```

⇒ `tmux → zsh → (claude | rhx) → node → sh`. every rung forks, and every fork dies before the
next poll.

## 4. fork rate — and it climbs

| | rate |
|---|---|
| forks, 10.3d average (`/proc/stat processes` = 186,559,530) | 210/s |
| forks, live 5s sample | 🔴 **795/s** |
| context switches, live | 9,262/s |

**live is 3.8x the boot average.** the churn is not steady state — it grows with the fleet.

corroborated by the **system-time share**: camper's slice is 361,429s system of 1,172,183s total =
**30.8%**. healthy compute runs 2–5%. thirty percent is process setup and teardown, not work.

## 5. session churn — the cost of a shell that computes naught

| | |
|---|---|
| highest session id, 10.3d | 143,964  ⇒ ~14,000/day, ~10/min |
| camper slice total | 1,172,183 cpu-s |
| 59 live scopes | 749,255 cpu-s (of which **one tmux scope holds 749,192**) |
| **dead scopes** (slice − live) | **422,928 cpu-s = 117.5 cpu-hr** |
| **per ssh session** | **2.94 cpu-s** |

⇒ a parent cgroup's `cpu.stat` is hierarchical and cumulative, so a removed child's usage is
charged up. **that subtraction is the only way to see 117 cpu-hours that left no process behind.**

🟡 **tmux collapses all crew work into ONE scope.** cgroup granularity therefore tops out at
*crew work vs connection churn*. per-hook attribution needs `cutime` (§2) or self-report.

## 6. ram — instrumented, and thrashed

`/sys/fs/cgroup/user.slice/user-1002.slice/`

| counter | value | read |
|---|---|---|
| `memory.current` | 26.9 GiB | |
| **`memory.peak`** | **29.8 GiB** | high-water of 31G — a gauge cannot find this |
| `anon` | 22.2 GiB | |
| `file` | 3.1 GiB | page cache, squeezed |
| `slab` | 1.16 GiB | kernel structures for 643 procs |
| **`workingset_refault_file`** | **1,001,683,987** | 🔴 **a billion refaults — the cache thrashes** |
| `workingset_refault_anon` | 0 | anon cannot be evicted: no swap cushion |
| `pgmajfault` | 36,036,118 | 36M disk reads that should have been cache hits |
| `pgscan` / `pgsteal` | 1.53B / 1.04B | 68% steal rate — reclaim works hard |
| `memory.events` `high` | 184,052,431 | throttled 184M times |
| `memory.events` `max` | 4,445 | |
| **`memory.events` `oom_kill`** | **2** | 🔴 **read with NO journal access** |

**the mechanism:** swap is hibernate-reserved (idle by design), so anon is unevictable. every byte
of reclaim pressure lands on the 3.1 GiB file cache. it evicts pages it needs back at once — a
billion times over 10 days.

⇒ **`% available` cannot see this.** 18% available reads as "tight". the refault counter reads as
"the box re-reads its own working set off disk continuously."

## 7. 🔴 the oom counter needs no privilege

`git.grove.saturation` renders:

```
oom  ⚪ not measured — no journal access on this box  ·  guard: earlyoom
     (a kill here is INVISIBLE to us, never absent — grant the
      grove user the journal groups, or read it with sudo)
```

`.dream/v2026_09_10.fix.the-grove-culls-clones-and-the-counter-is-blind.md` files rung 1 of the fix
as a privilege grant on a shared remote host, owned by `ahbode/infrastructure`.

**it is not owed.** `cat /sys/fs/cgroup/user.slice/user-1002.slice/memory.events` returned
`oom_kill 2` on the first try, as `camper`, with no grant. the journal is one source; the cgroup is
another, and the second was always readable.

⚠️ the two counters differ in scope, so the swap is not free: the cgroup counter is **per slice**
(camper's kills, not the box's) and counts kills by the **kernel** oom killer. `earlyoom` sends
SIGTERM from userland *before* the kernel acts, so it appears in the journal and NOT here. ⇒ the
cgroup read is a floor, never a total — and a floor beats `⚪`.

## 8. what it points at, ranked by cpu

| # | target | cost | note |
|---|---|---|---|
| 1 | **fork churn** — 795/s, 30.8% system time | ~314 cpu-hr | the whole dead-process mass |
| 2 | **shell amplification** — `zsh` reaps 80+ cpu-hr at 0 own | 80+ cpu-hr | 16 shells, top quarter of 68 |
| 3 | **hook cost** — a clone's children cost 2.0x the clone | 38+ cpu-hr | measured on 6 clones |
| 4 | **session churn** — 14k ssh/day at 2.94 cpu-s | 117 cpu-hr | every poll opens and closes |
| 5 | **ram thrash** — 1.0B refaults, no cushion | — | not cpu, but it feeds the stall |

⚠️ **§1–4 are not four costs; they overlap.** they are four *cuts* through one mass, each a
different attribution of the same 314 cpu-hours. do not sum them.

## 9. defects found en route

- `git.grove.saturation --json` doubles a field's value: `oom_klines=0\n0`, `oom_kills=0\n0`,
  `oom_elines`, `oom_ekills`, `procs_zombie`. a parser that takes the first line is correct by
  luck.
- `top`, `eats`, `greeds`, and `holds` are all one `ps` snapshot, so all four inherit the §1 blind
  spot. **none is wrong; all four answer "what runs now" where "what did this box spend" was
  asked.**

### 🔴 the general form — a single-session mechanism, replicated N-fold, with no serialization

measured 2026-09-13, `local`: `~/.tmux.conf` loads tmux-continuum. 188 concurrent
`continuum_save.sh` + 4 concurrent `check_tmux_version.sh`, 787%+143% cpu, load 337% on a 12-core
box — and it recurred at 196 and 130 within the hour that came after, because a prune clears only
the already-fired instances while the mechanism that fires them is untouched.

🔴 **the multiplier is the CLIENT, and three guesses at it were wrong before the box was read.**
the first draft of this section said *"a periodic `run-shell -b` autosave, 15-min interval"*, once
per duct, across *"~140 live duct tmux servers"*. all three are refuted:

| the guess | what the box says |
|---|---|
| ~140 tmux servers, one per duct | 🔴 **2 sockets.** `ductwork.sh:41` — `DUCTWORK_TMUX_SOCKET` is empty by default and `-L` is a **test seam**. ducts have always shared one server |
| a 15-**minute** background timer | 🔴 a status-line **`#()`**, fired at `status-interval = 15` **seconds**. a 60x error |
| N = servers | 🔴 **N = redraws per client.** 57 clients on one server ⇒ ~53 spawns/**second**, 11 subshells each, ≈ 145% of a core, continuously |

⇒ **the general form survives every correction; only the multiplier moved.** that is the part to
carry forward: a replicated singleton's cost is set by whatever unit its config is **evaluated
per**, and that unit is rarely the one the config's own text names.

⇒ the shape generalizes past tmux-continuum: **any plugin, hook, or background timer that assumes
it runs inside ONE long-lived interactive session becomes an O(N) unserialized cost the moment its
config is inherited by N ephemeral clones of that session.** the mechanism is not wrong on its own
terms — continuum genuinely helps a human's one real tmux session survive a reboot. it is wrong
**as inherited pavement**: a duct is recreated from the crew ledger on every boot, never restored
from a resurrect snapshot, so the inherited copy pays the mechanism's full periodic cost for a
guarantee ductwork never needed.

**the tell, generalized:** if an inherited config carries anything that runs on a schedule — a
timer, a hook, or a **status-line `#()`** — ask two questions, in this order: *does it assume it is
the only instance of itself on the box?* and *what unit is it evaluated PER?*
`git.grove.saturation`'s `eats` line answers the first at a glance — one program name (`bash
continuum_save.sh`) with an `n=` count in the double digits or higher, at a cpu sum far past what
one instance could produce, is this pattern's fingerprint.
`rule.require.prune-runaways-before-you-blame-the-grove` names the instrument; this is the pattern
to recognize before the instrument is even reached for.

⚠️ **the second question has no instrument, and it is the one that decides the size of the cut.**
`eats` shows the pile; it does not show the multiplier that builds it. the mean **age** of the
pile does — 158 alive at a 3s mean age names a spawn rate, where 158 alive at a 40m mean age names
a wedge. one `ps -eo etimes` settles which.

⇒ the measured record, with the spawn-rate probe and the four corrections in full:
`catalog.of=saturator.axis=cpu.md`.

## 10. method — reproduce it

```sh
# the 91% (§1)
rhx git.grove.send <grove> --what 'for f in /proc/[0-9]*/stat; do cat "$f" 2>/dev/null; done \
  | cut -d")" -f2 | awk "{k+=(\$14+\$15)/100; o+=(\$12+\$13)/100} END{print k, o}"'

# the slices (§5) — dead scopes = slice total minus the live scopes' sum
rhx git.grove.send <grove> --what 'cat /sys/fs/cgroup/user.slice/user-1002.slice/cpu.stat'

# ram (§6) + oom (§7)
rhx git.grove.send <grove> --what 'D=/sys/fs/cgroup/user.slice/user-1002.slice; \
  cat $D/memory.peak $D/memory.events; grep -E "refault|pgmajfault|pgscan|pgsteal" $D/memory.stat'

# churn or wedge? (§9) — ONE ps call, and it settles the multiplier
rhx git.grove.send <grove> --what 'ps -eo etimes,stat,args --no-headers \
  | awk "/<program>/ && !/awk/ {n++; s+=\$1; if (\$1>mx) mx=\$1} \
         END{printf \"alive=%d mean_age=%.0fs max_age=%.0fs\n\", n, s/n, mx}"'
```

⚠️ **the last one is the cheapest high-value read on this page.** a low mean age says the pile is
**churn** — a rate to cut at its source. a high one says it is a **wedge** — instances that never
finished. the two need opposite fixes, and an `eats` count alone cannot tell them apart.

field order in `/proc/<pid>/stat` after the `)`: position 12 `utime`, 13 `stime`, **14 `cutime`,
15 `cstime`** — in clock ticks, 100/s.

## 11. 🔴 the probe that became its own subject — a worked failure

a probe was written to answer *"who forks?"* by a census: 60 samples of `/proc/*/comm`, with a
`/proc/stat processes` delta around it. it returned a table that reads like a finding and is not
one. **both halves failed, and each failed in a way that still looks like data.**

### a. the table is a RESIDENCY census, not a spawn count

every row is population × 60 samples. divide it back and it reproduces the cluster census exactly:

| row | samples | ÷ 60 | census `n` |
|---|---|---|---|
| `sshd` | 7,021 | **117.0** | 117 ✓ |
| `tmux: client` | 3,420 | **57.0** | 57 ✓ |
| `zsh` | 4,028 | 67.1 | 65 ✓ |
| `claude` | 1,225 | 20.4 | 20 ✓ |

⇒ it measured **what was resident**, never **what spawned** — the very gauge/counter confusion this
brief exists to name. 🟡 the one salvage: an independent cross-check of §2's cluster counts, from a
second instrument on a different pass.

### b. `forks_in_3s=263,439` counted the PROBE

the delta bracketed a loop that ran `cat` once per process, per sample:

```
60 samples × 643 processes = ~38,600 `cat` forks, from the probe itself
```

and the window was minutes rather than the 3 s its own label claimed — the census took far longer
than its `sleep`s. **so the number is a sum of the box's forks and the probe's, over an unknown
interval, reported as a 3-second rate.**

### the lesson, and it generalizes past this probe

| | forks to answer *"what spends the cpu?"* |
|---|---|
| counter delta | **2** |
| this census | 🔴 **~38,600** |

🔴 **a ~19,000x cost, for a worse answer.** and the failure mode is the dangerous kind: it emitted a
well-formed table with plausible magnitudes, under a header that named the right question. no part
of the output announced that it answered a different one.

⇒ **the rule this earns:** *does this probe read a counter, or enumerate a population?* an
enumeration is O(N) forks per sample, so on a 🔴 box it joins the queue it measures. the surgoal's
principle now carries this as its second, cost-based argument.

---

written by human + beaver 🦫
