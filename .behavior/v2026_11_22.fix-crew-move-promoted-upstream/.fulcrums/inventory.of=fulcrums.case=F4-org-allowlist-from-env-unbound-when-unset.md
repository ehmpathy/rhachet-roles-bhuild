# F4 — the org allowlist reads env, unbound when unset

## .the fork

- A: keep `CREW_MOVE_ORGS="ehmpathy whodisio <operator orgs>"` hard-coded
- B: read `GIT_CREW_MOVE_ORGS`; unset → no org bound (any tree under `~/git/<org>/` moves)
- C: read `GIT_CREW_MOVE_ORGS`; unset → refuse every move, fix names the var

## .taken

B. A names a private operator's orgs in a published package, and the clamp `orgNamesAbsent` refuses it. C makes the bare command fail on every fresh install (`rule.prefer.defaults-match-common-case`). B keeps the guard for the operator who sets it.

## .rework

clean — flip the unset branch to refuse (C), or seed a default list.

## .confidence — 70%

the allowlist was a safety bound; the commander may want it on by default, which favors C.

## .where

`1.vision.yield.md` · `.what this builds` item 1

## .verdict

open
