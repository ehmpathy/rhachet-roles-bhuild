# F7: record keys in snapshots need no mask; they are stable hashes

- **raised by:** peer ergo-acceptance-journey-coverage, blocker.1 ("the record key is a generated uuid")
- **the fork:**
  - snap record keys live;
  - or mask them to `<id>`.
- **taken:** snap them live. the premise does not hold:
  - `asRadioTaskRecordKey.ts` derives the key as
    `createHash('sha256').update(identity).digest('hex').slice(0, 16)`.
  - the identity is `create\n<repo>\n<title>` or `update\n<repo>\n<exid>\n<status>`.
  - so the same push yields the same key on every run. no randomness and no clock enter it.
  - the flag is spelled `--uuid` for history, but its value is this hash.
  - "since opened" in `asRadioHeldOutput` is a fixed phrase, not an elapsed duration.
  - extant radio snapshots already hold live keys and stay green across runs (e.g.
    `asRadioHeldOutput.test.ts.snap`).
- **what changed in the blueprint anyway:** the false phrase "the uuid" is gone. the blueprint now
  states the key is a stable sha256, in the case table and in "output channels".
- **rework:** clean. a mask is one replace in the test's snap helper.
- **confidence: 95%**
- **where:** the play acceptance test; the unit snaps of `asRadioQueueFixLines` and `asRadioHeldOutput`
- **verdict:** open, for the council at the close
