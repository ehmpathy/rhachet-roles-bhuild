# F4 — a separate `radio.task.comment` skill, not a `--comment` flag on push

## .the fork

- **A** `radio.task.push --exid N --comment <text|@stdin>` (#567, #533)
- **B** a new skill `radio.task.comment` in role=dispatcher (#406); push's contract unchanged
  beyond a shared helper

## .taken at the time — A

i took A: #567 and #533 named the flag, and one verb kept one gate path.

## .verdict — B, by the director (2026-11-14)

> F4 redirected: the wish names a separate radio.task.comment skill in role=dispatcher, and
> bounds it: no change to radio.task.push contract beyond a shared helper. so a --comment flag on
> push departs from a stated intent; make it its own skill, share only the helper.

what changed in the vision:

- the contract is `rhx radio.task.comment --via V --into R --exid N --comment <text|@stdin>
  [--auth A]`, a new skill beside push in role=dispatcher
- `radio.task.push` keeps its flags, help, and output. the two share one helper — the record →
  gate → drain path. push's drain already carries every held record oldest first, so a push that
  gets through also delivers a held comment; that is extant drain behavior, not a push contract
  change
- `--title`, `--description`, `--status` on the comment skill are flags it does not read: refused,
  with a fix that names `radio.task.push`
- the gate path stays one: both skills write the same record kind into the same queue, and meet
  `radio.uses` in the same helper — so A's reason (one gate path) holds under B

## .rework — clean (applied)

## .confidence — ruled

## .where

`src/contract/cli/radioTaskComment.ts` (new), `src/domain.roles/dispatcher/skills/radio.task.comment.sh`
(new); the shared record → gate → drain helper.

## .verdict

ruled: B
