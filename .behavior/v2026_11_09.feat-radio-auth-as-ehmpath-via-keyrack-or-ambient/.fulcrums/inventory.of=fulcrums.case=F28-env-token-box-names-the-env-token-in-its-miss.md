# F28 — an env-token box with a human email names the env token in its miss; it does not fall to keyrack

- **fork**: a box with a human git email, no stored gh login, and `GH_TOKEN` (or `GITHUB_TOKEN`) set — a CI runner or an agent box — takes the default's human branch and misses. (a) fall to the keyrack robot token · (b) keep the miss, but word it so it names the env token as the cause and offers the three fixes
- **taken**: (b). the box declares a human identity; a silent fall to keyrack would flip that send to the robot with no human ask, the exact identity swap S1 forbids in the other direction. the miss now reads "…but gh holds no stored login, and an as-human send never uses the env GH_TOKEN", and its hint names each way out: `--auth 'as-robot:env(GH_TOKEN)'` (send with that token, on purpose), `--auth as-ehmpath-via-keyrack`, or `gh auth login`. the env token's value never appears; only its name
- **rework**: clean — one branch in `asAmbientHumanNoLoginError`, fed by the pure `asGhEnvTokenName`; to flip to (a), the human branch calls the keyrack leaf in place of the throw
- **confidence**: 80%. low because a CI fleet that relied on the old keyrack default with a human-shaped email will now halt until it names an auth; the halt is loud and names the fix, so the cost is one flag per pipeline
- **where**: `src/domain.operations/radio/auth/asAmbientHumanNoLoginError.ts`, `asGhEnvTokenName.ts`; unit `getGithubTokenByAuthArg.ambientfirst.test.ts` case2b, `asGhEnvTokenName.test.ts`
- **verdict**: —
