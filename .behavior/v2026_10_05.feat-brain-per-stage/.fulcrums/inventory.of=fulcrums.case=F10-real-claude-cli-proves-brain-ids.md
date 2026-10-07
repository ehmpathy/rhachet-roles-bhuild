# F10 · prove the brain ids via the real claude cli in CI

## the fork

two peer lanes at 5.1 (behavior-intent-coverage, ergo-friction-hazards) block on
`rule.require.external-contract-integration-tests`: no test hands `claude-opus-5-5[1m]` or
`claude-sonnet-5-5[1m]` to the real consumer. options:

| option | proves | cost |
|---|---|---|
| A · real claude cli via `npx --yes @anthropic-ai/claude-code@2.1.280` (taken) | the cli accepts each exact string, `[1m]` suffix included, answers on that model, and rejects a bad id loud | 3 tiny paid calls per integration run; a one-time cli download into the npx cache |
| A′ · same cli as a pinned devDep | same | rejected: `node_modules/.bin/claude` shadows the stub `claude` the acceptance journeys bind (measured: guards journey red), and would route their reviewer lanes to the real paid cli |
| B · anthropic api via sdk | the base ids exist at the service | misses the `[1m]` alias grammar, which is claude code's, not the api's |
| C · refute: ids sourced from anthropic docs | naught at runtime | the rule names effort difficulty a blocker, not an excuse |

## taken, and why at the time

A. the cli is the true consumer of both strings (driver `/model`, reviewer `enroll claude --model`),
`ANTHROPIC_API_KEY` is already in the repo's `env.test` keyrack and CI's firewall, and the test reads
the strings from init'd routes, so a later prescription change is checked with no test edit.

## rework

clean: delete `initBehaviorDir.brain.claude.integration.test.ts`. no dependency, no template, and no
other test depends on it.

## confidence, and why it is not higher (80%)

- each CI integration run spends real tokens on three calls (two accepts, one rejection)
- the pinned cli version (2.1.280) needs a bump when claude code changes its model grammar; the test
  goes red loud if it does, never silent
- the wisher may prefer a manual pre-release check over a per-run paid call

## where

- `src/domain.operations/behavior/init/initBehaviorDir.brain.claude.integration.test.ts`

## verdict

awaits the wisher.
