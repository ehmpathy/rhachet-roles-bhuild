# define.invariant.crew.ratelimit.healable-transient

## .what

a live clone stopped on a BARE `API Error: Rate limit reached` banner — anchored as its own
line, with no `resets HH:MM` clock — is a HEALABLE transient 429. never a usage cap, never a
frozen orphan. the poll must flag it healable; the cure is a NUDGE that tells the clone to
retry the failed turn — never a reboot.

## .kind

**nature** — a transient 429 is a fact about the api. the box stays alive (its ❯ prompt is
up), the conversation holds, and only the turn failed mid-flight. only a retry is owed.

⚠️ a STALE cap is nature too, for the same reason: a cap whose reset clock has PASSED is a dead
banner over a live box — the api already lifted it; only the pane text is stale. it heals
exactly as a transient 429 does: a nudge, never a wait, never an auth.swap.

## .invariant

a rate-limit pane falls into exactly one of four states, told apart by the banner's shape, its
clock, and whether that clock has PASSED:

| pane shows | state | cure |
|---|---|---|
| bare `API Error: Rate limit reached`, anchored, NO clock | transient 429 | NUDGE — retry the turn |
| `resets HH:MM`, reset in the FUTURE | live usage cap | auth.swap, or a reset wait |
| `resets HH:MM`, reset PASSED | stale cap | NUDGE — the banner is dead, retry |
| the banner as tool DATA (a file:line prefix, or a Search arg) | NOT a wedge | none — at work |

the ANCHOR test parts a halt from data: the banner is a halt ONLY when the error owns its own
line (`^[[:space:]]*(⎿[[:space:]]*)?API Error: Rate limit reached`). a `file:line:` prefix or a
`Search(pattern: "…")` wrapper means the text is DATA, never a halt.

## .why

- a transient 429 renders as a healthy box — the ❯ prompt is up and empty, so a naive sweep
  reads `😶 at work` over a clone idle 20m+ (measured: a live clone halted 21m read as healthy)
- a reboot is the wrong cure — it burns the live conversation's context
  (`rule.forbid.byhand-fix-that-burns-the-live-proof`); a nudge costs one message and keeps it
- the clock is the discriminator, at two levels: absent → nudge; future → wait; passed → nudge

## .the heal-guidance is gated on sponsorship

the poll flags a transient 429 healable, and GUIDES the heal (emits the nudge) only when the
tree is sponsored (`rhx eco.priority`). an unsponsored halt is flagged healable but not chased.

## .the reset clock is a second discriminator — tz-aware

`__crew_cap_reset_passed` parts a live cap from a stale one:

- the zone is read off the banner — a `(UTC)` suffix compares in UTC; no suffix compares local
- PASSED iff `now - reset ∈ [0, 64800s]` — the 18h bound guards the midnight-wrap: a bare
  `HH:MM` with no date parses to today, so a reset more than 18h behind is read as tomorrow's
  clock, not today's, and stays a live cap
- fail-closed — an unparseable clock stays a BLOCKING cap; a stale cap wrongly cured is cheap
  (one nudge), a live cap wrongly nudged burns a message into a wall
- `__CREW_NOW_EPOCH` pins the clamp's now to noon, deterministic on any box

## .scope

covers the headless 429 banner and the stale usage-cap banner (reset PASSED) — both heal by a
nudge. does not cover a LIVE usage cap (`__duct_pane_cap_line` — a future reset needs auth.swap
or a wait), nor a husk.

## .the counter-argument

"a banner under a Search line is a grep result" is false for the BARE form: a grep result
carries a `file:line:` prefix; a search arg sits inside `Search(...)`. only the anchored,
prefix-free banner is the clone's own halt.

## .enforcement

- a bare, anchored, clockless 429 over a live box read as `😶 at work` or `🧊 frozen` = a poll
  defect
- a transient 429 cured by a reboot = a blocker (burns the conversation)
- a sponsored transient-429 halt left un-nudged across ticks = a supervisor miss
- a cap whose reset clock has PASSED, left as a blocking wait or cured by auth.swap/reboot = a
  defect — it is dead, the box lives
- a stale-cap compare that ignores the `(UTC)` suffix, or reads a >18h-past clock as PASSED = a
  `__crew_cap_reset_passed` defect

## .see also

- `define.invariant.crew.husk.discriminator-parity` — the husk twin
- `rule.forbid.byhand-fix-that-burns-the-live-proof` — why a reboot is wrong
- `__duct_pane_has_ratelimit`, `__duct_pane_cap_line` (work/ductwork.sh) — the detectors
- `__crew_cap_reset_passed`, `__crew_is_healable`, `__crew_heal_nudge` (work/crewwork.sh) — the
  tz-aware discriminator, the predicate, and the shared cure
- `rule.require.poll-recommends-every-cure-heal-has.md` — why `--healable` spans every state
  heal cures
- `rule.always.poll-the-fell-and-heal-sets` — derives the nudge set for the babysit tick

---

written by human + beaver 🦫
