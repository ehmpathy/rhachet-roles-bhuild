# define.invariant.crew.poll.completeness

## .what

`git.crew.poll --live --stones` is the ONE deterministic, always-run instrument a supervisor
reads to know the fleet's state. any crew defect it cannot render — a husk, a partial view, a
misclassified role — is a **blocker in `crew.poll` itself**, never a gap closed by a second,
separately-invoked tool.

## .kind

**nurture.** a fleet could be watched by many narrow instruments instead of one wide one. we
choose one wide one: a husk sat undetected for hours across five measured instances while a
purpose-built detector (`git.crew.heal`) existed, uninvoked, because no mechanism forced its use
every tick.

## .invariant

> for every crew state a human or a supervisor cares to distinguish, `crew.poll`'s render ⟺ that
> state — never `crew.poll`'s render AND a second tool's render, taken together.

if a defect class needs `crew.heal`, `term.audit`, or any side instrument to surface it on a
routine tick, `crew.poll` is incomplete, and the incompleteness is the defect — not the absence
of a habit to also run the side instrument.

## .why

- a habit is forgettable; a deterministic render on the one call already made every tick is not
- two instruments that each check the fleet independently is not defense in depth — it is the
  same cost paid twice, and it still misses whatever neither checks
- a supervisor who must remember "also run crew.heal" has reintroduced tribal knowledge: a fact
  held in one brain, rather than a property of the tool

## .scope

governs **detection**, never **action**. `crew.poll` must RENDER a husk (or a partial-view crew,
or a stale-role classification) wherever the data it already fetches can show it. it does not
mean `crew.poll` should also CURE one — a cure (reboot, etc.) stays a deliberate `--mode apply`
act on `crew.heal` or a peer verb.

does not cover a mutation whose correctness depends on human intent — that is
`define.invariant.crew.view.all-or-naught.md`, a peer invariant about a different question.

## .the litigation

raised 2026-09-13 after two husks turned up only via manual `crew.read`, moments after a routine
`crew.poll --live --stones` had already run on both trees and missed them.

## .the counter-argument

a single wide instrument grows slower and more complex with every defect class it must detect.
true, but a second instrument does not remove that complexity — it relocates it to a human's
memory of when to invoke it, which is strictly worse: render-path complexity is auditable in one
file; a habit is not auditable at all.

## .what would overturn it

nurture, so overturned by a changed cost, not a changed fact: if the render path became
measurably too slow or fragile to carry every defect class, the fix is to compose the render
path (per-duct checks joined together) — never to move a check back out to a second tool a
human must remember.

## .enforcement

- a crew defect `git.crew.poll --live --stones` does not render, where the discriminator already
  exists = **blocker** on `crew.poll`
- a fix that adds a NEW separately-invoked detector, rather than joining the check into
  `crew.poll`'s own per-duct read = **blocker**
- `crew.heal` (and peers) remain correct as **action** verbs — none of that is what this
  invariant governs

## .see also

- `term=duct.pane.husk._.choice.reason.md` — the measured instances, and the discriminator
  `crew.heal` already carries
- `define.invariant.crew.view.all-or-naught.md` — the peer invariant, for the view axis
- `rule.always.fix-the-verb-that-left-you-the-gap.md` — a sweep verb's gaps are fixed in the
  verb, never worked around
- `term=partial-audit._.choice._.md` — the shape an instrument takes when it silently narrows
  its own subject set
- `philosophy.entoolment-is-the-pinnacle` (bhrain/learner) — why a habit is the wrong rung

---

written by human + beaver 🦫
