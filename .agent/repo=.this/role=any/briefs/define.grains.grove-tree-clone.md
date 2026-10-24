# define.grains.grove-tree-clone

## .what

three grains name where a clone works, and together they address it:

| grain | names | unique within | example |
|---|---|---|---|
| **grove** | where a tree's crew runs; a name `rhx git.grove.list` knows | the fleet | `bert-laptop`, `grove-sandpine-v20260901` |
| **tree** | one worktree = one branch = one pr | its grove | `svc-lessons.beav.feat-book-a-lesson` |
| **clone** | one worker, by its slug, or by its serial when it has none | its tree | `mechanic`, `foreman`, `4c1e8b27-…` |

a full address names all three, in that order, each as a key:

```
phone://grove=<grove>/tree=<tree>/clone=<clone>
```

## .why these three, and only these

- **grove** — a tree name is unique only on its grove; two groves may each hold a tree named
  `notebook`. drop the grove and an address names two peers
- **tree** — the tree already pins the repo and the branch. a repo name alone names several trees;
  a branch name alone may sit in two groves. the tree is the unit work happens in
  (`rule.require.one-pr-per-worktree`)
- **clone** — a tree holds a crew; the slug picks one seat. a clone with no slug is picked by its
  serial, rhachet's own key for it — the two names `@:<slug|serial>` takes. each clone is its own
  actor, so what it holds (a mailbox, its contacts) is keyed by its serial, never shared by a tree

no fourth grain is owed. `repo`, `branch`, and `box` each name a projection of a grain above, never a
grain of their own (`rule.forbid.address-by-repo-branch-or-box`).

## .the forms

| form | where | e.g. |
|---|---|---|
| full | stored, printed, in any hint a peer reads | `phone://grove=bert-laptop/tree=notebook/clone=director` |
| `grove=local` | input only | cast to this grove's name before it is stored or printed |
| `@:<clone>` | input only, and the own-tree list | a clone in the caller's own tree |
| `@:<short-serial>` | input only, and the own-tree list | the first 8 hex of a serial; looked up, refused if two clones match, never stored |

- **keys in one fixed order** — grove, tree, clone. any other order is refused, and the refusal prints
  the canonical form, so a peer never has two spellings
- **`local` never leaves the input** — on a remote grove, `local` names that remote grove. a reply hint
  that said `local` would route a reply to the wrong grove
- **`clone=director`, never `clone=@:director`** — `@:` is rhachet's shell shorthand for "a clone in
  this tree", not part of the slug

## .relation to the supervisor stack

`define.work-primitive-hierarchy` lays out fleet → crew → clone → tree → duct → term, with grove as a
coordinate beside the stack. the address uses the three of those that name a **recipient**: where it
runs (grove), what work it is on (tree), which seat (clone). a duct is how a keyboard is reached, not
who is reached, so it stays out of the address.

## .see also

- `rule.forbid.address-by-repo-branch-or-box` — the forbid twin
- `domain.terms/role=supervisor/term=grove._.choice._.md` · `term=tree._.choice._.md` ·
  `term=clone._.choice._.md`
- `src/domain.roles/supervisor/briefs/persona/define.work-primitive-hierarchy.md`

---

written by human + beaver 🦫
