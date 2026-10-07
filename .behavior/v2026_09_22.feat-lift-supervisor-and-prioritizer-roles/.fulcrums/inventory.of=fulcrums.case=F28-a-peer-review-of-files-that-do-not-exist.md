# `F28` — a peer lane graded two files that are NOT IN THIS REPO. do I dispute, or concede to be safe?

- **raised** — 2026-09-28, at `5.3.verification`
- **rework** — **clean** (a disposition on two concerns; two commands to reverse)
- **status** — best-guessed; **unruled**
- **confidence** — **97%**

---

## .the fork, stated fairly

the `behavior-experience-coverage` lane (i006 · r005) returned `0 blockers / 2 nitpicks`, both
well-formed, both citing a rule this repo holds, each with a code snippet.

🔴 **and both cite files that do not exist.**

| the lane cited | measured |
|---|---|
| `blackbox/role=behaver/experience.guard.journey.acceptance.test.ts` | 🔴 **no such file** — `globsafe` → 0 |
| `blackbox/role=dispatcher/skill.wait.acceptance.test.ts` | 🔴 **no such file** — the dispatcher tier holds 5 tests, none named `wait` |

and the four strings it quoted as snippets:

```sh
$ rhx grepsafe --pattern 'review-input|review-output\.json' --glob '**/*.ts'      # → 0
$ rhx grepsafe --pattern "passage\.jsonl|'\.triggered'|\"\.triggered\"" --glob '**/*.ts'  # → 0
```

**zero, across every TypeScript file in the repo.** the snippets are not paraphrases of real code;
the code is absent.

> **so: do I dispute two nitpicks and risk a reviewer being right in a way I could not see — or
> concede them, and put on record that I fixed an item that was never there?**

---

## .what I took, and why

**taken: dispute both.**

### 1. a concession would be a lie on the record

`--as conceded` commits me to *"the reviewer is right, and I will fix it."* there is no defect to
fix. the file I would open does not exist, and the pattern I would remove appears in no file. the
next traveler reads a concession and looks for the repair; **they will find neither the repair nor
the defect, and will have no way to tell which of the two is absent.**

### 2. the tally was right and the artifact tallied was not about this repo

this is `F26`'s shape at one remove, and the distinction matters:

| | `F26` (r010, i005) | 🔴 `F28` (r005, i006) |
|---|---|---|
| what the lane returned | a **session transcript** — visibly not a review | a **well-formed review**, correctly shaped |
| how it was caught | on sight | 🔴 only by a `globsafe` on every cited path |
| the failure | the instrument did not produce a review | the instrument produced a review of a **fictional codebase** |

⚠️ **the second is far more dangerous than the first.** `F26`'s artifact announced itself. this one
passes every structural check `contract.reviewer-output` makes — two numeric counts, a rule
citation, file paths, line ranges, a fenced snippet. **the only check that catches it is opening
the file.**

⇒ and I nearly did not. the nitpick count was inside its allowance (`4/7`), so the tally alone gave
me every reason to leave both un-absorbed and drive on. the reason I opened the paths at all is
that the **stone's buttonup mandate** — *"if you detect it, you fix it"* — applies to nitpicks too,
so I had to go read the code before I could decide whether to fix. **the mandate caught a defect
the threshold would have waved through.**

### 3. the underlying concern is one I have already answered on the merits

`nitpick.2`'s rule — `rule.require.acceptance.blackbox` — is the same rule `F23` disputed at i004
as a class of 5. its own summary table permits internals in **setup** and **verify**; only the
**action** must go through the contract. so even had the cited file existed, the concern would have
been answered by a rule quote rather than a repair.

⇒ that is worth stating because it removes the one reading under which a concession would be
cheap: *"concede it, the underlying point is sound anyway."* it is not sound — it was already
adjudicated against, on the rule's own words.

---

## 🔴 .why my confidence is 97% and not higher

the 3% is not about the measurement. `globsafe` returned 0 files and `grepsafe` returned 0 lines,
four times, and those are executable facts anyone can re-run in seconds.

the 3% is that **I am the party under review, arguing that my reviewer described a repo that is not
mine.** that is the most self-serving claim a driver can make, and it is exactly the claim a driver
who had quietly deleted two test files would also make.

⇒ so the entry names the **re-runnable command**, never the conclusion. a council that doubts me
runs two greps.

⚠️ and one honest residue: I cannot rule out that the lane saw a **stale index** of this branch from
before the `F13` split — which renamed several `blackbox/` files. that would make it a **bind**
defect rather than a hallucination, and a kinder diagnosis. I have no evidence either way, so I do
not assert one; what the dispute rests on is only that the cited artifacts are absent **now**.

---

## .the reversal, if the council rules the other way

two commands, and they buy naught in-tree:

```sh
rhx route.stone.set --stone 5.3.verification --as conceded --with behavior-experience-coverage --about nitpick.1 --severity better
rhx route.stone.set --stone 5.3.verification --as conceded --with behavior-experience-coverage --about nitpick.2 --severity better
```

🔴 the same asymmetry as `F27`: a concession here names a repair that cannot be made, because the
file to repair is absent. the dispute is the only disposition that describes the true state.

## .where

- `.reviews/peer/…i006…r005._.given.by_peer.behavior-experience-coverage.report.md` — the review
- `blackbox/role=dispatcher/` — 5 files, none named `wait`
- `blackbox/role=behaver/` — the journey tests are `skill.init.behavior.guards.journey.{vision,blueprint,execution}.acceptance.test.ts`, per `F13`'s split

## .the verdict

*(unruled)*

## .see also

- `F26` — the sibling: a lane that returned no review at all. read the two together; they are one
  instrument failure at two visibility levels
- `F23` — the prior adjudication of `rule.require.acceptance.blackbox`, which answers `nitpick.2` on
  the merits even where the file is absent
- `contract.reviewer-output` (bhrain/role=reviewer) — every structural check this artifact passes
- `rule.require.trust-but-verify` (ehmpathy/mechanic) — the discipline that opened the paths
