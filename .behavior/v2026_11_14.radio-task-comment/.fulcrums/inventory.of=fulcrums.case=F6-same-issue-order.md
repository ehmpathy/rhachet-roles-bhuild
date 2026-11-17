# F6 — a comment waits behind an earlier held update on its issue

## .the fork

- **A** keep the extant same-issue order kind-blind: a comment queues behind any earlier held act
  on its issue (`getOneRadioFateAheadOnIssue`, `asRadioTaskRecordOrder` group by `via|repo|exid`)
- **B** exempt comments: a comment never waits behind another act on its issue

## .taken — A, and why at the time

- a comment often corrects or explains a change pushed just before it ("claimed — the cure is
  in the second commit"). posted ahead of the change, it reads wrong
- A is the extant behavior; B adds a branch to a shared order function that every act reads
- the stuck case has a cure today: `queue set --auth as-human` or `queue del` on the update frees
  the comment behind it

## .rework — clean

one predicate in `getOneRadioFateAheadOnIssue`: skip the wait when the later record is a comment.

## .confidence — 60%, and why it is low

#394's measured case is exactly an update the robot may not apply; a comment pushed after it
would wait though the robot can post it. the wisher may value "the comment always gets out" over
"thread order holds".

## .where

`getOneRadioFateAheadOnIssue.ts`, `asRadioTaskRecordOrder.ts` (unchanged under A).

## .verdict

open
