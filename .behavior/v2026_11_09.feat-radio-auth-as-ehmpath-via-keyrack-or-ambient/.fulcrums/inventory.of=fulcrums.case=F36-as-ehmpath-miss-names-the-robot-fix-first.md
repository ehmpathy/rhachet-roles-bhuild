# F36 — an as-ehmpath miss names the robot fix first, even on a human box

- **fork**: on bert's laptop (a human email), `--auth as-ehmpath` misses both spots. r11 holds the first fix, `rhx keyrack set … EHMPATH_BEAVER_GITHUB_TOKEN`, is wrong for that persona. (a) lead with `--auth as-human` when the email is a human one · (b) lead with the keyrack fix, then `or send as yourself, on purpose: --auth as-human`
- **taken**: (b). `--auth as-ehmpath` is an explicit ask to send as the robot; the caller who typed it wants the robot, whoever owns the laptop. the wish requires each miss to name every spot it checked and the fix, and the keyrack row's fix is to set the key. `--auth as-human` stays on the next line, marked "on purpose", so a human who meant themself has the move at hand. the held record's `amend it:` line is the recorder's move on the stored record, not a third say of the same advice: it amends what waits, where the line above it changes the next push
- **rework**: clean — swap two lines in the as-ehmpath miss tree when the email is a human one, and resnap
- **confidence**: 75%. the persona read is fair: most humans who hit this did not mean the robot. the explicit value is the stronger signal
- **where**: `src/domain.operations/radio/auth/getEhmpathAuthMissMessage.ts` (the miss tree); push case10f, pull case10, push walk case3 snapshots
- **verdict**: —
