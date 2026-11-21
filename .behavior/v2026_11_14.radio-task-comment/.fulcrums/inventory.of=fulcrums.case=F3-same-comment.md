# F3 — "the same comment" = the exact body on that thread, by any author

## .the fork

- **A** exact body match against every comment on the thread, any author
- **B** exact body match only against comments by the sender's identity
- **C** record-only idempotency: the record key dedupes; never read the thread

## .taken — A, and why at the time

- #406's failure case is a client timeout after github already posted: only a thread read can
  see that post, so C fails the exact case asked for
- B needs the sender's login, which as-human does not expose without an extra `gh api user`
  call per send; and a human who pasted the same text already said it — a second copy adds noise

## .rework — clean

filter the read by `user.login` (B) in the one comparison function.

## .confidence — 75%, and why it is low

a director may want to repeat a short note ("still blocked") on purpose, days apart; A keeps it
from a second post. the repeat can vary one word, so the cost is low, but it is a real surprise.

## .where

the comment findsert in each channel dao (execution stone).

## .verdict

open
