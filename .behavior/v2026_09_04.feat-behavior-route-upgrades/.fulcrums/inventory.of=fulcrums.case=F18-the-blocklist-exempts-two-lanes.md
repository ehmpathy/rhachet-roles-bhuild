# F18 — the review-scope blocklist exempts two vision lanes

## the fork

the directive: a peer lane reads `yield.md` from behavior dirs, and nothing else from them. the
blocklist that delivers it — `--paths-wout '.behavior/*' --paths-wout '.dream/*'` — is applied to
every repo-wide sweep. **two vision lanes are left off it**, and that is a call, not an oversight.

| lane | its `--paths-with` | what it reads under `.behavior/` |
|---|---|---|
| `dimensional-decomposition` | `$route/1.vision.*.md` | the walked dimension space |
| `experience-coverage` | `$route/1.vision.*.md` | the case inventory + every `case=NNN` demo |

## the alternatives, stated fairly

1. **exempt them** — the blocklist covers sweeps; these two keep their stage glob
2. **narrow them to `$route/1.vision.yield.md`** — the directive's literal reading, applied to all
3. **narrow them to an explicit appendix allowlist** — `$route/1.vision.yield.appendix.experience.*`

## taken, and why at the time

**option 1.** the appendices are these two lanes' **subject**, never their noise.

- `rule.require.dimensional-decomposition` grades the walked product, which lives **only** in
  `1.vision.yield.appendix.experience.dimensions.md`
- `rule.require.experience-coverage` grades whether each critipath carries a demo, and the demos
  are `1.vision.yield.appendix.experience.case=NNN.*.md`
- ⇒ option 2 leaves both lanes with a subject of **one file that does not contain what they grade**.
  they would return `0/0` and read as approved — the exact fail-safe the wish exists to close

option 3 is option 1 with more moving parts: the allowlist restates the stage glob and drifts from
it on the next appendix kind.

🟡 **the directive's target is the round's own record — the fulcrums, seeds, dreams, dispatches, and
the appendices a PROSE gate has no business grading.** an appendix read by the lane whose rubric
names it is not that.

## rework, and why

**clean.** two `--paths-with` values on two lines. no caller hardens against a review glob, and no
later stone builds on it. reversal is one edit per lane.

## confidence, and why it is not higher

**88%.** the 12% is one unresolved question: the vision lanes at `$route/1.vision.*.md` also sweep
`1.vision.yield.appendix.groundwork.md` and the `archaeology` file, neither of which either rubric
grades. the measured cost of that is small — 17 vision `.md` files against a 158-file branch — but
it is real, and a per-lane allowlist would cut it.

⇒ it was not cut here because option 3's drift is a **silent** cost and this one is a **measured**
one, and `rule.require.a-cue-is-not-a-claim` prefers the measurable.

## where

`1.vision.guard.light:187,287` · `1.vision.guard.heavy:297,396`

## the verdict

open.
