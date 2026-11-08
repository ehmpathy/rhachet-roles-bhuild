# F22 · the token axis's time model is cured before the first pool calibrates, not in this round

## .the fork

three peer points (i005) show that the token axis of the sprout gate will grant too much once a
pool calibrates:

- a hold lasts 15 min, but a booted crew takes the whole 180 min window to show in the fleet rate
  (`enroll-impl-arch-defects` blocker.2)
- the per crew-hour cost divides by the window, not by the hours a crew was alive, so short-lived
  seats read cheap (`enroll-impl-arch-defects` blocker.3)
- a keyed hold renews on each ask with no bound, so a polled key pins its slot
  (`enroll-impl-arch-defects` blocker.5)

two more sit beside them: calibration refuses any partial burn, so one unreached grove keeps the
token axis ⚪ (`enroll-impl-behavior-intent` blocker.1); and no sprout verb calls the gate, so
ask → sprout → release is a protocol of prose (`enroll-impl-arch-defects` blocker.6).

i006 (`enroll-impl-arch-defects`) adds three more of the same class:

- the cap rows ride argv through three jq hops; past ~700 rows (a few hours of wired seats) the
  token read of that grove fails `Argument list too long` (blocker.1). the gate stays sound: that
  grove reads unreached, so the fleet rate reads unread and the gate grants on ram and cpu. what
  dies is `calibrate`, which this fulcrum already orders after the cure
- holds count fleet-wide only when a token axis binds the ask; the scope belongs to the axis, so a
  calibrated pool over-grants across groves, or under-grants (blocker.2)
- a pool with no fresh read sums to 0 rather than null, and a partial pool is netted against every
  account's burn (blocker.3)

the cure set grows by three, and its shape is the one the review names: a slim probe (caps off
argv, windowed, calibrate-only), a `holdwork` axis table (scope and cost per axis), and a pure
`calwork` whose pool and burn cover one account set.

- **(a)** cure all of them in this round
- **(b)** defer them: the token axis is ⚪ unread on every pool today, so none of the three
  over-grants can fire. the cure lands before the first calibration, and that order is on record
- **(c)** turn the token axis off in the gate until the cure lands

## .taken, and why

(b). the cap ledger holds 0 rows: the statusline writer waits on the seat restart (the director's
act), and calibration needs two reads past it (F13). until then `limit_tokens` and `free_tokens`
are null, the gate grants on ram and cpu alone, and it names the token axes as unread on every
grant. the three over-grants need a calibrated pool to fire.

the cure is not small. a crew count in place of a rate, or a hold that lasts the window, plus
per-crew `first_at` / `last_at`, is a probe recast that F16's bucketed scan already plans. a lease
bound and a gate call from the sprout verbs belong to the `holdwork` recast F17 plans. this round
made the fail-safe half sure: a partial burn now leaves the free token count unread
(`capacitywork` [case1][t1]), and an empty grove now meets a spent pool with 0 slots ([t3]).

(c) would remove an axis the vision names, for a harm that cannot fire yet.

## .rework

clean today: no caller depends on the token axis, since no pool has calibrated. it turns dirty the
day one does. so the order is the guard: **the cure lands before the first calibration**. the
execution yield's todo says so beside "caps calibrated".

## .confidence, and why it is low

55%. the defer rests on an order (cure, then calibrate) that a human could break with one
`calibrate` run once the seat restart lands. a reviewer who reads "latent" as "shipped" is not
wrong.

## .where

`work/capacitywork.sh` (`free_tokens`, `fleetph`); `work/tokenwork.sh` (`kind_burn`);
`git.grove.capacity.sh` (the hold renewal); `git.tree.behavior.sh` (no gate call);
`5.1.execution.from_vision.yield.md` (the todo).

## .verdict

open — the council's.
