# inventory of fulcrums

| case | title | rework | status | confidence |
|---|---|---|---|---|
| F1 | what counts as an "ehmpath email" | clean | approved (director, clean) | 70% |
| F2 | the ambient token comes from `gh auth token`; the identity from `git config user.email` | clean | approved (director, clean) | 80% |
| F3 | the default (no `--auth`) stays `as-robot:via-keyrack(ehmpath)` | clean | approved (director, clean) | 60% |
| F4 | `as-ehmpath` falls to ambient on any keyrack non-grant, not only `absent` | clean | approved (director, clean) | 80% |
| F5 | the three new values replay from a stored record | clean | approved (director, clean) | 85% |
| F6 | the bhuild copy of the ehmpath identity roster, not an import from the peer | clean | approved (director, clean) | 75% |
| F7 | an `as-ehmpath` hit adds an `auth = … (via …)` line | clean | approved (director, clean) | 70% |
| F8 | the hit source prints as one log line, not a row in the output tree | clean | reversed (peer round): a row in the tree | 75% |
| F9 | the `--auth` help values render as child branches, not indented text | clean | best-guessed | 90% |
| F10 | `shx` passes `env: process.env` explicitly | clean | best-guessed | 85% |
| F11 | in a test env, the ambient read refuses unless `RADIO_GH_STUB=1` | clean | best-guessed | 80% |
| F12 | the as-ehmpath keyrack read pins `org: ehmpathy`; the via-keyrack default does not | clean | best-guessed | 80% |
| F13 | the uncommitted `.husky/` gate edits are left to their owner, not revised or reverted | clean | best-guessed | 85% |
| F14 | `withAmbientStub` sets its overlay on `process.env` in place, restored in finally | clean | best-guessed | 85% |
| F15 | the new auth operations follow the auth folder's extant name and input conventions | clean | best-guessed | 80% |
| F16 | under the ambient-first default, an ehmpath box with no gh login falls to keyrack | clean | best-guessed | 80% |
| F17 | a box with no git email, and any test env with no stub gh, keep the keyrack default | clean | best-guessed | 75% |
