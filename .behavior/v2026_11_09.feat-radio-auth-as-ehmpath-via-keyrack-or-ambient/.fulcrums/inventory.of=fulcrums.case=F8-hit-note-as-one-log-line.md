# F8 — the `as-ehmpath` hit source prints as one log line, not a row in the output tree

- **fork**: where the F7 source line lands — (a) a row woven into the push and drain output trees, carried on the auth result through RadioContext · (b) one `🔑 auth = as-ehmpath (via keyrack|ambient)` line, logged at the derive, beside the extant `🔓 unlocked keyrack` note
- **taken**: (b). the derive already logs one observability line on the locked path; this follows it. (a) widens RadioContext's auth union and every output renderer for one value's note
- **rework**: clean — move the line into the trees by a `via` field on the auth result; the derive keeps one return point
- **confidence**: 75%. a reader may prefer the line inside the tree, under `auth =`
- **where**: `src/domain.operations/radio/auth/getEhmpathTokenByVia.ts`
- **verdict**: reversed to (a), in the execution peer round. a `console.log` inside the derive is presentation in the domain grain, and a log line sits outside the tree a reader scans. the derive now returns `{ token, spot }`; `getGithubTokenByAuthArg` carries `ehmpathSpot` (non-null only for `as-ehmpath`, where two spots could pay); the push, drain, and pull renderers show `auth: as-ehmpath (via keyrack|ambient)` as a row in the tree
