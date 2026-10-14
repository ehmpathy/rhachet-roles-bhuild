# F15 — the read sheds legacy keys via `_`-prefixed destructure binds

- **the fork** — a peer (arch-hazards-maintenance, i002 nitpick.1) calls `heldAt: _heldAt` noise.
  (a) keep the `_` binds; (b) `void heldAt`; (c) `omit(json, [...])` from type-fns.
- **taken** — (a). the `_` prefix is biome's sanctioned mark for an intentional unused bind; (b)
  adds two statements whose only job is to silence a linter; (c) adds `type-fns` as a new direct
  dependency (it is not one today) for a two-key shed.
- **rework** — clean. one destructure.
- **confidence** — 90%.
- **where** — `src/access/daos/daoRadioTaskRecord/index.ts` `asRecordFromFileJson`.
- **verdict** — unruled.
