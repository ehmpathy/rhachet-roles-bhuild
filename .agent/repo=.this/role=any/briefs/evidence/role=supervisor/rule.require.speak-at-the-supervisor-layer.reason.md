# rule.require.speak-at-the-supervisor-layer.reason

the dated record behind the rule. ref-level by construction — a reader reaches for this only
when they want to check the rule against what produced it.

## .the evidence that paved it — one session's own reports, 2026-08-09

the human caught the defect before the supervisor did. five verdicts, every one of them
substrate-layer:

| what was said | the layer it sat at | what it should have said |
|---|---|---|
| *"duct.poll reported `not a claude session`"* | substrate | *"the crew read as down, falsely"* |
| *"the pane is 10 columns"* | substrate | *"its term was resized on close, so the read lied"* |
| *"`window-size latest` picks up the transient sizes kitty emits"* | substrate | *"hidden crews report unreliably; fixed"* |
| *"i resized 12 detached fleet windows to 200x50"* | substrate | *"the fleet reads honestly again"* |
| *"two rows, zero sessions"* | substrate | *"a felled tree left a phantom crew"* |

⚠️ **not one of those five sentences is wrong.** every one answers a question about the
*instrument* when the human asked about the *work*. that is what makes the defect hard to
self-catch: accuracy is not the failure mode.

## ✅ .the once-open word — `camp`, settled 2026-09-06 by a look NEXT DOOR

this section read **"`camp` is not defined in this repo … it has no term cluster"** and concluded
the word was *"defined by nobody."* the first clause was true and the conclusion was false: the
canonical cluster sits in **`ahbode/infrastructure`**, and predates the section that declared it
absent.

> a **camp** is an elastic container of groves — one aws account that holds a variable set of
> grove work-boxes plus the shared services they need (vpc, nat egress, iam identity,
> cross-account reach).
>
> — `ahbode/infrastructure:.agent/…/domain.terms/term=camp._.choice._.md` ⚠️ **foreign path**

⇒ the cluster is **not owed here.** camp's home is the repo that owns the aws accounts and the
`git.grove.*` family, and a term whose home is another repo is cited there
(`rule.always.scope-onetime-lessons-to-the-behavior`).

### 🔴 the mechanism — a `partial audit`, and its cure is one flag

*"a full read of `.agent/`"* is an honest description of a **complete** read. the defect is the
scope it was complete over: this repo alone, chosen before the check that decides it. the verdict
then generalized to the world and carried no trace of what it excluded.

⚠️ **the tell is the phrase itself.** *"a full read of X"* followed by a claim about more than X
is the shape, and it reads as rigor — the word *full* is what makes it persuasive and what makes
it wrong. the cure costs one call:

```sh
rhx git.repo.get lines --repos 'ahbode/*' --words 'term=camp'
```

### 🔴 the guess it recorded would have SHIPPED a definition that violates the real one

the two data points below were recorded — correctly and in good faith — as *evidence, not a
definition*, and they still pointed the wrong way. both of their implications are **forbidden
synonyms** in the canonical term:

| the data point | what it implied | the canon's verdict |
|---|---|---|
| `ahbode.camp.AWS_PROFILE`, **`env: camp`** | camp is an **env**, peer to test/prep/prod | ⛔ forbidden — *"camp is not a deploy stage; it is a place clones work"* |
| the tree slug `…camp-grove` | camp is an **aws-account-shaped boundary** | ⛔ forbidden — *"the aws primitive camp is BUILT ON, not what camp IS"* |

⇒ so the discipline that produced this section — *evidence, held apart from a definition* — was
**correct and insufficient**. it kept the guess visible as a guess, and a later author with two
supports and a deadline would still have paved from it. **the guard that actually works is the
search next door, not the caution in the prose.**

⚠️ the nuance both halves flattened, and it survives: `env.camp` is real, and
`ahbode/infrastructure`'s own `term=env` lists `camp` among its values — while `term=camp` forbids
`env` as a synonym. both hold at once. an **env** answers *which account do i point at*; a **camp**
is the container of groves that one env happens to address. the data point was a true observation
about the keyrack manifest and a false inference about the concept.

## .the open inconsistency — `grove` has two spellings

`grove` is declared in the hierarchy brief (the machine a crew runs on, `local` |
`cloud://<name>`) and carries a known split: `--grove cloud://grove-1` as a flag vocabulary
versus `duct://grove-1/...` as a uri authority — two spellings for one concept. that
reconciliation is owed.

---

written by human + beaver 🦫
