# F17 — a box with no git email, and any test env with no stub gh, keep the keyrack default

- **fork**: ambient-first reads the git email first. where it cannot or need not, (a) keep the extant default (`as-robot:via-keyrack(ehmpath)`, slug from the cwd repo's org) byte for byte · (b) as-human · (c) a miss
- **taken**: (a). a box with no email declares no identity, so neither named box applies; CI and fresh boxes keep the send they had. a test env with no stub never reads ambient (the no-real-gh contract), so it takes the same keyrack path, and every extant default-auth test holds unchanged
- **rework**: clean — swap the fallback in `getGithubTokenFromKeyrackDefault`
- **confidence**: 75%. the director may want a box with no email to send as-human
- **where**: `src/domain.operations/radio/auth/getGithubTokenByAmbientFirst.ts`; unit `getGithubTokenByAuthArg.ambientfirst.test.ts` case4, case5
- **verdict**: —
