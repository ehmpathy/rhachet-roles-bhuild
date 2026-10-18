# F14 — three scope-flag defects are one class, and the class gets one repair

- **status** CLOSED — wisher directive, 2026-09-06
- **rework** clean
- **confidence** 92%
- **where** bhrain#448 (the class repair) · `5.3.verification.guard` + the two `5.1.execution.*`
  guards (the instances, already conformed)

## the fork, stated fairly

three defects surfaced independently, across two repos and three days:

| # | the misuse | found by |
|---|---|---|
| 1 | `--paths-without` is parsed and discarded | this route's groundwork |
| 2 | a doubled `--paths-with` last-wins | bhuild#366 |
| 3 | `--paths-with` with no `--diffs` **replaces** the diff bound | a bhrain dream |

each arrived with its own obvious repair — add an alias · union the doubled values · document the
bound. **the fork was whether to take the three obvious repairs, or to name the class.**

## taken, and why at the time

**name the class**, and the wisher directed it:

> *"prevent the ability to misuse the reviewer like that in the future, to close that landmine"*

⇒ *"prevent the ability"* rules out all three instance-repairs by construction. an alias fixes one
typo and leaves the next silent; a union fixes one doubled flag and leaves the next single-value
flag someone doubles still handled quietly.

🔴 **the class is: the parser GUESSES where it should REFUSE.** the mechanism under all three is one
**arity declaration** — accumulate `--rules`/`--refs`/`--optional`, single-value for the rest, exit
nonzero on any violation.

## why it reads as a bug and behaves as a landmine

> **a review lane pointed at the wrong corpus does not fall silent. it reasons correctly from what
> it was shown.**

the output is well-formed in every case, so no surface a driver reads parts it from a real verdict.
#366's four-round measurement gives the polarities:

| polarity | count |
|---|---|
| a false **blocker** — coverage denied a test on disk | 2 |
| a false clean `0/0` | 1 |
| a true catch, by coincidence of the narrowed set | 1 |

🔴 **the false blocker is the dearer**, because it actively directs work: a driver who complies
rather than checks lands a duplicate test and calls it a repair.

## 🟡 what makes defect 2 the sharpest of the three

**the caller's form is reasonable.** `--refs A --refs B` accumulates in that same parser
(`review.ts:144-149`), so a caller who repeats `--paths-with` has generalized correctly from the
tool's own behavior — and is silently wrong.

⇒ defects 1 and 3 punish a typo and an omission. **defect 2 punishes a correct inference.**

## rework, and why

**clean.** the bhuild half is done and independently correct: 3 lanes in `5.3.verification.guard`
folded their doubled `--paths-with` to one flag on the open glob `'**/*.{test.ts,snap}'`, and 2
lanes in the `5.1.execution.*` guards renamed to `--paths-wout`. the `{src,blackbox}` allowlist was
applied, then reverted to the open glob on the `exclusion-must-actually-exclude` verdict — an
allowlist in a shared template is forbidden (seed S2, `term=review.scope.blocklist`). both are right
whether or not bhrain ships. the bhrain half is a new ship, never a reversal.

⇒ and `mech-test-scope-purity` (`:274`) already carried the folded form and was the one lane whose
recorded scope matched its written bind every round. **the fix had a worked precedent in the same
file.**

## confidence — 92%, and why not higher

the class is real and the directive is explicit. the residual 8% is that i propose an **arity
declaration** as the mechanism, inside someone else's parser, without a read of how its options are
threaded downstream. if `--paths-with` turns out to be legitimately multi-value somewhere i did not
look, defect 2's repair is wrong and the row reopens.

🟡 **that is the same gap F13 carries** — a design proposal in a repo i do not own, priced on a read
i have not made.
