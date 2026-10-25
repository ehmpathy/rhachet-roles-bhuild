# F2 — when a set-aside record retries

- **the fork**: (a) every drain retries it once · (b) only an explicit `queue drain --key K`, a `set`, or a re-push retries it (#511 caseC: "never on every push")
- **taken**: (a). fewer paths: no "set aside" state to persist and clear, no rule for when access "changes". a grant on the repo cures it at the next push with no human step. the cost is one failed gh call per set-aside record per drain
- **rework**: clean — (b) is a filter on the held line plus one flag on the record
- **confidence**: 70%. #511 asked for (b) explicitly; a fleet with many set-aside records would pay many failed calls per push
- **where**: `getAllRadioTaskRecordsHeld.ts`
- **verdict**: —
