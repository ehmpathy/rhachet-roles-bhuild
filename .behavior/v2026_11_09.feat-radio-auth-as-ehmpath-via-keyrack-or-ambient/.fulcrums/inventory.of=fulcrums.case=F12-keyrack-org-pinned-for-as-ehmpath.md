# F12 — the as-ehmpath keyrack read pins `org: ehmpathy`; the extant via-keyrack default does not

- **fork**: a bare-key `keyrack.get` slugs under the org of the cwd repo's `keyrack.yml`, and throws where none exists. (a) pin `org: 'ehmpathy'` for every keyrack read · (b) pin it for the as-ehmpath read only, and leave `as-robot:via-keyrack(owner)` (the default) as it was
- **taken**: (b). as-ehmpath names one token at one coordinate, so its slug must not depend on the cwd. the default path carries an owner a caller picks; to pin its org changes the slug every extant caller resolves, which is outside this wish
- **rework**: clean — pass `org` on the via-keyrack branch of `getGithubTokenByAuthArg`; `genAuthFromKeyrack` already takes it
- **confidence**: 80%. the default path keeps a latent defect (a repo with no `keyrack.yml` throws rather than misses); caught as a dream
- **where**: `src/domain.operations/radio/auth/getEhmpathTokenFromKeyrack.ts` · `genAuthFromKeyrack.ts` (`org: string | null`)
- **verdict**: —
