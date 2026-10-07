# domain.term.choice.reason: duct.refresh

## .etymology

the word was **not coined this round** — `duct.refresh` predates the crew layer entirely. what
happened on **2026-09-04** is that a supervisor needed it, found no crew-layer verb, and wrote
`crew.refresh` to carry it up. so this cluster is a **conform**, not a coinage.

⚠️ and the conform is exactly what surfaced the defect below. a coinage gets enumerated against
its alternatives (`rule.require.enumerate-before-you-name`); a reuse feels like it needs no such
check, because the word is already in the repo. **that sense of safety is what let the overload
spread.**

### what it beat

- **`repaint`** — the closest miss, and it is too narrow: it names one of the two acts and drops
  the geometry restore, which is the half that actually matters
- **`redraw`** — same fault, and it reads as a claim about pixels rather than about the window
- **`restore`** — too wide. it would cover the geometry half and imply a rollback of state,
  which this verb never does
- **`resync`** / **`reset`** — both read as an act on the WORK. this verb is strictly view-side,
  and a word that blurs that line is a word that will one day be run on a live clone by someone
  who thought it was safe for a different reason

## 🔴 .the defect the tend found — `refresh` is overloaded, and I widened it

the glossary held no `refresh` cluster, so the tend went to hunt for synonym drift and found
worse: **two concepts already share the word**, on one boundary.

| the call | the concept | the layer |
|---|---|---|
| `duct.refresh --on <uri>` | repaint clients, restore geometry | a **terminal** |
| `duct.list --refresh`, `__duct_refresh_host` | re-read live state into the registry | a **cache** |

a boundary qualifier cannot part them — both are `duct.*`. they differ by concept, which is the
definition of an overload under `rule.forbid.domain-term-ambiguity`.

🔴 **and I extended it.** `crew.refresh` was written this round, on the view sense, with no check
for a second sense — so the overload now spans two layers rather than one.

⇒ the honest account: `rule.always.reuse-pavement-before-improvise` sent me to check for extant
pavement, I found `duct.refresh`, and I reused it — **correctly**. the rule I skipped is the one
that runs *after* a hit: a reused word still owes the *"of what?"* test. **reuse is exempt from
invention, never from the vet.**

## .what is owed

| owed | to |
|---|---|
| 🔴 a second word for the **cache** sense — `resync` / `reload` / `rescan` | `duct.list --refresh`, `__duct_refresh_host` |
| its cluster, once the word is settled | `domain.terms/` |

⚠️ **not done here, on purpose.** the cache sense is a live flag on a live skill, and a rename
inside a babysit tick is a change nobody asked for at a moment nobody watches
(`rule.forbid.domain-term-synonyms` explicitly permits an extant use to stand **until
disturbed**). the overload is now on the record, which is what makes it fixable later rather
than re-derived later.

## 🔴 .the diagnosis this verb was reached for was WRONG, and that is worth the record

the cue was two stones rendered clipped — `blocked ✋…`. the paved cause of a clip is a window
stranded in `window-size manual`, and `duct.refresh` is its paved cure. so the reach was correct
by the book.

**both refreshes reported no geometry restore.** the strand was absent, so the clip has another
cause, and it is still open.

⇒ the verb is honest — it says when it restored geometry and when it did not — and that honesty
is the whole reason the wrong diagnosis was caught in one call rather than assumed. **a tool that
had merely reported `refreshed` would have closed the question falsely.**

⚠️ so the general lesson is not *"refresh does not fix clips."* it is:

> **a paved cure names a paved CAUSE. to run it does not prove that cause was present.**

## .the round's second-order gain

the read-back that verified the refresh caught a **live permission modal** that had opened since
the poll — a read-only glob under `/tmp`, approved `--keys 1`, and the clone moved `l3@i028 →
i029`.

⇒ that is `rule.require.verify-after-send` earning its keep in a direction it does not
advertise: the verify caught what the ACT never touched. a read after a write is not only a
check on the write.

---

written by human + beaver 🦫
