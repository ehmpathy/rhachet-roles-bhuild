# F13 · defer the `init.behavior --help` fix until the wisher approves the flip of its pin

## the fork

the 5.3 frictionless walk of the init path ran `init.behavior --help` and got:

```
⛈️  error: input invalid
   └─ --name must be a string, got undefined
```

so the first command a human types to learn the skill fails, and it names a flag rather than the
usage. ergonomist `rule.require.help-on-demand` treats that as a blocker. the defect is inherited:
the cli file is unchanged on `origin/main`. `skill.init.behavior.flags` `[case7]` pins it on purpose
as `--help flag (currently errors - no help support)` and asserts `exitCode not 0`.

| option | cost |
|---|---|
| A · defer: keep the pin, catch a dream (taken) | the critical path keeps a broken help until the wisher rules |
| B · fix it here and flip `[case7]` | rewrites a pinned test's asserted outcome; `rule.forbid.test-intent-violations` demands explicit wisher approval for that |
| C · fix it here, keep `[case7]`, add a separate test | impossible: the old pin asserts the failure, so a fix turns it red |

## taken, and why at the time

B was built first (a help-only schema parsed ahead of `--name`, a `HELP_TEXT` render, a flipped `[case7]`).
three peer reviewers then blocked the flip: `ergo-contract-snapshots` (r002 blocker.1),
`mech-given-when-then` (r007) and `mech-test-intent` (r008). r002 also named the snaps the new
contract lacked (blocker.2). their point holds: a fulcrum with an unruled verdict is not approval.
C does not exist, so the fix cannot land without the flip, and the flip is the wisher's call.

so B was reverted: `src/contract/cli/init.behavior.ts` and the flags test are byte-identical to
`origin/main` again, and the flags suite passes 14/14 with the old `[case7]` snaps. the full fix
shape is in the dream, so it can land in one pass once approved.

## rework

clean: replay the dream's fix shape (one cli file, one test case and its snaps, one header line).

## confidence, and why it is not higher (85%)

- the wisher may want the fix in this pr instead; that path is clean and the dream holds the shape
- the help copy in the dream is my own phrase choice

## where

- dream: `.dream/v2026_10_05.fix.init-behavior-help-errors.md` (symlinked at `$route/dreams/`)
- pin: `blackbox/role=behaver/skill.init.behavior.flags.acceptance.test.ts` `[case7]`
- header: `src/domain.roles/behaver/skills/init.behavior.sh` lists `--size` and `--wish` (true now);
  `--help` waits for the fix

## verdict

awaits the wisher: approve the flip (then land the dream), or leave the pin.
