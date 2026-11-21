# F26: the send-timeout test kills its stalled stub at 2s, not 300ms

## .the fork

`daoRadioTaskViaGhIssues.shell.integration.test.ts` stalls a stub gh for 20s and asserts the send is killed
loud. the timeout passed was 300ms. this route's full integration runs saw it red: the stub had not yet logged
its argv when the kill fired, so the argv assertion failed. the fork:

- **a.** keep 300ms, and make the stub log its argv before bash does any other work
- **b.** raise the timeout to 2s, keep the `< 5_000` elapsed bound, and say why at both lines

## .taken: b, and why at the time

- **the intent is "a stalled send is killed loud, never hangs".** a 20s stall killed under 5s proves it at 2s
  as at 300ms: the stall would cross the bound four times over
- **the flake sat in bash startup on a loaded box**, which (a) cannot remove: the argv log is the stub's first
  line already, and a process must start before it can log
- **ran 3× green** after the change, under the same load that failed it

## .rework

clean. one number and one comment, in one test file.

## .confidence, and why it is low

80%. a reviewer may hold that a sub-second timeout is a case worth its own proof. the dao passes its timeout
straight to the child-process kill, so the value does not change the code path under test.

## .where

`src/access/daos/daoRadioTask/daoRadioTaskViaGhIssues.shell.integration.test.ts` L73–92
