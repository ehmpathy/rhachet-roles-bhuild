# `F24` — do the 7 newly-unskipped suites stay unskipped?

- **raised** — 2026-09-28, at `5.3.verification`
- **rework** — **clean** (one line per file: re-add `describe.skip` and its note)
- **status** — best-guessed; **unruled**
- **confidence** — **70%**

---

## .the fork, stated fairly

the stone forbids skips outright. i found nine, investigated every one by a **real run**, and
removed seven of them. each of the seven needs a credential at run time.

| suite(s) | needs | present locally? | present in CI? |
|---|---|---|---|
| `review.behavior` ×4, `review.deliverable` | claude CLI credit | 🔴 **exhausted mid-session** | ❔ **i cannot see** |
| `daoRadioTaskViaGhIssues`, `radio.task.pull` | `BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN` | 🔴 absent | ✅ **passed directly in `.test.yml`** |

> **so: leave all seven unskipped and let a credential gap show as red — or restore the skips
> and keep the tier green at the cost of the coverage?**

---

## .what i took, and why — at the time

**taken: unskip all seven.**

1. 🔴 **every one of the seven reasons was measurably FALSE.** five named
   `ANTHROPIC_API_KEY`, when both skills shell the `claude` **binary**. two named *"once keyrack
   provides"* a token whose own workflow line records that **keyrack rejects it by design** — an
   unblock that can never arrive.
2. **to re-skip, i would owe a NEW true reason.** the only candidate is *"CI might lack
   credit"* — speculation i have not measured. to write it would repeat the exact defect i spent
   this stone to undo.
3. 🔴 **the unskip immediately surfaced three real, shipped defects** — an unfaithful fixture, an
   error branch unreachable under `set -e` in **both** review skills, and a test that discarded
   its subprocess's output. none was visible while the suites were skipped. that is the argument
   for the mandate, as evidence rather than principle.
4. **precedent, for the gh pair:** `radio.task.push.via-gh-issues` is **already** unskipped and
   already leans on a CI-supplied github credential. the two now match what their own peer does.
5. **a credential gap fails LOUD and precisely** — `BadRequestError: BHUILD_DEMO_REPO_ACCESS_
   GITHUB_TOKEN not set`. that is the behavior `rule.require.failfast` asks for, and the stone
   says *"credential difficulty = blocker, not deferral."*

---

## 🔴 .why my confidence is only 70%

i will not dress this up. the weak joint is narrow and specific:

> **i cannot read CI's secrets, so for the five brain suites i do not know whether the credential
> they need exists there at all.**

- the gh pair i am confident about (**~90%**) — the workflow names their token on the very job
- the five brain suites i am **not** (**~55%**) — `keyrack firewall --env test` hydrates whatever
  secrets exist, and a claude credential may simply not be among them

⚠️ and i must own a second point: **i exhausted the local claude credit myself**, partly with a
432-second run of a suite that was bound to fail. so the local red is in part my own fault, and i
should not read it as evidence about CI either way.

⇒ 70% is the honest number for the pair taken together. i state it rather than round it up.

---

## .what would settle it in one step

```sh
# push the branch and read the shard jobs; they either find the credential or they do not
gh run watch
```

🔴 **i cannot run it.** a push needs a commit, and `rule.forbid.commits-the-route-did-not-ask-for`
binds — no stone on this route asked for one, and the route is not finished. **that is the whole
reason this is a fulcrum rather than a measurement.**

---

## .the reversal, if the council rules the other way

**clean, and small.** per file, restore two lines:

```ts
// <the true reason — never the false one that was there before>
describe.skip('…', () => {
```

⚠️ the one item that must NOT come back is the old text. whichever way this rules, *"deprecated:
anthropic api key disabled"* and *"once keyrack provides"* are both disproven and may not be
restored.

---

## .where

- `blackbox/role=behaver/skill.review.behavior.acceptance.test.ts`
- `blackbox/role=behaver/skill.review.behavior.caseValidBehavior.acceptance.test.ts`
- `blackbox/role=behaver/skill.review.behavior.caseViolations.acceptance.test.ts`
- `blackbox/role=behaver/skill.review.behavior.caseWellFormed.acceptance.test.ts`
- `blackbox/role=behaver/skill.review.deliverable.acceptance.test.ts`
- `blackbox/role=dispatcher/skill.radio.task.pull.via-gh-issues.acceptance.test.ts`
- `src/access/daos/daoRadioTask/daoRadioTaskViaGhIssues.integration.test.ts`

## .the verdict

*(unruled)*

## .see also

- `review/self/for.5.3.verification._.has-zero-test-skips.md` — the nine-skip inventory in full
- `review/self/for.5.3.verification._.has-behavior-coverage.md` — the three defects the unskip found
- `F21` — the adjacent find that only `anthropic/claude/code/*` ships a brain repl
