# F18 — a group send writes one record per peer; a crash mid-write may leave part of the group

## .the fork

- **A (taken)**: admission is all-or-none (every peer is checked before any write); then one QUEUED
  record is written per peer, each by an exclusive create. a process kill between two writes leaves
  the first records QUEUED, and the daemon delivers them
- **B**: write one group file the daemon expands, or a journal the daemon commits, so a crash
  leaves the whole group or none

## .taken, and why

the window is the few milliseconds between two local file writes, and only a kill or a disk fault
opens it. a refusal (unknown peer, keys out of order, bad uuid) — the failure a sender actually
meets — still writes naught. B adds a second record shape (a group file) or a commit step that
every reader of the mailbox would have to learn, for a window a sender can inspect after the fact:
`rhx phone.text get` lists each text of the group by its own name.

## .rework

clean — B touches `setPhoneText` and the daemon's read; no caller outside them.

## .confidence — 80%, low because

the wish says a group send is all-or-none; a wisher who reads that as a crash guarantee may want B.

## .verdict

(awaits council) — raised by r7 nitpick.2 at the i001 absorb.
