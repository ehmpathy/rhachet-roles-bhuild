# F34 — the blackbox walks cover each spot outcome once per skill, not each --auth value

- **fork**: r10 asks for more walks through the real skill: `as-ehmpath-via-ambient` on a human box (push and pull), and an auth journey in the recorder suite. (a) one walk per value per skill · (b) walks cover each spot outcome the wrapper can show: ambient pays, keyrack pays, as-human sends, a miss holds. each value's own branch is proven at the cli contract
- **taken**: (b). a walk proves what only the `.sh` wrapper can: the stub gh reaches the real subprocess, the exit code, and both streams. push walks default-ehmpath, default-human, as-ehmpath fall-through, as-ehmpath keyrack-grant, and the as-ehmpath miss. pull walks the same, minus the keyrack grant. via-ambient on a human box takes the same wrapper path as the as-ehmpath miss (exit 2, a ConstraintError tree). its rows are snapped at the cli contract: `radioTaskPush` case10a, `radioTaskPull` case12. the recorder suite tests the record store, and auth reaches it through the same push dispatch
- **rework**: clean — one more `given` per walk file, each about 25 lines, test-only
- **confidence**: 80%. a reader who wants one walk per value per skill would choose (a); each walk costs ~5s and re-proves a wrapper path another walk already proved
- **where**: `blackbox/role=dispatcher/skill.radio.task.{push,pull}.via-ambient-stub.acceptance.test.ts`; `src/contract/cli/radioTaskPush.integration.test.ts` case10a; `radioTaskPull.integration.test.ts` case12
- **verdict**: —
