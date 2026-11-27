# F8 — keep the pioneer's else branches in movework.sh

## .the fork

- A: flatten all 81 `else` / `elif` branches in `movework.sh` to early returns now, per `rule.forbid.else-branches`
- B: keep the pioneer's branch shape; flatten in a later change, once the awaited pioneer change has folded in
- C: flatten only the branches this route rewrote

## .taken

B. two reasons:
- the awaited pioneer change (apply retires the source seats once verify proves the destination live) lands as a diff on the pioneer bytes. `movework.sh` still reads as those bytes plus named adaptations, so that change folds in by diff. a flatten of 81 branches rewrites most of the lib's control flow and turns the fold into a hand re-port
- a flatten touches every refusal and judge path across ~2.5k lines; the diff for one review would be dominated by a restructure the wish never named

C was weighed: the branches this route rewrote (hints, `rc` captures) hold no `else`, so C is empty.

the two `else` branches in `ductwork.status.sh` (a bhuild-owned part, with no pioneer change awaited) were flattened in this round.

## .rework

clean — a flatten is local to `movework.sh`; 172 suite tests and the `movework.deps` clamp guard its behavior.

## .confidence — 80%

the cost: a reviewer on the narrative rules reads 81 blockers in a lib this route lifted. the dream `v2026_11_24.refactor.flatten-movework-else-branches` names the flatten and its order.

## .where

`src/domain.roles/supervisor/skills/work/movework.sh`

## .verdict

open
