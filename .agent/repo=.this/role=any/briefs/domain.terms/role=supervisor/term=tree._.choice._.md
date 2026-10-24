# domain.term: tree

term.chosen   = tree
term.kind     = noun
term.synonyms.forbidden:
- repo (as a place work happens)
- branch (as a place work happens)
- worktree (in prose; fine as git's own word for the mechanism)
- checkout
- workspace

## .what

**one worktree = one branch = one pr**, on one grove. the unit a crew works in.

- named by its slug: `<repo>.<owner>.<kind>-<topic>`, e.g. `svc-lessons.beav.feat-book-a-lesson`
- unique within its grove; two groves may each hold a tree of one name
- holds a crew of clones (`term=crew`) and its own mailboxes

## .in an address

`tree=<tree>` is the second grain of `phone://grove=<grove>/tree=<tree>/clone=<clone>`
(`define.grains.grove-tree-clone`).

## .reason

see `term=tree._.choice.reason.md`.

---

written by human + beaver 🦫
