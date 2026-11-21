# F12 — texts and contacts are scoped per clone

## .the fork

- **A**: per tree — one mailbox and one contacts file for every clone in a tree
- **B (taken)**: per clone — each clone has its own mailbox and contacts, under
  `skill=phone.text/clone=<serial>/` and `skill=phone.contacts/clone=<serial>/`

and for the parts beside them:

- **C (taken)**: the daemon and the `phone.contacts.uses` meter stay per tree
- **D**: a daemon and a meter per clone too

and for a clone with no slug:

- **E (taken)**: `clone=` takes the slug, or the full serial when the clone has none — the same two
  names rhachet's `@:<slug|serial>` takes. the 8-char short serial is accepted on input only

## .taken, and why

- B: a mechanic and a foreman in one tree are two actors. per tree, either could read, reply as, or
  withdraw the other's texts, and a grant to one would widen both
- B: the serial is rhachet's own key for a clone (`serial=<serial>` dirs); `clone whoami` returns it
  from `RHACHET_CLONE_SERIAL`, so the phone learns its caller with no new mechanism
- C: one daemon per tree already holds the lock and the `clone say` cwd; it can serve every mailbox
  in the tree. the meter is a human's call about a tree, as `radio.uses` is
- E: a slug is the readable name, so it is stored where one exists; a serial is the only name an
  unnamed clone has. the short serial is lossy (a prefix), so it never reaches disk. admission
  looks up the serial for both forms before it compares, so a clone that gains a slug later stays
  the same contact

## .rework

clean — a path segment in the mailbox layout, before any code exists.

## .confidence — 85%, low because

C is a best guess: a per-clone meter would let a human lift self-management for the director seat
alone in a tree that also holds crew seats. no such tree is known today.

## .verdict

B and E: the wisher, 2026-10-21 — *"contacts and texts are scoped per clone, right? even if the
clone doesnt have a name, still can be addressed via @:{hash} right?"*. C: best-guessed, open to
the council.
