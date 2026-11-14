# F10 — the comment op picks its channel dao by a static import, as the push ops do

raised by the arch-smell-scopeleaks peer, 5.1 round 1, blocker.2.

## .the fork

- **A** follow the extant direction: `setRadioTaskComment` imports the channel daos from the
  `access/daos/daoRadioTask` barrel and picks one by `via`, exactly as `setFullRadioTask`,
  `setPartRadioTask`, `radioTaskPush`, and `radioTaskPull` do today
- **B** inject the channel sender via `context` (a `setComment` dependency), so the op imports no dao

## .taken — A, and why at the time

- the wish bounds the change: "no change to radio.task.push contract beyond a shared helper" (F4).
  the record drain calls the comment op beside the push ops on one path; B alone for comments
  makes two dispatch styles on that path, and B for all of them rewrites the push contract
- the half of the concern that was this pr's own drift is repaired: the context type and guard
  (`ContextDispatchRadio`, `isContextGithubAuth`) now come from `domain.objects/RadioContext`, their
  real home, and the two comment daos are reached through the barrel's exports, never a file path
- the cycle the peer names (`access/daos/daoRadioTask` → `domain.operations/radio/task/format/*`)
  is on main before this pr; this op adds no new layer pair to it

## .rework — clean

B is a mechanical move across the five ops at once, with no record or cli change. a fit for a
standalone refactor of the radio dispatch, not a comment feature.

## .confidence — 80%

## .where

`src/domain.operations/radio/task/comment/setRadioTaskComment.ts`; the barrel
`src/access/daos/daoRadioTask/index.ts`.

## .verdict

open
