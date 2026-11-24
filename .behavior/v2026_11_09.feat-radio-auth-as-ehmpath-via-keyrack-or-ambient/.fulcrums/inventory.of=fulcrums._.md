# inventory of fulcrums

| case | title | rework | status | confidence |
|---|---|---|---|---|
| F1 | what counts as an "ehmpath email" | clean | approved (director, clean) | 70% |
| F2 | the ambient token comes from `gh auth token`; the identity from `git config user.email` | clean | approved (director, clean) | 80% |
| F3 | the default (no `--auth`) stays `as-robot:via-keyrack(ehmpath)` | clean | superseded (director, seed S1): ambient-first | 60% |
| F4 | `as-ehmpath` falls to ambient on any keyrack non-grant, not only `absent` | clean | approved (director, clean) | 80% |
| F5 | the three new values replay from a stored record | clean | approved (director, clean) | 85% |
| F6 | the bhuild copy of the ehmpath identity roster, not an import from the peer | clean | approved (director, clean) | 75% |
| F7 | an `as-ehmpath` hit adds an `auth = … (via …)` line | clean | approved (director, clean); widened by F26 | 70% |
| F8 | the hit source prints as one log line, not a row in the output tree | clean | reversed (peer round): a row in the tree | 75% |
| F9 | the `--auth` help values render as child branches, not indented text | clean | best-guessed | 90% |
| F10 | `shx` passes `env: process.env` explicitly | clean | best-guessed | 85% |
| F11 | in a test env, the ambient read refuses unless `RADIO_GH_STUB=1` | clean | best-guessed | 80% |
| F12 | the as-ehmpath keyrack read pins `org: ehmpathy`; the via-keyrack default does not | clean | best-guessed; each caller now names its org as a parameter | 80% |
| F13 | the uncommitted `.husky/` gate edits are left to their owner, not revised or reverted | clean | best-guessed | 85% |
| F14 | `withAmbientStub` sets its overlay on `process.env` in place, restored in finally | clean | best-guessed | 85% |
| F15 | the new auth operations follow the auth folder's extant name and input conventions | clean | best-guessed | 80% |
| F16 | under the ambient-first default, an ehmpath box with no gh login falls to keyrack | clean | best-guessed | 80% |
| F17 | a box with no git email, and any test env with no stub gh, keep the keyrack default | clean | best-guessed | 75% |
| F18 | an ambient read fault is a ConstraintError, so the drain holds it rather than abort | clean | best-guessed | 85% |
| F19 | a record with no `--auth` replays box-relative, named; its identity is not pinned | clean | best-guessed | 75% |
| F20 | the default on a human box checks the gh login before it sends | clean | best-guessed | 80% |
| F21 | the git email stays the identity bar; the gh-login match stays a follow-up | clean | best-guessed | 70% |
| F22 | the structural radio auth refactors are dreams, not this stone | dirty (size) | best-guessed | 70% |
| F23 | the wish text stays as said; seed S1 carries the default's change | clean | best-guessed | 80% |
| F24 | an ambient read fault is the ambient spot's miss; the walk goes on | clean | best-guessed; refines F18 | 85% |
| F25 | the gh probe reads the stored login only, never an env token | clean | best-guessed | 90% |
| F26 | every value whose source can vary names it; the human line names the email | clean | best-guessed | 80% |
| F27 | the tree commits when the route asks, never to make a review durable | clean | best-guessed | 85% |
| F28 | an env-token box with a human email names the env token in its miss; no keyrack fall | clean | best-guessed | 80% |
| F29 | the pre-extant skips stay until a token is provisioned; this stone does not unskip them | dirty (a human fills the token) | best-guessed | 75% |
| F30 | the queue auth replay is proven at the cli contract, not by a third blackbox walk | clean | best-guessed; disputed to council (r4 nitpick.1) | 80% |
| F31 | the transformer unit suites stay data-driven caselists, not given/when/then | clean | best-guessed; disputed to council (r7 nitpick.1) | 85% |
| F32 | the spot-allow invariants move to the derive suite, not a unit file of their own | clean | best-guessed; disputed to council (r12 nitpick.2) | 85% |
| F33 | the grovework red found on this branch is fixed in this route, not split out | clean | best-guessed; disputed to council (r12 nitpick.3) | 80% |
| F34 | the blackbox walks cover each spot outcome once per skill, not each --auth value | clean | best-guessed; disputed to council (r10) | 80% |
| F35 | the radio output shapes this route did not author go to a dream, not a reshape here | clean | best-guessed; disputed to council (r11) | 80% |
| F36 | an as-ehmpath miss names the robot fix first, even on a human box | clean | best-guessed; disputed to council (r11 nitpick.3) | 75% |
| F37 | the pull list header sets its auth after a `·`, not inside parens | clean | best-guessed; disputed to council (r12 i004 blocker.5) | 80% |
