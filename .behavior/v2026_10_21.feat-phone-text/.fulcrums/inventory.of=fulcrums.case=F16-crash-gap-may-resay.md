# F16 — a daemon crash between the say and the settle

## .the fork

- **A**: per text: say → write the peer's `in` copy (findsert) → settle the `out` copy DELIVERED.
  a crash after the say and before the settle leaves the text QUEUED; the next tick says it again
  (at-least-once in that gap)
- **B (taken)**: the daemon holds a per-text claim, `<record>.claim`, that names its pid and its act
  (`say`). a claim whose pid is dead and whose act is `say` means a say may have landed; the next
  claimant — a daemon tick or a sender's withdraw — settles a still-QUEUED text FAULTED with the
  reason *"a daemon stopped mid-say; it may have been said, so it is not said again"*, and the
  daemon tells the sender. at-most-once, the same rule as F5

## .taken, and why

the wish says *"delivered once"*, and F5 already chose at-most-once for an unconfirmed say. the
per-text claim (built to stop a withdraw mid-say, r7 blocker.2) already marks the say window, so B
needs no sixth status and no boot sweep: the claim file is the marker, and the five statuses hold.

## .rework

clean — `genClaim` records its act; `setPhoneTextFaultedIfSayStale` settles a stale say; both
claimants call it.

## .confidence — 90%

the one residue: a crash after the claim and before the say also settles FAULTED, though naught
was said. that is the at-most-once price F5 already pays.

## .proof

`setPhoneText.integration.test.ts` case8: a stale `say` claim → FAULTED, the peer hears naught,
the sender hears the failure; a withdraw over a stale `say` is refused as already FAULTED; a stale
`withdraw` claim is reclaimed and the text is said.

## .verdict

closed in code at the i001 absorb (r8 blocker.3); the council may still prefer A.
