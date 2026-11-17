# F2 — a comment may land on a thread the radio did not frame

## .the fork

- **A** comment on any issue or pr number the auth can reach
- **B** comment only on a `🎙️ task -` issue (the frame `get.one.byPrimary` enforces for updates)

## .taken — A, and why at the time

- an update refuses a foreign issue because it rewrites a body a human wrote; a comment rewrites
  naught, so the reason for the frame does not apply
- #567's own measured case, #489, is a thread the radio did not frame; #255 asks to "talk back
  into an open gh issue thread"; #394 and #406 amend issues a human opened
- B would leave the exact side path (#489's raw wrapper) as the only way to reach such threads

## .rework — clean

add the frame check to the comment send (one `byPrimary`-like read before the post). no record
shape changes.

## .confidence — 85%, and why it is low

#533's text says "appends ONE comment to task N", which a strict reader could take as radio
tasks only; the other four asks say issue, thread, or pr.

## .where

the gh.issues comment send (execution stone).

## .verdict

open
