# F20 — pure transformer tests keep the caselist frame, with no `[caseN]` / `when('[t0]')`

raised by the mech-given-when-then peer, 5.3 round 1, nitpick.1.

## .the fork

- **A** keep the caselist frame: `describe` + a `TEST_CASES` table + `given(description)` + `then`
- **B** add `[caseN]` labels and a `when('[t0]')` around each pure call, in all eleven suites

## .taken — A, and why

- the mechanic role names a frame of its own for this shape: `rule.prefer.data-driven` asks for a
  caselist table "especially [for] unit tests of transformers", and its own example carries no
  `[caseN]` and no `when`. all eleven suites test pure transformers, one call per case
- a `when('[t0]')` around a pure call names no act beyond the call the `then` already makes; it adds
  a level of indent and a label with no new sense
- each case already carries a full prose description, which is what the `[caseN]` tag would point to
- the same frame sits on main in this repo's own transformer tests

## .rework — clean

a mechanical edit of eleven test files; no prod code moves.

## .confidence — 80%

why not higher: the peer cites `rule.require.given-when-then`, which reads as universal; the two
rules overlap for table-driven unit tests, and which one wins there is not stated.

## .where

the eleven `*.test.ts` files the peer lists.

## .verdict

open
