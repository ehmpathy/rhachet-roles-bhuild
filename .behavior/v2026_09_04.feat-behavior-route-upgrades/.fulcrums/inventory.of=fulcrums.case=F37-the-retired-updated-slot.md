# F37 — the retired `↻` updated slot: keep it out, or restore it

rework = clean · status = open · confidence = 85% · risk = rework only, no harm

## the fork

r012 i004 blocker.1 asks to restore `computeOutputTree`'s `updated` param, its `↻` symbol, and the
`given('all files are updated')` case, since a test case on an exported function was removed with no
wisher approval on record.

- **A — keep the slot out, and pin its absence** (taken)
- **B — restore the slot, the case, and `updated: []` at the one caller**

## taken, and why at the time

A. `init.behavior` is a findsert: `initBehaviorDir` returns `created` and `kept`, and never rewrites
an extant file. the one caller passed `updated: []` since #45, so the `↻` row had no producer, and
its test asserted a state the program cannot reach. a kept file that drifted is now named by the
stale outputs and marked inline on its row, which is the case the slot was meant to tell.

the absence is clamped: `computeOutputTree.test.ts` asserts `not.toContain('↻')`, and the doc block
states the two-state contract.

## rework, and why clean

B is three local edits — a param, a symbol, one test case — and one caller line. no consumer
outside `init.behavior` reads the function.

## confidence, and why it is not higher

`rule.require.review-test-changes` asks to preserve old behavior when the caller cannot be asked.
the reviewer's view — any removed test case is a criterion change until a human rules — is a fair
one, and that is the council's call.

## where

`src/domain.operations/behavior/init/computeOutputTree.ts`, its test, `src/contract/cli/init.behavior.ts`

## verdict

closed, by the driver, at i005 — **B**. the rework was clean, and `rule.require.review-test-changes`
settles it without a human: absent an ask, preserve the tested behavior. the `updated` param, the
`↻` symbol, and `given('all files are updated')` are back; `init.behavior` passes `updated: []`;
the `drifted` mark rides beside them. a self-sufficient close owed no council row.
