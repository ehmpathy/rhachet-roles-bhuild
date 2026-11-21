# inventory.of=fulcrums

| case | title | rework | status | confidence |
|---|---|---|---|---|
| [F1](./inventory.of=fulcrums.case=F1-route-size.md) | route size trimmed to vision → execution → verification → playtest | clean | stands — director, 2026-11-14 | 80% |
| [F2](./inventory.of=fulcrums.case=F2-foreign-threads.md) | a comment may land on a thread the radio did not frame | clean | stands — director, 2026-11-14 | 85% |
| [F3](./inventory.of=fulcrums.case=F3-same-comment.md) | "the same comment" = exact body on that thread, any author | clean | stands — director, 2026-11-14 | 75% |
| [F4](./inventory.of=fulcrums.case=F4-flag-shape.md) | a separate `radio.task.comment` skill; push contract unchanged beyond a shared helper | clean | **ruled by director: B** | — |
| [F5](./inventory.of=fulcrums.case=F5-os-fileops-log.md) | os.fileops comments live in a log beside the task file | clean | stands — director, 2026-11-14 | 90% |
| [F6](./inventory.of=fulcrums.case=F6-same-issue-order.md) | a comment waits behind an earlier held update on its issue | clean | stands — director, 2026-11-14 | 60% |
| [F7](./inventory.of=fulcrums.case=F7-cross-worktree-race.md) | two worktrees that push one body at once may post it twice; residual race accepted | clean | stands — director, 2026-11-14 | 70% |
| [F8](./inventory.of=fulcrums.case=F8-comment-body-field.md) | a comment's body rides the record's `description` field, not a new `comment` field | clean | open | 80% |
| [F9](./inventory.of=fulcrums.case=F9-body-match-edges.md) | "the exact body" matches after line ends are unified and edges trimmed; the record key hashes the same form | clean | open | 85% |
| [F10](./inventory.of=fulcrums.case=F10-comment-op-dao-direction.md) | the comment op picks its channel dao by a static import, as the push ops do (peer r5.b2) | clean | open | 80% |
| [F11](./inventory.of=fulcrums.case=F11-mint-skips-unreadable-record.md) | the heldSeq mint skips an unreadable record without a notice; main code, left as is (peer r2.n1) | clean | open | 85% |
| [F12](./inventory.of=fulcrums.case=F12-husky-drift-out-of-scope.md) | the local `.husky` / `.gitignore` / `.gitattributes` drift stays out of this pr; `.husky` set back to HEAD on disk, a copy in `.temp/husky-drift/` (peer r1, round 2; 5.3 r1) | clean | open | 90% |
| [F13](./inventory.of=fulcrums.case=F13-delivered-comment-no-requeue.md) | a delivered comment re-runs on a repeat; the thread findsert decides kept or posted (peer r11, rounds 3-4) | clean | open | 85% |
| [F14](./inventory.of=fulcrums.case=F14-wet-shapes-and-live-snapshot.md) | three refactors left wet; the real-gh suite now snaps, masked, by a hand-written snap (peers r11.4/6/9c, r9.n2, round 3; 5.3 r2/r4) | clean | open | 80% |
| [F15](./inventory.of=fulcrums.case=F15-push-refuses-comment-flag.md) | `radio.task.push` refuses `--comment` and names `radio.task.comment`; no call push accepted changes (peer r10.b1, round 4) | clean | open | 80% |
| [F16](./inventory.of=fulcrums.case=F16-round4-polish-deferred.md) | round-4 polish and extra coverage deferred to one follow-up (peers r10, r11 nitpicks, round 4) | clean | open | 80% |
| [F17](./inventory.of=fulcrums.case=F17-pre-extant-skips-left.md) | main's ten `describe.skip` / `runIf` suites stay skipped in this pr; the two radio gh ones caught as a dream (5.3 zero-skips scan) | clean | open | 75% |
| [F18](./inventory.of=fulcrums.case=F18-zod-gate-exit-code-left.md) | the shared `getCliArgs` schema miss stays exit 1 behind `⛈️ error`; a fix for every skill is caught as a dream (5.3 ergonomics review) | clean | open | 80% |
| [F19](./inventory.of=fulcrums.case=F19-live-pr-and-long-thread-unproven.md) | the live suite comments on an issue only; the pr and long-thread paths stay proven by stub and gh source (peer r3, 5.3 round 1) | clean | open | 80% |
| [F20](./inventory.of=fulcrums.case=F20-caselist-frame-for-transformers.md) | pure transformer tests keep the caselist frame, no `[caseN]` / `when('[t0]')` (peer r7, 5.3 round 1) | clean | open | 80% |
| [F21](./inventory.of=fulcrums.case=F21-dispatcher-boot-budget-raise.md) | the dispatcher boot budget rises 4_200 → 4_700 for the comment verb; reserved for the commander, named in the pr (peer r12, 5.3 rounds 5–6) | clean | open | 75% |
