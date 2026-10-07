# define.decomposition.from-bot-and-from-top

## .what

a goal about CHANGING A NUMBER has two decompositions, run in parallel, from opposite ends:

| direction | starts from | drives toward | answers |
|---|---|---|---|
| 🔬 from-bot | measurements | fundamentals | what IS true, what moves when tweaked? |
| 🗼 from-top | fundamentals | reality | what SHOULD we offer, why, how? |

from-bot **discovers**: instrument the flow already running, drive traffic, tweak, read lift/drop.
from-top **declares**: reason from first principles about the offer, build down into what ships.

⇒ peers, never a sequence. neither is the other's prerequisite.

## .why both

| direction alone | its limit |
|---|---|
| from-bot | tunes only the flow that is there; cannot invent a rung not there; finds its limit with no signal that a limit was hit |
| from-top | a hypothesis with no instrument under it is unfalsifiable — ships, moves or not, nobody knows which part did it |

from-bot finds the local maximum; from-top finds a different hill. run one alone and you get a
well-tuned wrong offer, or an untested right one. the pair is a loop: from-bot's instrument grades
a from-top change; from-top's structure hands from-bot a new subject.

## .the dependency is about measurement, not start

from-top needs the instrument to GRADE its change — true. from-top needs the instrument to
START — false; to argue from fundamentals needs no telemetry. a gate here is a preference, and a
preference costs a peer's full duration to hold (`howto.find-the-serialization-a-rank-hides`). the
two halves usually touch different repos/artifacts/people and overlap almost completely — default
parallel; a chain owes a reason per edge.

example: `signup-funnel-tune` split from-bot (acceptance tests + snapshots to observe the flow, then
tune) into one repo, from-top (the salesladder perspective, declared from fundamentals) into
another — the repo boundary made the parallel split both safe and attractive. both inherited the
same sev/urg, with the parallel claim written into each `--why`.

## .when it applies

| the goal is… | both directions? |
|---|---|
| change a number — conversion, latency, cost, retention | yes — the case this pair exists for |
| build what does not exist yet | from-top alone, naught to measure |
| fix a defect with known cause | neither — it's a repair |
| already instrumented | from-bot is cheap now, from-top still owed |
| unmeasurable even in principle | from-top alone, and say so |

## .bound

applies only where a goal has a measurable present state AND a declarable ideal. not a mandate to
split every row — a mechanical both-halves split on a one-direction row is ceremony.

## .enforcement

- a change-a-number goal decomposed one direction only, no note why the other doesn't apply = **blocker**
- a gate between a from-bot and from-top half with no OUTPUT dependency named = **blocker**
- a from-bot half with no instrument in its done-test = **blocker**
- a from-top half with no why behind the offer = **nitpick**
- a both-halves split on a one-direction goal = **nitpick**

## .see also

- `rule.always.consider-both-directions-when-you-decompose.md` — the mandate; when it fires
- `define.eco.decomposition-vs-orchestration.md` — what a decomposition claims
- `howto.find-the-serialization-a-rank-hides.md` — why the default is parallel
- `define.invariant.eco.a-part-gates-its-whole.md` — what a nested half commits to
- `rule.require.a-gain-cell-behind-every-sev.md` — each half owes its own gain cell

---

written by human + beaver 🦫
