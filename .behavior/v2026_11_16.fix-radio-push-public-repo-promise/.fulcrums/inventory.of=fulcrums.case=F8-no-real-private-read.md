# F8: no real-github read of a private repo in the integration suite

- **raised by:** peer ergo-acceptance-journey-coverage, nitpick.2
- **the fork:**
  - add a real read of a private (and an internal) repo;
  - or prove PRIVATE / INTERNAL by the json transformer's unit cases plus the real PUBLIC read.
- **taken:** the second, plus one real failure read:
  - a real read with an invalid token proves `unreadable` on an auth failure. this was added (conceded
    in part).
  - a real private read needs a private fixture repo, declared for tests, that a test token can read.
    the repo declares one fixture, the public demo repo (`GITHUB_DEMO_REPO`,
    `BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN` in `.agent/keyrack.yml`), and no private one. a test
    that reads some other private repo the beaver token happens to see would bind ci to an
    undeclared fixture. a declared private fixture is a human grant, not a driver act.
  - the real PUBLIC read already proves the reply's field and shape (`{"visibility":"PUBLIC"}`). the
    PRIVATE / INTERNAL map is pure and is unit-tested on github's documented enum.
- **rework:** clean. one more case, once a human provisions a private fixture.
- **confidence: 85%**
- **where:** `getOneGhRepoVisibility.integration.test.ts`
- **verdict:** open, for the council at the close
