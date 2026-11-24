# rule.always.date-a-record-from-the-filesystem — example: the session that crossed midnight

repo `ehmpathy/rhachet-roles-bhuild`, route `.behavior/v2026_09_04.feat-behavior-route-upgrades`,
2026-09-05 → 2026-09-06.

## what happened

- the session opened on 2026-09-05 and ran past midnight; its context still read 09-05
- it wrote two dated glossary entries, a dream filename and its symlink, and two rounds of a
  progress file — each a day off. one glossary entry was "corrected" from right to wrong
- the progress file declares *"ONE FILE PER DAY, never across days"*; two rounds landed in the
  prior day's file
- the learner's staleness hook fired three times. the driver blamed the hook twice, then read the clock

## the mtime trap

to check the date, the driver read two files written hours earlier. their mtime read
`2026-09-05`, late afternoon; a fresh probe showed the true date was 09-06. the stale read was one day wrong
in the same direction as the defect, so it would have confirmed the error rather than caught it.

## the cost

five records a day off, and two misdiagnoses of a tool that behaved correctly.

⇒ the concept: `rule.always.date-a-record-from-the-filesystem.md`. the worked log:
`.agent/.cache/repo=bhrain/role=learner/skill=learn.domain.terms/progress.2026-09-05.md`.
