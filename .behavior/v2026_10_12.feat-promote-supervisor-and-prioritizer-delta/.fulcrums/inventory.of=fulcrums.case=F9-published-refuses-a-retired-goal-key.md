# F9 — the package keeps its refusal of a retired `goal:` key

## .the fork

after `d121127`, the source retired the `goal` column (the slug IS the goal) and rewrote its clamp
to expect a `set` that carries `goal:` to **exit 0**, the key ignored. the lift had retired the same
column earlier and **refuses** the key: `set takes no goal`, exit 2, with `goal.mv --from` named.

| option | effect |
|---|---|
| take the source (ignore) | parity; the next delta ports cleanly |
| ✅ keep the package (refuse) | a caller who still passes `goal:` learns the verb moved, rather than a silent no-op |

## .why taken, at the time

an ignored key is a failhide: the caller meant a move, got naught, and exit 0 told them it worked.
the refusal names the verb that does the move. the source's own [t4] comment admits the ignore is
an accident of "unknown keys are IGNORED rather than refused".

## .rework

clean: one branch in `ecowork.db.goal.mjs` and its [t4]/[t5] clamps in `ecowork.graph`.

## .confidence — 90%, and why not higher

the divergence costs a merge conflict on each future delta until upstream adopts the refusal
(reseed dream row 5).

## .where

`ecowork.graph.integration.test.ts` [case26] [t4]–[t5]

## .verdict

—
