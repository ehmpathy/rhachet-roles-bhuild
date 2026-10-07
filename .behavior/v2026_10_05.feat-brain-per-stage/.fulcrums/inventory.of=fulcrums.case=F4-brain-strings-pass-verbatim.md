# F4 · the brain strings pass verbatim to `/model`, as wished

## .the fork

- **a.** write `claude-opus-5-5[1m]` and `claude-sonnet-5-5[1m]`, the wish's exact strings
- **b.** write the short aliases (`opus[1m]`, `sonnet[1m]`), which track the latest model

## .taken — a, and why

the wish names the exact strings, `[1m]` suffix included. bhrain sends the value verbatim to
`/model` (term `route.guard.brain`), and both strings pass its literal allowlist
(`isGuardValueLiteral.js`: `/^[A-Za-z0-9._/:#[\]-]+$/`). a pin is also what the wish wants for
reviewers: "the current sonnet, not an older one" — a deliberate pin, bumped on purpose.

every string carries `[1m]`: both guard `brain:` values and every reviewer `--model`.

## .rework

clean. a sedreplace over the templates.

## .confidence — 95%, and why not higher

both ids are confirmed in anthropic's docs:

- `claude-opus-5-5` — released 2026-09-22, 1M context by default
  ([opus-5-5 overview](https://platform.claude.com/docs/en/models/opus-5-5/overview))
- `claude-sonnet-5-5` — released 2026-09-28, 1M context native
  ([sonnet-5-5 overview](https://platform.claude.com/docs/en/models/sonnet-5-5/overview))

the real claude cli (2.1.280) accepts both strings via `--model` and answers on the named model
(F10, `initBehaviorDir.brain.claude.integration.test.ts`). the residual: no live `enroll claude`
reviewer lane, which wraps that cli, has yet run on `claude-sonnet-5-5[1m]` in this repo.

## .where

every `brain:` line; every `enroll claude --model` line.
