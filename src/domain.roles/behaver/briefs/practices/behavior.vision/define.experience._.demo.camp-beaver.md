# define.experience._.demo.camp-beaver

## .what

a worked example whose whole job is **one lesson**: 🦫 **care is an aggregate, and frequency alone
can flip it.**

the wish: *"a beaver opens a grove in a camp to work its trees."* a **camp** is a protected host
of resources (`local:laptop`, `cloud:ec2`); a **grove** is a set of trees within a camp.

|  | 🌴 **happy** — no edge to guard | 🌵 **sharp** — an edge the behavior must guard |
|--|-----------------------------------|------------------------------------------------|
| ⭐ **critipath** — failure intolerable | **case 1** — `grove open`, at each day's start | **case 2** — `grove open` on a camp already at capacity |
| 🌙 **alterpath** — failure deferrable | **case 3** — `grove list` shows what is loadable | **case 4** — `grove restore` from a snapshot |

⇒ read `case 1` against `case 4` and the lesson lands: **same fallback, opposite care.**

---

## the pair that carries the lesson

`grove open` and `grove restore` have the **identical** fallback — *support does it by hand*. they
have the identical per-incident cost. they differ on **frequency alone**, and that alone flips the
care:

| path | frequency | per-incident cost | `freq × cost` | care |
|------|-----------|-------------------|---------------|------|
| ⭐ `grove open` | each day's start, every beaver | support hand-loads the trees | **support drowns** | **critipath** |
| 🌙 `grove restore` | once in a blue moon | support rebuilds from the same snapshot | **tolerable** | **alterpath** |

🔴 **each individual `grove open` failure is survivable.** support hand-loads the trees; the beaver
gets their grove. ask *"is this one failure survivable?"* and you name it alter. ask **"what does a
season of these cost?"** and you get the answer: support drowns by wednesday.

⇒ `intolerable` describes **the sum**, never the incident.

### the cost override

if `grove restore` had **no snapshot**, support could not rebuild — cost → ∞ — and it flips to
**critipath despite the rarity**. rarity relaxes severity only while the fallback still reaches the
goal.

---

## `case=001.open-a-grove.md` — ⭐ happy critipath

> **who** — bo, a beaver who works trees in a camp each day
> **came for** — a live grove to work in, at the start of the day

**narrative**

bo starts the day: `grove open --camp local:laptop --grove river-bend`. the camp loads the trees
and hands back a live grove. no edge here — the camp is up, the grove exists, capacity is free.
it is the route every beaver walks each day, which is exactly what makes a break intolerable in
sum.

```
given a camp "local:laptop" with capacity free and a grove "river-bend"
  when [t0] bo runs `grove open --camp local:laptop --grove river-bend`
    then bo sees "🦫 opened river-bend — 12 trees loaded"
  when [t1] bo runs the same command again
    then the same grove is returned — no second load (idempotent)
```

---

## `case=002.open-at-capacity.md` — 🌵 sharp critipath (fails safe)

> **who** — bo, a beaver who works trees in a camp each day
> **came for** — one more grove, on a camp that already holds all it can

**narrative**

bo opens a fourth grove on a camp that holds three. an **edge**: a partial load would leave trees
half-resident and the camp wedged. the camp refuses **at the boundary** — before it loads one tree —
names the limit, and names which grove to close. bo is not cut.

```
🦫 dam's full — local:laptop holds 3 groves, river-bend would be the 4th

  why: camp capacity = 3 (set by `camp set --capacity`)
  fix: close one, then retry —
    grove close --grove old-slough
  see what's open:
    grove list --camp local:laptop
```

```
given a camp "local:laptop" at capacity 3/3
  when [t0] bo runs `grove open --camp local:laptop --grove river-bend`
    then the camp refuses the open before any tree loads — no partial residency
    and  the message names the limit and which grove to close
```

> the fail-safe proof a sharp critipath owes: **fast** (refused at the boundary), **loud**,
> **teaches the fix**. critipath because a wedged camp blocks every grove on it, every day —
> `freq × cost` intolerable.

---

## `case=003.list-the-groves.md` — 🌴 happy alterpath

> **who** — bo, a beaver who works trees in a camp each day
> **came for** — a reminder of which groves the camp can load

**narrative**

bo forgets what is loadable and runs `grove list`. it prints the groves and their tree counts. a
convenience: if `list` broke, bo reads the camp manifest by hand, or just tries `grove open` and
reads the error. the repair defers.

```
given a camp "local:laptop" with groves "river-bend", "old-slough"
  when [t0] bo runs `grove list --camp local:laptop`
    then bo sees both groves with their tree counts
```

---

## `case=004.restore-a-grove.md` — 🌵 sharp alterpath

> **who** — bo, a beaver whose grove went corrupt
> **came for** — the grove back as it stood at the last snapshot, never half-applied

**narrative**

a grove goes corrupt — a tree write tore mid-flush. bo runs `grove restore --from snapshot`. a
edge: a half-applied restore is worse than the corruption, so the restore stages to a new grove
and swaps atomically. it fires once in a blue moon, and support can rebuild from the same snapshot
by hand, so the **repair defers**: alterpath.

```
given a corrupt grove "river-bend" and a snapshot from 2026-09-01
  when [t0] bo runs `grove restore --grove river-bend --from 2026-09-01`
    then the restore stages to a new grove and swaps atomically — never half-applied
    and  on failure the corrupt grove is left untouched, and the snapshot is named
```

> 🟡 **case 2 and case 4 are both sharp, and their fallbacks are equally costly.** they split on
> frequency alone. that is the whole demo.

---

## what this example demonstrates

- 🔴 **frequency alone can flip care** — `grove open` and `grove restore` share a fallback and a
  per-incident cost; only how often they fire differs.
- severity is an aggregate — every `grove open` failure is survivable one at a time.
- the cost override — remove the snapshot and `grove restore` flips to critipath despite the
  rarity. rarity relaxes severity only while the fallback still reaches the goal.
- `deferrable` names what tolerance buys — support rebuilds today; the tool is fixed later.

## .see also

- `define.experience._.axis=care.path=criti-vs-alter` — the axis this demo isolates
- `define.experience._.axis=care.path=criti-vs-alter._.demo.catalog=freq-x-cost` — the full `freq × cost` catalog
- `define.experience._.demo.surf-school` 🐢 — the 2×2 baseline (the axes are independent)
- `define.experience._.demo.ship-sailor` 🐈⛵ — the two decoys (a sharp path that succeeds; `0 × ∞ = 0`)
