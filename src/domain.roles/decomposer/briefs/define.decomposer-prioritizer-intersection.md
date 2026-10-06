# define.decomposer-prioritizer-intersection

## .what

> 🍄 the **decomposer** splits a goal. 🔦 the **prioritizer** ranks what a split produced.
> they meet at one object — the **subgoal** — and each holds half of what it needs.

## .the two capacities

| capacity | why it matters |
|---|---|
| detect a **decomposable** subgoal | one unsplit estimate is the unreliable one; several small ones are defensible |
| 🔴 detect a **reusable** component | one goal may serve several surgoals, and its gain sums over every root. same cost, more gain — a **rank event**, never mere tidiness |

⇒ a flat queue cannot see reuse. three `p1 · 3d` rows may share one component or none, and a
list hides which. that is why the store is a DAG with several parents per goal.

## .why each is blind alone

| | 🍄 decomposer | 🔦 prioritizer |
|---|---|---|
| holds | how to split well | what each piece is worth, to how many roots |
| lacks | any reason to prefer one split | any capacity to split |

⇒ together: **split → rank → the rank reveals a better split.** a component that serves three
roots is evidence the first cut was wrong — evidence that exists only after the rank.

## .the boundary

| the question | whose |
|---|---|
| split this goal? along what line? | 🍄 decomposer |
| does this component serve more than one root? | 🍄 detects · 🔦 scores |
| what is each piece worth? which first? | 🔦 prioritizer — a human authors sev/urg |

🔴 **the decomposer never grades.** it proposes rows with their edges and leaves `sev`/`urg`
blank (`rule.forbid.fabricated-opines`).

## .what the store owes

1. several parents per goal
2. a gain rollup over every root a goal serves
3. provenance — *"extracted from goals A and B"*
4. 🔴 an ungraded row is storable. otherwise the decomposer cannot hand off without a fabrication

⇒ tracked at `ehmpathy/rhachet-roles-bhuild#385`.

🍄 the glyph rhymes with the wisher's *"mycelium network of roots"*. a mnemonic, never evidence.

## .see also

- `define.eco.rock-lifecycle-and-treestruct` (role=prioritizer) — the graph this writes into
- `define.cost-gain-matrix` (role=supervisor) — the gain per cost reuse maximizes
- `rule.forbid.fabricated-opines` (role=prioritizer) — why the handoff is ungraded

---

written by human + beaver 🦫
