# domain.term.choice.reason: stall

## .etymology

`stall` is **taken from the kernel's own expansion** of PSI — *Pressure **Stall** Information*.
so the word is not merely adopted; it is the upstream author's own name for the quantity, with
`pressure` reserved for the subsystem that reports it.

⇒ that split is already drawn upstream. we keep it rather than re-draw it, which is why
`pressure` sits on the forbidden list: to use it for the measurement would collapse a
distinction the source made deliberately.

## .why the term was owed at all

the word entered a **contract** the moment the saturation skill printed it:

```
   stall = the share of time work WAITED on that resource (kernel PSI).
   'some' = at least one task waited · 'full' = no work progressed at all.
```

that legend is a published surface a human reads, so `rule.require.domain-term-itemization`
fires: a term declared in a contract is itemized or it drifts. the same round's skill also names
it in eight output lines and three verdict variables.

## .the enumeration — the reads the word must cover

| the read | `pressure` | `contention` | `wait time` | **`stall`** |
|---|---|---|---|---|
| cpu: a task sat in the run queue | ⚠️ overloads PSI | ✅ | ✅ | ✅ |
| memory: an allocation waited on reclaim | ⚠️ | ✅ | ✅ | ✅ |
| io: a read waited on the device | ⚠️ | ✅ | ✅ | ✅ |
| **`full`: no task progressed at all** | ⚠️ | ⛔ nobody contended — they all lost | ⚠️ reads as a duration, not a share | ✅ |
| a grove with `CONFIG_PSI=n` | ⚠️ | — | — | ✅ absent, and nameable as absent |

- **`contention` broke on row 4** — a `full` window is precisely the case where contention
  *ended*: every task is blocked, so none contends. the word describes the cause and fails on
  the worst symptom.
- **`wait time` is a duration**, and the quantity is a **share of a window** (a percentage). the
  word invites a reader to sum it, which is meaningless.
- **`pressure` covers every row** and also covers the subsystem — the too-wide failure. it is
  the genus; `stall` is the differentia.

## .evidence

### the two-alarm split, measured — 2026-09-03, `grove-ahbode-v20260901`

```
psi cpu     some avg10=1.60  avg60=4.51  ·  full avg60=0.00
psi memory  some avg60=0.00              ·  full avg60=0.00
psi io      some avg60=0.00              ·  full avg60=0.00
```

the grove was under real load — 4 cores, three live claude clones, load 1.0–2.2 — and its cpu
`some` sat at 4.5% while `full` sat flat at zero. **that pair is the healthy signature**: work
occasionally queued, and the grove never once stopped.

⇒ had the skill printed a single "stall: 4.5%" it would have been unreadable as a verdict, since
the identical number under a nonzero `full` is a bottleneck. the split is what lets the number
carry a verdict at all.

### the counter-evidence the same read gave — memory

`psi memory` read `0.00%` on both halves while `free -h` showed only 1.3Gi free of 30Gi. the
stall read was right and the free-bytes read misled: 19Gi was reclaimable cache, and no
allocation ever waited.

⇒ this is why `saturation` grades on stall and never on used-bytes
(`term=grove.saturation._.choice.reason.md`).

### 🔴 a stall STARVES a reader — and starvation is told from a timeout by its SHAPE

**2026-09-04**, the same grove. `git.crew.poll` rendered `😴 unread` for crews that a targeted
`git.crew.read` answered **instantly**. three diagnoses were offered before the right one, and the
first two were confident and wrong:

| the guess | what refuted it |
|---|---|
| the per-tree `--timeout` is too short | an A/B at 30s and 90s returned the **same** count |
| the `⚠️ UNREACHED` groves explain it | the affected crews were on the **reachable** grove |

🔴 **the A/B is the discriminator, and it is cheap:**

| | `--timeout 30` | `--timeout 90` |
|---|---|---|
| unread crews | 8 | **8** |
| `❔unread` boxes | 13 | **13** |
| **which** crews | one set | 🔴 **a different set** |

> **a timeout improves monotonically with time. a stall does not** — under `full` PSI the host
> makes no progress at all, so a read that lands in a stall window returns empty however long it
> waits. the count is set by how much of the window is stalled; **which** readers lose is a race.

⇒ **a stable count with a membership that rotates = starvation. a count that falls = a timeout.**
one A/B parts them, and no amount of thought does — both prior guesses were reasoned, and both
were wrong.

the read that confirmed it: cpu `load 3.70 / 4 = 92%`, memory **`full 23.26% @60s`** — no work
progressed at all for nearly a quarter of the window — with swap hibernate-reserved, so there is
no cushion to page into and pressure OOMs rather than thrashes.

