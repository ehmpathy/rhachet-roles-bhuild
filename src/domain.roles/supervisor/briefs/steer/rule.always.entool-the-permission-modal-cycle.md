# rule.always.entool-the-permission-modal-cycle

## .what

to answer a permission modal is four steps, always in the same order: raw-read the pane, parse
which numbered option reads bare "Yes" vs "No", send the key, re-read to verify. the moment you
run that cycle a SECOND time in one session, by hand, on a fresh tree, it is a defect — not in
the crew, in you. fold it into one skill call before a third repeat.

## .why

correct in shape, forbidden in method. two extant rules already cover this ground
(`rule.always.pave-on-second-repeat`, `rule.require.bulk-over-byhand`) but neither
names THIS cycle specifically — a general rule a reader has already agreed with is
a rule a reader looks past when the specific temptation arrives
(`rule.require.specialize-a-rule-its-readers-look-past`, bhrain/learner). a step done
by hand a second time should never see a third hand-run.

## .the cycle, named

1. `git.crew.read --tree <t> --who <r> --raw --lines N`
2. visually parse the ANSI-rendered numbered list; find which position reads bare "Yes"
   (approve) vs "No" (decline, always the LAST option — never option 2, which grants beyond
   this run)
3. `git.crew.send --tree <t> --who <r> --keys <n>`
4. `git.crew.read --tree <t> --who <r>` to verify the send landed

## .the test

before you run step 1 for the SECOND time this session on a permission modal:

> **is this the second time i have parsed a numbered permission list by hand this session?**

yes → stop. before you touch a third tree, wrap the four steps into one skill (or one function
inside `crewwork.sh`) that takes `--tree`, reads raw, parses the option positions
programmatically (grep for the line that fits `^\s*\d+\.\s+Yes\s*$` vs the decline line), sends
the key, and verifies — then use that skill for every tree left in the sweep.

## .the bound

- a modal whose option text is NOVEL (not the standard yes/no/yes-and-dont-ask shape) may still
  need a human eye once — that first read is not the violation, the SECOND hand-parse of the
  SAME novel shape is
- this rule governs the MECHANIC of the answer, never the JUDGMENT of which key to press — a
  judgment call (is this command actually safe?) stays a driver decision every time

## .enforcement

- the raw-read/parse/send/verify modal cycle run by hand a THIRD time in one session, with no
  skill built after the second = **blocker**
- a queued batch of N modals answered as N sequential hand-cycles instead of one skill call
  applied N times = **blocker**

## .see also

- `rule.always.pave-on-second-repeat.md` — the general form this specializes
- `rule.require.bulk-over-byhand.md` — the peer rule this cycle already violates
- `rule.require.specialize-a-rule-its-readers-look-past` (bhrain/learner) — why a general rule
  was not enough to stop this
- `rule.require.babysit-permission-approval.md` — the per-modal safety test this cycle serves
- `howto.review-permission-requests.md` — the per-modal procedure this rule mandates be tooled

---

written by human + beaver 🦫
