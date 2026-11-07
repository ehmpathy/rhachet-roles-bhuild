# rule.forbid.address-by-repo-branch-or-box

## .what

never address a clone, or name where work happens, by repo, branch, or box. address by the three
grains: grove, tree, clone (`define.grains.grove-tree-clone`).

## .why

each forbidden word names a projection, so it names more than one peer:

| 👎 forbidden | why it misleads | 👍 instead |
|---|---|---|
| `<org>/<repo>` | one repo holds several trees, each with its own `@:mechanic` | `tree=<tree>` |
| `<repo>#<branch>` | a branch can sit in two groves; a tree already pins the branch | `tree=<tree>` |
| `box`, `host`, `machine` | forbidden synonyms of grove (`term=grove`) | `grove=<grove>` |
| `cross-repo`, `cross-box` | the reach axis is same-tree · cross-tree · cross-grove | the grain that differs |
| `phone://local/...` in a stored or printed address | `local` names a different grove on each machine | the cast grove name |
| `clone=@:<clone>` | `@:` is a shell shorthand, not part of the slug | `clone=<clone>` |

a quote from an issue that used a forbidden form is a premise to verify, not a shape to adopt.

## .the test

does the address, or the prose about reach, name a repo, a branch, or a box? replace it with the grain
it was a projection of.

## .enforcement

- an address shape keyed on repo, branch, or box = **blocker**
- `local` in a stored or printed address = **blocker**
- prose that says repo, branch, or box where tree or grove is meant = **nitpick**

## .see also

- `define.grains.grove-tree-clone` — the positive peer
- `domain.terms/role=supervisor/term=grove._.choice._.md` — where `box` / `host` / `machine` are
  forbidden

---

written by human + beaver 🦫
