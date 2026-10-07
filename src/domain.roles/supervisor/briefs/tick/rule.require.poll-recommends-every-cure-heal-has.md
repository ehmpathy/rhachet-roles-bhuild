# rule.require.poll-recommends-every-cure-heal-has

> **the poll's actionable set must include EVERY state its paired cure-tool can cure. a
> diagnostic that names a defect its own cure-tool can fix, yet omits it from the actionable
> set, hides a cure it holds.**

`git.crew.poll --healable` derives the set a supervisor heals in bulk
(`rule.always.poll-the-fell-and-heal-sets`). `git.crew.heal` is its paired cure-tool. the two
are a POLL/CURE pair, and the invariant that binds them is coverage:

```
{ states git.crew.poll --healable lists }  ⊇  { states git.crew.heal can cure }
```

⇒ the poll must recommend the cure it holds. every state the cure-tool can act on is a state the
poll's actionable set must name.

## 🔴 .why — a hidden cure is worse than an absent one

a poll that omits a curable state does not fail loud. it renders a clean, confident actionable
set that silently excludes a defect the fleet could have fixed in one command. the supervisor
reads "no tree to heal", moves on, and the curable clone idles across ticks while the cure sits
one call away.

measured 2026-09-14: 6 grove husks sat live, and `git.crew.heal` cures a husk (reboot + resume).
yet `git.crew.poll --healable` listed only `limited` crews (429 / stale cap) and reported "no
tree to heal right now" — the poll denied the cure it held. the gap is invisible by
construction: the poll looks complete, the cure exists, and only a human who happens to know
heal-cures-husks notices the omission — the exact class `surgoal.polish-the-supervisor-and-
prioritizer-tools` exists to end.

## .the predicate is the seam

`__crew_is_healable` (work/crewwork.sh) IS the coverage contract. it must return healable for
every status `__crew_heal_one` can cure:

| status | heal cures it by | `--healable` lists it? |
|---|---|---|
| `limited`, transient 429 (no clock) | a NUDGE — retry the turn | ✅ yes |
| `limited`, stale cap (reset PASSED) | a NUDGE — the banner is dead | ✅ yes |
| `limited`, live/future cap | 🔴 no cure — auth.swap or a wait | ❌ NO (correct) |
| `husk` (signal-killed / bare-shell) | a REVIVE — reboot + resume | ✅ yes |

the ONE exclusion — a live/future cap — is correct precisely because heal does NOT cure it: a
future reset owes a wait, not a nudge. the contract holds in both directions: the poll lists
what heal cures, and omits what heal cannot.

heal arbitrates the surface-only husk edge cases (a ^C-ended or unreadable-close husk it
surfaces rather than revives) at RUN time. the poll still lists them — the supervisor runs the
heal, and heal decides revive-vs-surface. the poll's job is to RECOMMEND the cure; heal's job is
to APPLY or refuse it.

## .the test — when you add a cure to the cure-tool

> **"did I teach the paired POLL to recommend this new cure, in the same round I taught the
> cure-tool to apply it?"**

the two land in ONE round, or the poll hides the cure until someone notices by hand.

## .the general form — every POLL/CURE pair

not about husks alone — the invariant binds any diagnostic to its cure-tool:

- `--healable` ⊇ what `git.crew.heal` cures
- `--fellable` ⊇ what `git.crew.fell` closes
- any future actionable set ⊇ what its paired verb acts on

a poll and a cure-tool that drift apart are a supervisor trap: the poll under-reports, the
supervisor under-acts, and the fleet pays in idle slots.

## .enforcement

- a state `git.crew.heal` can cure, absent from `git.crew.poll --healable` = **blocker**
- a state the poll lists that its cure-tool CANNOT cure = **blocker** (a false recommendation)
- a cure added to a cure-tool with no update to its paired poll, in the same round = **blocker**
- an actionable predicate widened with no clamp test that proves the new state is listed =
  **blocker** (`rule.require.clamp-edge-cases`)

## .see also

- `rule.always.poll-the-fell-and-heal-sets.md` — the tick that derives these sets through the
  tool
- `define.invariant.crew.husk.discriminator-parity.md` — the husk cure axis heal arbitrates
- `define.invariant.crew.ratelimit.healable-transient.md` — the four rate-limit states, and why
  a live cap is the one row the poll omits
- `rule.forbid.byhand-heal.md` — the cure runs through the tool, so the poll must name it
- `surgoal.polish-the-supervisor-and-prioritizer-tools.md` — a hidden cure is the defect class
  this surgoal targets
- `__crew_is_healable` (work/crewwork.sh) — the predicate that IS this coverage contract

---

written by human + beaver 🦫
