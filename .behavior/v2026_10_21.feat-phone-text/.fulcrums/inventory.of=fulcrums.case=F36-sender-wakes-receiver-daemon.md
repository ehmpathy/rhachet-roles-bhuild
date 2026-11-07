# F36 — a send wakes the receiver tree's daemon, spawned with cwd at that tree

## .the fork

delivery moved to the receiver: its tree's daemon says each text held there. a send on this grove
must make sure that daemon runs.

- **A (taken)**: `phone.text set` findserts the daemon of each receiver tree, spawned with cwd at
  that tree, so it loads that tree's own installed package
- **B**: the send only writes; each tree's daemon is started at boot, or by its own clones
- **C**: the sender's daemon delivers into the receiver's pane, as before

## .taken, and why at the time

B leaves a text silent until the receiver's tree happens to start a daemon; the stop hook covers
that gap, but late. C is the shape the order retired. the cwd bend matches F1: the worker serves
the tree its cwd names. across groves, the far grove's `phone.inbox put` wakes its own daemon.

## .rework

clean. one call in the cli, one `cwd` input on `genProcessDetached`.

## .confidence — 85%, low because

a sender now starts a process in a tree it does not own.

## .where

`src/contract/cli/phoneText.ts` (`treeDirsToWake`), `src/infra/process/genProcessDetached.ts`,
`src/domain.operations/phone/daemon/genPhoneDaemon.ts`, `src/contract/cli/phoneInbox.ts`.

## .verdict

(best-guessed)
