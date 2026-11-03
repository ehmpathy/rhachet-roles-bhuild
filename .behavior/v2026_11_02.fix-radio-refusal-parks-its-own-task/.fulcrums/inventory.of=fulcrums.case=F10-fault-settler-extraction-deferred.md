# F10 — the fault and auth settlers stay inline in this pr

## the fork

- (a) extract `setRadioTaskRecordHeldOnFault` and `setRadioTaskRecordHeldOnAuth` from
  `setRadioTaskRecordUpstream` now, as peers of `setRadioTaskRecordHeldAtGate` (r11 round 6,
  nitpick 2)
- (b) keep both inline here, and carry the extraction in the dream beside the one fault-line pick

## taken

(b). the words policy this pr adds is one call (`asRadioReasonHeadline({ reason, faultText })`),
already a pure transformer with its own unit table; the settle rule is `asRadioTaskRecordSettled`,
also unit tested. the extraction would move the re-push check and fate build of two paths that
this pr did not otherwise change, in the drain's core send loop, for no behavior change. that
ripple is the dirt; the reviewer itself graded it `better` and "not for this PR if it adds risk".

## rework: clean

a pure move of two inline paths into two files; no caller outside the orchestrator.

## confidence: 85%, and why it is not higher

the reviewer is right that the orchestrator would read better, and the dream pairs it with the
fault-line pick, which may never be scheduled.

## where

`setRadioTaskRecordUpstream.ts` · dream `.dream/2026_11_02.radio-record-fate-fields-classified-and-one-fault-line.dream.md` item 4

## verdict

open — for the fulcrum council.
