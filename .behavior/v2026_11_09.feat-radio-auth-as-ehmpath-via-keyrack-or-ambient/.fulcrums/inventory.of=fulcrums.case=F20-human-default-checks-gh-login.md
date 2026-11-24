# F20 — the default on a human box checks the gh login before it sends

- **fork**: a human email, no `--auth`, gh logged out. (a) return as-human and let gh fail at the send · (b) read `gh auth token` in the derive; on none, miss with the fix
- **taken**: (b). an ehmpath box with no login already misses with a tree and a fix; a human box reached gh and failed there with no tree. the read checks presence only — the token is never kept, and gh still sends under its own login
- **rework**: clean — drop the read in the human branch of `getGithubTokenByAmbientFirst`
- **confidence**: 80%. explicit `--auth as-human` is left unchanged (the wish holds it unchanged), so the two differ on a logged-out box
- **where**: `src/domain.operations/radio/auth/getGithubTokenByAmbientFirst.ts`; unit `getGithubTokenByAuthArg.ambientfirst.test.ts` case2 [t1]; demo `1.vision.experience.case=8` [t2]
- **verdict**: —
