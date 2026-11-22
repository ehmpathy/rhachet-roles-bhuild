# F11 — in a test env, the ambient read refuses unless `RADIO_GH_STUB=1`

- **fork**: how prod code keeps a test off a real gh login — (a) trust each test to place a stub · (b) refuse the ambient read in a test env unless the test declares a stub via `RADIO_GH_STUB=1`
- **taken**: (b). the same shape as the extant `as-human` test-env refusal; a test that forgot its stub fails loud before `git config` or `gh auth token` runs. the declaration alone does not prove the stub is on PATH — `withAmbientStub` runs `assertStubGhOnPath` for that
- **rework**: clean — drop the guard and its unit case
- **confidence**: 80%. a test-aware branch in prod code; precedent exists, but a reader may prefer the guard live in test infra alone
- **where**: `src/domain.operations/radio/auth/getEhmpathTokenFromAmbient.ts`
- **verdict**: —
