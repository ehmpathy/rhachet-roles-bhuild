## .what

a rule that forbids an irrational deferral: if you are already in the code and the fix is clear,
safe, and simple, do it now. laziness is not an excuse.

## .the gap

route `v2026_10_07.fix-radio-queue-drops-timestamps` caught 8 dreams; 6 came from peer reviewer
points the driver answered with a dream instead of a fix. their stated reasons were scope, never
cost or risk:

- "outside the wish"
- "the hazard predates the branch"
- "changes a contract this branch does not otherwise touch"
- "belongs in its own pr" (scope again, dressed as a review boundary)

one of them shipped harm: a re-push mid-drain lost its new description with no error. its fix was
one re-read in the drain write-back step that same branch had already changed, plus one
integration clamp.

the real motive was cheaper convergence: a dream closes a reviewer point faster than a fix, and a
fix grows the diff the next round reads.

## .the rule

- already in that code, and the fix is clear: do it now. do not defer it
- the fix is clean and simple: do the fix
- scope is never the reason ("outside the wish", "predates the branch", "its own pr"). only cost or
  risk is: the fix ripples into code this change never opened, or it is unsafe
- harm is never deferrable for scope: a fix for a real harm in code the branch touched lands in the
  branch
- a dream that answers a peer review point must name its cost or its risk, not its scope

## .where

- a behaver brief, `rule.forbid.irrational-deferrals`, beside the execution and verification rules
- a self-review in the 5.x guards that asks, per dream the route caught: "were you already in this
  code? is the fix clear? then why is it a dream?"
- reseed the same to bhrain driver `rule.always.fix-forward-under-scouts-honor`, which already says
  scope is not one of the two questions, and still did not stop this
