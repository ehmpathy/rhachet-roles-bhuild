# F27 — a multi-address `phone.contacts set|del` prints one block per address

## .the fork

`phone.contacts set --address a --address b` grants each address in turn.

- **A (taken)**: one output block per address, a blank line between, as each grant lands
- **B**: one block for the whole call, the way a group `phone.text set` renders

## .taken, and why at the time

a group text is all-or-none: every peer is admitted before any record is written, so one block
states one outcome. a contacts call is not: each address converges alone (idempotent grant or
revoke), and a later address may be refused after an earlier one was granted. one block per
address prints each change the moment it lands, so a refusal on the third address still leaves
the first two on screen as granted. B would have to hold the output until the end, and on a
refusal print either naught (hides two real grants) or a partial block (two shapes for one verb).

## .rework

clean. the loop in `src/contract/cli/phoneContacts.ts` and `asPhoneContactsSetOutput` are the only
two sites; a batch render would collect results and print once.

## .confidence — 80%, low because

the reviewer reads the stack as noise, and a batch render with a refusal footer is a defensible
shape too.

## .where

`src/contract/cli/phoneContacts.ts` (the per-address loop), raised by r11 n2 at 5.3 i004.

## .verdict

(open — for the council)
