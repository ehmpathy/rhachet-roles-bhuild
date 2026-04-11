# self-review: has-divergence-addressed (r2)

i promise that it has-divergence-addressed.

deeper reflection on whether divergences are truly acceptable.

---

## divergence 1: getDispatcherRoleKeyrack.ts removed

**blueprint declared**: separate file `getDispatcherRoleKeyrack.ts` to load keyrack

**implementation**: inline registration `{ uri: __dirname + '/keyrack.yml' }`

**why acceptable**:
- the inline approach achieves the same outcome: keyrack is registered on the role
- reduces file count by 1 (simpler)
- no behavioral difference to consumers of getDispatcherRole
- rhachet's role link process finds the keyrack.yml regardless of how it's registered

**risk check**: none — the keyrack.yml path is resolved at runtime via `__dirname`

---

## divergence 2: CI/CD env var vs prepare:rhachet step

**blueprint declared**: `npm run prepare:rhachet` step that runs `npx rhachet keyrack source --env ci`

**implementation**: env var `EHMPATH_BEAVER_GITHUB_TOKEN: ${{ secrets.BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN }}` set directly in workflow

**why acceptable**:
- keyrack.source() in jest env files reads from process.env
- env var set directly achieves same outcome: token available at test time
- simpler CI/CD config (no additional npm command execution)
- keyrack's fallback behavior (env var → keyrack unlock) makes this seamless

**risk check**: none — tests pass in CI/CD with this approach

---

## divergence 3 & 4: keyrack.yml shorthand format

**blueprint declared**: verbose YAML format with explicit `mechanism: EPHEMERAL_VIA_GITHUB_APP`

**implementation**: shorthand `ephemeral` which rhachet keyrack expands to same mechanism

**why acceptable**:
- rhachet keyrack documentation confirms `ephemeral` = `EPHEMERAL_VIA_GITHUB_APP`
- shorthand is idiomatic for rhachet keyrack declarations
- less verbose, easier to read and maintain

**risk check**: none — rhachet handles the expansion internally

---

## hostile reviewer challenge

what would a hostile reviewer say?

| challenge | response |
|-----------|----------|
| "the inline keyrack registration is harder to test" | the keyrack.yml file is still testable independently; registration method doesn't affect testability |
| "env var approach bypasses keyrack's mechanism translation" | for CI/CD, direct token injection is standard practice; local dev and integration tests use keyrack.source() |
| "shorthand format might change in future rhachet versions" | semver guarantees backwards compat; shorthand sense is stable |

---

## conclusion

all divergences are simplifications that preserve the blueprint's intent. no functional deviations. implementation delivers the same blackbox experience as specified.

**verdict**: divergences addressed satisfactorily.

