# F24 — a revived clone starts with fresh contacts and an empty thread

## .the fork

a revive mints a fresh serial (rhachet rebinds a DEAD clone's slug under a new
`genCloneSerial()`), and the phone keys mailbox and contacts by serial (F12, ruled by the wisher).

- **A (taken)**: a clone's phone state lives exactly as long as its serial. a revived clone starts
  empty; the dead serial's dirs stay on disk as the audit trail. the gap is made legible, not
  closed: the empty contacts render names the grant path and the meter, a slug address still
  resolves at delivery, and an inbound text still admits the reply
- **B**: a clone with a slug reads through the prior serial dirs that carried that slug: contacts
  and the inbound admission survive a revive. needs a slug marker per serial dir, a read-through
  in the contacts dao and the reach check, and a clamp (revive, then contacts survive)
- **C**: key contacts by slug where a clone has one, by serial where it does not

## .taken, and why at the time

F12 is the wisher's verdict: "per clone", keyed by serial. B and C each widen what "a clone" means
from one serial to a lineage of serials under one slug. that is a reach decision, not a mechanism:
a grant made for one clone would pass to whatever clone next takes the slug, and the contacts are
the reach boundary (F3). to widen a boundary by side effect, inside a review round, is the call a
wisher must make, so A ships and B or C waits for the verdict.

## .rework

clean. B is additive: a marker file written at mailbox gen, a read-through in two readers, one
integration clamp. no record shape changes, and no record a release has written is rewritten.
C would move the contacts file, which is dirtier, so B is the offered follow-up.

## .confidence — 55%, low because

the i007 reviewer graded it `[blocker][urgent]`, and the harm is real: a crew's mechanic that
restarts cannot open a thread to its director until someone re-grants. a revive is routine, so
the frequency is high. against that, the director's first text heals it (S14), and B is clean. the
wisher may read F12 as "per seat", in which case B is the intent and A is the defect.

## .where

`src/access/daos/daoPhoneContacts/`, `src/access/daos/daoPhoneMailbox/`,
`src/domain.operations/phone/peer/getOnePhoneReach.ts`. demoed as
`1.vision.experience.case=11.a-revived-clone-keeps-its-seat.md`, cells C9 and C10, dimension D16.
raised at i007 by r010 blocker 1.

## .verdict

**ruled by the director: per SEAT (tree + role), never per serial.** "a seat outlives a respawn and
a reboot, and a text sent to a seat must reach whatever clone sits there next; a per-serial
mailbox loses mail on every reboot." A, the per-serial default, is overturned. the mailbox and the
contacts key by seat: the slug where a clone has one, the serial only where it has none (C).

built: `daoPhoneMailbox` and `daoPhoneContacts` take `clone` (the seat name, `self.address.clone`);
the daemon writes each `in` copy into the peer seat its roster names. clamped by
`setPhoneText.integration.test.ts` case13: a text either side of a revive lands in one seat
mailbox, and the revived clone texts its director with no re-grant.
