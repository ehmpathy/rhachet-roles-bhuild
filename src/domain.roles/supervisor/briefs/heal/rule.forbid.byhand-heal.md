# rule.forbid.byhand-heal

## .what

> a supervisor never heals a crew by hand. every cure runs through the tool — `git.crew.heal`
> for a wedge, a husk, a tabless seat; the boot/refresh/reboot verbs for the rest. a raw
> `git.crew.send` nudge, a hand-typed retry, a hand-typed resume: each is a byhand heal, and
> each is forbidden.

if the tool cannot yet cure the state, that is a GAP IN THE TOOL, never a licence to cure by
hand. upsert the capability into the tool, then run it
(`rule.always.entool-the-skills-you-touch`, `rule.always.fix-the-verb-that-left-you-the-gap`).

## .why

a heal is a CAPABILITY, and belongs in a tool, never in a supervisor's fingers
(`philosophy.entoolment-is-the-pinnacle`). three harms follow a byhand heal:

- **unauditable** — a tool heal writes one testable, reviewable code path; a byhand send leaves
  only a pane echo
- **it recurs** — a byhand cure is re-derived every time, worded afresh, and drifts
- **in-the-moment judgment is the weak link** — the tool encodes the settled cure (nudge a
  transient 429, never reboot it); a byhand send re-decides all of that under time pressure

## .this is NOT rule.forbid.byhand-fix-that-burns-the-live-proof

| rule | forbids |
|---|---|
| burns-the-live-proof | a byhand finish of a tool's half-done cure on a LIVE repro |
| byhand-heal (this) | a byhand cure of a crew at all, repro or not |

the two overlap on the burns case; each catches what the other misses.

## .the test

> "am I about to type the CURE into a crew myself?"

yes → 🔴 stop. run the tool; if it has no path for this state, add one, then run it. a MODAL
answer (`--keys`) is not a heal.

## .the cues

| when… | then… |
|---|---|
| a clone is 429-wedged and you reach for `crew.send --anyway --what 'retry...'` | 🔴 that is the byhand heal — run `git.crew.heal --mode apply` |
| a husk sits dead and you reach to hand-type `claude --resume` | run `git.crew.heal --what work --mode apply` |
| the heal tool DETECTS the state but only SURFACES it | the cure is owed IN the tool — add it |
| you think "I'll nudge it once, it is faster" | faster once, unauditable forever, and it recurs |
| `git.crew.send` prints its cure-tool nudge on your `--what` | that nudge is this rule — heed it |

## .the measured incident

a mechanic was 429-wedged; the supervisor healed it with a raw `crew.send --anyway --what
'...retry...'` — a byhand heal. the root cause was a tool gap: `git.crew.heal` detected the
wedge but only surfaced it, no cure path existed. cured by `__crew_heal_nudge`: heal now issues
the retry nudge itself in apply mode, and `git.crew.send` nudges any `--what` steer toward a
tool. the byhand path is closed because the tool path now exists.

## .enforcement

- a crew cured by a byhand `crew.send` where a tool path exists = **blocker**
- a tool that detects a curable state but only surfaces it, worked around by a byhand send
  instead of an added cure path = **blocker**
- a `--keys` modal answer read as a byhand heal = false positive

## .see also

- `rule.forbid.byhand-fix-that-burns-the-live-proof` — the peer: bans the byhand FINISH that
  burns proof; this bans the byhand heal at all
- `rule.always.entool-the-skills-you-touch` (bhrain/learner) — the cure belongs in the tool
- `rule.always.fix-the-verb-that-left-you-the-gap` — a tool gap is closed, never routed around
- `define.invariant.crew.ratelimit.healable-transient` — the cure the tool now owns
- `philosophy.entoolment-is-the-pinnacle` (bhrain/learner)

---

written by human + beaver 🦫
