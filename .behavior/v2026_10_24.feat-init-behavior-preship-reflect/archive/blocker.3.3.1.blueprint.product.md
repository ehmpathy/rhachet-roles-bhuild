# blocker · 3.3.1.blueprint.product

## what blocks me

the director's outcome is "the blueprint goes to the commander for review". the commander's gate is
the `approved?` judge, and judges live in the stone's guard.

this route was inited at nano, so it had no blueprint stone. i added `3.3.1.blueprint.product.stone`
via `rhx route.stone.add`. that skill adds the stone alone: **the stone has no guard.** an unguarded
stone, once arrived or passed, can move on with no `approved?` judge. that would carry the
blueprint past the commander — exactly what the director asked me not to do.

the guard file is sealed. `rhx route.mutate grant get` reads `blocked (no privilege flag)`. no
`rhx` command writes a guard; only an edit does, and the edit needs the route's mutate grant, which
only a human may grant.

## what i tried

- `rhx route.drive` → the route went vision → execution; no blueprint stone
- `rhx route.stone.add --stone 3.3.1.blueprint.product --from @stdin --mode apply`, fed the
  package's own `templates/3.3.1.blueprint.product.stone` → the stone exists; no guard
- `rhx route.mutate grant get` → blocked, no privilege flag
- a re-run of `init.behavior --size mini` on this route was weighed and refused: it would findsert
  every mini stone (criteria, research, roadmap, the phase0 execution) beside this route's
  `5.1.execution.from_vision`, far past "add one gate"
- the blueprint yield is written and complete: `3.3.1.blueprint.product.yield.md`, five open
  questions itemized for the commander, none best-guessed
- i did not arrive or pass the stone: either could skip the commander

## what i need

one human grant, then i do the rest:

```sh
rhx route.mutate grant allow
```

then i copy the package's `templates/3.3.1.blueprint.product.guard.light` in as this stone's guard
(it carries `reviewed?` and `approved?`), arrive the stone, run its reviews, and stop at the
commander's approval gate.
