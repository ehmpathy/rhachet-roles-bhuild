# define.invariant.eco — status is DERIVED from three refs, never asserted

## .what

> a priority's `status` is a **QUANT** — measured from the world by a sync. no human types it.

| glyph | status | means |
|---|---|---|
| 💧 | `enqueued` | seeded, no tree yet |
| 🌲 | `enqueued` | sprouted — a tree is referenced, liveness unmeasured |
| 🌾 | `inflight` | a crew is on it now |
| 💤 | `snoozed` | a tree was made, and no sync has seen it live lately |
| 🌊 | `released` | it shipped |
| 🥀 | `cancelled` | it wilted — the work will not happen |

three refs feed them, parted by **lifespan**:

| ref | names | lifespan | answers |
|---|---|---|---|
| `refTask` | the seed — a gh issue | permanent | *was this asked for?* |
| `refTree` | the worktree | 🔴 **ephemeral** | *is a crew on it?* |
| `refPull` | the pull request | permanent | 🔴 *did it SHIP?* |

## .kind

**nurture.** most trackers ship a hand-set status. we derive, because an assertion goes
stale in silence — and a stale status still ranks.

## .invariant

```
status = f(refPull, refTree × clock, refTask)
```

one exception: **`cancelled` may also be asserted, and only a merged `refPull` clears it.**

## 🔴 .why — the defect it is written from

measured 2026-09-14:

```
coachbook-dao-type-reverts
  ├─ refTask: domain-objects-metadata#21   CLOSED 2026-07-24
  ├─ refTask: domain-objects-metadata#24   CLOSED 2026-07-24
  └─ status:  enqueued                     ← 🔴 SEVEN WEEKS STALE
```

both seeds shipped in july; the rank promoted the row every read. every field was accurate
the day it was typed. ⇒ the world moved and no path existed for it to tell the store.

## 🔴 .why `refPull` — a tree cannot answer "did it ship?"

```
work merges  →  `git tree del` fells the worktree  →  the refTree points at a worktree that is gone
```

the tree ref dies the moment its answer is worth the most. so a tree measures **liveness**,
never **outcome**.

a closed issue is ambiguous by `state` alone — `CLOSED` covers ship and abandon — and
unambiguous with `stateReason` (`COMPLETED` vs `NOT_PLANNED`). ⇒ the sync reads
`stateReason`, always. `refPull` stays authoritative: permanent, and unambiguous from one
field. the other two are evidence; this one is proof.

## 🔴 .`snoozed` 💤 is a CLOCK, not a declaration

it names a tree sprouted and then abandoned. no one declares that — an abandoned tree is
abandoned because no one came back. only a clock catches it.

| the tree was… | ⇒ |
|---|---|
| seen live within the window | 🌾 `inflight` |
| seen live, outside the window | 💤 `snoozed` |
| 🔴 never seen | 🌲 `enqueued` |

⚠️ the middle row costs money — a tree holds a grove slot whether or not anyone works it
(`define.invariant.crew.inflight-implies-sponsored`). 🟡 `snoozed`, not `held`: the clock
implies a wake; `held` would claim a decision no one made.

**the window is 24h, and it is a judgment** — long enough that an overnight gap does not
flap a row, short enough that a week-old tree cannot pass as live. it lives in one place.

**two clocks, never confused:**

| column | counts | moves on |
|---|---|---|
| `seen_at` | a **human** reached for the row | `set` / `--ask` |
| `seen_tree_at` | the **sync** saw the tree alive | `sync` |

one measures attention, one measures work. a single clock reports the wrong one under the
exact state this invariant catches: a row no one touched, whose tree no one works.

## .the projection — first match wins

| condition | ⇒ status |
|---|---|
| any `refPull` **merged** | 🌊 `released` |
| `status` already `cancelled` | 🥀 `cancelled` — **sticky** |
| any `refPull` **closed, unmerged** | 🥀 `cancelled` |
| all `refTask` closed **`NOT_PLANNED`** | 🥀 `cancelled` |
| any `refPull` **open** | 🌾 `inflight` |
| tree seen live within the window | 🌾 `inflight` |
| tree seen live, outside the window | 💤 `snoozed` |
| all `refTask` closed **`COMPLETED`** | 🌊 `released` |
| any `refTask` **CLAIMED** | 🌾 `inflight` |
| a `refTree` exists, never seen | 🌲 `enqueued` |
| otherwise | 💧 `enqueued` |