⚠️ **`rule.require.bound-grove-concurrency-by-saturation` already puts `git.grove.saturation` at
step 0 of a tick.** it was run at step N instead, and the whole three-tick detour is the cost of
that reorder — the answer was one call away the entire time.

### ⚠️ the starved read makes the tally UNDER-report — a `false-report`

a starved crew renders `😴 unread`, and an unread crew contributes **no stone**, so it drops out
of the `🙋 await approval` tally. measured across consecutive ticks: `🙋 7` → `🙋 3` → `🙋 6`
while **not one approval was granted**.

🔴 **the loop closes on itself.** the approval backlog is what holds the clones that saturate the
grove; the saturation is what starves the reads; the starved reads are what **hide the backlog**.
⇒ an instrument that under-reports the very condition that degrades it — honest output, false
inference (`term=false-report`, reader-inference family).

### 🔴 a LEVEL is not a PRESSURE — measured 2026-09-07, and the supervisor got it wrong first

eight consecutive ticks on `grove-ahbode-v20260901`, one grove, one hour:

| | t1 | t2 | t3 | t4 | t5 | t6 | t7 | t8 | t9 | t10 |
|---|---|---|---|---|---|---|---|---|---|---|
| ram **available** (a level) | 7.7 | 7.6 | 7.4 | 7.3 | 6.6 | 5.8 | 5.3 | **6.3** | 5.7 | **4.8** |
| ram **stall full @60s** (a 60s window) | 2.1 | 2.3 | 7.8 | 15.3 | 16.9 | 29.9 | 32.3 | 32.3 | 32.3 | 🔴 **11.5** |
| ram **stall full, LIFETIME** (cumulative) | — | — | — | — | — | 48.2h | 48.4h | 48.4h | 48.5h | 48.5h |

⚠️ **at t7 the supervisor extrapolated the LEVEL and told a human the grove would exhaust in
"7–8 ticks, under two hours."** t8 refuted it: available rose a full gigabyte.

⇒ a level is a **stock**, so one clone that exits returns a gigabyte and erases the whole apparent
trend. that half of the lesson holds.

### 🔴 the SECOND error was worse, and it is the one worth the file

off t8 the same supervisor claimed *"the pressure metric has not reversed once in eight
readings"* — and paved that sentence **into this file** as the corrected read. **t10 refuted it:
32.3% → 11.5%, a two-thirds fall in one tick.**

the defect is exact, and it is the very mistake the section was written to name:

> `full @60s` is a **60-second window**, not a cumulative total. it reports the last minute and
> forgets. it oscillates freely and carries no memory whatever.

⇒ so the supervisor swapped one un-checked assumption for another. `available` was rejected for a
property it genuinely has (it is a stock), and `full @60s` was adopted **without the same question
asked of it** — is this a level, a window, or a cumulative total? it is a window, and a window is
no more extrapolable than a stock.

🔴 **the cumulative row is the third line above, and it is the only monotone one.** `full 48.5h`
over a fixed uptime can never fall, because a past interval's cost is never repaid. that is the
quantity the supervisor *described* at t8 — and the one it was not reading from.

| the row | kind | may it fall? |
|---|---|---|
| `available 4.8G` | stock | ✅ freely — one exit returns a gigabyte |
| `full @60s 11.5%` | 60s window | ✅ freely — it forgets every minute |
| `full 48.5h` / `53.226% of life` | cumulative | 🔴 **the hours never fall** (the *ratio* may, as uptime grows) |

⇒ **three rows, three kinds, one render, and the skill labels none of them.** every one is
honestly reported; the reader supplies the kind, and the reader is where both errors happened.

### ⚠️ the claim it retires, and the clause it adds

**every one of the eight measurements was accurate.** the defect was entirely in the inference
drawn across them, which is what makes it the hardest kind to catch — no instrument was wrong, so
no instrument could object.

| the clause | what it covers |
|---|---|
| a prescribed read is not a read that was **run** | the read was skipped |
| a read that RAN is not a read that ran **correctly** | the read ran and lied |
| a conclusion TRUE when drawn is not true **now** | the read was right, then went stale |
| 🔴 **a measured SERIES is not a TRAJECTORY** | **every read was right, and the LINE THROUGH THEM was the author's** |

⇒ the fourth is the only one where no read failed at all. the cure is not another read; it is to
**name which kind of quantity you are about to extrapolate** — a stock may reverse with no change
in the condition, a rate over an interval may not.

## .disputes

*(none raised)*

## .see also

- `term=grove.saturation._.choice._.md` — the parent concept
- `rule.forbid.domain-term-ambiguity` (bhrain/learner) — why `pressure` cannot name both
- `rule.require.enumerate-before-you-name` (bhrain/learner) — the table above
- the linux kernel's `psi.rst` — the upstream definition of `some` and `full`

---

written by human + beaver 🦫
