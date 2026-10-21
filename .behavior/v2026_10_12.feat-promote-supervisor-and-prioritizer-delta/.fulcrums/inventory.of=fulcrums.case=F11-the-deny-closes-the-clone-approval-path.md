# F11 — the F6 deny also closes the clone's `--approval` path

## .the fork

`git.tree.size.uses allow` and `git.crew.commit.sponsor set` accept `--approval '<the human's exact
words>'` when there is no tty. that path exists for a clone that relays a grant the human gave in
chat. F6 ruled a deny on those verbs for the clone, and a deny is absolute in the harness, so the
`--approval` path is now reachable only from a human's own `! rhx …` prompt.

| option | effect |
|---|---|
| ✅ deny, as ruled | the clone can never mint a grant; a chat grant needs the human to type `! rhx … allow` |
| ask in place of deny (`permissions.ask`) | the harness prompts the human per call; the click IS the approval, and `--approval` stays usable |

## .why taken, at the time

the wisher ruled "add the deny now". the ask form is a one-word swap if the wisher meant "the
clone may not act alone" rather than "the clone may not act".

## .rework

clean: `deny` → `ask` in `inits/init.claude.permissions.jsonc`, and the jq key in the init.

## .confidence — 60%, and why it is low

the skills' own `--approval` design says a relayed grant is legitimate; the ruled deny says it is
not. both were the wisher's, at different times. this is a question for the council.

## .where

`src/domain.roles/supervisor/inits/init.claude.permissions.{jsonc,sh}`

## .the peers re-asked it, round i001

two peer lanes raised this same fork from outside, so it is held here for the council rather than
argued down in a `.taken` (`rule.always.raise-a-blocker-a-taken-cannot-close`):

- `enroll-impl-behavior-intent` blocker 5 — the off-tty refusal tells a clone to run
  `allow … --approval '<their exact words>'`, which the shipped deny forbids
- `enroll-impl-arch-defects` blockers 2 and 3 — any non-empty `--approval` passes the guard, and a
  bash write to the meter is not denied; *"for a real gate, move the meter out of the clone's
  write scope"*

the three are one question. a free-text `--approval` cannot tell a human's words from a clone's,
so it is either a relay the human trusts (ask) or a door to close (deny + a refusal that names
only the human's `! rhx …`). a meter outside the clone's write scope is the structural form of
the deny, and a larger change (a store the clone's uid cannot write).

## .verdict

— for the council.
