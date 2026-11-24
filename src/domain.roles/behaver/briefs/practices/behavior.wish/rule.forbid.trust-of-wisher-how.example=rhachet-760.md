# rule.forbid.trust-of-wisher-how.example=rhachet-760

## .where

- repo: ehmpathy/rhachet
- pr: https://github.com/ehmpathy/rhachet/pull/760 — `rhx brains auth set|get|use|del`
- route: `.behavior/v2026_11_14.feat-brains-auth-use-get-set/`
- review: 2026-11-23

## .what happened

the wish named an ad hoc command, `brains.auth.usage`, as the parity target for `get`, and a swap
command as the source of the account-swap design. the driver carried both straight through:

- requirement case=27 (`brains-auth-get-matches-usage`) defined `get` as what the ad hoc command
  shows — a tool no consumer of `rhx brains auth` knows
- requirement case=28 copied the poc's scope model, and never asked whether scope must be an
  explicit input
- source comments justified choices by what the poc does

## .the cost

the review rejected all of it: the work existed to replace the ad hoc command, so a spec measured
against it could not stand. the requirements, the design behind them, and the comments were each
redone. the one contract that held was the verb set the wisher asked for: `get|set|use|del`.

## .the strike test, applied

| requirement | strike `brains.auth.usage` | restated |
|---|---|---|
| case=27: `get` shows what `brains.auth.usage` shows | says naught | per account: each usage window, its used share, and when it resets |
| case=28: three scopes, as the swap command had them | still reads, but was never challenged | which seats must change account, and who asks? → an open question for the wisher |

## .see also

- `rule.forbid.trust-of-wisher-how` — the rule this case grounds
- `rule.forbid.trust-of-wisher-how.reason.md` — the argument
