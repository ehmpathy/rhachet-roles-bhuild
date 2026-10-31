# F10 — what `queue get` shows as a record's last fault

- **the fork**: (a) the reason code the record already holds (`state: set aside (upstream:access)`) · (b) gh's verbatim stderr, kept in a new record field and printed as a `why:` line (the case=5 sketch)
- **taken**: (a). the record is a tracked file; raw gh stderr can carry a clock value (the repo's timestamp gate halts it, `rule.forbid.timestamps-in-tracked-files`), a request id, or a token-shaped string, and it churns the diff on every retry. the reason code is stable, names the class, and keys the fix lines. the verbatim text still prints in the drain output at the moment of the fault
- **rework**: clean — one optional record field plus one child line in `asRadioHeldOutput`
- **confidence**: 75% — the wish says "its last fault", which the class satisfies; a human who wants the exact gh words may prefer (b)
- **where**: `asRadioHeldOutput.ts` (`asRadioTaskRecordStateLine`), `asRadioTaskRecordState.ts`; found in 5.1 self review `behavior-declaration-coverage`
- **verdict**: —
