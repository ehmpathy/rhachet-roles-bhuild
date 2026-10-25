# F12 — concerns from the 5.1 peer review held as-is, with evidence

- **the fork**: (a) hold each concern below as-is, with the cited evidence · (b) change the code to satisfy it
- **taken**: (a), per concern:

| reviewer · concern | held because |
|---|---|
| arch-opport-decomposition · blocker.1 — `getDispatcherRole.ts` exports `ROLE_DISPATCHER` | the repo-wide role convention: all six roles pair `get<X>Role.ts` with `ROLE_<X>` (`getRoleRegistry.ts:3-8`). this diff touched one hook line in the file. a rename of one role breaks the convention; a rename of all six is a repo-wide change outside this wish |
| arch-opport-decomposition · nitpick.1–4; mech-failhides · nitpick.3 — `asLazyCli` inline, `load*` names, `asCli` name, the `✋` heuristic | pre-extant in `src/contract/cli/index.ts`; this diff added one loader and one thunk in the extant shape. a rework of the cli entry shape is outside the wish |
| mech-decode-friction · nitpick.1 — the async IIFE in the push orchestrator | pre-extant in `radioTaskPush.ts`; this diff did not change it |
| arch-hazards-maintenance · nitpick.3; arch-hazards-behavior · nitpick.3 — the onStop hook has no `.catch` | claude blocks a stop on exit 2 alone. an unhandled rejection exits 1, which claude shows and does not treat as a block, so the stop is never blocked; a `.catch` that exits 0 would hide a broken install (`rule.forbid.failhide`). claude runs hooks from the project root, which is the cwd the radio reads |
| arch-hazards-behavior · nitpick.2 — a re-push of a held record with a new body is a no-op | misread. `asRadioTaskRecordFromPush.ts:45` spreads the push's own fields (`...input.push`, description included) into the record, so a held record takes the new body; `isRadioTaskRecordRequeuedByPush` decides only whether the fate resets |
| ergo-friction-hazards · nitpick.1 — the key mask assumes 16 hex chars | the record key is a 16-hex digest by construction; the mask tracks that one format, and a format change fails the snapshot loud rather than silently |
| behavior-intent-coverage · nitpick.4 — `[case6]` collides with vision case=6 | `[caseN]` is the file's own ordinal across all its givens; the title names the vision cases it demos (`case=2, case=4, case=5`), so the map reads off the title |
| i002 · arch-smell-scopeleaks · blocker.1 — `setRadioTaskRecordUpstream` imports the permission op | pre-extant import (`git diff origin/main` adds no such line). the radio.uses gate is the wish's own bound, and each record meets its own target's gate (X1), so the record op calls the gate as it calls auth. a relocate of `radio/permission` is a structural change outside the wish |
| i002 · arch-smell-scopeleaks · nitpick.1 — `getOneBranchBindForRecord` binds to the behavior bind shape | pre-extant in `radioTaskPush.ts`; the contract layer is the sanctioned stitch across domains, as the reviewer notes |
| i002 · arch-hazards-behavior · blocker.1 — read-check-write window in `setRecord` | pre-extant (`setRecord` is untouched by this diff); its `.note` names the residual window as microseconds, not the length of a send. a versioned upsert is a dao contract change outside the wish |
| i002 · arch-hazards-behavior · nitpick.1 — a delivered re-push with no `--description` | pre-extant line (this diff added only the DROPPED re-queue); out of the wish |
| i002 · arch-hazards-behavior · nitpick.2; mech-failhides · nitpick.1 — the push drain's try/catch note | pre-extant in `radioTaskPush.ts` (this diff changed only one help line there) |
| i002 · arch-hazards-maintenance · nitpick.2 — an upstream fault exits 2 | pre-extant push contract: a held push exits 2 whatever held it ("a shut gate or an upstream fault holds it QUEUED, exit 2"), since the caller's next move is the fix |
| i002 · ergo-friction-hazards · nitpick.2 — a shut-gate drain's still-held rows lack the key | a gated row prints its one fix (`lift it (human): …`), which takes no key; a set-aside row prints `amend it` / `or drop it` with its key |

- **rework**: clean — each is a local edit if a reviewer or the wisher prefers (b)
- **confidence**: 80%
- **where**: 5.1 peer review i001
- **verdict**: —
