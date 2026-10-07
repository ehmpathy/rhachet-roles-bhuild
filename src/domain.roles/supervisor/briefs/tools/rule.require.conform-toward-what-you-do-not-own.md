# rule.require.conform-toward-what-you-do-not-own

## .what

when two surfaces disagree — a glyph set, a term, a flag name, an output shape — and the
divergence spans a boundary you own on one side only, the side you own conforms.

ask "which of these do I own?" before "which of these is better?"

## .why

a merits argument is the wrong first question when one side cannot be changed by you at all —
a verdict in its disfavor buys no action. worse, to argue first spends the human's attention
on a fork that was already closed by ownership.

measured: `git.crew.poll` and `git tree status` once diverged on four verdict glyphs. every
merits argument for the richer set may have been true and none of it mattered — `crew.poll`
lives in a repo-owned skill dir and `git tree status` does not, so `crew.poll` conforms.

## .the test

| the divergence | who conforms |
|---|---|
| you own one side, not the other | the side you own |
| you own both sides | the merits argument is live — pick, and record why |
| you own neither | not yours to settle — record it, dispute it, or seed it |

"own" means: the file lives in a repo you may edit in this session. a repo you could only open
a pr against is a repo you do not own for this purpose.

## .the shape a conformance takes

conform the render, never the domain — the two are separable, which is what makes conformance
cheap. e.g. `git.crew.poll` adopted the peer's two severity glyphs at every render site while
its own six-way verdict words stayed intact, so every downstream distinction survived. a
conformance that costs a distinction is a regression with a justification attached.

## .the corollary — no shared-lib dodge

a shared lib for the disputed vocabulary is the merits argument in a costume — it changes the
side you do not own, by proxy, and needs their agreement to land. it may be right eventually;
it is never the first move, and never a substitute for the unilateral conformance you can make
today.

## .terseness

where ownership settles the direction, there is no fork to analyze. make the change, say what
changed in a line or two. save a fulcrum list for a fork that is genuinely open.

## .enforcement

- a conformance proposed toward a surface you cannot edit = **blocker**
- a merits argument raised before the ownership question is answered = **nitpick**
- a conformance that collapses a distinction a downstream consumer depends on = **blocker**
- a shared-lib extraction offered as the first move on a one-sided divergence = **nitpick**

## .see also

- `rule.forbid.domain-term-inconsistency` (bhrain/learner) — the defect this cures at the render layer
- `rule.require.speak-at-the-supervisor-layer.md` — the peer discipline, aimed at layer not side
- `howto.domain-term-disputes.[guide].md` (bhrain/learner) — the paved path when you own neither side
- `rule.forbid.prescribe-how-on-dispatch.md` — why a proposal reads as a spec

---

written by human + beaver 🦫
