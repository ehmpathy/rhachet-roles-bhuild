# F6 — the fate of `radio.task.held`

- **the fork**: (a) keep it one release as an alias of `queue get`, with a one-line notice · (b) remove it now
- **taken**: (a), as #604's acceptance asks. the stop hook moves to `queue get --when hook.onStop` at once, so the alias serves only hand calls and old briefs
- **rework**: clean
- **confidence**: 85%
- **where**: `radio.task.held.sh`, `getDispatcherRole.ts` (the stop hook command)
- **verdict**: —
