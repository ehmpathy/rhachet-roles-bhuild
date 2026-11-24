# F33 — the grovework red found on this branch is fixed in this route, not split out

- **fork**: `grovework.integration.test.ts` went red on this branch at 5.1 (an ssh config login that assumed `camper`). r12 nitpick.3 asks whether it belongs in a radio auth change. (a) revert it and dispatch it as its own branch · (b) keep the fix-at-cause, with its clamp (`SSHCFG_LOCAL_LOGIN_NOT_CAMPER`, t7)
- **taken**: (b). the full integration suite gates this route's verification; a red left in place would block 5.3 or force a skip. the fix is small, safe, and test-only, so `rule.always.fix-forward-under-scouts-honor` and `rule.forbid.workarounds` both point at the fix now
- **rework**: clean — revert the fixture stanza and t7, and push them as a separate branch
- **confidence**: 80%. a reviewer may prefer one concern per pr; the change touches no radio code and no prod code
- **where**: `src/domain.roles/supervisor/skills/work/grovework.integration.test.ts` (fixtures + t7)
- **verdict**: —
