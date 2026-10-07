# catalog.of=saturator.axis=cpu 🦫

the cpu saturators. cpu is a **flow** — a cluster's cost is **rate × cost-per-event**, so
every lever below cuts one factor or the other.

⇒ the index, the flow/stock law, and the reaper caveat: `catalog.of=saturator._.md`.

## .the rows

`grove-sandpine-v20260901` · 4 cpu · 10.3d uptime · 2026-09-13 · total spend **354 cpu-h**

| cluster | n | own_h | reaped_h | **total_h** | **share** | kind | the lever |
|---|---|---|---|---|---|---|---|
| `tmux: server` | 2 | 18.8 | 150.8 | 169.6 | 🔴 **47.9%** | fork churn (blended) | fewer forks per crew turn |
| `zsh` | 65 | 0.0 | 116.0 | 116.0 | 🔴 **32.8%** | fork churn (blended) | cheaper shell init; fewer hook forks |
| `systemd` | 4 | 0.6 | 28.8 | 29.5 | 8.3% | session churn | fewer ssh sessions |
| `claude` | 20 | 9.0 | 20.5 | 29.4 | 8.3% | 🟢 the work | do not cut |
| `sshd` | 117 | 0.1 | 4.0 | 4.1 | 1.2% | session churn | fewer ssh sessions |

🔴 read the `own_h` column — the top two clusters own only 18.8 of the 285.6 hours charged to
them. they are reapers, not workers: the cost is what died beneath them. `zsh` owns 0.0 hours
across 65 peers and is the #2 cpu cluster; no `ps` sample can produce that row.

## .the two top rows are one pipeline at two stages

`cutime` rolls up recursively: a reaped parent's own time and its children's accumulated time
both charge to the grandparent. the process tree is a funnel, tmux its root.

| row | holds |
|---|---|
| `zsh` 116.0h | subtrees under **live** shells — in flight |
| `tmux: server` 150.8h | subtrees under shells **already dead** — complete |

the same work, before and after its shell exits — no double-count, one pipeline captured
twice. but "the work" in that pipeline is **not** mostly the fleet's — see `b` below.

## .the real own-costs beneath the charge

two genuine costs sit under the reaper charge, both `rate × cost-per-event`:

### a. zsh interactive startup — 86 ms of cpu, 24x the bare shell

| invocation | cpu per spawn | reads |
|---|---|---|
| `zsh -i -c exit` | 🔴 86.1 ms | `.zshenv` + `.zshrc` (579 lines) |
| `zsh -c exit` | 3.6 ms | `.zshenv` only |
| `bash -c exit` | 2.1 ms | fork+exec floor |

the rc costs 82.5 ms, 96% of startup — driven by `compinit`, `eval "$(starship init zsh)"`
(a fork per shell), and an fnm/node version hook. 143,964 sessions × 86.1 ms ≈ 3.4 cpu-h of the
116h — small total, clear unit cost, scales with session churn. wall time per spawn was 282 ms
against 86 ms cpu: ~70% blocked on runq contention.

### b. the status line spawns ~50 processes per second — and it dominates

measured, 2 tmux servers, 57 clients, 62 sessions:

| measure | value |
|---|---|
| `continuum_save.sh` alive at any instant | 🔴 158 (6 samples over 30s) |
| mean age | 3s (max 6s) — pure churn, none stuck |
| spawn rate | 🔴 ~53/s (158 alive ÷ 3s mean life) |
| cpu per spawn | 27.4 ms |
| subshells per spawn | 11 |

```
53 spawns/s × 27.4 ms = 1.45 cpu-s/s = 🔴 145% of a core (~36% of this 4-core box, continuously)
53 spawns/s × 11 subshells = ~580 forks/s
```

the process table confirms it: `bash` 133 + `sh` 77 — the continuum family is the largest
cluster on the box, ahead of `sshd` (117) and `claude` (21). the rate is 14x what the config
predicts (`status-interval = 15` sets a floor on redraws, never a cap — tmux also redraws on
pane output, and a clone that pipes continuous output makes that continuous too). a `ps`
sample sees ~0% per instance; the aggregate is a third of the machine.

**the fix** — remove, in `~/.tmux.conf`:

```
set -g @plugin 'tmux-plugins/tmux-continuum'
set -g @continuum-restore 'on'
set -g @continuum-save-interval '15'
```

it buys a duct naught: continuum restores a human's tmux session after reboot; a duct is
re-built from the crew ledger on every boot and never restored from a snapshot. full cost, zero
value, inherited — the `replicated singleton` kind in its purest form. the human's own `local`
session may genuinely want it — scope the removal to a duct-specific tmux config (`tmux -f`),
never a blanket one.

### c. tmux own 18.8h — the pty pump

what is left of tmux's own time once `b` is charged to its children: the pty pump for 62
sessions and 57 clients. this figure is a residual estimate (a direct `pgrep` probe matched no
pid), not a direct read.

## .what `b` does to the rows above

