# F31 — the transformer unit suites stay data-driven caselists, not given/when/then

- **fork**: r7 nitpick.1 asks 16 new unit suites to move from `TEST_CASES.map(… test(…))` to `given / when / then`. (a) rewrite each into bdd blocks · (b) keep the caselist shape, the one `rule.prefer.data-driven` (mechanic) names for unit tests of transformers
- **taken**: (b). every listed suite tests a pure `as*` / `is*` transformer, and `rule.prefer.data-driven` shows this exact `describe` + `TEST_CASES.map(thisCase => test(thisCase.description, …))` shape as its example. `rule.require.given-when-then` marks unit tests as recommended, not required. each `description` states the given and the result, so the runner output still reads per case. a rewrite trades one paved pattern for the other and moves no behavior
- **rework**: clean — a mechanical wrap of each `test(…)` in `given / when / then`, sixteen files, no prod code
- **confidence**: 85%. two mechanic rules point two ways for a unit transformer test; the repo already holds both shapes side by side (`asRadioAuthShown` bdd, `asRadioNestedLines` caselist)
- **where**: the 16 files r7 lists, under `src/domain.operations/radio/` and `src/infra/shell/`
- **verdict**: —
