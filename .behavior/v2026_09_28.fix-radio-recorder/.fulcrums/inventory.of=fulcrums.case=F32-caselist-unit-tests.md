# F32 — transformer unit tests as data-driven caselists

- **the fork:**
  - (a) seven new transformer unit tests stay caselists: a `TEST_CASES` table, one `test()` per row
  - (b) wrap each row in `given` / `when` / `then`
- **taken:** (a). `rule.prefer.data-driven` (mechanic) names exactly this shape for unit tests of
  transformers — its example is `TEST_CASES.map(thisCase => test(thisCase.description, …))`.
  `rule.require.given-when-then` marks unit tests "recommended", integration "required"; every
  integration and acceptance test in this branch is given/when/then. the extant repo holds the same
  split (`getCliArgs.test.ts`, `isGithubAuthFailure.test.ts`, the dreamer tests)
- **rework:** clean — a mechanical wrap per file, no assertion changes
- **confidence:** 80%. two mechanic rules meet here; the more specific one (transformers,
  caselists) governs
- **how found:** peer r007 (mech-given-when-then) blocker.1
- **where:** `asPushTaskFromArgs.test.ts`, `asRadioErrorDetail.test.ts`, `asRadioRecordTransformers.test.ts`,
  `asRadioUpstreamReason.test.ts`, `asRadioTaskRecordLift.test.ts`, `asCliMalfunctionOutput.test.ts`,
  `isHintInErrorMessage.test.ts`
- **verdict:** conceded at peer round 2 — r007 re-raised it, and the two rules compose rather than
  compete: each file keeps its `TEST_CASES` table and maps each row to
  `given('[caseN] <description>')` › `when('[t0] …')` › `then(…)`. no assertion changed; unit suite
  625/625 green after the wrap
