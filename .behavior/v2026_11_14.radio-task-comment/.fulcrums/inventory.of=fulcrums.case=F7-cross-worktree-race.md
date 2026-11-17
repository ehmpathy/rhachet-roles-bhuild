# F7 — two worktrees that push one body in the same seconds may post it twice

## .the fork

- **A** accept the residual race: the dedupe is a thread read, then a post; within one worktree
  the drain lock serializes it; across worktrees two sends can both read "absent"
- **B** make the post atomic: a marker in the body (a hidden hash), then re-read after the post
  and delete the younger twin
- **C** a cross-worktree lock (a shared dir under `~/.rhachet/`)

## .taken — A, and why at the time

- github's comment post takes no idempotency key, so no read-then-post can be atomic
- B writes a second act (a delete) the gate must also meet, and edits the comment's visible text
  with a marker no asker wanted
- C couples every worktree on the machine through one lock, and still misses two machines
- the race needs two clones with one exact body in one window of seconds; its cost is one
  duplicate comment, deletable by hand. freq × cost is low

## .rework — clean

B can be added inside the gh comment send alone, with no record or contract change.

## .confidence — 70%, and why it is low

#406 says "an agent that retries after a timeout must not double-post" — met (one worktree). but a
reader may take #533's "not posted twice" as absolute.

## .where

inventory row 40; the gh.issues comment send (`daoRadioTaskCommentViaGhIssues.ts`, `.note` on
`findsert`).

the os.fileops twin: the log append is a read of the log, then an append. two worktrees that share
one `--into` dir can both read "absent" and append the same body twice. same fork, same answer (A):
the same window of seconds, the same deletable cost. a `.note` beside the append in
`daoRadioTaskCommentViaOsFileops.ts` names it. raised by the arch-hazards-behavior peer, round 1.

## .verdict

open
