# F24 — an ambient read fault is the ambient spot's miss; the walk goes on

- **fork**: the ambient spot's read faults (gh exits 127, git exits 3, a read cut off). (a) the fault ends the derive, as F18 left it · (b) the spot returns a miss row that names the read, its exit, and the fix, and the walk tries its next spot
- **taken**: (b). under the default an ehmpath box reads ambient first; with (a), a broken gh blocked a granted keyrack token that `as-ehmpath` (keyrack first) would have sent. a fault on the last spot still surfaces, inside the miss tree, with its exit and its fix, as a ConstraintError the drain holds (F18 stands for that). the test guard's refusal is no fault, and still rethrows
- **rework**: clean — one catch in `getEhmpathTokenFromAmbient`; the throw class (`AmbientReadFaultError`) is what the catch keys on
- **confidence**: 85%. a reader may hold a broken gh is worth a loud stop even when keyrack pays; the walk's whole contract is "try each spot", and the hit names keyrack as the spot that paid
- **where**: `src/domain.operations/radio/auth/getEhmpathTokenFromAmbient.ts`, `AmbientReadFaultError.ts`; unit `getGithubTokenByAuthArg.ambientfirst.test.ts` case6, `getGithubTokenByAuthArg.asehmpath.test.ts` case9, case10
- **verdict**: —
