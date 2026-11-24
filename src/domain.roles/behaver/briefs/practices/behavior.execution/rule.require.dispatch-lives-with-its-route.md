# rule.require.dispatch-lives-with-its-route

## .what

an authored dispatch — the source `.[task].md` text you push over the radio — lives in the route
that produced it, never in a briefs dir:

| when | the home |
|---|---|
| a route is bound | `$route/.dispatch/dispatch.$target.$slug.[task].md` |
| no route is bound | `.behavior/.dispatch/dispatch.$target.$slug.[task].md` |
| ever | 🔴 never under `.agent/**/briefs/` |

the second row mirrors where `radio.task.push` records a push with no bound route
(`.behavior/.radio/`).

the name may also take the dated form a route already uses, `v$date.into=$target.$slug.md`. the
home is what this rule grades; the lane matches both names, so a leak in either shape is caught.

## .why

- **a dispatch is ephemeral and route-scoped.** its durable record is the github issue the push
  created; the local file is only the text you sent. it is born, held, and cleaned up with the route
  that produced it, beside that route's `.fulcrums/`, `review/`, and `.route/`
- **briefs boot into every session.** a dispatch filed there costs every future session its tokens,
  and drifts from the route that motivated it
- **a bad precedent copies itself.** the leak this rule exists for was one dispatch in a briefs dir,
  then two more by sessions that copied it

## .how

1. author the task text
2. write it to the home above — `rhx teesafe --into '$route/.dispatch/dispatch.<target>.<slug>.[task].md'`
3. push it: `rhx radio.task.push --via gh.issues --into <owner/repo> --title '...' --description @stdin`
4. if the dispatch carries a durable lesson, distill that lesson separately into a real brief. the
   dispatch itself stays route-local

## .the fix for a leak

a dispatch this branch added under a briefs dir — move it:

```sh
rhx mvsafe --from '<path under briefs>' --into '$route/.dispatch/<name>'
```

a dispatch from a closed route that this branch did not add is an **orphan**. flag it in the yield,
name the file, and drive on — no lever you hold can attribute it.

## .enforcement

the lane also reads the stone's own `5.1.execution.*.yield.md`, so its scope is never empty. the
yield is no dispatch: grade it only for an orphan flag, and a yield beside zero leaked dispatches
is clean.

- a dispatch added on this branch under `.agent/**/briefs/` = **blocker**
- an orphan dispatch under a briefs dir, unadded by this branch = **flag**, never a blocker
- a durable lesson left only inside a dispatch = **nitpick**

## .see also

- `radio.task.push` (dispatcher) — the push this file is the source of
- `rule.always.catch-dreams-for-followups` (bhrain/driver) — the route-local trail a dream also keeps
