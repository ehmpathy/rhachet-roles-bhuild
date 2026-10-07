# domain.term.choice.reason: unsignalable

## .etymology

**coined, not adopted** — and the coinage is deliberate, because every extant candidate names the
wrong half of the state.

the word is built from the one property that makes the state matter: **a signal cannot be
delivered.** not that the process refuses it, not that it is broken, not that it is busy — that
the kernel accepts the signal, queues it, and never reaches a delivery point.

⇒ so the word names a **capability of the observer**, never a disposition of the process. that
inversion is the whole discovery: *"it ignored TERM"* is a claim about the process's will;
*"it is unsignalable"* is a claim about what any caller can achieve.

## .the enumeration — every read the word must cover

per `rule.require.enumerate-before-you-name`, run against the whole set:

| the read | `wedged` | `stuck` / `hung` | `zombie` | `defiant` / `deaf` | **`unsignalable`** |
|---|---|---|---|---|---|
| survives SIGTERM | ✅ | ✅ | ⛔ already dead | ✅ | ✅ |
| 🔴 survives **SIGKILL** | ⚠️ silent on it | ⚠️ silent | ⛔ | ⛔ implies a choice | ✅ **states it** |
| is ALIVE and at work | ✅ | ⚠️ implies idle | ⛔ | ✅ | ✅ |
| its handlers are installed and unblocked | ⚠️ | ⚠️ | ⛔ | 🔴 **says the opposite** | ✅ |
| **cured by no fleet action** | 🔴 no — a wedge IS cured by `crew.reboot` | ⚠️ | ⛔ | ⛔ | ✅ |

the failures sort three ways:

- 🔴 **`wedged` is TAKEN, and by a state with the opposite remedy.** this repo uses `wedge` of an
  alive, unreachable **program** — deaf to keystrokes, view repaintable, and **cured by
  `crew.reboot`**, measured twice on 2026-09-07. an unsignalable process is cured by naught the
  fleet can do. one word on two states whose remedies disagree is the exact defect
  `rule.forbid.domain-term-ambiguity` exists to prevent.
- **`defiant` / `deaf` assert a DISPOSITION**, and the measurement refutes it: `SigBlk: 0`,
  `SigIgn: 0`, `SigCgt` holds SIGTERM. the process installed a handler and wants the signal. these
  words blame it for a state it did not choose.
- **`zombie` is the inverse**, and its canon is already load-bearing here. `term=phantom.reason`
  turns on it: *"a zombie is substance with no reaper, a phantom is a record with no substance."*
  a zombie has exited; this has not.
- **`stuck` / `hung` / `frozen` are too WIDE** — they cover a spinlock, a network timeout, a
  deadlock, and a paused process alike. a word that covers every failure discriminates none.

## ⚠️ .the caveat — `D` is normally healthy, and brief

uninterruptible sleep is the ordinary state of any process mid-`read()`. **most D-state lasts
microseconds and is invisible.** the word is reserved for the case where it **persists**, and this
cluster records no threshold for "persists" — one measured instance, over 36 hours, is the whole
evidence base.

⇒ so `unsignalable` names a state, never a defect. **a process is not unsignalable because it has
been in D for N seconds; it is unsignalable at the moment you try to signal it and cannot.** the
duration is what makes it worth a word rather than what defines it.

## .disputes

### dispute: `wedged` — raised 2026-09-08 — status: RESOLVED (coin `unsignalable`)

- raised.by  = beaver, at authorship
- claim      = the repo already says `wedge` of an alive-and-unreachable program, and this beaver
               reached for it on 2026-09-07 to describe exactly this nvim. one word, and it is
               already in the vocabulary
- counter    = the remedies **disagree**. a wedged program is cured by `crew.reboot` — measured,
               twice, that day. an unsignalable process is cured by no fleet act at all; it exits
               when its kernel call returns. and `rule.require.bound-grove-concurrency-by-saturation`
               already records the pair as distinct: *"a wedge is established by a probe, never by
               a read"* alongside *"a merely-slow process absorbs a SIGTERM grace exactly as a
               wedged one does."* to merge them would make a supervisor reboot a crew over a
               condition a reboot cannot touch
