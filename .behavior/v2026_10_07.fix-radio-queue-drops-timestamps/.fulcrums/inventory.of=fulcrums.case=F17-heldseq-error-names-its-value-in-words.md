# F17 — the heldSeq error names its value in words, with no metadata object

- **the fork** — peers (mech-failhides i002/i003 nitpick.1, arch-hazards-maintenance i004 nitpick.1)
  ask `asRecordFromFileJson` to throw `new MalfunctionError(message, { heldSeq })`. (a) add the
  metadata object; (b) name the value in the message, and let the wrapper name the path.
- **taken** — (b). measured: with `{ heldSeq: fields.heldSeq ?? null }` added, the case7 snapshot of
  the message a human reads gained a three-line json block inside the wrapper's `why:` line:

  ```
     ├─ why:   💥 MalfunctionError: the record lacks a positive integer heldSeq, its place in line (found: "first")
  + {
  +   "heldSeq": "first"
  + }
  ```

  helpful-errors prints metadata into the message. the value is already named in words
  (`found: "first"`), and the wrapper `withRecordMalfunction` supplies the path (`where:`) and keeps
  the cause chain. the metadata adds no fact, only a broken tree. reverted; the throw carries an
  inline note that says why.
- **rework** — clean. one argument.
- **confidence** — 85%. low part: a log sink that reads structured metadata, not the message,
  would see no `heldSeq` field; none reads this error today.
- **where** — `src/access/daos/daoRadioTaskRecord/index.ts` `asRecordFromFileJson`; snapshot in
  `index.integration.test.ts` case7.
- **verdict** — unruled.
