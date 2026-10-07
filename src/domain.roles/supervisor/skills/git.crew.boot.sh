#!/usr/bin/env bash
######################################################################
# .what = BOOT a CREW's WORK against a tree — one duct per role, in the
#         tree's own worktree. it opens NO tabs.
#
# ⚠️  this is the EXPENSIVE verb. it consumes a branch's worktree, two
#     tmux sessions, an install, and a bound route — and its inverse,
#     `crew.stop`, ends every conversation in the crew for good.
#     when you only want a WINDOW, reach for `git.crew.show` instead.
#     when you want BOTH, reach for `git.crew.open`.
#
# .why `boot` and not `open`: `open` did not pair with `stop`, and it
#      overlapped in sense with `crew.show` — so the reader who wanted a
#      window reached for the verb that kills work. you boot a MACHINE;
#      you do not boot a window. see term=crew._.choice.reason.md.
#
#      `open` was later revived, for the COMPOSITE verb rather than for
#      this one, and the dispute is recorded with the reason it no
#      longer carries the defect.
#
# .why  = a crew took three verbs in a fixed order that lived only in a
#         supervisor's head:
#
#           rhx duct.open --on $tree/mechanic --cwd $worktree
#           rhx duct.open --on $tree/foreman  --cwd $worktree
#           rhx term.open --via kitty --on $tree --for mechanic
#           rhx term.open --via kitty --on $tree --for foreman
#
#         four calls, one worktree path to look up by hand, and an order
#         that MATTERS: term.open findserts a duct of its own, so a tab
#         run before its duct spawns the session in the CALLER's
#         directory. after the 2026-08-09 reboot that put reclaimed
#         mechanics in sandpine-notebook instead of their own worktrees — and a
#         `claude --continue` from there resumes the wrong conversation.
#
#         this skill owns the first half of that order:
#           tree (find + verify) -> ducts (with --cwd)
#         `git.crew.open` owns the whole of it, tabs included.
#
# usage:
#   rhx git.crew.boot --tree <treeslug>
#   rhx git.crew.boot --tree <treeslug> --grove local
#   rhx git.crew.boot --tree <treeslug> --grove cloud://grove-1
#   rhx git.crew.boot --tree <treeslug> --roles reflector   # add ONE seat
#   rhx git.crew.boot --tree <treeslug> --resume mechanic
#   rhx git.crew.boot --help
#
# args:
#   --tree    the tree slug, as duct.list prints it   (required)
#   --grove   local | cloud://<groveslug>
#             default: the box the LEDGER says this crew was booted on.
#             ⚠️ this line read `local (default)` until 2026-09-18, which was
#             stale against the code below it: crewwork.sh:5022 converted boot
#             off a hardcoded `local` in 2026-09-05, and the header kept the
#             retired claim. a reader who trusted it would pass `--grove` by
#             hand on every grove tree, or read a grove crew's absence as real.
#   --roles   comma list, in order
#             (default: every role in CREWWORK_ROLES_DEFAULT, crewwork.sh)
#             the FIRST role takes the window's base tab
#
#             ⚠️ this verb is IDEMPOTENT, so --roles names what to ENSURE, not
#             what to replace. `--roles reflector` on a two-duct crew adds the
#             third and leaves the other two untouched — it does not narrow the
#             crew to one. to end a duct, reach for git.crew.stop.
#   --resume  restore this role's PRIOR conversation, by name — it sends
#             `claude --resume <role> --permission-mode acceptEdits`, then
#             answers the session picker if one draws
#
# 🔴 .why NOT `claude --continue`, which this line once named
#   `--continue` resolves by cwd-RECENCY, and a tree's mechanic and foreman
#   share ONE worktree — so they share one claude project dir, and the
#   foreman's `--continue` can hand back the MECHANIC's conversation.
#   neither pane says so, and the operator reads the wrong transcript as
#   the right one (term=false-report). `--resume <name>` is deterministic:
#   git.tree.behavior launches each clone with `--name $role`, so the role
#   IS the handle. see crewwork.sh:1185-1194.
#
# .why --resume is opt-in
#   it TYPES into a live duct. a clone already mid-task would be
#   interrupted, so the caller names the role deliberately.
#
# guarantee:
#   - idempotent: finds what is up, creates only what is absent
#   - every duct starts inside the tree's own worktree
#   - a tree with no worktree fail-fasts rather than opens a crew
#     pointed at the wrong directory
#   - NEVER opens a tab — this is the work axis. use git.crew.show for
#     the view, or git.crew.open for both
#   - exit 0 = crew up, 1 = malfunction, 2 = constraint
######################################################################

set -uo pipefail

# source crewwork from the REPO's own lib (it loads ductwork + termwork).
#
# .why the repo, not ~/.bash_aliases: the global dotfiles are owned by
#      dev-env-setup's install_env, so what we write there is one reinstall
#      from erased and one shared name away from a collision. the lib beside
#      this skill is ours alone — it versions with the skills that call it,
#      and it ejects into rhachet-roles-bhuild as one unit.
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

# parse args (swallow rhachet's reserved flags, which it forwards through)
args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --help|-h)
      # .why to the FENCE and not a line number: a hardcoded window silently
      #      drops whatever the header grows past it, and a reader cannot tell
      #      a truncation from an absence (term=false-report). measured
      #      2026-09-05 — `2,50p` cut the args block mid-list, so --roles and
      #      --resume vanished from a help that still looked complete.
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    *) args+=("$1"); shift ;;
  esac
done

crew.boot "${args[@]}"
