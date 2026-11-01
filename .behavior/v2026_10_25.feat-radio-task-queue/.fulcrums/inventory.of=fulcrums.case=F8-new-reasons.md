# F8 — the reason vocabulary

- **the fork**: reuse `upstream:fault` for every non-auth fault · add `upstream:access`, `upstream:not-found`, `upstream:transient`
- **taken**: add all three. the fix differs per class (a grant or as-human for access; a re-aim or another auth for not-found; a wait for transient), `get` names the fix from the reason, and F1's halt scope keys on transient. the extant `upstream:401`, `upstream:rate-limit`, `upstream:auth`, `upstream:fault` stay
- **rework**: clean — one transformer, `asRadioUpstreamReason`
- **confidence**: 80%. low part: the transient detector is new; gh stderr for network and 5xx faults must be read as text (`asRadioUpstreamReason.ts` has no structured status). a miss reads as `upstream:fault`, which sets aside rather than halts — the safe direction
- **where**: `asRadioUpstreamReason.ts`, `asRadioErrorHint.ts`; the not-found path also needs `daoRadioTaskViaGhIssues.ts:134` to tell a repo-lookup error from an absent issue
- **verdict**: —
