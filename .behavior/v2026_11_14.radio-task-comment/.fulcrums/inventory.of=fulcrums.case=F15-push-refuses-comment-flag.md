# F15 — radio.task.push refuses `--comment` and names radio.task.comment

raised by the enroll-impl-behavior-intent peer, 5.1 round 4, blocker.1.

## .the fork

- **A** push refuses `--comment` (exit 2), and the refusal names the full `radio.task.comment` call
- **B** leave push as is: zod strips the unknown flag, and `push --exid N --comment …` runs as an
  empty update — exit 0, "onto the pile!", no comment posted

## .taken — A, and why at the time

- `push --exid N --comment @stdin` is the literal form that #567 spells out. under B a director who
  follows the issue text sees exit 0 and believes the amend landed — a silent false success
- F4 bounds push to "no change beyond a shared helper". a refusal adds no behavior to push: no flag
  push reads, no output for any call push accepted before. every call that worked still works the
  same. it only turns a call that silently did naught into a loud one with the fix named
- it mirrors the comment skill's own refusal of `--title`, `--description`, `--status`

## .rework — clean

delete the `comment` schema key and the five-line refusal in `src/contract/cli/radioTaskPush.ts`,
plus acceptance case3 [t6].

## .confidence — 80%

below 93%: it reads F4's "no change to radio.task.push contract" narrowly, which is the director's
call to make.

## .where

`src/contract/cli/radioTaskPush.ts`

## .verdict

open
