# F3 — which auth a held record replays with

- **the fork**: (a) its own stored auth (today, C22) · (b) the auth of the push that carries the drain (#511 caseE) · (c) its own, plus an explicit `drain --auth` override and `set --auth` amend
- **taken**: (c). (b) makes one `--auth as-human` push send every other held record — some another clone's, in another route — as the human, with no ask. that is a github write the human did not choose per record. (c) gives the same cure with one deliberate verb
- **rework**: clean — the auth a send uses is one argument in `getOneRadioContextForRecord`
- **confidence**: 65%. it departs from #511's stated want; the wisher may prefer (b)
- **where**: `getOneRadioContextForRecord.ts`, `setRadioTaskRecordsDrainedByPush.ts`
- **verdict**: —
