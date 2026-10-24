# howto: keep a role's boot under its budget

## .what

each director-seat role (behaver, decomposer, prioritizer, supervisor) declares
`budget: tokens:` in its `boot.yml`. the clamp `src/domain.roles/roleArtifacts.integration.test.ts`
boots each one at the src layout and at a linked copy, and turns red when a boot outgrows it.

## .measure

```sh
npx rhachet roles cost --what src/domain.roles/<role>/boot.yml   # src; the linked render costs a little more
rhx git.repo.test --what integration --scope path://roleArtifacts --mode apply   # the clamp, ~2–5 min
```

a brief or `boot.yml` edit imports no module, so a `--changedSince` run skips the clamp. name it.

## .levers — cheapest first, and the one that is forbidden

| lever | how | bound |
|---|---|---|
| refout | keep the cue at `say`; move its argument to an adjacent `.reason.md` at `ref` | the cue stays word for word |
| condense | write `x.md.min` beside `x.md`; the `.min` boots in its place | every claim of the cue survives. supervisor claims are pinned in `CUE_CLAIMS_SUPERVISOR` |
| catalogize | `not:` a set of unsaid briefs and name each in one catalog line | the catalog must name every one (`[case7]`) |
| raise | edit `budget.tokens` | the raise sits in the diff, for review |
| cut a cue | — | ⛔ forbidden: no rule deleted, no sense changed |

## .traps

- **`not` wins over `say`.** rhachet subtracts `not:` before the say/ref split, so a said brief that a
  `not:` glob matches boots nowhere, with no error. to say a supervisor brief, add its name to its
  directory's `!(…)` glob too. `[case5][t1]` turns red when you forget.
- **a `not:` extglob erases `.reason.md` files too.** micromatch reads `!(a|b).md` as "does not
  start with `a` or `b`", so it spares `a.reason.md` but erases the reason file of any unsaid brief.
  each supervisor glob lists `*.reason` for that cause; `[case5][t1]` turns red if one is erased.
  ⚠️ a supervisor refout still costs one ref path line, and the supervisor sits at ~99.9% of its cap.
- **a `.md` edit is shadowed by its `.md.min`.** each such `.md` carries a banner. carry the edit into
  the `.min`, or the boot does not change.
- **budget from the linked render, not src.** round the linked payload up to the next 100.
- **a supervisor skill added or removed** must update the readme counts (`[case8]`).
- **a halted boot** reds the exit check alone; fix that first, the dependent checks follow.

## .see also

- `.dream/v2026_10_22.reseed.rhachet-boot-yml-knob-for-the-also-roster.md` — the upstream knob that
  would retire the `!(…)` globs
- `.dream/v2026_10_21.refactor.one-ship-filter-for-build-and-tests.md` — one ship filter for the
  build and the clamp
