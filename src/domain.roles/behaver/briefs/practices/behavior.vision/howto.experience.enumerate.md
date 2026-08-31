# howto.experience.enumerate

## .what

enumerate **every experience** a wish implies — every actor's happy flows and sharp edges —
before you demonstrate any of them. you enumerate first, **then name its feel and care**: each
experience gets a **feel** (happy / sharp) and a **care** (critipath / alterpath). the care
decides what blocks, not whether it makes the list — an alterpath is enumerated the same as a
critipath; it is just marked a bonus. the output is a list of experiences, each titled
`actor + feel + observable outcome`, with a feel and care set, that the `case=N` demos then render
(narrative + `[tn]`) and the `case=_` catalog then indexes.

this is the method behind `rule.require.experience-coverage`: the rule blocks on absent
critipaths and flags absent alterpaths; this howto is how you find them **all** in the first
place, so the care — not a gap in the list — is what decides what blocks. for a worked
result, see `define.experience._.demo.surf-school`.

## .why

a demo you did not plan is a demo you sampled. if you jump straight to "write a happy-path
walk", you demo the sunny middle and leave the sharp edges — where defects hide — undeclared.
enumerate first, demo second, and the coverage review has a real list to grade against instead
of a guess whether the sample was representative.

## .the moves

1. **list the actors and their goals.** who encounters this behavior? a surfer, an admin, a
   ci pipeline each live the one behavior their own way. for each actor, name the goal they
   came for. (this is the "who + what goal" that the vision must declare up front.)

2. **walk both feels per actor.** for each actor, ask:
   - *happy* — what does their smooth success look like (they get what they came for)?
   - *sharp* — where can the path cut them (a rejection, a limit, a handoff gone wrong)?

3. **hunt the sharp edges.** sharp paths hide in three places; scan each to surface them (this
   is a locator, not a taxonomy — the axis is feel, not "where"):
   - a **rejection** — the first invalid input, the error the actor hits
   - a **limit** — the successful edge (the *last* open slot, the max-valid order)
   - a **seam** — a handoff where one part's output is another's input (cli → domain op,
     domain op → external api, one stage's output → the next)

4. **name each as `actor + feel + observable outcome`.** "a surfer happily books an open slot
   and sees a held-slot confirmation". "a surfer hits a sharp edge — books a closed spot — and
   gets a named rejection". the name carries the point of view and the observable result — not
   "the general case".

5. **name each one's feel, and rate its care.** feel is happy or sharp (from move 2). care is:
   - a **critipath** — a core usecase depends on it, so it must work → an absent demo is a
     **blocker**. a *sharp* critipath must also prove it fails safe (fast, loud, teaches the
     fix — see `define.experience`).
   - an **alterpath** — a non-critical alternate route we may walk but never demand → an absent
     demo is a **nitpick**; cover it as a bonus.
   these names let the coverage review block on the critipaths and merely flag the alterpaths.

6. **score each by boundary-density, and center the densest.** for each path, count the
   boundaries it exercises (rejections, limits, seams). a path that crosses many is both your
   highest-value demo (covers much at once) and your highest-risk one (most likely to break) —
   so hunt these out and give them the richest demo + deepest scrutiny. density is independent
   of care: a dense *alterpath* can be your most valuable demo. do not prune the sparse ones —
   density ranks priority, it does not filter. see `define.experience._.metric=boundary-density`.

## .the premier tactic — actors × feel as a grid

draw a grid: actors down the side, the two feels across the top. each cell asks "is there a
path here, and do we care?" — a cell with a real experience is one to demo (named critipath or
alterpath); an empty cell is a question you answer aloud ("admins have no sharp path worth a
demo — the close op is an idempotent no-op").

| actor | happy | sharp |
|-------|-------|-------|
| surfer | book my spot + tide → held (critipath) · take the nearest open slot → confirmation (alterpath — falls back to a named slot) | book a closed spot → named rejection (critipath) · grab the last slot → limit holds, site drops it at once (critipath) · book when the site-index is unreachable → fails loud, no stale slot (critipath) |
| admin | close a spot → slots vanish at once (critipath) | close an already-closed spot → no-op (alterpath, skip) |

every real-experience row after the dedupe is a `case=N` demo. every cell you marked skip/n/a is a
declared non-experience — the review reads it as a deliberate choice, not an oversight.

to name each row's **care**, apply the one test: *if this path broke, would a core usecase fail,
or is there a workable fallback?* fail → critipath (blocker); fallback → alterpath (nitpick).
"take the nearest open slot" is an alterpath — she falls back to a named slot. "book my spot +
tide" is a critipath — an auto-assign to the wrong cove is no fallback. do not assume the plainer
default is critical; the more-specified path that subsumes it usually is.

this is the behaver cousin of the architect's `howto.dimensional-decomposition`: walk the
product of orthogonal axes (actors × feel), and the cells surface the critipaths a flat "list
some walkthroughs" would miss.

## .the test

- every actor that matters has at least one row.
- each row has a feel (happy / sharp) and a care (critipath / alterpath), each named.
- each sharp critipath row shows how the edge fails safe, not just that it exists.
- every empty cell is answered aloud (skip/n/a with a reason), never left blank.
- the densest experiences are found and centered — the highest boundary-count paths get the
  richest demo and the deepest scrutiny (they are the most likely to break).
- the critipaths are the bar — an absent critipath is a blocker; an absent alterpath, or thin
  bonus coverage, is a nitpick.

## .see also

- `define.experience` — the feel × care frame (and the fail-safe obligation of a sharp critipath)
- `define.experience._.axis=feel.path=happy-vs-sharp` — the feel axis, and where sharp edges hide (the hunt)
- `define.experience._.axis=care.path=criti-vs-alter` — the care axis, and the one test (workable fallback?)
- `define.experience._.metric=boundary-density` — the metric to score & prioritize experiences by (move 6)
- `define.experience._.demo.surf-school` — a canonical worked catalog + case files
- `rule.require.experience-coverage` — the rule this method feeds
- architect `howto.dimensional-decomposition` — the product-of-axes tactic this mirrors
- `code.test/frames.behavior/howto.write-bdd` (mechanic) — how to render each row's `[tn]`
