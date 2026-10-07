# F15 · the guards journey keeps its extant `checkpoints` + `beforeAll` shape

## the fork

`skill.init.behavior.guards` `[case1]` is one ordered journey: a single `beforeAll` drives a route
stone by stone and stores each step's output on a `checkpoints` object that later `when` blocks
read. this change adds three steps (`visionDrive`, `roadmapDrive`, `executionDrive`) in the same
shape. `ergo-acceptance-journey-coverage` (r004 nitpick.1) asks for `useThen`/`useWhen` instead.

| option | cost |
|---|---|
| A · add the three steps in the extant shape (taken) | extends a pattern the rule prefers to avoid |
| B · move only the three new steps to `useWhen` | each step depends on the route state the prior steps left; a `useWhen` per step splits one ordered `beforeAll` into two orders of execution in one file |
| C · rewrite the whole journey to `useWhen` | ~20 steps and 19 tests; a refactor smuggled into a brain change |

## taken, and why at the time

A. the steps must run at a fixed point in the journey's order (after the blueprint passes, before
execution). the extant `beforeAll` is what fixes that order. a mixed shape would read worse than
one consistent shape. the results are only read, never mutated after the `beforeAll`.

## rework

clean: a whole-journey move to `useWhen` is one self-contained refactor of one file.

## confidence, and why it is not higher (80%)

- a reviewer could fairly prefer C as a follow-up; it is not caught as a dream since the shape works and the rule is a prefer

## where

- `blackbox/role=behaver/skill.init.behavior.guards.acceptance.test.ts` `[case1]` `checkpoints`

## verdict

awaits the wisher.
