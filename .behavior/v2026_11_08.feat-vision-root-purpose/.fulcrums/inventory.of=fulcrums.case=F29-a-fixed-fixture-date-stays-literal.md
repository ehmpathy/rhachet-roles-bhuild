# F29: a fixed fixture date stays literal

## .the fork

the review skill's acceptance snap pins the literal route `v2026_11_08.sandpine-lesson-reminders`,
where the journey snap masks its route as `v{DATE}`.

- **A — mask the review snap's route date too**
- **B — keep it literal**

## .taken, and why

B. the two dates differ in kind:

- the journey's route is minted by `init.behavior` at run time, from today's date. that is a
  clock value, so it must be masked
- the review suite writes its route itself, as a constant in the test (`ROUTE_REL`). it is the
  same bytes on every run, so no mask is owed
- a mask over a constant hides what the test wrote, and makes a real leak harder to see
- it is a datestamp, never a timestamp, so `rule.forbid.timestamps-in-tracked-files` allows it

## .rework

clean. one mask call, then a resnap.

## .confidence, and why

85%.

## .where

`blackbox/role=behaver/skill.review.vision.root-purpose.acceptance.test.ts` (`ROUTE_REL`)
