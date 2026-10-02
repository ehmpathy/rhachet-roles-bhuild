# inventory of fulcrums

| case | title | rework | status | confidence |
|------|-------|--------|--------|------------|
| F1 | record identity before an exid exists | clean | best-guessed | 90% |
| F2 | where an unbound push records | clean | best-guessed | 70% |
| F3 | exit code of a held push | clean | best-guessed | 75% |
| F4 | which backlog a push drains | clean | ruled by wisher — broad drain | 100% |
| F5 | are status updates recorded too | clean | ruled by wisher — yes, updates too | 100% |
| F6 | are upstream blocks in scope | clean | best-guessed | 85% |
| F7 | an explicit drain verb | clean | best-guessed | 70% |
| F8 | where records live, given a worktree may be removed | clean | ruled by wisher — route-local, loss accepted | 100% |
| F9 | the stop reminder: scope and shape | clean | scope ruled by wisher; shape best-guessed | 85% |
| F10 | an explicit re-push of a refused record | clean | best-guessed — re-queue | 85% |
| F11 | the clock a drained line's "held since" reads in | clean | best-guessed — utc stamp with date | 80% |
| F12 | two pushes at once in one worktree | clean | best-guessed — no lock; converges via findsert | 80% |
| F13 | one malformed record file on disk | clean | best-guessed — fail loud, name the path | 85% |
| F14 | `asRadioTreeLines` shared across two outputs | clean | best-guessed — one transformer | 80% |
| F15 | the radio domain names `.behavior/<route>/.radio` | clean | best-guessed — the recorder walks its own store | 75% |
| F16 | `radioTaskHeld.ts` exports `cliRadioTaskHeld` | clean | best-guessed — match the push + pull cli files | 85% |
| F17 | record dao imported, not injected | clean | best-guessed — import; real-fs tests, no mocks | 75% |
| F18 | `set*` on the record mutations | clean | best-guessed — `set` is the sanctioned upsert verb | 85% |
| F19 | `AGENTS.md` / `CLAUDE.md` all-caps names | clean | best-guessed — the loader mandates them | 95% |
| F20 | where the gh.issues positive path is proven | clean | ruled by wisher — in cicd, where the token lives | 100% |
| F21 | does `radio.uses allow` name the held backlog | clean | best-guessed — no; the stop reminder is the channel (F9); dreamed | 70% |
| F22 | how long a settled record is kept | clean | best-guessed — keep all, route-local; retention dreamed | 80% |
| F23 | the upstream send op keeps its name `radioTaskPush` | dirty | best-guessed — keep; rename dreamed | 75% |
| F24 | where "which dirs are routes" is decided | clean | best-guessed — the record dao walks; shared scan dreamed | 70% |
| F25 | the shape of `domain.operations/radio/record/` | dirty | best-guessed — flat, inline settle fates; clusters dreamed | 70% |
| F26 | a transition guard for `RadioTaskRecordStatus` | clean | best-guessed — implied by the writes; guard dreamed | 75% |
| F27 | the recorder reuses two `radio/cli/` ops; the raw op keeps its own title check | dirty | best-guessed — reuse as they stand; lift dreamed with F23 | 70% |
| F28 | seven skipped brain suites, now that `rhachet-brains-xai` is installed | dirty | best-guessed — leave skipped, out of scope; port dreamed | 70% |
| F29 | cli input errors: json hint block + `BadRequestError` header, repo-wide | dirty | best-guessed — leave; printer + class migration dreamed | 75% |
| F30 | two gh suites skipped on `BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN` | clean | best-guessed — leave skipped, pre-extant; key to the foreman | 80% |
| F31 | a delivered push keeps the extant `key: value` render beside the recorder's `=` trees | clean | best-guessed — keep; shared with pull | 75% |
| F32 | transformer unit tests as data-driven caselists, not given/when/then | clean | ruled by review — both: each caselist row maps to a `given('[caseN]')` › `when` › `then` (reviewer re-raised; conceded) | 95% |
| F33 | extant blocked-push tests re-pointed from a throw to the held contract | dirty | settled by the wish's own words | 95% |
