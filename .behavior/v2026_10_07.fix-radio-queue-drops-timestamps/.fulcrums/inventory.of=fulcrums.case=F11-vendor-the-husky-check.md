# F11 — this repo adopts `check.timestamps.sh` byte for byte

- **the fork** — the wisher: "it should be in this repos git husky too, the time checker". the check lives in `declapract-typescript-ehmpathy` main (`src/practices/husky/best-practice/.husky/check.timestamps.sh`), but this repo pins `declapract-typescript-ehmpathy@0.47.2`, which does not ship it. (a) copy the file byte for byte and add its `pre-commit` source line; (b) bump declapract and run `rhx declapract.upgrade`, which brings the file along with every other practice drift since 0.47.2; (c) write our own check.
- **taken** — (a). the copy is identical to the best practice, so a later declapract upgrade finds no diff and owns the file from then on. (b) pulls unrelated practice changes into a fix whose scope is timestamps. (c) forks a practice the org already holds.
- **rework** — clean. (b) can follow at any time; it overwrites the copy with the same bytes.
- **confidence** — 80%. low part: the wisher may prefer the declapract upgrade as the path, so this repo stays on the managed track.
- **also** — old tracked files that hold `HH:MM:SS` (fixture logs, `ecowork.db.schema.mjs`, a few briefs, old routes) are left as they are. the check scans staged files only, so each one blocks only when it is next edited. a sweep of them is out of scope.
- **where** — `.husky/check.timestamps.sh`, `.husky/pre-commit`.
- **verdict** — unruled.
