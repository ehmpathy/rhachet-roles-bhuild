# F3 — who may grant a contact

## .the fork

- **A (taken)**: `phone.contacts set` carries no identity check in code; the dispatcher role's permissions deny it to a clone's own tool call (the `git.commit.bind` pattern). a human, or a boot verb that runs it beneath, grants
- **B**: `require_human` (tty or `__I_AM_HUMAN`), as `radio.uses` does — blocks a director clone that boots crews, which contradicts the wish
- **C**: a clone may grant only links where it is one end — still lets any mechanic link itself to any tree

## .taken, and why at the time

the wish says contacts are supplied "by whoever boots the tree", and a director (a clone) boots
crews. B would forbid that. A matches the extant pattern for clone-denied grants.

## .rework

clean — swap the gate; the contacts file is unaffected.

## .confidence — 70%, low because

the boundary is only as strong as the permission layer; a clone outside this role's hooks could
call it.

## .verdict

ruled by the wisher, 2026-10-21 — **a meter, neither A nor C.**

- `phone.contacts.uses allow | block | get`, human only (the `radio.uses` pattern)
- **blocked by default, always**, for every clone, every role
- once a human lifts it, the clones of that tree may `set` and `del` their own contacts
- no role is allowed by detection; a director gets the grant from its boot hooks (F4)
- `del` is in this delivery (inventory C5)

verbatim: *"clone denied is a good idea to start with ; maybe we support phone.contacts.uses
allow|block too, to decide whether that clone can manage their own contacts"*, then *"default
blocked always. directors will get booted via their hooks with the grant automatically."*
