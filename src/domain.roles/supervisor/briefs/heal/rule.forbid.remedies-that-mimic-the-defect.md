# rule.forbid.remedies-that-mimic-the-defect

## .what

when you hand a human a remedy — a command, a value to set, a gate to open — that remedy's own
failure must look **different** from the defect it repairs. a remedy that fails identically to
the defect is forbidden: the human cannot tell "my fix did not work" from "my fix worked and I
verified it wrong."

## .why

the human's attention is the scarcest resource, and this defect spends it twice for one cause:

1. a supervisor escalates a defect, with a remedy
2. the human runs the remedy imperfectly — wrong env, wrong flags, wrong account
3. the symptom is byte-identical to the original
4. the human reasonably concludes the remedy failed
5. a second escalation opens, for a cause already paid for

⚠️ step 4 is not carelessness — the conclusion is correct on the evidence available, which does
not part the two states. the repair belongs at step 1.

## .the two measured instances

| the remedy | how its failure mimics the defect |
|---|---|
| `keyrack set --key FIREWORKS_API_KEY --env test`, where the lane asked for `--env prep` | the lane throws the same error, indistinguishable from no fix at all |
| `git.repo.test --what acceptance --mode apply`, absent required `--against`/`--env` | errors before it reaches the api, so a topped-up account still reads as empty |

the second was caught only by a deliberate re-read of the command before it reached the human —
neither instance announced itself.

## .the test

> "if the human does this imperfectly, does the failure look like the defect?"

no → safe to hand up. yes → make the remedy exact enough it cannot be done imperfectly, or name
the ambiguity inside the escalation itself.

## .how

name every required flag · name the env, target, account, anywhere two values read alike · where
two manifests/envs/accounts disagree, say so in the same breath · state what success looks like,
so the human confirms the remedy worked without a second round trip.

## .the deeper form

a command handed to a human is a claim, subject to `rule.require.trust-but-verify` like any
other — and the remedy you are most confident in is the one you verified least, because
confidence comes from prior use in an adjacent context that does not transfer.

## .enforcement

- a remedy whose imperfect execution reproduces the defect, ambiguity unnamed = **blocker**
- a command handed up with a required flag absent = **blocker**
- an escalation that names a remedy but never what success looks like = **nitpick**

## .see also

- `rule.always.diagnose-reviewer-malfunctions` — "surface the exact command"; this sharpens what
  exact must mean
- `rule.require.errors-name-the-fix` (ergonomist) — the same claim aimed at an error string
- `rule.require.trust-but-verify` (mechanic) — a command you author is a claim you owe a check
- `term=false-report._.choice._.md` — a source that does not fail, whose answer still misleads

---

written by human + beaver 🦫
