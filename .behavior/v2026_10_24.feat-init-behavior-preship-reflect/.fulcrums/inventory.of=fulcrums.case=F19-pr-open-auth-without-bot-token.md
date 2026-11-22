# F19 · who opens the pr when the seaturtle keyrack token is absent (blueprint q3)

## .the fork

`git.commit.push` opens the pr under the seaturtle keyrack token. absent the token, it fails to
open the pr and offers `--auth as-human`, which uses the ambient gh login — on a human's box, the
human's account.

- (a) held, like a refused push, until the token is set
- (b) `--auth as-human` is allowed
- (c) `--auth as-human` only when the ambient gh login is the bot; else held, like a refused push

## .taken

(c), by the director.

## .rework

clean — one arm of `6.preship.stone` step 2 (the push refusal sort), one `say` of
`has-held-not-bypassed`.

## .confidence

100% — the director's verdict.

## .where

blueprint `6.preship.stone` step 2; `## open questions` q3 (now ruled).

## .verdict

ruled (c), by the director (2026-11-04). **why**: a pr opened under a human account is a public
write under his identity.
