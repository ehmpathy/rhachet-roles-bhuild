# F32 — the spot-allow invariants move to the derive suite, not a unit file of their own

- **fork**: `isEhmpathSpotAllowed` and `asEhmpathSpotShown` were deleted, with their unit tests. r12 nitpick.2 asks whether a unit-level replacement exists. (a) restore a dedicated unit file per invariant · (b) lock each invariant where it now lives: the derive's own unit suite plus the cli cases
- **taken**: (b). the allow check no longer exists as an operation; the walk in `getGithubTokenByAuthArg` decides which spot it reads. `getGithubTokenByAuthArg.asehmpath.test.ts` asserts on `fake.calls` that via-keyrack reads neither `git config user.email` nor `AMBIENT_READ_GH_LOGIN`, and that via-ambient never calls keyrack. `asAuthSourceShown.test.ts` carries the three shown cases. `radioTaskPull` case11 and case12 lock both at cli grain
- **rework**: clean — a new unit file that re-asserts the same calls, no prod code
- **confidence**: 85%. a reader may want each invariant named in its own file; the assertions exist, one grain up
- **where**: `src/domain.operations/radio/auth/getGithubTokenByAuthArg.asehmpath.test.ts`, `asAuthSourceShown.test.ts`, `src/contract/cli/radioTaskPull.integration.test.ts`
- **verdict**: —
