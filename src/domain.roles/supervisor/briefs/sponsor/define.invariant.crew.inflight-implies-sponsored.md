# define.invariant.crew.inflight-implies-sponsored

## .what

an inflight tree must be a sponsored star. a crew runs — holds a grove slot, a duct, a
worktree, a bound route — ONLY on a tree a human funded (⭐ in `rhx eco.priority`). an
inflight tree that carries no ⭐ is an anomaly, not a state.

## .kind

**nurture.** a duct is a duct whether or not a human funded it, and the fleet booted such
trees for its whole life. we CHOOSE the constraint because the grove is concurrency-capped by
token budget: every slot an unfunded tree holds is one a funded star cannot have. the cap is
the reason; lift the cap and the constraint is negotiable.

## .invariant

```
tree.inflight  ⟹  tree.priority.sponsored (⭐)
```

contrapositive, the operative half:

```
¬ tree.priority.sponsored  ⟹  ¬ tree.inflight
```

⇒ **if it is not sponsored, it should not be inflight.**

## .why

- **the grove is a fixed pool.** concurrency is capped by token budget
  (`rule.require.bound-grove-concurrency-by-saturation`), so the crews that run are drawn from a
  scarce set. an unsponsored crew in that set is a funded star denied a slot.
- **sponsorship is the human's commitment of scarce budget** (`define.prioritized-vs-sponsored`).
  to run an unfunded tree spends the pool on work no human committed to.
- **the fleet's default question is "how do the funded stars fare?"**
  (`rule.always.read-stars-as-sponsored-priorities`). a poll that ranks every crew answers a
  question about MOTION where the human asked about the FUNDED set.

## .the tool consequence — `git.crew.poll` default-scopes to stars

| the read | scope | shows |
|---|---|---|
| `rhx git.crew.poll` (default) | the ⭐ sponsored trees | how the funded stars fare |
| `rhx git.crew.poll --all` | every crew, sponsored or not | the whole fleet, for husk cleanup and fell sweeps |
| an unsponsored tree that is inflight | surfaced as an **anomaly** | a row flagged ⚠️ — a slot spent off-budget, to settle |

the default answers `read-stars-as-sponsored-priorities` by construction — the bare poll IS the
funded read. `--all` widens to the fleet, which husk cleanup and the fell sweep still need (a
tree that fell or merged often sheds its sponsor before it closes).

⚠️ an unsponsored-inflight tree is not silently dropped — only an unsponsored IDLE tree is
hidden. an unsponsored INFLIGHT tree violates the invariant, so it is surfaced as an anomaly to
settle: fell it, unsponsor its slot, or mark it sponsored.

## .the litigation

2026-09-14: *"the crew.poll should be default scoped to stars. if its not sponsored, it
shouldnt be inflight."* — said after a fleet-wide poll reported the busiest crews as "our
stars" when that was a motion read, not the funded read.

## .the counter-argument

*"a husk or a tree that merged is often unsponsored by the time it closes — the default scope
would hide the very trees the fell sweep needs."* true, and that is what `--all` is for. the
fell and heal sweeps run `--all`; the default read answers the funded question. the two scopes
serve two questions, and neither is the other.

## .what would overturn it

- the grove concurrency cap is lifted (unbounded token budget) — an unsponsored crew then
  denies no star a slot, and the constraint becomes a preference
- sponsorship stops deciding budget commitment — ⭐ then no longer marks the funded set, and the
  scope loses the flag it keys on

## .scope

covers a crew that is INFLIGHT — holds a live grove slot. does not cover a felled tree, a tree
still owed a closeout, or an idle unsponsored tree with no crew (those hold no slot). `--all`
is the sanctioned way to read every crew regardless of sponsorship.

## .enforcement

- a `git.crew.poll` default read that ranks every crew rather than the ⭐ set = **blocker**
- an unsponsored tree left inflight, not surfaced as an anomaly = **blocker**
- a fell or heal sweep that uses the default scope and misses an unsponsored tree mid-close =
  **blocker** (those sweeps owe `--all`)
- an idle unsponsored tree hidden by the default scope = **false positive** (it holds no slot)

## .see also

- `rule.always.read-stars-as-sponsored-priorities.md` — the read this invariant makes the
  default
- `define.prioritized-vs-sponsored.md` (prioritizer) — ⭐ is a human's committed budget
- `rule.require.bound-grove-concurrency-by-saturation.md` — the concurrency cap that is the .why
- `surgoal.squeeze-the-grove.md` — every off-budget slot is waste this surgoal targets
- `rule.require.speak-at-the-supervisor-layer.md` — answer the funded question in its own units

---

written by human + beaver 🦫
