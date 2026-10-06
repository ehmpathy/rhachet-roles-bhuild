# domain.term: saturation

term.chosen   = saturation
term.kind     = noun
term.boundary = grove
term.synonyms.forbidden:
- usage
- health
- stats
- resources
- vitals

## .what

**how much a grove's work is WAITING on a resource** — cpu, memory, or io.

saturation is a question about a queue, never about a percentage busy. it asks *"did work have
to wait?"*, and the kernel answers it directly: `/proc/pressure/{cpu,memory,io}`.

```
🟢 headroom     work never waited
🟡 tight        work waited sometimes
🔴 saturated    work waited enough to be the bottleneck
```

## ⚠️ .saturation is NOT utilization — they are two concepts, and they disagree

this is the whole reason the word was needed, so it is stated first:

| | asks | measured by | a grove at 95% |
|---|---|---|---|
| **utilization** | how much is in USE? | load, idle%, used bytes, df% | possibly perfect |
| **saturation** | did work WAIT? | PSI stall, swap rate, iowait, runq | the actual verdict |

⇒ **a grove can be 95% busy and stall nought; a grove can be 40% busy and thrash.** only the
second is a problem, and utilization reports them the same way.

`utilization` is therefore **not a forbidden synonym** — it is a **distinct adjacent term**. to
forbid it would be to erase a real concept; the discipline is to not use one word for both.

## .the memory trap this term exists to defuse

`free -h` on a warm grove reads `10Gi used, 1.3Gi free` of 30Gi — which looks like 4% headroom
and is not. 19Gi of that is reclaimable page cache. `MemAvailable` reads 20Gi, and PSI memory
stall reads `0.00%`.

⇒ so a utilization read says 🔴 and the truth is 🟢. **saturation is graded on what is
AVAILABLE and on whether work stalled — never on what is "used".**

## .the components, and the word for each

| axis | headroom read | saturation read |
|---|---|---|
| cpu | load per core, idle% | `psi cpu` stall, run queue |
| memory | `MemAvailable`, cache | `psi memory` stall, swap in/out RATE |
| disk | `df` used% | `psi io` stall, iowait |

⚠️ a rate is not a total. `/proc/vmstat` carries boot-cumulative swap counters, which say naught
about right now — a swap read must be SAMPLED (`vmstat 1 2`) or it is not a saturation read at
all.

## .a saturation read is NOT

- **liveness** — an unreachable grove has no saturation; it has a `down` / `asleep` verdict
- **a capacity plan** — it is an instantaneous read, never a forecast
- **attributable on its own** — it says a resource was contended, never by whom. the top-process
  list is a separate, weaker signal alongside it

## .refs

- `.agent/repo=.this/role=any/skills/git.grove.saturation.sh` — the skill that reads it
- `term=grove.saturation.stall._.choice._.md` — the measurement it is graded on
- `term=grove._.choice._.md` — the boundary; saturation is a property of a grove

## .reason

see `term=grove.saturation._.choice.reason.md` — etymology, the enumeration that ruled out
`usage`, and the evidence.

---

written by human + beaver 🦫
