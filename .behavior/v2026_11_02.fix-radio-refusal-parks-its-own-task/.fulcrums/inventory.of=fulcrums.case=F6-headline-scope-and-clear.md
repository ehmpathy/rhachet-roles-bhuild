# F6 — which faults keep words, where they show, what clears them

## the fork

- which faults keep words: every held fault, or only a send fault upstream answered and that stays
- which states show the `fault:` line: a state gate in the render, or the record alone
- which writes clear the headline: every write that changes `reason` with no headline of its own

## taken

- **only a send fault that stays keeps words.** a wall (rate limit, outage) halts, and its words
  vary per attempt — a retry hint, a reset time — so a kept one would rewrite the tracked file on
  each drain; `setRadioTaskRecordUpstream` keeps none when `isRadioUpstreamReasonHalt({ reason })`.
  an auth fault keeps none: its text is ours or the caller's `--auth as-robot:shx(...)` command's,
  never github's, and a vault cli may echo a secret no token shape catches. the drain that meets
  either still prints its words once, from the fault text it holds in hand
- **the record is the one owner of what shows.** the render prints `reasonHeadline` wherever it is
  non-null; no state gate second-guesses it, since no writer leaves words a state should hide
- cleared by the one settle rule (`asRadioTaskRecordSettled`) when `reason` changes with no
  headline named — used by the drain's settle and by `asRadioFateHeldBehindHalt`; `del` clears it
  (the reason becomes the human's why); `set --auth` clears it with the reason (the words were the
  verdict on the old auth); `set` of a body alone keeps both; a re-push that does not re-queue keeps
  both, one that does resets both

⇒ the headline holds only github's words, never sits beside a reason it did not explain, and never
holds words that churn.

## clamps

- case9 [case2] — the wall keeps no words; a refusal before it keeps its own
- case9 [case2b] — an outage halts, keeps no words
- `setRadioTaskRecordUpstream` [case3] — an auth fault keeps no words; the file holds neither the
  credential command's echo nor the fault text
- `asRadioHeldOutput` [case12] — two rows with words show two `fault:` lines; wall and gate rows none

## rework: clean

one guard in the upstream writer, one settle rule; the render reads the field.

## confidence: 90%, and why it is not higher

a dropped record loses github's words; a human who audits a drop later reads only the why they
typed. a reader of `get` behind a wall or an auth fault sees the class and the fix, not the words.

## where

`setRadioTaskRecordUpstream.ts` · `asRadioHeldOutput.ts` · `asRadioTaskRecordSettled.ts` ·
`asRadioFateHeldBehindHalt.ts` · `setRadioTaskRecordDropped.ts` · `setRadioTaskRecordAmended.ts` ·
`asRadioTaskRecordFromPush.ts`

## verdict

open — for the fulcrum council.
