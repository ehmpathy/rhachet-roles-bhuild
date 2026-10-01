# F20 — where the gh.issues positive path is proven

- **the fork:** prove a real gh.issues delivery on this host (needs `EHMPATH_BEAVER_GITHUB_TOKEN`,
  absent in this keyrack) · prove it in cicd, where the credential lives
- **taken:** cicd. the gh.issues acceptance suite (cases 1–6) and the `genAuthFromKeyrack` /
  `getGithubTokenByAuthArg` integration run on the release pipeline, which holds the token; a
  red run there blocks the merge. locally, the credential-free cases (case7 auth-fail held, case9
  help) and the whole os.fileops suite (same `radioTaskPush` findsert / upsert beneath) pass
- **rework:** clean — none; cicd is the extant gate
- **confidence:** 100% — ruled by the wisher
- **where:** peer r008 blocker.1, r009 blocker.1; `blocker/5.1.execution.from_vision.md`
- **verdict:** ruled by wisher, 2026-09-29 — "just let that auth part be tested on cicd"
