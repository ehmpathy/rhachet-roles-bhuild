# F27 — the tree commits when the route asks, never to make a review durable

- **fork**: a peer lane notes the tree runs ahead of HEAD and asks for a commit so the next lane reviews the real state. (a) commit now · (b) leave the tree uncommitted until a stone asks or the route finishes
- **taken**: (b). the guard's lanes review the worktree (`--diffs since-main` reads the tree, not HEAD), so the lane already sees every fix; a commit would only change what reviewers see, and no stone in this route asks for one at 5.1. the commit lands when the route finishes, as `rule.forbid.commits-the-route-did-not-ask-for` binds a driver
- **rework**: clean — a commit is one command whenever a stone or the finish asks
- **confidence**: 85%. the lane's worry is durability; the worktree is the checkpoint, and it is not shared with any other clone
- **where**: the worktree of `beav/feat-radio-auth-as-ehmpath-via-keyrack-or-ambient`
- **verdict**: —
