# F11 — `ecowork.sh`'s self-arm, and the scope of `LIBS_WORK`

| field | value |
|---|---|
| case | F11 |
| title | `ecowork.sh` arms `set -uo pipefail` itself, against the family contract |
| rework | **clean** |
| status | **disputed** — the peer's concern is declined, with the reason written at both sites |
| confidence | **95%** |
| where | `src/domain.roles/prioritizer/skills/work/ecowork.sh:140` · `src/domain.roles/workPrelude.integration.test.ts` (`LIBS_WORK`) |
| raised by | peer `enroll-impl-arch-defects`, i004 r011, §1.4 |

## .the fork, stated fairly

the four work libs of the supervisor seat (`crewwork` · `ductwork` · `termwork` · `syncwork`) arm
no shell options of their own. each trusts its entrypoint to arm first, and
`workPrelude.integration.test.ts` clamps exactly that contract over the four.

`ecowork.sh` — the prioritizer seat's work lib — breaks the pattern. it arms `set -uo pipefail`
at `:140`, in its own body.

| branch | the move |
|---|---|
| **A** — the peer's proposal | delete `:140`, add `ecowork` to `LIBS_WORK`, so one contract covers all five |
| **B** — what was taken | keep the arm, keep `LIBS_WORK` at four, and write down WHY at both sites |

## .taken, and why at the time

**branch B.** the arm is load-critical, so branch A would cause the harm it means to prevent.

the peer's premise was that `ecowork.sh`'s callers arm first, as the other four libs' callers do.
a caller census refutes it:

| the 4 supervisor work libs | this lib |
|---|---|
| a source only from entrypoints that arm first | a **bare** source, 21 times |

exactly **one** production caller sources this file — `eco.priority.sh:550`, which arms at `:548`,
two lines above. every **other** site is of the shape:

```sh
bash -c "source .../ecowork.sh; <verb> ..."
```

and `bash -c` arms no options of its own. so a delete of `:140` leaves 21 call sites with
`set -u` and `pipefail` both off — which is the exact class of quiet defect the family contract
exists to forbid.

⚠️ **and the peer read it the other way.** it named `eco.seed.sh:140` as a second armed caller.
that file does not source `ecowork.sh` at all; its own `:140` is its arm as an **entrypoint**, and
the shared line number is a coincidence. ⇒ two cited line numbers that agree is not evidence; the
executable line is (`rule.always.trust-but-verify`).

### the 21 bare sites

all under `src/domain.roles/prioritizer/skills/work/.test/`, each of the
`bash -c "source …; <verb>"` shape:

```
ecowork.integration.test.ts : 57, 71, 92, 118, 143, 167, 191, 214, 238, 262,
                              287, 311, 334, 358, 381, 405, 428, 452, 476, 499, 523
```

## .rework, and why it is clean

**clean.** the reverse is a one-line delete plus a one-word add to an array literal. no caller
hardens against the arm, and no later work is built upon it — the arm is invisible to every
caller by design (it changes only the shell's own option state).

⇒ so a council that prefers one uniform contract over five libs can have it, at the price of a
prelude in each of the 21 `bash -c` strings. that is a real cost and a legible one.

## .confidence, and why it is not 100%

**95%.** the 5% is named rather than hidden: the 21 sites were **enumerated by grep**, never
verified by a run. `ecowork.integration.test.ts` is held out of the required gate under `F9`
(`jest.integration.config.ts:40`), so there is no paved route to execute them and watch a
delete go red.

the cheap check, for whoever wants the last 5%: comment out `:140`, run the ecowork suite
directly, and watch the unbound-variable class surface. that is a one-command probe once `F9`
settles and the hold-out lifts.

## .the verdict, once ruled

_(unset)_

---

itemized by human + beaver 🦫
