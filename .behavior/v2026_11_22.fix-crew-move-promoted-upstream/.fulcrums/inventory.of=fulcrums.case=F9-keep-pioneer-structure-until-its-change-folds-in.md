# F9 — keep the pioneer's structure in movework.sh until its awaited change folds in

## .the fork

the architecture lanes ask for a restructure of the lifted lib:

- the crew half shares state through `__mv_*` globals, not explicit inputs (r4.blocker1, r5.nitpick2)
- `__mvbox_install` composes five recovery paths in one body (r4.blocker2)
- `crew.move` parses its flags in the same body that orchestrates (r4.nitpick1)
- `__mvbox_*` and `__crew_ledger_enroll` take 3–8 positional args (r7.blocker3)
- the move log appends each step (r7.nitpick1)
- round 2: the pioneer's render labels (`before` / `after (expected)`, `skip` / `already gone`) read asymmetric (r9.nitpick2), and ~35 lines of its prose say `box` where `grove` is meant (r1.nitpick1, beyond the cited lines, which were recast)

- A: restructure now: inputs as args, one named operation per recovery, `key=value` args, an upserted log
- B: keep the pioneer's structure; restructure once the awaited pioneer change has folded in
- C: restructure only what this route wrote

## .taken

B, for the same reason as F8:
- the awaited pioneer change (apply retires the source seats once verify proves the destination live) lands as a diff on the pioneer bytes. `movework.sh` still reads as those bytes plus named adaptations, so that change folds in by diff. a restructure of its state, its args, and its install turns the fold into a hand re-port of ~2.5k lines
- a restructure touches every judge and apply path; the review diff would be dominated by a refactor the wish never named, over a lib whose behavior 221 suite tests now hold

C is what this route did: the new functions it wrote take their inputs as args (`__crew_move_locked`, `__crew_move_judge_then_act`), and each new verdict returns on a stream or an rc.

the move log is an event log: its reader takes the newest `begin` and the steps after it, so a retry converges on the same resume point (clamped by case24). an append is the log's contract, not a duplicate side effect.

## .rework

clean — each restructure is local to `movework.sh` or `crewwork.ledger.sh`; the move, twin, and ledger suites and the `movework.deps` clamp guard behavior. the dream `v2026_11_24.refactor.flatten-movework-else-branches` names the order: fold the pioneer change, then flatten (F8), then lift state into args.

## .confidence — 80%

the cost: the decomposition and positional-args lanes read blockers in a lib this route lifted, until the follow-up lands.

## .where

`src/domain.roles/supervisor/skills/work/movework.sh` · `src/domain.roles/supervisor/skills/work/crewwork.ledger.sh`

## .verdict

open
