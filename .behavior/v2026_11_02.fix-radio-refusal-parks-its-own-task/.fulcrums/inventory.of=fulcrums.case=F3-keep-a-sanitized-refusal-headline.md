# F3 — keep a sanitized refusal headline on the record

- **the fork**: (a) keep #605 F10's call: the record holds only the reason class · (b) keep gh's
  verbatim stderr · (c) keep one sanitized headline: the first line github said, the echoed
  command cut, bounded, dropped whole if it holds a clock value or a token shape · (d) keep
  gh's verbatim words in an untracked, self-ignored sidecar beside the record (a safe home per
  `rule.forbid.timestamps-in-tracked-files`), no sanitize needed for clocks
- **why not (d)**: two homes for one record's state. the words must clear when the reason
  clears (e14); a field on the record clears in the same write, a sidecar needs a second write
  that a crash or a `del` can skip, and a stale sidecar would show old words beside a new reason.
  the sanitize (c) costs is small and testable; the sync (d) costs is spread across every writer
- **taken**: (c). the wish asks `get` to show "its refusal text"; #605 F10 left exactly this
  fork unruled at 75%, and noted "a human who wants the exact gh words may prefer (b)". (c) gives
  the words and keeps F10's reasons: no clock (the timestamp gate), no token, no echoed title, and
  the same bytes on each retry, so no diff churn
- **rework**: clean — one nullable record field, one child line in `asRadioHeldOutput`, one
  transformer
- **confidence**: 75% — the drop-whole-on-a-clock rule may hide a headline a human wanted; a mask
  would keep it, but a mask is a second transform to trust
- **where**: `RadioTaskRecord.ts`, `setRadioTaskRecordUpstream.ts:176-201`, `asRadioHeldOutput.ts`
- **verdict**: —
