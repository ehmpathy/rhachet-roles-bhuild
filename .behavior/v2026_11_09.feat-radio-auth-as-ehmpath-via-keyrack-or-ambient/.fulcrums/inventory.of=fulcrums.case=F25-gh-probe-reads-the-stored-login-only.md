# F25 — the gh probe reads the stored login only

- **fork**: `gh auth token` prints `$GH_TOKEN` (or `$GITHUB_TOKEN`) before the stored login, yet the send strips both and runs under the stored session. (a) probe as-is · (b) probe under `env -u GH_TOKEN -u GITHUB_TOKEN`, so only the stored login can answer
- **taken**: (b). with (a), an env token passed the probe, the default chose as-human or as-ehmpath on its strength, and the send then ran under a login the probe never saw — or under none. the probe must read what the send will use. one constant, `AMBIENT_READ_GH_LOGIN`, names the command for every ambient path
- **rework**: clean — one constant; the unit fakes match on a part of the command
- **confidence**: 90%. `env -u` is POSIX on linux and macos; a box without `env` has no shell skills at all
- **where**: `src/domain.operations/radio/auth/AMBIENT_READ_GH_LOGIN.ts`; unit `getGithubTokenByAuthArg.ambientfirst.test.ts` case7; integration `getEhmpathTokenFromAmbient.integration.test.ts` case6 (a stub gh that honors `$GH_TOKEN`, as the real one does)
- **verdict**: —
