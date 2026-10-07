# rule.always.act-on-a-broken-or-incomplete-tool

## .what

when you find a `repo=.this` skill is broken, incomplete, or covers less than it claims —
mid-tick, while you drive the fleet — fix it, or dispatch its fix, in the SAME round you found
it. a paragraph of diagnosis is not a fix. to fix tools is the supervisor's primary
responsibility, ahead of any single crew's status.

## .why

`git.crew.heal --all` once enumerated roughly a third of the fleet and silently omitted the
rest — written into a term file, cited, and left broken through further ticks. a description
is not a fix, and it does not even survive as a memory jog for the next one.

⇒ this is the TOOL-scoped peer of `rule.always.cure-detected-defects-same-tick` (the
CREW-scoped case). together they close "found it, described it, did not fix it."

## .the test

before a response ends, for every tool defect found this tick:

> did I patch the skill file, or only write a brief about it?

a brief, a term-file addendum, an invariant citation are report artifacts. an edited, tested,
committed skill — or a dispatched behavior that will do so — is the only act that counts.

## .the ladder — reach for the highest rung the tick allows

1. **fix it yourself, now** — the defect is small (a wrong glob, an absent role in a loop, a
   serial loop that should fan out) and you hold the file open already
2. **dispatch a nano behavior** — the defect is real but bounded work (a new discriminator
   branch, a parallel rewrite of a loop); sprout a tree, do not merely note the gap
3. **surface it once, with the exact defect and file/line, and move on** — reserved for a
   defect that needs a human call (a design tradeoff, a scope decision), never for "I
   described it well enough already"

rung 3 is the floor under both, for the rare case neither applies — not an escape hatch.

## .the bound

- governs a tool found broken or incomplete THIS tick — not a mandate to audit every skill
  every tick
- a fix that needs a credential, quota, or grant only a human holds is exempt from rungs 1-2
  (`rule.forbid.self-grant-human-gates`) — surface it once and move on

## .enforcement

- a tool found broken or measurably incomplete, described with no patch attempted and no
  dispatch sprouted the same round = **blocker**
- a later tick that re-finds the SAME tool defect already described in a prior tick's own
  briefs = **blocker**

## .see also

- `rule.always.cure-detected-defects-same-tick.md` — the crew-scoped peer
- `rule.always.fix-the-verb-that-left-you-the-gap.md` — the general form: fix the sweep verb,
  never work around it
- `define.invariant.crew.poll.completeness.md` — the case this rule was paved from
- `philosophy.pavement-saves-nature` (bhrain/learner) — an unrepaired pothole in a paved path
  carries the authority of pavement with none of its safety

---

written by human + beaver 🦫
