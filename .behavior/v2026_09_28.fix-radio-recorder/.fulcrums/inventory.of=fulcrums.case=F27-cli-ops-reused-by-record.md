# F27 — the recorder reuses two `radio/cli/` ops, and the raw op keeps its own title check

- **the fork:** the recorder imports `getOneRadioContextFromCliArgs` and `asTaskDetailOutput` from
  `radio/cli/`, and the raw op `radioTaskPush` keeps its `BadRequestError` title/description check
  beside the cli's `ConstraintError` one (as shipped) · lift both ops to `radio/` with names that
  drop "cli" (e.g. `getOneRadioContextForChannel`), and delete the raw op's copy of the check
- **taken:** reuse as they stand. both ops predate this tree with callers + tests; the recorder
  replays a record's own cli-shaped args (`via`, `auth`, `into`), so the "cli args" name still
  reads true of what it consumes. the raw op's check is unreachable from the recorder (records are
  validated before transcribe) yet still guards the raw op's other entry
- **rework:** dirty — the lift renames two extant ops and every import of them; the check removal
  changes the raw op's contract. both ride with F23 (the raw op's rename)
- **confidence:** 70%. `rule.prefer.most-common-denominator` does favor the lift once two peer
  dirs reuse an op
- **where:** i007 r011 nitpicks 1 and 2; dream
  `dreams/2026_09_29.lift-radio-cli-ops-the-recorder-reuses.dream.md`
- **verdict:** —
