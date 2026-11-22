# F1 — what counts as an "ehmpath email"

- **fork**: (a) any address on the `ehmpath.com` domain · (b) only a declared roster of seaturtle addresses · (c) both
- **taken**: (c). an address on `@ehmpath.com`, or one of the declared seaturtle identities — `seaturtle@ehmpath.com`, the app bot's noreply, and the clone account's noreply (`259600029+ehm-seaturtle@users.noreply.github.com`). the clone's own box carries the noreply form in git config (peer `keyrack.operations.sh`, `SEATURTLE_CLONE_EMAIL`), so a domain-only test would refuse the very box the wish targets
- **rework**: clean — one predicate, `isEhmpathEmail`, owns the test
- **confidence**: 70%. the wish says "an ehmpath user email" and never lists one; the clone box's actual git config email was not read here (the read is not paved)
- **where**: `src/domain.operations/radio/auth/` (new predicate)
- **verdict**: approved by the director with the vision, 2026-11-14; clean rework, held as taken
