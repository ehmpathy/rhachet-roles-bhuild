# F25 — the `clone socket auth error … auth-denied` line in this pane is not the phone daemon

## .the fork

the surdirector saw `clone socket auth error ... auth-denied` sit in this clone's input box, and
asked whether the phone daemon under test writes into a live pane.

- **A (taken)**: the line is rhachet's own. the phone writes into a pane only through
  `rhx clone say`, which never types into the sender's pane, and no phone daemon ran in this tree
- **B**: the phone daemon or a phone test wrote it; the phone would owe a guard against a live
  pane

## .taken, and why at the time

evidence, read 2026-10-22:

- `rhx phone.daemon get` in this tree reads `state: DOWN`, and no `daemon.log` exists under this
  tree's cache — no phone daemon has run here
- the string lives in rhachet, not in `src/`: `rhachet/dist/domain.operations/clone/socket/
  genCloneSocketServer.js:248` traces `clone socket auth error: <message>` when an inbound socket
  say fails its auth check; `auth-denied` is the class for a caller that is not the clone's own
  unix user (`computeCloneOperationalRejectClass.js:26`)
- that server is the host of this clone's pane, so its trace prints into this pane's tty — the
  caller was some process that tried to say to THIS clone and failed auth
- every phone test runs on a fake sdk (integration) or a stub rhachet bin (acceptance); the one
  test that drives real rhachet (`sdkRhachetClone.integration.test.ts`) says to `nobody` in a temp
  tree, which never reaches this clone's socket

so the writer is a sayer to this clone from outside its unix user (a supervisor tool, a sandbox),
and the print is rhachet's trace into the pane it hosts.

## .rework

clean. if the trace in the pane is a defect, it is rhachet's: a socket server should log an auth
failure to its own log, never to the tty of the pane it hosts, since that tty is a human's input
box. a reseed to rhachet, not a change here.

## .confidence — 70%, low because

the caller that tripped the auth check was not found; only the writer of the line was. the
surdirector's own say tool, run as another user, is the likeliest caller, and it is unverified.

## .where

none in this tree. rhachet `genCloneSocketServer.js:248`.

## .verdict

(open — for the council)
