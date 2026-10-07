# domain.term: stall

term.chosen   = stall
term.kind     = noun
term.boundary = grove.saturation
term.synonyms.forbidden:
- pressure
- contention
- backpressure
- wait time
- psi

## .what

**the share of wall-clock time in which work could not proceed, because it waited on a
resource.** the one measurement `saturation` is graded on.

read from the kernel's PSI counters, `/proc/pressure/{cpu,memory,io}`, as a percentage over a
recent window (10s · 60s · 300s).

```
some avg10=1.60 avg60=4.51 avg300=2.37     ← at least ONE task waited
full avg10=0.00 avg60=0.00 avg300=0.00     ← NO work progressed at all
```

## 🔴 .`some` and `full` are two different alarms — never collapse them

this is the distinction the term exists to carry, and the one a reader most often loses:

| | means | what it costs | verdict |
|---|---|---|---|
| **some** | at least one task waited, others ran | latency on the waiter | 🟡 tight — often normal, often fine |
| **full** | every runnable task waited at once | the grove did no work | 🔴 saturated — always a defect |

⇒ **a `some` above zero is unremarkable on a busy grove; a `full` above zero is not.** a grove
at `some 40% · full 0%` is loaded and healthy. a grove at `some 40% · full 8%` lost 8% of its
wall clock outright.

so a report that prints one number for "stall" has thrown away the half that decides the
verdict.

## .why `stall` and not `pressure`

`pressure` is the kernel's own word (PSI = Pressure Stall Information), which is exactly why it
is forbidden here: it names the **subsystem**, and this term names the **quantity that subsystem
reports**. to use one word for both is the overload `rule.forbid.domain-term-ambiguity` forbids.

⇒ cite `psi` as the *source* — "read from psi" — never as the measurement itself.

## .the window matters, and a report owes at least two

a single window is a snapshot that cannot tell a spike from a trend:

- **avg10** — is it live right now?
- **avg60** — is it sustained?
- avg300 — is it the shape of the hour?

⇒ a stall read of one window is a `partial audit` of the three.

## .a stall is NOT

- **utilization** — a grove can be fully utilized with zero stall; that is the ideal, not a fault
- **iowait** — iowait is cpu-time-blocked-on-io, a narrower and older proxy. `psi io` counts the
  wait whether or not a cpu sat idle for it
- **available on every kernel** — absent before 4.20 and with `CONFIG_PSI=n`. an absent stall
  read is ⚪ *not measured*, never 🟢 *measured fine*

## .refs

- `.agent/repo=.this/role=any/skills/git.grove.saturation.sh` — reads and grades it
- `term=grove.saturation._.choice._.md` — the parent concept it grades
- `term=partial-audit._.choice._.md` — what a one-window read is

## .reason

see `term=grove.saturation.stall._.choice.reason.md` — etymology and evidence.

---

written by human + beaver 🦫
