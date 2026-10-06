# domain.term: unsignalable

term.chosen   = unsignalable
term.kind     = adj
term.boundary = grove.process
term.synonyms.forbidden:
- wedged
- stuck
- hung
- frozen
- zombie
- defiant
- deaf

## .what

a process in **uninterruptible sleep** (`State: D`) — blocked inside a kernel call that cannot be
interrupted, so **a signal is recorded against it and never delivered.**

```
you send SIGTERM   →  the kernel accepts it, queues it as pending
the process        →  is in D state, so no handler runs
you send SIGKILL   →  same. even KILL waits
it exits           →  when its kernel call completes. never before
```

⚠️ **it is not a refusal.** the process has no opportunity to refuse — the delivery point is the
return from the kernel call, and it has not returned.

## 🔴 .why this earns a word — no signal ends it, INCLUDING SIGKILL

every other off-verb in this repo is answered by a stronger signal. this one is not:

| the state | TERM ends it | KILL ends it |
|---|---|---|
| a healthy process | ✅ | ✅ |
| a process that ignores TERM | ⛔ | ✅ |
| a **slow** process on a loaded grove | ✅ eventually — see below | ✅ |
| 🔴 **unsignalable** (`D`) | ⛔ | ⛔ **no** |

⇒ so an escalation ladder that ends at SIGKILL has **no rung for this state**, and a caller who
escalates learns naught: the outcome is identical to the rung before. the only cure is that its
io or memory reclaim completes.

## ⚠️ .it is NOT a slow exit, and the two are indistinguishable from outside

a process on a saturated grove may take **minutes** to be scheduled to run its own signal handler.
from a `ps` read, that is byte-identical to unsignalable — both appear alive after a TERM.

**the discriminator is a probe, never a read:**

```sh
awk '/^State/' /proc/<pid>/status      # `D (disk sleep)` = unsignalable
                                       # `S (sleeping)`   = slow, or idle
```

measured 2026-09-08 on `grove-ahbode-v20260901`: `pid 1791658`, `nvim`, `State: D`, `PPid: 1`,
outlived **two** `SIGTERM` prunes while every process beside it exited within a second — on a box
reading `runq 0, idle 91%`, so load was not the cause.

🔴 **the signal masks rule out the alternative hypothesis outright:**

```
SigBlk: 0000000000000000     none blocked
SigIgn: 0000000000000000     none ignored
SigCgt: 0000000028095207     handlers installed, SIGTERM among them
```

⇒ **it is neither blocked nor ignored.** the process wants the signal and cannot be reached. that
is what parts an unsignalable process from one that merely declines.

## .unsignalable is NOT

- **a `husk`** — a husk is a pane whose **program is dead**. this one is alive, and that is the
  whole difficulty (`term=duct.pane.husk`)
- **a `zombie`** — a zombie has already exited and awaits a reap. the opposite: a zombie is a
  record of a death, this is a life with no exit
- **a `phantom`** — a record with no substance. this is substance no record can end
  (`term=phantom`)
- **`wedged`** — 🔴 the closest and the most dangerous. `wedge` is used across this repo of an
  alive, unreachable **program** — deaf to keystrokes, its view repaintable. that is a state a
  `crew.reboot` cures. **an unsignalable process is cured by naught the fleet can do**, so to call
  both `wedged` would put one word on two states with opposite remedies

## .what to do about one

| | |
|---|---|
| **wait** | the honest first answer. it exits when its kernel call returns |
| **read its stack** | `cat /proc/<pid>/stack` names the call it is blocked in, and so the cause |
| **relieve the CAUSE** | if reclaim, free ram; if io, relieve the device. the process is a symptom |
| ⛔ **escalate the signal** | KILL is not stronger here. it queues beside the TERM |
| ⛔ **report it pruned** | it is alive. a report that says otherwise is a `false-report` |

⚠️ **a prune must therefore report an unsignalable process as SURVIVED**, never fold it into a
success count. an instrument that claims a kill it did not achieve is worse than one that fails
loudly (`rule.require.verify-after-send`).

## .refs

- `.agent/repo=.this/role=any/skills/git.grove.prune.sh` — the verb that meets this state
- `rule.require.prune-runaways-before-you-blame-the-grove.md` — the grace, and why it is generous
- `rule.require.bound-grove-concurrency-by-saturation.md` — D-state tasks inflate the load average,
  which is the root of the cpu badge that misreads

## .reason

see `term=grove.process.unsignalable._.choice.reason.md` — the etymology, the rejected `wedged`,
and the measured evidence.

---

written by human + beaver 🦫
