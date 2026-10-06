# rule.require.throttle-babysit-cron-by-idle-streak

## .what

the babysit cron's cadence tracks how much the fleet actually needs — never a flat interval,
and **never a full stop**. count consecutive no-change ticks and step the cron's period through
three tiers:

| tier | cadence | when |
|------|---------|------|
| **hot** | every 10 min | an action landed this tick or the last (streak 0–1) |
| **average** | every 30 min | a short no-change run (streak 2–5) |
| **slow** | every 60 min | a long idle stretch (streak 6+) |

a "no-change tick" = the sweep took NO action (no approve / deny / steer / submit / release /
send — but a send to the sweep's own **instrument duct** is not an action; see below) AND the
fleet was identical to the prior tick (same `duct.list`, every mechanic read unchanged, no new
prompts, no queued messages, naught verified+granted to release).

any tick that takes an action, or where the fleet changed, resets the streak to 0 and drops the
cron straight back to **hot** — no gradual climb-down, so a fleet that just came alive gets
watched closely at once.

🔴 **this rule REPLACES a prior form that halted the sweep entirely at streak 6.** that was
corrected: a hard pause means a genuine event between the pause and the next human prompt — a
crashed clone, a signal-killed husk, a cleared gate — goes unwatched indefinitely. a husk
(`💥143`, safe to auto-heal) once sat dead for 7+ hours amid such a pause. the count logic is
unchanged; only the act taken at each threshold is: **slow down, never stop.**

## .why

a fully-static fleet — every mechanic parked on a human-only gate or an escalation — yields
little from a 10-minute sweep; each tick re-reads the identical state, at a real token and time
cost. but the fleet is never PROVABLY safe to leave unwatched entirely: a box can OOM, a husk can
appear, a human can grant a gate outside any prompt. a cron that hits zero can miss all three.

the fix scales cost to signal instead of a full cutoff: a hot fleet is checked often because
real work lands; a quiet fleet is checked rarely, at a cadence cheap enough to run forever, but
never stopped.

## .the counter

| tick outcome | streak | tier after |
|--------------|--------|------------|
| an action was taken (approve/deny/steer/submit/release/send) — **but not a send to the instrument** | reset to 0 | hot (10 min) |
| the fleet changed — any duct **other than the sweep's own instrument duct** reports `🌊 changed`, or the duct set differs | reset to 0 | hot (10 min) |
| genuine no-change (no action, every duct but the instrument `🧊 unchanged`) | +1 | per streak, see table above |

count is per-fleet, not per-duct — one no-change SWEEP is one increment.

do NOT judge "did it change" by eye — the tick's own sweep already answers it deterministically,
from a content hash of each pane against the prior poll:

```
🌊 ducts moved — 0 changed, 14 unchanged (since the prior poll)
```

a `0 changed` plus a no-action tick IS the increment, with no judgment call. read that line off
`rhx git.crew.poll --live --stones`, the one sweep a tick runs — the crew poll delegates to
`duct.poll` and tallies the result, so do not reach past it for the delegate
(`rule.require.babysit-cron-per-dispatch-fleet`, "the ONE poll").

## 🔴 .three sources starve the counter, and only one is cured

a streak that can never advance defeats the whole rule — if any row is structurally true every
tick, `+1` can never fire and the cron can never throttle down. three sources have been measured
to do exactly this; only the first is repaired.

### 1. the INSTRUMENT duct — repaired

the sweep resizes detached windows through a **bare-shell duct that is itself a fleet member**.
a `duct.send` to it changes its pane, so it reports `🌊 changed` on every tick by construction —
and if counted, the streak could never reach 0 changed.

**the fix:** a send to the **named instrument duct** is NOT an action or a change for this
counter — it approves naught, steers naught, releases naught, it only resizes a pane so the box
detectors can read. every other send (a steer, a nudge, a `--keys`, a release phrase) still
resets the streak as before.

⚠️ once the fleet's detached windows converge on one width, the resize becomes a no-op on them
(a window already at 200 cols, re-set to 200, does not rewrap, so its hash holds still) — that
is a property of a settled fleet, not evidence the fix is no longer owed. a tab closure
reintroduces a genuine rewrap and the streak resets again on the next tick, as it should.

### 2. a FOREIGN duct — recorded, not repaired

a duct **someone else** moves (e.g. a third party at work in a real session in a bare shell on
a supervised host) can report `🌊 changed` for several consecutive ticks, with every byte of the
change genuine and none of it work this supervisor governs. it qualifies as a fleet member by
shape (`duct://<host>/<tree>/<role>`), correctly — the shape test is what keeps a human's own
personal shell out while it lets a real remote clone in.

this breaks the binary "did the fleet change" test: the duct's bytes changed, but the
SUPERVISED work did not. it is neither a fabrication (cured by case 1's exclusion rule) nor a
legitimate change (a real action worth a reset for) — it is a third kind the binary cannot hold,
and no cure on record reaches it: the instrument's named-duct carve-out does not generalize (a
foreign duct's name is not stable, and it is not "mine" to carve out), and a width-normalized
pane hash still differs for a real reason.

what it would take: a concept of fleet **membership** — "is this duct one I supervise?" —
rather than a judgment on any pane's bytes. no instrument on hand answers that; a bare shell and
an idle clone render the same. **recorded here as an open gap, not silently set aside** — the
counter counts what it is defined to count until this is repaired.

### 3. harness CHROME — recorded, not repaired

claude's own status-bar chrome (e.g. a token-savings hint line) can change while the pane body
is byte-identical and the elapsed timer is frozen — no party acted at all, yet the pane hash
moves. this is the hardest of the three: there is no actor to exclude and no membership question
that would exclude one.

what parts it, at no new mechanism: the three-axis read `rule.require.nudge-parked-clones`
already takes — **body · elapsed · width**. body and width are identical; the **frozen elapsed**
timer is the sharp signal — a clone genuinely at work moves its own timer forward; one that
holds still is not mid-turn. a chrome-only change is cheap to detect from a read the sweep
already owes a parked clone, but the POLL itself cannot see it — a pane hash is one axis, and it
is the axis chrome moves.

**recorded, not repaired.** the rule counts what it is defined to count: a duct other than the
instrument reported `🌊 changed`, so the streak correctly resets to 0 on such a tick, under the
text as written. to count it otherwise before this becomes a repair would act on a belief
rather than the rule (a `substituted criterion`).

### the quiet-streak caveat

all three sources can fall silent with no cure landed — the foreign work finishes, or the fleet
converges on one window width so the instrument's resize becomes a no-op. a run of clean ticks
that follows is evidence about the fleet's STILLNESS, never about the counter's SOUNDNESS. a
streak that advances today can be starved again tomorrow by one closed tab or one grove that
wakes. cases 2 and 3 remain unwritten cures.

## .how to apply

1. each sweep, after the read, decide: was an action taken (apart from the instrument send), or
   did the fleet change (apart from the instrument duct)? yes → streak = 0. no → streak += 1.
2. compute the tier the new streak lands in (hot 0–1, average 2–5, slow 6+).
3. if the tier CHANGED since the last tick, re-cadence the cron: `CronDelete` the current job,
   `CronCreate` a new one at the new tier's interval, same prompt body, and announce the shift
   plainly ("fleet quiet N ticks — throttle babysit cron to every 30 min", or the reverse).
4. if the tier is UNCHANGED, do not touch the cron.
5. **never `CronDelete` without a matched `CronCreate`** while dispatchees are live — only the
   period moves.
6. on session end / last dispatchee closed, `CronDelete` with no replacement — the one case a
   cron is torn down for good (`rule.require.babysit-cron-per-dispatch-fleet`'s lifecycle table).

## .what this does NOT do

- it does not close or stop any duct — the dispatchees stay live and parked
- it does not touch the human-only gates — those still need the human
- it does not stop the sweep at any streak length — the slowest tier (60 min) is the floor,
  never a full stop

## .enforcement

- a streak that crosses a tier boundary with no re-cadence (cron left at the old interval) =
  **nitpick** (wasted cost or missed signal, but not a blind spot)
- the cron deleted with no replacement while dispatchees remain live = **blocker** (the old pause
  behavior this rule replaces, and it re-opens the unwatched-husk gap this correction exists to
  close)
- a re-cadence to a FASTER tier while the fleet still held an actionable prompt (a safe read to
  approve, a queued message to submit, a verified+granted tree to release) left unactioned =
  **blocker** (that tick was an action tick, and the streak was miscounted)

## .see also

- `rule.require.babysit-cron-per-dispatch-fleet.md` — the one omnibus cron this throttles (torn
  down for good only on last-dispatchee-closed)
- `rule.require.babysit-permission-approval.md` — what counts as an action
- `rule.prefer.release-into-prod-phrase.md` — a "release" tick is an action, resets
- `term=duct.pane.husk._.choice._.md` — the failure mode a full pause misses: a signal-killed
  clone with nobody to watch it

---

written by human + beaver 🦫