**terminal states take ALL refs; inflight takes ANY.** the board acts on terminal claims, so
they take the strict quantifier.

🔴 **a merged `refPull` outranks a human's cancel.** if it merged, it shipped — the cancel is
simply false by then.

## 🔴 .`cancelled` 🥀 is the ONE status a human may assert

| | 💤 `snoozed` | 🥀 `cancelled` |
|---|---|---|
| would a human declare it? | no | ✅ yes — *"we are not doing this"* |
| can a ref measure it? | ✅ the clock | sometimes — a closed pr, a `NOT_PLANNED` seed |
| reachable with **no refs**? | no | 🔴 **yes** — killed before work began |

⇒ a ref-less cancelled row has no measurement that could clear it, so a sync that re-derived
it would resurrect killed work every run.

> **the sync may SET `cancelled`. it may not CLEAR it — except on a merged `refPull`.**

## 🟡 .the one conflict the sync REPORTS

pr **merged**, task still **open** → write 🌊 `released`, and **print the conflict**: the seed
was never closed. a sync that only wrote would bury the finding.

## 🔴 .three constraints on a status glyph

| constraint | why | rules out |
|---|---|---|
| **base emoji, no VS16** | a VS16 glyph renders a different width and shears the row (`termwork.sh` documents it for ☁️/☘️) | 🌫️ · 🕸️ |
| **unclaimed in the fleet** | one concept, one symbol | 🍂 — `term.audit` and `git.tree.del` mean a felled tree · ☁️ — `termwork`'s cloud mark |
| **dim, not bright** | brightness is salience; a dead row must not out-contrast a live one | 💨 |

🟡 **backup: 🌑 new moon** (`U+1F311`, base) — lowest contrast, but a celestial dialect beside
the grove's 🌲 🌾. swap if 🥀 pops too hard: one jq branch and one snapshot.

## .scope

governs `status` on an `eco.priority` row and the sync that writes it. it does **not** govern
`sev`, `urg`, or `sponsored` — opines (`rule.forbid.fabricated-opines`) — nor
`--gates`/`--gated-by`, which express dependency, not state.

## .the litigation

2026-09-14. `snoozed` was first drawn sticky. the wisher settled it:

> *"nah, paused is if there WAS a tree created for it but its not been seen live by
> sync recently … e.g. within past 24hrs"*

the names are the wisher's:

> *"lets call it inflight, snoozed, released as the status names for those"*

`released` over `done`: it names the **ship**, which is what `refPull` measures.

## .the counter-argument

> *"a human sometimes knows a row is parked for a reason no ref can see."*

true. the answer is to make that case **representable** — gate it (`--gated-by`), or teach
the store to hold the reason — never to smuggle it into `status`. a status that doubles as a
comment is how it went stale to begin with.

## .what would overturn it

- a ref unreadable without a credential the fleet lacks — a partial derivation that
  overwrites is worse than an assertion
- a `refPull` that stops to be permanent (repo deleted, fork) — the projection needs a lower rung
- a second writer of the board — two syncs race on one field

## .enforcement

- a hand-written `status` where a ref could derive it = **blocker**
- a row with `refTree` and no `refPull`, once a pr exists = **blocker** (liveness, never outcome)
- a sync that writes `sev`, `urg`, or `sponsored` = **blocker** (`rule.forbid.fabricated-opines`)
- 🔴 a sync that clears `cancelled` on anything but a merged `refPull` = **blocker**
- a closed issue read by `state` alone = **blocker** (collapses released and cancelled)
- a sync that clears `snoozed` on a row whose tree it never looked for = **blocker**
- a merged-pr / open-task conflict written with no report = **blocker**
- a status glyph with a VS16 selector = **blocker**
- the 24h window written in more than one place = **nitpick**

## .see also

- `define.invariant.eco.quant-informs-opine` — the parent boundary
- `define.invariant.eco.the-csv-is-truth-the-db-is-a-cache` — where the derived status lands
- `define.invariant.crew.inflight-implies-sponsored` (role=supervisor) — why 💤 costs money
- `rule.forbid.fabricated-opines` — the line the sync may not cross
- `term=eco.store._.choice._.md` — the store the sync writes through

---

written by human + beaver 🦫
