# F37 — the pull list header sets its auth after a `·`, not inside parens

- **fork**: F26 put the source on the auth label, so a human send reads `(auth: as-human (via ambient email bert@example.com)):`, which nests parens. r11 (i002 nitpick.6) named it. (a) keep `tasks on gh.issues (auth: X):` and accept the nest · (b) `tasks on gh.issues · auth: X`, one level of parens at most
- **taken**: (b). the header is a label for the list below it, and the auth is a fact about the label, not a parenthetical aside. the `·` is the separator the radio output already uses for adjacent facts. `asTaskListOutput.test.ts` holds a human case that asserts one level of parens
- **rework**: clean — one template string in `asTaskListOutput.ts`, and a resnap of the list header snaps
- **confidence**: 80%. a reader of the old header loses no fact; the shape moved, the content did not
- **where**: `src/domain.operations/radio/cli/asTaskListOutput.ts`; snaps `asTaskListOutput.test.ts.snap`, pull CLI case8/9/14/15, pull walks
- **verdict**: —
