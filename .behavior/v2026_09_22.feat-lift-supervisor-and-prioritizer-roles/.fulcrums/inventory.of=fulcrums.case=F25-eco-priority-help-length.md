# `F25` — is a 546-line `--help` a defect to fix, or the surface the wisher wanted?

- **raised** — 2026-09-28, at `5.3.verification`
- **rework** — **dirty** (a published flag + a snapshot + 500 lines of authored prose)
- **status** — best-guessed; **unruled**
- **confidence** — **60%**

---

## .the fork, stated fairly

a frictionless walk of the two lifted roles' primary surfaces measured this:

| surface | `--help` lines | `usage:` at | lines AFTER usage |
|---|---|---|---|
| `rhx git.crew.list` | **23** | line 15 | **8** |
| `rhx eco.priority` | **545** | line 41 | 🔴 **504** |

⚠️ the last column is the measure that matters, and it is the one i got wrong first. **both**
surfaces put `.what` and `.why` ahead of `usage:` — that order is the house convention, and it is
not the defect. what parts them is what comes **after**: 8 lines a reader can take in, versus 504
a reader must scroll past.

🔴 **re-measured exactly on 2026-09-28**, after i caught myself twice on this same table. the
figures above are now counted, never estimated:

```sh
rhx eco.priority --help | rhx teesafe --into .log/measure.eco.help.txt
wc -l .log/measure.eco.help.txt                      # 545
head -n 52 .log/measure.eco.help.txt | tail -n 20    # `usage:` is the 9th row ⇒ line 41
```

⇒ my first pass wrote **546 / ~43 / ~503** from a `wc -l` over a stream that carried the skill's
own banner. the shape of the defect survived; two of its three numbers did not. **a tilde in a
defect report is a measurement i did not take.**

> **so: split it into a short head + a `--full` body — or leave it, because the length is the
> point?**

---

## .what i took, and why — at the time

**taken: leave it. catch a dream, and raise this fulcrum.**

1. **the SAFE/CLEAN test says defer.** SAFE yes (help text only); **CLEAN no** — the help is
   snapshotted, a `--full` flag is a **published contract change** on a package this very PR
   ships, and the body is 500 lines of deliberately authored argument
   (`rule.always.fix-forward-under-scouts-honor`).
2. 🔴 **the length may be load-central rather than accidental.** several `.why` blocks exist to
   stop a clone from an invented `sev`/`urg` (`rule.forbid.fabricated-opines`), and one states
   outright that a sentence in `--help` is the **only** way a human can verify the
   csv-is-truth invariant by hand. a shorter help could weaken a guard.
3. **the role is NEW.** its vocabulary — quant vs opine, bigrock/altrock/subrock, the fibonacci
   ladder — has no prior art in a consumer repo. the help doubles as the first lesson, on
   purpose.

---

## 🔴 .why my confidence is only 60%

the argument against my own call is strong, and i will not soften it:

> **`rule.prefer.defaults-match-common-case` is about the COMMON case, and after day one the
> common case is recall.** a repeat user who wants a flag name pays a 546-line scroll, every
> time, forever. the first lesson is read **once**.

and the peer surface settles that the bar is reachable: `git.crew.list` carries `.what`, `.why`,
`usage`, and `guarantee` in 23 lines and reads in one pass. so *"the role is new"* explains the
**content**, never the **shape** — a `--full` rung would keep every word and fix the scroll.

⚠️ i am also aware my incentive points this way: a defer costs me a dream file, and a fix costs
me a contract change plus a resnap on the day i want to close a verification stone. **that is
exactly the pressure a fulcrum exists to expose**, so it is on record here rather than in my own
head.

⇒ 60% is the honest number. i would not defend this call at 93%.

---

## .what would settle it in one step

ask the wisher one question:

> *"is `eco.priority --help` long on purpose — the role's first lesson — or would you take a
> short head with `--help --full` behind it?"*

🔴 **only the wisher can answer.** it is a question about authorial intent on prose they wrote,
and `rule.forbid.fabricated-opines` is the adjacent lesson: a clone does not get to decide what
a human meant.

---

## .the reversal, if the council rules the other way

**mid-cost, and fully reversible.** the long body is kept verbatim behind `--full`; the head is
new prose. the ripple:

| touched | cost |
|---|---|
| `eco.priority.sh` — a `--full` branch | small |
| the acceptance snapshot | one resnap, **read before blessed** |
| the readme's `--help` reference | one line |

⚠️ what must NOT happen under either verdict: a **trim** of the long body. every `.why` in it is
cited by a brief. this is a split, or it is no change at all.

---

## .where

- `src/domain.roles/prioritizer/skills/eco.priority.sh`
- `blackbox/role=prioritizer/__snapshots__/skill.eco.priority.acceptance.test.ts.snap`
- `.dream/v2026_09_28.split-eco-priority-help-into-a-scannable-head-and-a-full-body.md`

## .the verdict

*(unruled)*

## .see also

- `review/self/for.5.3.verification._.has-critical-paths-frictionless.md` — the walk that found it
- `def.ergonomic` — *output is scannable*, the one rubric line this fails
- `rule.prefer.defaults-match-common-case` (ergonomist) — the rule that argues against my call
