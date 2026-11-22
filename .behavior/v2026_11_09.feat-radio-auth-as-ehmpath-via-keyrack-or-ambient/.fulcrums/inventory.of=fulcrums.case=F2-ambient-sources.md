# F2 — the ambient token and the ambient identity

- **fork**: the wish says "the ambient git config". git config holds no token. (a) token from `gh auth token`, identity from `git config user.email` · (b) token and identity both from gh (`gh api user`) · (c) `GITHUB_TOKEN` env
- **taken**: (a). the commander's words gate the ambient spot on its "user email", which is a git config field; gh's `/user` email is often null. the token must come from somewhere a human logs in, and `as-human` already leans on the gh login
- **rework**: clean — one communicator reads both
- **confidence**: 80%. awkward: the gh login and the git config email can disagree (a box with an ehmpath email and a human's gh login). noted in the vision's awkward section
- **where**: new ambient communicator under `radio/auth/`
- **verdict**: approved by the director with the vision, 2026-11-14; clean rework, held as taken
