# F6 — each delivery writes an `in` copy into the peer tree mailbox

## .the fork

- **A (taken)**: on DELIVERED, the sender's daemon also writes `text.<seq>.in.json` into the peer tree's mailbox (the peer's own seq)
- **B**: only the sender's tree holds the text; the peer's tree holds only what it sent

## .taken, and why at the time

#491's done-test: "the reply lands in the director's record". with B, a director's mailbox would
hold its own texts but not the replies. A makes each tree's mailbox a full thread.

## .rework

clean — drop the copy write.

## .confidence — 75%, low because

it is a write into a foreign tree's gitignored cache; the peer's seq is minted by the writer under
the peer's lock.

## .verdict

(awaits council)
