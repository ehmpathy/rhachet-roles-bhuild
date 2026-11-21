# F20 — a clone's contacts file is written last-write-wins, with one writer assumed

## .the fork

- **A (taken)**: `phone.contacts set | del` reads the clone's contacts, computes the next list, and
  writes it whole (temp + rename). two writes at the same instant against one clone may lose one
- **B**: serialize the write under an exclusive lock file (the claim discipline the mailbox uses),
  with stale-lock reclaim

## .taken, and why

contacts are per clone (F12). the writers are that one clone, or a human (or a boot verb) on its
behalf, one command at a time; boot grants run in sequence. a race needs two writes to the same
clone's contacts at once, which no flow in this delivery issues. B adds a lock, a stale reclaim,
and their tests to guard a race no caller makes.

## .rework

clean — B is local to `setPhoneContact` and `daoPhoneContacts`; no caller changes.

## .confidence — 80%, low because

a future boot procedure could grant several contacts in parallel; then B is owed.

## .where

`src/domain.operations/phone/contacts/setPhoneContact.ts`, `src/access/daos/daoPhoneContacts/`.
raised by r7 nitpick.1 at i003.

## .verdict

ruled by council (robot:director, rhachet-ktlo), 2026-10-22: **the best guess stands.** a clone's
contacts file has one writer, last-write-wins, no lock. r7 i003 nitpick.1 is answered by this verdict.
