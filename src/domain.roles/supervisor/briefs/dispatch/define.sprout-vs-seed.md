# define.sprout-vs-seed

## .what

two verbs for two dispatch shapes. one word each, so a human names the mechanism in one
syllable and the supervisor never has to guess.

| verb | means | yields |
|------|-------|--------|
| **sprout** | dispatch a **tree** | a worktree + ducts + a bound behavior — work STARTS now |
| **seed** | dispatch a **radio task** | a gh issue queued for later — work does NOT start |

a seed is planted and waits. a sprout breaks ground and grows.

## .why

"dispatch a task" names an intent, not a mechanism, and the two mechanisms are opposites. a
wrong guess once booted a full worktree where the human meant "queue an issue" — the tree had
to be felled.

sprout/seed removes the need for a question: each word carries its mechanism, so the human
states it in one syllable and the supervisor acts with no round trip. the cost asymmetry is
mirrored in the words — a seed is cheap to plant or leave unplanted; a sprout consumes real
resources the moment it happens. the lighter word names the lighter act.

## .the default is SEED — only a TREE-shaped object overrides it

1. **the object, not the verb, authorizes a tree boot.** "sprout a tree", "dispatch a tree",
   "boot a crew" — all name a tree, all authorize SPROUT.
2. **all else is a seed.** a bare "dispatch", "send a task", "queue this", "get X done" pushes
   a radio task and waits.

| the phrase | its object | the act |
|---|---|---|
| "sprout a tree" · "dispatch a tree" · "boot a crew" | 🌲 a tree | SPROUT |
| "dispatch a task" · "send a task" · "queue this" | 📋 a task | SEED |
| a bare "dispatch", no object | — | SEED (default) |

`dispatch` is ambiguous by itself; read its object to tell it apart, per
`rule.forbid.domain-term-ambiguity`. `tree` and `crew` are this repo's own words for what a
sprout produces (`term=crew`, `define.work-primitive-hierarchy`) — a human who says either has
named the mechanism as plainly as `sprout` does. the glossary binds contracts and code, never
the wisher's speech (`rule.forbid.domain-term-synonyms`: prose may use a synonym; a contract
may not) — so to demand the one word from a human is wrong.

### why the default falls to SEED

| | a wrong seed | a wrong sprout |
|---|---|---|
| costs | a gh issue nobody wanted | a branch, worktree, two ducts, a terminal, an install, a bound route |
| undone by | a close | `git.tree.del`, which refuses while the tree holds work |
| disturbs | naught | the fleet — a crew begins the wrong work at once |

a wrong seed costs one message ("sprout it", from the same wish, already authored). a wrong
sprout costs a fell, and the wish is re-pushed regardless. the recovery path from a wrong seed
passes through the seed — that is what makes it the correct default. so a bare "dispatch" is
seeded, never asked about; ask only when the human names a tree-shaped outcome and withholds
the word.

## .the map to extant mechanisms

| verb | skill | prior name |
|------|-------|------------|
| sprout | `rhx git.tree.behavior --into $org/$repo --name beav/... --size ... --wish ...` | radio pull / "boot a worktree" |
| seed | `rhx radio.task.push --via gh.issues --into $org/$repo --title ... --description @stdin` | radio push |

these are aliases in speech, not new skills. a sprout names the ACT of dispatch, never a
guarantee of a live worktree — it may boot one, be answered by work that needs none, or fail
and be felled. verify from `rhx git.crew.list` and the filesystem
(`rule.require.verify-after-send`). sprout/seed settles WHICH action; it never relaxes the
rules that bind that action — a sprout still owes a bound behavior
(`rule.require.behaviors-over-adhoc`) and a human ok above nano
(`rule.require.confirm-behavior-size-above-nano`).

## .enforcement

- a tree booted where the human never named a tree = **blocker**
- a sprout answered as a seed, or a seed answered as a sprout = **blocker**
- a bare "dispatch" seeded = correct; a question asked in its place = **nitpick**

## .see also

- `term=sprout._.choice._.md`, `term=seed._.choice._.md` — etymology and rejected synonyms
- `rule.require.clarify-radio-push-vs-pull.md` — the ambiguity these words dissolve
- `rule.always.sprout-on-a-grove-never-local.md` — WHERE a sprout lands
- `rule.require.behaviors-over-adhoc.md` — a sprout must boot a bound behavior
- `rule.require.confirm-behavior-size-above-nano.md` — a sprout above nano needs a human ok
- `howto.dispatch-workers.md` — the sprout flow end to end

---

written by human + beaver 🦫
