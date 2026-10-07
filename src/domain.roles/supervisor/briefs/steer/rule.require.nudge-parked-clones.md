# rule.require.nudge-parked-clones

## .what

on every babysit tick, do not stop at the poll's verdict. for each clone that reads
idle, read its **status line** and decide who owns the stall — then nudge the ones
that are yours.

a clone parked on a todo, awaited a word to go, is dead time. the sweep exists to
find those; the poll's verdict alone will not.

## .why

> **a poll verdict is a MEASUREMENT, not a diagnosis.**

the box detector answers one question: is a permission modal up? every other
blocker — a telemetry survey, a compaction prompt, a quota cap, any non-permission
modal — renders as `⌨️ box empty`, which reads "idle and fine" but only means "no
permission modal found". those are different claims.

## .how to apply

### 1. start from the sweep, never from a loop

```bash
rhx git.crew.poll --live --boxes      # every crew, its tree, what each role awaits
```

the sweep names the candidates. do not read clone after clone to find them
(`rule.require.bulk-over-byhand`).

### 2. drill in only on what it flagged

for a clone marked `empty` and unchanged a while:

```bash
rhx git.crew.read --tree <tree> --who <role> --lines 14
```

a legitimate drill-in, not a loop: the sweep chose the subject; the status line is
depth no summary carries. a `🚧prompt` read is likewise required
(`howto.review-permission-requests`, step 0) — a poll shows options, never the
command they act on.

read the **status line** at the bottom, and route by who owns it:

| status line | owner | the move |
|---|---|---|
| `N.stone, judge, approved? 👋` | **human** | surface once per state change; never self-grant (`rule.forbid.self-grant-human-gates`) |
| `review.peer, lN@iNNN, exhausted` or `blocked` | **driver** | ask "why can't you get lN to agree with you?" (`rule.require.ask-why-the-reviewer-wont-agree`), never escalate first |
| a survey or other non-permission modal | **you** | dismiss it — grants naught, unblocks the clone |
| `You've hit your limit · resets <time>` | **human**, while LIVE | surface once, named — once the reset has PASSED it is **yours** (`rule.require.resume-quota-capped-clones`) |
| a live spinner with an elapsed timer | nobody | at work; leave it |
| route complete, verified, quota granted | **you** | "release into prod" (`rule.prefer.release-into-prod-phrase`) |
| a human's own words in the pane BODY, answered | **human**, live | leave it — no nudge, no relay |

`N.stone` is a wildcard here only because this table routes by OWNER, a property of
phase and glyph alone. it is never abstract in a report — the same string blocks
different work at different stones (`rule.require.report-stone-with-status`).

## four things that can mislead you here

1. **the status line is a proxy too.** it names the route's last SETTLED state —
   mute on who is at the keyboard, on whether the clone has drivable work below the
   gate, and on whether the gate it names was already answered seconds ago (a route
   records transitions; a live turn is not one yet). **a live elapsed timer
   outranks the status line** — a timer that still runs means at work, whatever the
   stone says. the same status-line string has rendered both "genuinely gated" and
   "15 seeds of drivable work remain below the gate" on two different trees — the
   tell lives in the pane BODY, not the status line; a clone that can still drive
   usually says so in its final line
2. **the human-at-keyboard read decays in minutes.** re-take it every tick, never
   inherit it — a modal byte-identical across a whole tick means nobody is there
3. **a `🌊 changed` cannot name the author of the motion** — a resize or harness
   chrome can trigger it as easily as the clone. don't read it as "the clone moved"
4. **an `Nm` idle figure shared across ducts dates an EVENT, not their idleness** —
   scan the column for repeats before you read any one as a duration

## the dismissal is safe, and is not a grant

a survey's dismiss option (`0`) expresses no opinion, sends no data, authorizes
naught. it is not the `2` of a permission modal. but read the modal first
(`howto.review-permission-requests`, step 0).

## .enforcement

- a clone left parked on a non-permission modal the supervisor could have dismissed
  = **blocker**
- an idle-and-unchanged clone whose status line was never read across several ticks
  = **nitpick** (the verdict was trusted as a diagnosis)
- a human-only gate surfaced on every tick rather than once per state change = **nitpick**
- a driver-owned stall (`exhausted`, `blocked`, a budget) escalated with no ask first
  = **blocker**
- a quota cap named and left, with no check of its reset time against now = **blocker**
  once that reset has passed
- a nudge sent into a pane where a human is live = **blocker**
- a `🌊 changed` reported as clone motion with no cause named = **nitpick**

## .see also

- `.agent/repo=.this/role=any/briefs/evidence/role=supervisor/rule.require.nudge-parked-clones.reason.md` — the incidents, cause tables, diagnostics
- `rule.require.babysit-cron-per-dispatch-fleet.md` — the sweep this reads the output of
- `rule.require.report-stone-with-status.md` — the bound on this table's `N.stone` wildcard
- `rule.require.bulk-over-byhand.md` — why the drill-in stays bounded to what the sweep flagged
- `rule.require.ask-why-the-reviewer-wont-agree.md` — the driver-owned branch, in full
- `rule.require.resume-quota-capped-clones.md` — the quota row's second half, after the reset
- `rule.forbid.self-grant-human-gates.md` — the human-owned branch, and its boundary
- `term=false-report._.choice._.md` — why a true verdict can still mislead a reader

---

written by human + beaver 🦫
