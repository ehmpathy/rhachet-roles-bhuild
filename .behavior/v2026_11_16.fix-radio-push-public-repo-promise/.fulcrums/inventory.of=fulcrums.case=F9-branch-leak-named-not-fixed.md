# F9: the branch name a status-only push publishes is named, not fixed, in #675

## .the fork

- **A, taken:** name it as a residual window (omitted table, pr note, catalog #42, J5 snap) and hold
  the fix in a dream (`.dream/2026_11_17.radio-status-push-leaks-branch-to-public-repo.dream.md`)
- **B:** fix it in this pr: read visibility for status-only gh.issues records too, and compose the
  body with no branch line and no assignee on a public or unreadable repo

## .why A, at the time

the leak is extant and derived (`setPartRadioTask` L127–145, `composeTaskIntoGhIssues` L18–21),
outside the issue's rows, which define a status-only update as one that owes no promise and no read.
B reaches the compose and claim paths and adds a read to every status push, on a p0 under a commit
window.

## .rework: dirty

B touches the compose path every gh.issues send shares, and the claim stamp the supervisor reads;
callers depend on the `🌲 tree planted at <branch>` line.

## .confidence: 70%, and why low

the harm is in the urgent class (a private branch name, public forever), and #675's own rationale
("a task text sent to a public repo cannot be taken back") covers it in spirit. the commander may
rule it in scope.

## .where

blueprint: omitted table (issue row 7), residual windows; catalog #42.

## .verdict

open.
