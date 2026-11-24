# F18 — an ambient read fault is a ConstraintError, not a MalfunctionError

- **fork**: `git config user.email` or `gh auth token` exits with a code other than its "none" exit (gh not installed, a broken config, a read cut off). (a) MalfunctionError, as before · (b) ConstraintError that names the read, its exit, and the fix
- **taken**: (b). the box holds the cause and the caller fixes it (install gh, repair the config, or name an auth that reads no ambient). and the drain holds only a BadRequestError: a malfunction rethrew past `getOneRadioContextForRecord` and aborted every record behind it. the default reads ambient on every send, so that path is common. it still never reads as "none"
- **rework**: clean — the throw in `getAmbientReadOrNone` and three test pins
- **confidence**: 85%. a reader may hold that a cut read (timeout) is a malfunction; it is held and named either way, and a retry is the fix it names
- **where**: `src/domain.operations/radio/auth/getAmbientReadOrNone.ts`; unit `getAmbientReadOrNone.test.ts` case3, `getGithubTokenByAuthArg.asehmpath.test.ts` case9, case10; integration `getOneRadioContextForRecord.integration.test.ts` (held as-ehmpath) case3
- **verdict**: —
