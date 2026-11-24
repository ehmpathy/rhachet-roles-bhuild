# F30 — the queue auth replay is proven at the cli contract, not by a third blackbox walk

- **fork**: r4 nitpick.1 asks for a blackbox acceptance journey of `queue set|drain` with an as-ehmpath value. (a) add a third stub-gh walk through the `.sh` wrapper for queue · (b) keep queue at the cli contract tier (`radioTaskQueue.integration` case23 set per value, case25 and case26 drain per box), since the push and pull blackbox walks already prove the one fact a blackbox run adds
- **taken**: (b). the queue integration runs `cliRadioTaskQueue`, the same entry the `.sh` wrapper calls, under a stub gh on `process.env.PATH`, and `shx` passes `process.env` explicitly (F10). the one property a `.sh` walk adds is that the stub reaches the skill's real subprocess, and `skill.radio.task.push.via-ambient-stub` and `skill.radio.task.pull.via-ambient-stub` prove it on the shared dispatch path. a queue walk would prove that fact a third time, at ~20s of acceptance time
- **rework**: clean — a new blackbox file, a copy of the push walk's scene with `queue set` and `queue drain` calls; no prod code moves
- **confidence**: 80%. a reviewer may hold that each skill owes its own blackbox journey, whatever it shares with its peers
- **where**: `blackbox/role=dispatcher/skill.radio.task.recorder.acceptance.test.ts` (the queue's blackbox file); `src/contract/cli/radioTaskQueue.integration.test.ts` case23, case25, case26
- **verdict**: —
