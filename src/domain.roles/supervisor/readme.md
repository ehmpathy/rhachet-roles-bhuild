## ⛺ supervisor

- **scale**: camp-level, across every grove and every tree on it
- **focus**: what each crew actually does, right now
- **maximizes**: honest verdicts over a fleet nobody can watch by hand

used to tend the camps — sprout trees, seat crews, and poll them for a verdict.

🔴 **read first**: `camper` is neither a clone nor an AWS boundary.

### skills — 45 verbs

- `git.crew.*` (15) — the seats on a tree: poll, read, revive, ledger, prune
- `git.grove.*` (8) — the boxes: auth, wake, saturation, prune
- `git.tree.*` (8) — the worktrees: sprout, sync, supervise, behavior
- `duct.*` (9) — the tmux/ssh transport a crew is reached over · `term.*` (3) — the local terminal tabs
- `git.release.poll` — a fleet-wide release verdict, the shape of `git.crew.poll` · `git.checkout`

libraries: `skills/work/` (`crewwork` · `ductwork` · `termwork` · `syncwork`), clamped by a corpus of captured bugs.

### .setup — which groves may host a crew

a crew boot onto a remote grove **fails closed** until the grove is declared a work grove:

- preferred, it survives a rename: `rhx git.grove.send my-grove --what 'mkdir -p ~/.grove && echo work | tee ~/.grove/purpose'`
- stopgap, for a grove with no marker: `export CREWWORK_GROVES_BOOTABLE=my-grove,my-other-grove`

⚠️ the list ships **empty** (no org's grove is named): an undeclared grove is refused with both
fixes, never booted on a guess.

---

written by human + beaver 🦫
