# F37 — a group mate is reached by its group alone; a lone text to one is refused

## .the fork

proper groups make each member a peer of every other. the question is what that admits.

- **A (taken)**: a group mate that is no contact is admitted only for a text to that group: by
  name (`--into group:<id>`), or by a `--re` of one of its texts. a lone text to it is refused,
  and the refusal names the grant
- **B**: a group mate is admitted for any text, as a contact is

## .taken, and why at the time

the send and the daemon must read one rule, or a text admitted at the send is refused at delivery.
the daemon already checked the mate against the text's own group. B also lets a member that a
director revoked keep its lone reach through any old group. A keeps a revoke meaningful.

## .rework

clean. one filter on the reach at the send.

## .confidence — 75%, low because

a human may read "a member of my group" as "a peer I may text alone".

## .where

`src/domain.operations/phone/text/setPhoneText.ts` (`assertPhonePeersAdmitted`),
`src/domain.operations/phone/daemon/getOnePhoneDeliveryLookup.ts`, and `phone.contacts get`,
which lists group mates with that hint.

## .verdict

(best-guessed)
