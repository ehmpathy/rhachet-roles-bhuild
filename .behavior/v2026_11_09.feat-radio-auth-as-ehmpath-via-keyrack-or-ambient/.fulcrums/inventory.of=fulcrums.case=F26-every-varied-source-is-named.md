# F26 — every value whose source can vary names it; the human line names the email

- **fork**: F7 named the spot only for `as-ehmpath`, the one value with two spots. (a) keep that · (b) return the source from every `as-ehmpath*` value and the default, and name the email on a default as-human send
- **taken**: (b). the derive always knows the spot, so it always returns it; the shown line is one transformer's call. the email on the as-human line is what makes a misread repo-local email visible on the send itself. `as-human` and `as-robot:*` name one fixed source and stay silent
- **rework**: clean — `AuthSource` gains `email` on its as-human branch; `asAuthSourceShown` renders it
- **confidence**: 80%. the email is the reader's own git config, shown to the reader; a log that leaves the box carries it too, and that is the point
- **where**: `src/domain.operations/radio/auth/AuthSource.ts`, `asAuthSourceShown.ts`, `getGithubTokenByAuthArg.ts`; CLI snaps push case10d/e, pull case8/9, queue case24
- **verdict**: —
