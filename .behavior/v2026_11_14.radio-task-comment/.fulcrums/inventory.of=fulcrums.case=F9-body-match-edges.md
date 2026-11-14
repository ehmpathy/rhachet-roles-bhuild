# F9 — "the exact body" matches after line ends are unified and edges trimmed

## .the fork

- **A** byte-exact match of the body against each comment on the thread
- **B** match after `\r\n` → `\n` and a trim of whitespace at both ends; inner text exact

## .taken at the time — B

a body piped via `@stdin` usually ends in a newline, and github may store a posted body with that
newline or a `\r\n` cut. under A, a retry of one body could read as new and post twice — the exact
failure F3 exists to prevent. B keeps F3's sense (the same words, by any author) and drops only
whitespace no reader sees. inner whitespace stays part of the body.

## .rework — clean

one transformer: `src/domain.operations/radio/task/comment/asCommentBodyCompared.ts`.

## .confidence — 85%

## .where

`asCommentBodyCompared.ts` is the one rule. `isCommentBodySame.ts` (+ its unit test) matches on it,
used by both comment daos; `asRadioTaskRecordKeyOfComment.ts` hashes it, so a retry with a trailed
newline lands on the same held record, not a twin (key [case5]). the key and the match cannot drift.

## .verdict

open
