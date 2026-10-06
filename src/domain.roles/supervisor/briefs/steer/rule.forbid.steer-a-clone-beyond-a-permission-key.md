# rule.forbid.steer-a-clone-beyond-a-permission-key

## .what

**the supervisor's entire channel to a clone is its permission modal: approve, or
reject.** no orders, no explanations, no carry-on prose. a clone drives a bound
route; the route is the instruction, authored before the clone booted.

> the test is about the CLONE, never your message: **did it ask for something?**
> asked → answer it. did not ask → send no message at all.

a `"steer"` payload on a decline is untouched by this rule — that's the reject
speaking (`term=steer` senses 1 and 2). what's forbidden is a standalone message you
originate into a clone that asked for naught (sense 3).

approve/reject is the ceiling, never the floor — most crews need neither.

## .why

a `crew.send` reads as cheap and is not. it costs the clone a turn — the unit the
quota meters, the context window spends, and the grove's ram holds — spent to say
something the route already says.

worse: it inserts supervisor judgment into a driver's lane. the driver owns its
fulcrums, its budget, its convergence, its scouts-honor calls
(`rule.always.drive-autonomously`), with more context than the supervisor holds.

if you find yourself composing a sentence to a clone, the thing you want is almost
always a tool change or a wish change — both durable, neither spends a turn.

## the substitution table — this IS the rule

| ⛔ never send | ✅ instead |
|---|---|
| a steer toward a fix you spotted | the route's reviewers will raise it |
| "commit this before we fell" | `crew.fell --stash --why '…'` — the stash keeps it |
| "carry on, your tab was closed" | fix the boot so a clone never reads silence as a stop |
| "a human must run X" | surface X **to the human**; the clone already knew |
| "converge with the reviewer" | the driver's own rules already say so |
| "release into prod" | a real exception — see below |
| a score on a product survey | dismiss it (`--keys 0`) — a neutral non-answer that files no score under the human's name |

## the narrow exceptions

1. **a permission modal** — approve (`--keys 1`) or reject the option labelled `No`.
   a reject may carry its reason (required on every `decline` per
   `howto.review-permission-requests`) — that's the reject speaking, never a
   message you originated
2. **"release into prod"** — the one phrase a verified-and-granted tree is owed
   (`rule.prefer.release-into-prod-phrase`); relays a human's authorization, never
   your opinion
3. **a human-only gate the human has now granted** — you're the transport for a
   fact the clone cannot observe

all three: you relay the human, never add yourself. a send that carries your own
judgment is the violation, however it's dressed.

## ✋ and 🔍 are yours to work — not yours to message

the babysit contract sorts poll tallies by owner: 🙋 is the human's; ✋ blocked and 🔍
in-review are the supervisor's. that answers *whose problem is this*, never *may I
send a message about it*. they settle differently:

| a ✋ blocked stone | the supervisor |
|---|---|
| appears in the tally | sends naught — the driver is already under orders to converge |
| persists across ticks | still sends naught — a repeat message is noise |
| raises a permission modal | **now** you act — approve or reject |
| names a human-only gate in its blocker text | surface **that gate** to the human, once |

a stall is not a summons. a persistent ✋ indicates a route or reviewer defect — the
repair belongs there, never in a message.

## .enforcement

- a `crew.send` that carries the supervisor's own judgment = **blocker**
- a `crew.send` composed in answer to a gate refusal, where the tool offered an
  escape hatch (e.g. `--stash`) left unread = **blocker**
- a clone's turn spent on work a `--stash`, a tool fix, or a wish edit would have
  covered = **blocker**
- a send that relays a human's authorization verbatim = ✅ **not a violation**
  (exception 2 or 3)
- an answer typed into a numbered box that is not a permission modal = **blocker** — except a
  survey's dismiss (`--keys 0`) and a transcript-share reject, which grant naught
  (`rule.require.nudge-parked-clones`, `rule.always.reject-transcript-share-prompts`)

## .see also

- `rule.always.drive-autonomously` (bhrain/driver) — the autonomy a steer overrides
- `rule.prefer.release-into-prod-phrase` — exception 2, the one phrase owed
- `rule.forbid.self-grant-human-gates` — what a send may never carry
- `rule.require.brief-a-crew-you-hide` — superseded by this rule
- `term=steer._.choice._.md` — the word, and why it is a supervisor act rather than a message

---

written by human + beaver 🦫
