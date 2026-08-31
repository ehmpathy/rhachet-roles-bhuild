# rule.require.experience-coverage

## .what

the vision must **demonstrate the critipaths** the wish implies — as concrete experiences,
not narrated prose. for each actor that matters, every critipath a core usecase depends on
must have a demonstrated experience case — and a sharp critipath must prove it fails safe.

an *experience* is an actor's lived encounter with a behavior (see `define.experience`). it
sits on two axes: **feel** (happy vs sharp — what the actor feels) and **care** (critipath vs
alterpath — how much we care). a *critipath* is a critical path a core usecase depends on, so
it must work; an *alterpath* is a non-critical route we may walk but never demand. the feel
axis sets the *obligation* (a sharp critipath must fail safe); the care axis sets the
*severity* of an absent demo (critipath → blocker, alterpath → nitpick).

## .why

a vision that narrates only the sunny middle leaves the boundaries — where defects hide —
undeclared. those gaps then surface at delivery, where they cost a rebuild instead of a
paragraph. a mandate that the critical-path surface be demonstrated at the vision makes the
gap visible at the cheapest moment.

the demonstration is the substrate; this rule is the teeth. a demo requirement without a
coverage check would let an author demo one path and skip the rest.

## .what it requires

for the vision to pass:

0. **a decomposition** — the critipaths are *discovered*, not free-listed: the experience space is
   factored into orthogonal dimensions and the product walked (`rule.require.dimensional-decomposition`).
   this is the companion rule; without it, the catalog below is a sample, not a coverage contract.
1. **a catalog** — `1.vision.experience.case=_.md` holds the walked matrix: every cell verdicted
   (demoed / itemized / forbidden / impossible), each real experience given a feel (happy / sharp)
   and a care (critipath / alterpath, where care = `freq × cost`). the catalog is the coverage contract.
2. **a case per demoed experience** — `1.vision.experience.case=N.$slug.md` demonstrates each
   critipath + chosen alterpath, twice: as a narrative and as a bdd `[tn]` timeline. a sharp
   critipath case shows the edge fails safe (fast, loud, teaches the fix).
3. **walk-then-grade** — first walk the product to name the critipaths, then check each has a case.
   an undemonstrated critipath is a gap. the demos are illustrative sketches at this stage, not
   verified proof — grade "is every critipath named + sketched", never "proven".

## .the coverage bar

the bar is "every critipath is demonstrated", not "every conceivable case is enumerated":

- a wish with one critipath gets one case + a one-row catalog.
- a wish with no user-visible experience declares "no experiences — internal only".
- alterpaths beyond the critipaths strengthen the picture but are not required — cover them as
  a bonus, but block only on the critipaths.

## severity

- an **absent critipath** — a happy or sharp critical path the wish clearly implies, with no
  case that demonstrates it — is a **blocker**.
- a **sharp critipath shown unhandled** — the edge exists but no fail-safe (fast / loud /
  teaches the fix) is shown — is a **blocker**.
- an **absent alterpath** — a non-critical alternate route — is a **nitpick**.
- a case that gives only a narrative or only a `[tn]` (not both) is a **blocker** — the two
  forms catch different gaps.
- a case written from the system's point of view instead of an actor's is a **nitpick** (it
  restates a behavior, not an experience).

## .enforcement

graded at the `1.vision` guard by two reviewers over this rule:

- **self-review** `has-experience-coverage` — the author walks the wish and closes gaps before
  the human approves.
- **peer-review** `experience-coverage` (light-enrolled) — an independent reviewer confirms
  every critipath is demonstrated and each sharp critipath fails safe; a `reviewed?` judge can
  auto-block on it.

## .see also

- `rule.require.dimensional-decomposition` — the companion rule: discover the critipaths by
  decomposition (this rule grades the demos; that one grades the space)
- `howto.experience.decompose` — the discovery method both rules rest on
- `define.experience` — what an experience is, and the feel × care axes
- `define.experience._.axis=feel.path=happy-vs-sharp` — the feel axis (and the fail-safe obligation of a sharp path)
- `define.experience._.axis=care.path=criti-vs-alter` — the care axis (the one test that sets blocker vs nitpick)
- `define.experience._.metric=boundary-density` — the metric that centers the densest, highest-risk experiences
- `howto.experience.enumerate` — the method that finds the critipaths this rule grades
- `define.experience._.demo.surf-school` — a worked example of a catalog + case files
- `code.test/frames.behavior/rule.require.given-when-then` (mechanic) — the `[tn]` timeline form
- `behavior.execution/ergonomist/rule.require.acceptance-journey-coverage` (ergonomist) — the
  delivery-stage coverage twin this shifts left
