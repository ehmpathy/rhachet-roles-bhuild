# F13 — one malformed record file on disk

- **the fork:** fail loud, the read names the file · skip the bad file and read the rest
- **taken:** fail loud. a skipped record is a held task that silently leaves the backlog — the
  exact loss the wish forbids (`rule.forbid.failhide`). the error is a `MalfunctionError`
  (`radio task record could not be read`) that names the path, so the fix is one `rmsafe` or edit
  away. the onStop hook exits 1 on it — loud on stderr, never exit 2, so the stop is not blocked
- **rework:** clean — the dao's `readRecordFile` is the one read site
- **confidence:** 85%
- **where:** `daoRadioTaskRecord/index.ts`; acceptance case2; peer r7 nitpick.2
- **verdict:** —
