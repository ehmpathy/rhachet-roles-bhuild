## .what

rip out the achiever goal-infer hook. the human never wants to see it again.

## .the fix

- in `src/domain.roles/achiever/getAchieverRole.ts`, delete the `onTalk` entry
  `./node_modules/.bin/rhx goal.triage.infer --when hook.onTalk`
- confirm no `goal.triage.infer --when hook.onStop` entry is registered anywhere; it has come back before
- in its place, leave a comment that forbids it:
  `// FORBIDDEN: no goal.triage.infer hook (onTalk or onStop). the human ruled it a nuisance; never re-add it.`
- add a unit test in `getAchieverRole.test.ts` that asserts no hook command contains `goal.triage.infer`,
  so a re-add fails ci
- update the readme and briefs that describe the hook

## .why

the human called it a nuisance that somehow got added back. the forbid comment and the test clamp it shut.
