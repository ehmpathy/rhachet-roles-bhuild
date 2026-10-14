# inventory.of=fulcrums

| case | title | rework | status | confidence |
|------|-------|--------|--------|------------|
| F1 | the cited hook lives in the consumer repo, not here | clean | ruled — confirmed: a consumer husky hook | 100% |
| F2 | heldSeq spans the worktree, not one dir | clean | best-guessed | 85% |
| F3 | stdout `held since <stamp>` becomes `held #N in line` | clean | ruled — confirmed: drop the age, it is irrelevant | 100% |
| F4 | os.fileops drops pushed_at / claimed_at / delivered_at | clean | ruled — reversed: in scope, but datestamps are fine, so no change | 100% |
| F5 | os.fileops backup is `task.<exid>.bak.md` | clean | ruled — reversed: the dated backup name is a datestamp, kept | 100% |
| F6 | the rule lives in `.agent/repo=.this/role=any/briefs/` | clean | ruled — confirmed | 100% |
| F7 | records stay trackable — no self-gitignore of `.radio/` | clean | best-guessed | 80% |
| F8 | the clamp is a byte scan for an iso datetime, plus a two-run byte test over records | clean | best-guessed (narrowed by the F9 verdict) | 85% |
| F9 | the rule's line: a timestamp (time of day) is forbidden; a datestamp is fine | clean | ruled — the wisher drew the line at time of day | 100% |
| F10 | the drain lock dir writes its own `.gitignore`; a crashed lock never reaches git | clean | best-guessed | 70% |
| F11 | this repo copies `check.timestamps.sh` byte for byte from declapract main, not via a declapract upgrade | clean | best-guessed | 80% |
| F12 | the wish quotes a real timestamp; mask its time to `THH:MM:SSZ` so the route can commit under the check | clean | ruled — confirmed: mask the ones in the wish | 100% |
| F13 | the gate exempts `.eco/*`, the prioritizer's data store, as its own clamp test prescribes; the brief names it a sanctioned home | clean | best-guessed | 75% |
| F14 | the record read checks the whole record shape (zod, at the dao boundary) | clean | reversed: the deferral was for scope; fixed in this branch | 90% |
| F15 | the read sheds legacy keys via `_`-prefixed binds, not `void` or a new `omit` dependency | clean | best-guessed, disputed at i002 | 90% |
| F16 | `gen` names the lock-ignore findsert, per the sanctioned verb set | clean | best-guessed, disputed at i002 | 95% |
| F17 | the heldSeq error names its value in words, with no metadata object (helpful-errors would print it as json inside the tree) | clean | best-guessed, disputed at i004 | 85% |
| F18 | a drained line carries no place label; line order is the place in line | clean | best-guessed | 85% |
| F19 | the eco.seed case that pushes runs in a hermetic temp repo, so it leaks no radio record | clean | reversed: the deferral was for scope; fixed in this branch | 90% |
| F20 | a push reads the records three times, on purpose: each read sees a state the prior one cannot | clean | ruled: not a defect; the dream is closed | 85% |
| F21 | the legacy-record and cross-dir drain journeys are proven at integration, not at the cli | clean | reworked at verification: acceptance case5 drives both journeys through the cli | 100% |
| F22 | the gate scans the whole staged blob, as declapract ships it; the repo's two stamp writers are fixed at the source | clean | best-guessed, disputed at i007 | 70% |
| F23 | routine tool bumps in the tree ride along with this change | clean | best-guessed, disputed at i007 | 80% |
| F24 | the gh.issues proof runs in ci, not on a local credential | clean | ruled — confirmed: just use the cicd one | 100% |
| F25 | the skips that predate this branch stand; each waits on a human grant or ci infra | clean | ruled — confirmed: keep suites skipped as before | 100% |

entries: `inventory.of=fulcrums.case=F$n-$slug.md`. verdicts from the wisher, 2026-10-07, verbatim:
"its a husky hook; rule should go into repo this yes; loose held since, its irrelevant. os.fileops
too; nah, only timestmaps, datestamps are fine".
