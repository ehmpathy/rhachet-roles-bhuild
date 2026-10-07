# domain.term.choice.reason: saturation

## .etymology

`saturation` is **adopted, never coined** — it is one of the three signals of the USE method
(brendan gregg): for every resource, check **utilization**, **saturation**, and **errors**. the
word already means, in that canon, *"the degree to which a resource has queued work it cannot
service"*. we take it unchanged.

⇒ that provenance is the reason it survives the enumeration below: a word that already carries
the exact distinction is stronger than one invented to carry it.

## .the enumeration — every read the word must cover

per `rule.require.enumerate-before-you-name`, the candidates were tested against the whole set
before a word was picked, never against the one case in hand:

| the read | `usage` | `health` | `stats` | **`saturation`** |
|---|---|---|---|---|
| cpu run queue depth | ⛔ covers "busy", not "waited" | 🔴 too wide | 🔴 too wide | ✅ |
| memory stall with 60% free | ⛔ says the opposite | 🔴 | 🔴 | ✅ |
| swap in/out rate | ⛔ | 🔴 | 🔴 | ✅ |
| io wait | ⛔ | 🔴 | 🔴 | ✅ |
| disk **capacity** headroom | ✅ | 🔴 | 🔴 | ⚠️ see the caveat |

the two failures are opposite, which is exactly what the enumeration rule predicts:

- **`usage` is too NARROW** — it names the busy fraction, which is a real but different
  quantity. it broke on row 2, and row 2 was the whole motivation.
- **`health` / `stats` / `vitals` are too WIDE** — they cover saturation AND liveness AND errors
  AND version drift. a word that covers every read discriminates none of them.

## ⚠️ .the caveat the enumeration surfaced — the disk row

**disk capacity is genuinely utilization, not saturation**, and the skill reports it anyway
under a `saturation` header. that is a known, deliberate stretch:

- a grove that fills its disk is bottlenecked, so a caller who asks "is that grove in trouble?"
  is owed it
- but `df` 85% full is a **headroom** fact; the saturation fact for disk is `psi io`

⇒ the skill therefore renders **both** on the disk axis and grades on the loudest. the word is
stretched by one row rather than by all four, and it is stretched knowingly. if the stretch ever
bites — a reader who takes a 🔴 disk verdict as an io-contention claim — the repair is to split
the axis, never to rename the term.

## .disputes

### dispute: `usage` — raised 2026-09-03 — status: RESOLVED (keep `saturation`)

- raised.by  = beaver, at authorship
- claim      = the human's own first words were *"cpu and ram utilization stats"*, so `usage` or
               `utilization` is what a caller reaches for, and the skill should be named for the
               word they will type
- counter    = the word a caller reaches for and the word that names the concept are two
               different jobs. `utilization` names the busy fraction — a REAL and DIFFERENT
               quantity, which is why it is not recorded as a forbidden synonym. to name the
               skill `usage` would make the two indistinguishable at exactly the point the whole
               tool exists to part them (the `10Gi used / 20Gi available` case, where the two
               give opposite verdicts)
- resolution = keep `saturation`; record `usage` / `health` / `stats` / `vitals` as forbidden
               synonyms; record `utilization` as a distinct adjacent term, NOT a synonym.
               discoverability is answered by the skill's `--help` and by this file, never by a
               conflation of two concepts in one word

## .evidence

### the measured case that motivated the split — 2026-09-03, `grove-ahbode-v20260901`

one grove, read on both frames within the same second:

```
utilization frame                   saturation frame
  free -h → 10Gi used of 30Gi         psi memory some avg60 = 0.00%
  free -h → 1.3Gi FREE                MemAvailable         = 20Gi (66%)
  verdict: 🔴 4% headroom             verdict: 🟢 no work waited
```

**both reads are true and they contradict.** the utilization frame counts 19Gi of reclaimable
page cache as consumed; the saturation frame asks whether any allocation actually stalled, and
none had. the first would have paged a human over a healthy grove.

⇒ this is the `false report` shape (`term=false-report._.choice._.md`): the instrument did not
fail and the number was not wrong — it answered a question the reader never asked.

### the swap defect the same read surfaced

`SwapTotal: 0`. no swap is **not** "no swap pressure" — it removes the cushion, so memory
pressure skips the thrash phase entirely and terminates in an oom kill. a saturation read that
merely printed `swap 0/0` would report the safest number for the least tolerant configuration,
so the term's skill calls it out explicitly.

## .see also

- `rule.require.enumerate-before-you-name` (bhrain/learner) — the discipline the table above runs
- `term=false-report._.choice._.md` — the shape a utilization-only read produces
- brendan gregg, the USE method — utilization · saturation · errors

---

written by human + beaver 🦫