- resolution = coin `unsignalable` for the kernel-state sense. `wedge` keeps the program sense,
               unchanged. record `wedged` as a forbidden synonym here, and note that its own
               cluster is still owed (19 uses, 8 files, no cluster as of 2026-09-08)

## .evidence

### the measured case — 2026-09-08, `grove-ahbode-v20260901`

`pid 1791658`, `nvim --embed`, up 1d13h, reparented to init:

```
Name:   nvim
State:  D (disk sleep)
PPid:   1
SigBlk: 0000000000000000
SigIgn: 0000000000000000
SigCgt: 0000000028095207
```

it outlived **two** separate `git.grove.prune --mode apply` runs — 13 of 14 died in the first, 2 of
3 in the second, every one of them within a second. the second run happened on a box that read
`runq 0, idle 91%`, so **load is ruled out as the cause**.

🔴 **the signal masks are what settle it.** the alternative hypothesis — *"nvim ignores or blocks
TERM"* — predicts a bit set in `SigIgn` or `SigBlk`. both are zero, and `SigCgt` shows a handler
installed. the process is reachable in principle and unreachable in fact.

### 🔴 the instrument defect it exposed, which is the more valuable half

`git.grove.prune` reported **`✔ all exited on TERM`** on both runs, while this process was alive
each time. two causes stacked:

1. the survivor check runs `ps -o pid= -p <pids>` wrapped in `|| true`, so a **failed call and a
   clean sweep are byte-identical**
2. the pid list is built with a trailing comma, which makes `ps` exit non-zero — measured directly:
   `ps -o pid= -p 1791658,` → `exit=1`, while `ps -o pid= -p 1791658` → `exit=0`

⇒ so the check failed on **every** run and the `|| true` converted that failure into *"none
survived"*. **the skill's header argues at length that `kill` reports a signal sent rather than a
process dead — and then builds its verify on a call that cannot tell the two apart.** the
instrument's own thesis, violated in its implementation.

### ✅ repaired 2026-09-08 — and the exit code was NOT the discriminator

the obvious repair is *"drop the `|| true` and read the exit code"*. it does not work:
`ps -o pid= -p <a-pid-that-is-gone>` exits **1**, and that is the **success** case here. so a
clean sweep and a malformed call agree on both stdout and exit status.

⇒ the probe therefore carries a **sentinel**. the remote prints it after the read, so its
absence — never an empty stdout — is what means *"the read did not happen"*:

```sh
ssh -n "$SSH_ALIAS" "ps -o pid= -p $csv | tr -d ' '; echo '--probe-ran--'"
```

and the pid list is joined with `paste -sd,`, which cannot emit the comma at the end that
`${pids// /,}` did.

**measured on the same process the same day.** where the prior run reported `✔ all 7 exited on
TERM`, the repaired one reports:

```
├─ ⚠️ 6 of 7 exited within 60s · 1 outlasted the grace
├─ 🔴 1 unsignalable — State: D, blocked in a kernel call
│     └─ ... these are reported SURVIVED, never pruned
└─ ⚠️ pruned 6 of 7 × nvim  ·  1 SURVIVED  ·  0 spared        exit 1
```

🔴 **and the state read changed the ACT, not merely the render.** a `D` survivor is now parted
out before phase 2 and **no SIGKILL is sent to it** — because KILL cannot reach it, and a signal
sent lets the report imply an act that could not occur. the ladder has no rung for this state,
so the instrument says so rather than pretends to climb one.

⚠️ this is why the say file requires an unsignalable process be reported as **survived**. the state
is rare; the report that hides it is what makes it dangerous, because a caller who reads
*"all exited"* stops the search.

## .see also

- `term=duct.pane.husk._.choice._.md` — a pane whose program is dead; the opposite of this
- `term=phantom._.choice.reason.md` — the zombie canon this enumeration leans on
- `term=grove.prune._.choice._.md` — the verb that meets this state
- `term=false-report._.choice._.md` — the class the prune's success message belongs to
- `rule.require.enumerate-before-you-name` (bhrain/learner) — the discipline the table above runs

---

written by human + beaver 🦫
