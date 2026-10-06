# define.invariant.crew.ratelimit.live-cap-healable-via-swap

## .what

a live clone stopped on a LIVE usage cap — `You've hit your limit · resets HH:MM` with a FUTURE
reset — is HEALABLE. its cure is an **auth.swap** to an uncapped account, never a passive wait
for the reset. the poll must flag a sponsored live cap healable, and heal must GUIDE the swap —
it may never render "a live claude box is up, no move" and leave the star capped.

## .kind

**nature.** a spent account budget is a fact about the api. but the account is only one of
several a human holds, and a swap moves the machine to a different, uncapped one — so a cure
exists whether or not we reach for it. the box stays alive, only the budget on one account is
spent; the reset clock settles which cure applies.

⚠️ the swap needs a human browser leg (the oauth flow), so the CURE is human-completed — but the
DETECTION and the GUIDANCE are the tool's.

## .invariant

the four rate-limit states (see `define.invariant.crew.ratelimit.healable-transient`); this
governs the row EXPLICITLY excluded there — the LIVE cap:

| pane shows | state | cure | axis |
|---|---|---|---|
| bare 429, no clock | transient 429 | NUDGE | retry |
| `resets HH:MM`, PASSED | stale cap | NUDGE | retry |
| `resets HH:MM`, FUTURE | **live cap** | **auth.swap** | **swap** |
| banner as tool DATA | not a wedge | none | — |

every `limited` sub-state has a cure:

```
status == limited  ⟹  healable   (nudge for transient 429 / stale cap; swap for a live cap)
```

## .why

- a live cap renders as a healthy box — the ❯ prompt is up and empty, so a naive read is `😶 at
  work`, or worse a poll render of `🚫 limited · resets …` read as a passive human wait
- a swap unblocks NOW; a wait costs days — a swap is global + hot, so one swap heals every
  clone on the grove (`term=auth.swap`); to wait for a distant reset when a swap clears it today
  idles a sponsored star for the sake of a clock
- a nudge is the wrong cure — the budget is genuinely spent, so a retry lands on a wall

## .the heal-guidance is gated on sponsorship

as with the transient-429 row, the poll flags a live cap healable and GUIDES the swap only when
the tree is sponsored. an unsponsored live cap is flagged but not chased — a swap is
human-completed and not spent lightly.

## .the litigation

a crew halted mid-turn on a live cap; the supervisor read `🚫 limited · resets …` off the poll
render for six ticks and reported it as a human-gated wait. two misses: `__crew_is_healable`
excluded the live cap (the swap axis was unwired), and heal's branch returned "a live claude box
is up — no move." the operator never read the pane — a trust-but-verify failure.

## .the counter-argument

"a live cap owes a real wait — a nudge lands on a wall, so it is not healable" is true for the
NUDGE axis, false for the SWAP axis. the wait is the fallback, never the cure.

## .what would overturn it

a human holds only one claude account (then a swap has no target; the guidance still surfaces,
the human declines) · claude makes the cap machine-wide across accounts (then the swap axis
collapses into the wait).

## .scope

covers the LIVE usage-cap banner with a FUTURE reset. does not cover a transient 429 or a stale
cap (both nudge-cured), nor a husk (revive).

## .enforcement

- a live-capped sponsored star excluded from `--healable` = a poll defect
- a live cap rendered "no move" with no auth.swap guidance surfaced = a heal defect
- a live cap NUDGED (a retry into a spent-budget wall) = a heal defect
- a live cap read off the poll render and reported as a passive wait, with no pane read = a
  supervisor miss (`rule.require.trust-but-verify`)
- an unsponsored live cap left un-chased = correct (the sponsorship gate)

## .see also

- `define.invariant.crew.ratelimit.healable-transient.md` — the transient/stale rows
- `term=auth.swap._.choice._.md` — the cure: global + hot, browser-chosen account
- `__crew_is_healable`, `__crew_heal_one` (work/crewwork.sh) — the classifier + surface
- `rule.always.clamp-the-production-defect-you-just-saw.md` — the reflex this fired
- `surgoal.polish-the-supervisor-and-prioritizer-tools.md` — the objective it serves

---

written by human + beaver 🦫
