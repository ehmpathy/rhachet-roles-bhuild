# catalog.of=saturator.axis=ram 🦫

the ram saturators. ram is a **stock** — a cluster's cost is **peers × footprint-each**, so
every lever below cuts one factor or the other.

⇒ the index, the flow/stock law, and the reaper caveat: `catalog.of=saturator._.md`.

## .the rows

`grove-sandpine-v20260901` · 31G ram · 2026-09-13 · resident total **27.8G**

| cluster | n | MB each | MB total | share | kind | the lever |
|---|---|---|---|---|---|---|
| `claude` | 20 | 1,229 | 24,864 | 🔴 **89.4%** | per-peer footprint | fewer clones, or a lighter one |
| `MainThread` (node) | 6 | 128 | 766 | 2.8% | per-peer footprint | shorter-lived reviewer procs |
| `sshd` | 117 | 6 | 735 | 2.6% | peer-count leak | fewer concurrent sessions |
| `zsh` | 65 | 5 | 338 | 1.2% | peer-count leak | fewer shells |
| `tmux: client` | 57 | 4 | 230 | 0.8% | peer-count leak | fewer attached clients |
| `run.bun.rhachet` | 9 | 47 | 420 | 1.5% | per-peer footprint | — |

🔴 one cluster is the axis — `claude` is 89.4% of resident ram, next is 2.8%. **the ram lever
is crew count, and it is the only effective one.** unlike cpu, where four kinds each hold a
real share, ram has a single dominant term — the two axes need different playbooks.

## .the kinds

### 1. per-peer footprint — count × a large each

`claude` at 1.2G per clone. 20 clones is 24.8G of a 31G box — ~25 clones before no cushion
remains. the arithmetic is linear and predictable, the one saturator plannable in advance:

| clones | ram held | of 31G |
|---|---|---|
| 15 | 18.4G | 59% |
| 20 | 24.6G | 79% ← measured here |
| 25 | 30.7G | 99% 🔴 |

### 2. peer-count leak — many cheap peers

`sshd` 117 · `zsh` 65 · `tmux: client` 57, each 4–6 MB, totals near 2%. cheap today — the one
to watch, not to cut: a measured case held 660 leaked `tmux: client` processes on one grove in
one session (`term=term`'s record), 2.6G at 4MB each, with no upper bound. the count is the
signal; the ram is the symptom.

## .the box thrashes — a state the rows do not show

| counter | value | read |
|---|---|---|
| `memory.peak` | 29.8G of 31G | the high-water. a gauge cannot find this |
| `anon` | 22.2G | unevictable |
| `file` | 3.1G | page cache, squeezed to a sliver |
| `workingset_refault_file` | 🔴 1,001,683,987 | a billion refaults |
| `pgmajfault` | 36,036,118 | disk reads that should have been cache hits |
| `pgscan`/`pgsteal` | 1.53B/1.04B | 68% steal rate — reclaim strains |
| `memory.events high` | 184,052,431 | throttled 184M times |
| `memory.events oom_kill` | 🔴 2 | read with no journal access |

mechanism: swap is hibernate-reserved, so anon cannot be evicted. every byte of reclaim
pressure lands on the 3.1G file cache, which evicts pages it needs back at once — a billion
times over 10 days. `% available` cannot see this: 18% available reads as merely tight, while
the refault counter says the box re-reads its own hot pages off disk continuously — and that
io is a cpu cost too (system time, iowait on the other axis). refaults are the ram equivalent
of `cutime`: a counter that names a cost the gauge omits entirely. read it before any ram
verdict.

## .the oom counter needs no privilege

`git.grove.saturation` renders `oom ⚪ not measured — no journal access`. it is not owed: `cat
/sys/fs/cgroup/user.slice/user-1002.slice/memory.events` returned `oom_kill 2` on the first
try, as the ordinary login user. the two sources differ in scope — the cgroup counter is per
slice, kernel-killer only; `earlyoom` sends SIGTERM from userland before the kernel acts and
lands in the journal, not here. a floor, never a total — and a floor beats `⚪`. read a husk on
a ram-red box against this before it is called a hang.

## .the levers, ranked

| # | lever | cuts | note |
|---|---|---|---|
| 1 | crew count | peers × 1.2G | the only lever with real leverage — it is the RAM lever; on a cpu-red box it reclaims 8.3% |
| 2 | clone footprint | 1.2G each | unowned upstream; a smaller each multiplies by 20 |
| 3 | a swap cushion | the thrash, not the stock | lets anon evict rather than oom — a provision decision |
| 4 | watch peer counts | a leak, before it is ram | `sshd`/`tmux: client` counts are the early signal |

## .the gaps

- rss double-counts shared pages — 20 clones that each hold one binary's pages report them
  individually; the cgroup's `memory.current` (26.9G) is authoritative for the slice,
  per-cluster rss is sound for rank, loose for sum
- `memory.peak` is per slice, not per cluster — which clone drove the 29.8G high-water is unknown
- no history — the peak is since boot; when it happened is unrecorded

---

written by human + beaver 🦫
