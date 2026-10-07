# define.eco.seed-dispatch-body-shape

## .what

the shape `eco.seed gen` writes into a foreign repo's queue. settled — extend it by a new
section in the same idiom, never by a restructure.

```
title:  🔦 priority - <slug> — <what>

## .what            the row's --what, verbatim
## .why             the row's --why, verbatim (a cost-gain cell, per rule)
## .the opine — ⚠️ this store's, not this repo's
                    sev · urg · goal · gain · work, plus the disclaimer
## .the backref     the `rhx eco.priority get --slug …` command
---
dispatched by human + beaver 🦫
```

## .why each part carries weight

**the title carries the slug** — a queue read returns titles only. drop the slug and a row that
reached a foreign repo can never trace back to the store that asked for it
(`rule.always.carry-the-slug-in-a-dispatch-title`).

**the opine is carried, marked as the ASKER's** — a `sev` pasted into a foreign queue with no
owner reads as that repo's own grade, and it is not. the section header says whose it is, and the
paragraph beneath says a re-rank there does not reach the store (`rule.forbid.fabricated-opines`).
strip the opine and the task carries no weight; state it unqualified and it carries a grade
nobody in that repo authored.

**the backref is a COMMAND, never a quote** — the store moves, so a pasted value goes stale the
moment it lands. the backref hands the reader the call that reads the row as it stands now.

## .no timestamps — deliberate

no date, no "as of", never `setAt`/`seenAt`. a dated dispatch rots in a queue nobody re-reads —
the date reads current on every future visit, and only github's own `createdAt` tells a fresh row
from a year-old one. the backref command is the cure: it makes the live row reachable, so the
issue never claims a currency it does not have.

⚠️ the same law binds any section added later — e.g. a `gates` list is a snapshot too: render the
gate as the ISSUE that tracks it, and mark the list as a snapshot, never stamp it with a time.

## .enforcement

- a dispatch body that states a `sev` without the "this store's, not this repo's" frame = **blocker**
- a dispatch title with no slug = **blocker**
- a timestamp in a dispatch body, or a store value pasted where the backref command belongs = **blocker**
- a restructure of the four sections where a fifth section would have served = **nitpick**

## .see also

- `rule.forbid.fabricated-opines.md` — why the opine must be marked as the asker's
- `rule.always.carry-the-slug-in-a-dispatch-title.md` (role=supervisor) — the title half
- `define.prioritized-vs-sponsored.md` — what the opine actually claims
- `rule.require.verify-after-send.md` (role=supervisor) — the eaten-payload hazard `@stdin` avoids

---

written by human + beaver 🦫
