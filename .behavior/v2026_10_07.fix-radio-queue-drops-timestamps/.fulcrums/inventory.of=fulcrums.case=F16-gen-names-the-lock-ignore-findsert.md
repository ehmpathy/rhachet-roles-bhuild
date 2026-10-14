# F16 — `gen` names the lock-ignore findsert

- **the fork** — a peer (arch-hazards-maintenance, i002 nitpick.3) asks to rename
  `genRadioLockDirIgnore` to `findsertRadioLockDirIgnore`. (a) keep `gen`; (b) rename to `findsert*`.
- **taken** — (a). `rule.require.get-set-gen-verbs` (mechanic) defines `gen` as exactly find-or-create
  (findsert), and forbids any operation prefix outside get/set/gen/del and as/is. `findsert` is the
  semantics the `gen` verb names, not a sanctioned prefix. the jsdoc already says "findsert".
- **rework** — clean. one file and its test.
- **confidence** — 95%.
- **where** — `src/domain.operations/radio/record/genRadioLockDirIgnore.ts`.
- **verdict** — unruled.
