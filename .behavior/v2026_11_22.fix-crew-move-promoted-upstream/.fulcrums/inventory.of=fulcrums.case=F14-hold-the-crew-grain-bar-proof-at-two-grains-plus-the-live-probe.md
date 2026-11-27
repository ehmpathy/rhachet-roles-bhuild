# F14 — hold the crew-grain bar proof at two grains, plus the live probe

## .the fork

level 3 (r10) asks for three things this round does not build:

- r10.blocker3: one crew-level test that boots a seat and asserts the `🏷️ status box` line, plus a move apply snapshot that carries it
- r10.nitpick1: a `✓ bar` row in `git.crew.move --mode verify`
- r10.nitpick3: the vision still names `GIT_CREW_MOVE_LOCAL_ONLY_REPOS`
- r10.nitpick5: a test that the held-lock hint renders

- A: build a real-tmux crew harness this round. today every crew suite fakes the duct verbs and records the calls
- B: hold the proof as it stands, and dream the verify bar row with its harness

## .taken

B:
- r10.blocker3: the stamp is proven at the two grains it composes from. no crew verb calls the stamp; it lives inside the duct verbs:
  - **duct grain:** `ductwork.status` proves each raise path stamps, on a real tmux. case1 covers `duct.open` created, case2 found, case5 `duct.reboot`, case2/case8/case10 `duct.refresh`, and case8 a grove over ssh
  - **crew grain:** `crewwork.verbs` proves each crew raise (hire, boot, `--resume`, open) calls `duct.open` with `--cwd` inside the tree (case1, case9), and that `crew.refresh` passes `--home` (case11)
  - **the done criterion:** the hetzner bar, released. the yield's last ship step proves it on the live grove (`rhx tmux.bar.probe`). no hermetic test reaches that grove
- r10.nitpick1: a bar row in verify needs the move suite's duct fakes to answer a probe. it is caught as `.dream/v2026_11_26.feat.crew-move-verify-reads-the-bar.md`, with the real-tmux crew harness it would share
- r10.nitpick3: `1.vision.yield.md` is human-approved, and an edit would reopen it. the execution yield already records the shipped knob (`…_LOCAL_ONLY_TREES`, tree globs), and the verb's `--help` names it
- r10.nitpick5: the test exists. move case73 [t0] asserts `fix: wait for it to finish`, and its snapshot holds the full line with `--to local`. `__mv_to` is set by the arg parse before the lock is taken

## .rework

clean. each is an added test, or one verify row, on code that already stands.

## .confidence — 80%

the risk: a crew verb that one day raises a seat through a path other than the duct verbs would go unstamped, and no crew-grain test would see it. the hetzner probe at release is the backstop.

## .where

`src/domain.roles/supervisor/skills/work/ductwork.status.integration.test.ts` · `src/domain.roles/supervisor/skills/work/crewwork.verbs.integration.test.ts` · `src/domain.roles/supervisor/skills/work/movework.sh`

## .verdict

open
