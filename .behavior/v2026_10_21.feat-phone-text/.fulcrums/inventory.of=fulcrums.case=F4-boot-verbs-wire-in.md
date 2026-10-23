# F4 — do the boot verbs grant contacts in this delivery?

## .the fork

- **A (taken)**: no. `phone.contacts set` is the documented boot step; the booter runs it. wire-in to `git.crew.boot` / `git.tree.behavior` is a caught dream
- **B**: yes — the supervisor's boot verbs grant both ways on every boot

## .taken, and why at the time

the wish's done-test and critical path need the grant, not the wire-in. B touches the supervisor's
large bash surface (crewwork, ductwork) under an EOD deadline, and crosses a role boundary.

## .rework

clean — a later edit adds one `phone.contacts set` call per boot.

## .confidence — 65%, low because

"contacts supplied at boot by whoever boots the tree" may mean the wisher expects B now.

## .verdict

ruled by the wisher, 2026-10-21: *"directors will get booted via their hooks with the grant
automatically."*

- a director's boot hooks run `phone.contacts.uses allow`; that grant is how a director manages
  its own contacts
- this repo holds no director role (`src/domain.roles/` has none), so those hooks live outside it.
  this delivery ships the meter they flip; the hook wire-in and a per-boot contacts grant in the
  supervisor's crew verbs stay a caught dream (`dreams/2026_10_21.phone-contacts-grant-in-crew-boot.dream.md`)
- confidence on that scope split: 75% — if the wisher wants the crew-boot grant here too, it is a
  clean add of one `phone.contacts set` per boot

## .the open half, for the council

the wisher ruled the director half (its own boot hooks). the crew half stays open: r8 (i003
blocker.2) points out that the supervisor's crew boot verbs DO live in this repo, so a per-seat
grant both ways at crew boot is reachable here — one `phone.contacts set` per seat, run beneath
each clone as a boot verb. the call is the wisher's: ship it in this delivery, or keep it a dream.

## .verdict

ruled by council (robot:director, rhachet-ktlo), 2026-10-22: **the best guess stands.** the crew
half ships as the dream `.dream/2026_10_21.phone-contacts-grant-in-crew-boot.dream.md`, not in this
delivery. r8 i003 blocker.2 is answered by this verdict.