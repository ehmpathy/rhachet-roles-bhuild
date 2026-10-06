# rule.require.prune-runaways-before-you-blame-the-grove

## .what

when a grove reads 🔴 on **cpu**, list its heaviest processes **before** any other remedy. a
runaway process is the cheapest cause to rule out and the cheapest to cure, invisible from
inside every duct on the box.

```sh
rhx git.grove.saturation --only <grove>            # is it cpu, and is the run queue full?
rhx git.grove.prune <grove> --process nvim         # plan — list, kill naught
rhx git.grove.prune <grove> --process nvim --where-cpu-over 100 --mode apply
```

🔴 `nvim` is the known repeat offender on this fleet — check it first, every time.

🔴 on `local` specifically, `continuum_save.sh` is a second known offender, and it recurs on
its own timer — a prune of it is a stopgap, not a fix. it is tmux-continuum's autosave hook,
one instance per duct tmux server, unserialized — many duct servers run unserialized autosave
loops against the same 15-minute clock. `comm` sees only `bash`; `git.grove.prune` matches an
interpreter-hosted file by a `/`-prefixed path mention in the full ps line:

```sh
rhx git.grove.prune local --process continuum_save.sh --where-cpu-over 0 --mode apply
rhx git.grove.prune local --process check_tmux_version.sh --where-cpu-over 0 --mode apply
```

the durable fix lives in `~/.tmux.conf` (disable the `@plugin tmux-continuum` block) — ducts
are recreated from the crew ledger on boot, never restored from a tmux-resurrect snapshot, so
continuum buys ductwork naught. the prune above still fires against every duct tmux server
booted before that edit, until each cycles out on its own.

## .why

a runaway on a shared grove degrades every crew there, and no clone can see it — from inside a
duct the grove and the clone are indistinguishable, so each crew reports a slow day and none
reports a cause. the supervisor is the only party positioned to catch it. and unlike the
concurrency remedies, a prune gives up no work at all: a fell forfeits progress, a resize costs
money, a wait costs time. a prune of a runaway costs naught anyone wanted.

measured case: 4 cpu · 31G ram, run queue 35, cpu idle 0%, cpu stall 98.87% — 11 `nvim`
processes held ~6.2G ram and ~43% cpu between them. the grove was NOT over-subscribed on
crews. the concurrency ladder (wait/fell/move/resize) would have cost real work and cured
naught. after the prune, speed visibly improved.

## .the order — this rule runs BEFORE the concurrency ladder

| step | ask | if yes |
|---|---|---|
| 1 | is the run queue at or above the core count? | it is genuinely cpu — continue |
| 2 | does the top process list hold a repeat offender? | 🔴 prune it, stop here |
| 3 | is the load spread across the crews themselves? | now run the concurrency ladder |

step 1 is where a supervisor most often goes wrong: linux counts uninterruptible sleep in the
load average, so a memory-bound grove reports a high load with an **empty** run queue. a prune
there kills a process for a defect it did not cause. run queue full → look for a runaway; run
queue empty → it is the memory axis.

## ⚠️ a prune is NOT a way to end a clone

`git.grove.prune` refuses `claude`, `tmux`, `node-pty`, and the box's daemons by construction
— the refusal is the point. a prune touches no crew record and no route stone, so a pruned
clone leaves a `husk` — a pane whose program is dead, which hides whatever gate that clone had
parked at. end a clone through the layer that owns its record: `rhx git.crew.stop --tree
<tree>` ends the work, `rhx git.crew.fell --tree <tree>` ends the crew.

## 🔴 TERM first, and give it real time

the skill sends `SIGTERM`, polls, and escalates to `SIGKILL` only over what outlasted the
grace. do not shorten the grace to hurry it — of eleven `nvim`, six exited within a second,
three more exited minutes later with no second signal. they were never deaf to TERM; on a
grove at `runq 35` a process may wait minutes to be scheduled, and nvim's TERM handler writes
swap files before it returns. a short grace measures the grove's LOAD, never the process's
defiance, and converts a slow clean exit into a SIGKILL — the lost-buffer outcome TERM exists
to avoid. hence `--grace 60`, polled rather than slept, so a healthy prune still returns in a
second.

## .why a cpu FLOOR rather than a blanket kill

`--where-cpu-over` spares anything under it — what parts a **prune** from a purge. the same
binary can appear in both states at once: eleven `nvim` ranged from 19.7% cpu down to 0.0%; the
top three were the sluggishness, the bottom five were idle editors somebody left open. a
blanket kill takes a human's buffers to cure a problem three processes caused.

- `--where-cpu-over 100` on a 4-core grove reads "over one whole core" — a defensible bound
- `--where-cpu-over 0` takes every match — a purge, typed on purpose

## .enforcement

- a grove 🔴 on cpu, remedied by fell/resize/halt with no top-process read first = **blocker**
- a prune run where the run queue is under the core count = **blocker** (memory axis; kills a
  process for a defect it did not cause)
- an attempt to end a clone via `prune` rather than `crew.stop`/`crew.fell` = **blocker**
  (refused by the skill, never to be worked around)
- `--grace` shortened below the default to hurry a prune = **nitpick**
- a repeat offender pruned and never recorded here = **nitpick**

## .the known offenders

| process | what it does | seen |
|---|---|---|
| `nvim` | accumulates across sessions, does not exit with its pane; `--embed` instances hold ram and spin cpu. also observed wedged — alive, unreachable, deaf to keystrokes | 2026-09-07, 11 at once |
| `continuum_save.sh` (`local` only) | tmux-continuum's autosave hook, one per duct tmux server, unserialized, fires again every 15 min until each duct's tmux server cycles out | repeated bursts, 787% cpu at peak |

append a row when another is found — the list is the value of this brief.

## .see also

- `.agent/repo=.this/role=any/skills/git.grove.prune.sh` — the instrument
- `rule.require.bound-grove-concurrency-by-saturation.md` — the ladder this rule runs before
- `term=grove.saturation._.choice._.md` — saturation vs utilization
- `term=duct.pane.husk._.choice._.md` — what a pruned clone leaves behind
- `term=false-report._.choice._.md` — `kill` reports a signal sent, never a process dead

---

written by human + beaver 🦫
