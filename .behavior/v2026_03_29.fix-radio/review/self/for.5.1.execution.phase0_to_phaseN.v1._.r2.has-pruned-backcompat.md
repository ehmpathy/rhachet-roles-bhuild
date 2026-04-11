# self-review: has-pruned-backcompat (r2)

deeper reflection on backwards compatibility concerns.

---

## what was the review about?

the guide asks: did we add backcompat that wasn't requested?

I reviewed each area where backcompat might lurk:
1. constants that could be removed but weren't
2. auth modes that could be simplified but weren't
3. test patterns that preserve old behavior

---

## files reviewed

| file | backcompat? | analysis |
|------|-------------|----------|
| getGithubTokenByAuthArg.ts | no | new default added, old modes preserved as core functionality |
| getAuthFromKeyrack.ts | no | new file |
| dispatcher keyrack.yml | no | new file |
| .agent/keyrack.yml | no | extends clause added |
| constants.ts | no | constant kept for test coverage, not fallback |

---

## why BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN is not backcompat

the constant is retained not for backwards compatibility but for **explicit auth mode coverage**.

in the acceptance test:
- case1: tests default keyrack auth (no --auth flag)
- case2: tests explicit `--auth as-robot:env(...)` mode
- case3: tests idempotency with explicit auth

case2 and case3 need a real token to test the explicit env var auth path. BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN provides that token.

if we removed this constant, we would lose test coverage for the explicit auth modes. that's not backcompat — that's comprehensive test coverage.

the deprecation note exists to guide NEW test authors: "use default keyrack auth for new tests, but this constant exists for explicit auth mode tests."

---

## why GITHUB_TOKEN removal is correct

the blueprint explicitly removed GITHUB_TOKEN fallback. this was backcompat that:
- was implicit (no explicit --auth)
- conflicted with the new keyrack default
- was explicitly removed per blueprint

the removal is correct.

---

## why preserved modes are NOT backcompat

the extant modes (`as-robot:shx(...)`, `as-robot:env(...)`, `as-human`) are **core functionality**, not backwards compatibility:

1. they serve distinct use cases (shell command, env var, interactive)
2. the blueprint contract shows them as supported modes
3. removing them would break valid workflows

these are orthogonal to the new default — not fallbacks.

---

## conclusion

**no unasked-for backwards compatibility detected.**

the implementation contains:
- no deprecated fallbacks
- explicit removal of GITHUB_TOKEN fallback (per blueprint)
- preserved explicit auth modes (core functionality)
- a constant for test coverage (not backcompat)

the codebase is clean.