the `b` rate, held flat, extrapolates to ~355 cpu-h over 10.3 days — past the box's total 354
cpu-h spent, so the rate is clearly not flat. the honest read is a bound, not a total: a large
and unquantified share of `tmux: server`'s 150.8h is `continuum_save.sh` churn, never complete
fleet work. `cutime` cannot split it further — every instance is a `bash` reaped by tmux,
exactly as real crew work is. only the mechanism's own self-report closes this gap.

## .the kinds

### 1. fork churn — a per-invocation cost, paid at a high rate

each fork is individually cheap and invisible; the rate makes the total. chain: `tmux → zsh →
(claude | rhx) → node → sh`. every rung forks; every fork dies before the next poll.

| measure | value |
|---|---|
| fork rate, 10.3d average | 210/s |
| fork rate, live | 🔴 795/s — 3.8x the average |
| context switches, live | 9,262/s |
| system time, crew slice | 🔴 30.8% (healthy compute runs 2–5%) |

`pcpu` reads backwards here — a hook at 8% pcpu spends ~92% of wall time blocked, queued
behind a long runq. fork cost rises exactly when the grove is busiest, and the load it adds is
part of what makes the queue long.

known instance: the `forbid-terms` hooks fork dozens of subprocesses per Write/Edit —
`blocklist.sh` runs 3 `jq` per term, `gerunds.sh` an `echo | tr` per word, both re-parse their
word list from disk every invocation. a tree is open on it:
`rhachet-roles-ehmpathy.beav.fix-hook-fork-storm`. `cutime` gives the exec+subshell read this
catalog exists to supply in full.

### 2. 🔴 replicated singleton — a single-session mechanism, inherited N-fold

a mechanism built for one long-lived interactive session, inherited by N ephemeral clones of
that session. correct on its own terms, O(N) unserialized in practice. the multiplier is
whatever the config is evaluated **per** — count the evaluations, never the processes that
host them.

measured instance (`local`): `~/.tmux.conf` loads tmux-continuum, firing fleet-wide against one
wall clock — 188 concurrent `continuum_save.sh` + 4 `check_tmux_version.sh`, 787%+143% cpu,
load 337% on a 12-core box, with the spike every hour. a prune only clears already-fired
instances; the trigger lives inside every booted duct server and re-fires on schedule — the
lever is the config, never the process table.

the trigger is the **status line**, not a timer, and the difference is 60x: `status-interval =
15` **seconds**, with `continuum_save.sh` inside `#()` in `status-right`, spawns 4 times a
minute per server — its own 15-*minute* elapsed check runs after that spawn. "saves every 15
minutes" forks every 15 seconds, each early exit paid at full fork price.

fingerprint: one program name with a double-digit-or-higher `n=`, cpu sum far past one
instance's possible cost — `git.grove.saturation`'s `eats` line shows it at a glance. the
general test: does this per-duct config carry a periodic background job that assumes it is the
only instance of itself on the box?

### 3. session churn — the cost of a shell that computes naught

| measure | value |
|---|---|
| ssh sessions, 10.3d | 143,964 (~14k/day, ~10/min) |
| cpu in dead cgroup scopes | 422,928 cpu-s = 117.5 cpu-h |
| per session | 2.94 cpu-s |

the dead-scope figure is `slice total − live scopes' sum` — a parent cgroup's `cpu.stat` is
hierarchical and cumulative, so a removed child is charged up; that subtraction is the only way
to see 117 cpu-hours that left no process behind. lever: poll shape — each poll that opens and
closes a session pays 2.94 cpu-s before it reads a byte; a persistent connection amortizes it.

## .the levers, ranked

| # | lever | cuts | evidence | cost to apply |
|---|---|---|---|---|
| 1 | 🔴 drop tmux-continuum from the duct tmux config | ~53 spawns/s · ~145% of a core · ~580 forks/s | 158 alive, 3s mean age, 27.4ms each | 3 config lines |
| 2 | cheapen the hooks — one `jq`, cached parse, pre-scan before parse | rate and cost-per-event | tree open, cutime read owed | a tree, already open |
| 3 | amortize ssh — persistent connection, fewer open/close cycles | 2.94 cpu-s × 14k/day = 117 cpu-h | dead-scope subtraction | ductwork change |
| 4 | guard the rc on non-tty — skip `compinit`/`starship` with no human to read a prompt | 82.5 ms × every shell ≈ 3.4 cpu-h | 86.1ms vs 3.6ms, timed | 2 lines |

lever 1 outranks lever 4 by ~100x and costs the same to apply, though lever 4 *looks* like the
problem (a visible 579-line rc) at only 3.4 of 116 hours. price the rate before the unit cost,
and measure the rate rather than infer it from config — inferred was 3.8/s, measured was 53/s.

⚠️ `claude` is NOT on this list — it is 8.3% of cpu and it is the work. per
`surgoal.squeeze-the-grove`: cut the fork nobody wanted, never the compute someone did.

## .the gaps

- the blend — `tmux`+`zsh` = 80.7% of the box, and no counter splits hook from `rhx` from dead
  clone inside it. a hook that logs its own name is the only instrument that closes this
- one box, one read — the tmux-continuum case is `local`; the rest is one grove
- cumulative only — a cluster that gains its share late reads identically to one steady since boot

---

written by human + beaver 🦫
