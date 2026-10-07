#!/usr/bin/env bash
######################################################################
# .what = move a TREE's state between groves, in a named direction
#
# .why  = a grove is where every clone works, so a grove is exactly the box
#         that saturates. and a human's only two read paths both ran ON it:
#
#           rhx git.crew.read   a pane scrape — lossy, no browse, no diff
#           rhx git.crew.show   an ssh tab — 🔴 nvim runs on the grove, and
#                               halts when the grove stalls
#
#         ⇒ the editor stalled precisely when there was most to review. this
#         moves the tree's state to a box the human owns, so the read costs
#         the grove naught and a saturated grove cannot reach it.
#
# usage:
#   # pull, to review — scope defaults WIDE
#   rhx git.tree.sync --tree <slug> --from cloud://<grove> --into local
#
#   # push feedback back — scope named explicitly
#   rhx git.tree.sync --tree <slug> --from local --into cloud://<grove> \
#     --what '*.feedback.*.md' --mode apply
#
#   # migrate a tree between groves
#   rhx git.tree.sync --tree <slug> --from cloud://<a> --into cloud://<b> \
#     --what '<glob>' --mode apply
#
#   # pull a GITIGNORED file too — a .env the seat must source
#   rhx git.tree.sync --tree <slug> --from cloud://<grove> --into local \
#     --also-ignored 'provision/**/.env'
#
#   rhx git.tree.sync --help
#
# args:
#   --tree   the tree slug, as git.crew.ledger prints it   (required)
#   --from   local | cloud://<groveslug>                   (required)
#   --into   local | cloud://<groveslug>                   (required)
#   --what   a git pathspec, repeatable. names WHAT travels
#            optional into local (defaults wide) · 🔴 REQUIRED into a grove
#   --also-ignored
#            a git pathspec, repeatable. pulls a GITIGNORED path, which the
#            snapshot skips by design. 🔴 PULL-only · opt-in, per path
#   --mode   plan | apply
#            default: apply into local, plan into a grove — a pull can harm
#            no crew, a write onto a live worktree is the deliberate act
#   --force  take the grove's state over a mirror that holds YOUR edits.
#            it lists every file it is about to overwrite, first.
#            🔴 PULL-only by nature — it can destroy only your own edits in
#            your own mirror. it does NOT loosen `--what` in the upward
#            direction; that guard protects a worktree someone else works in
#
# ⚠️ .--force is for a mirror that holds REAL edits. a mirror that merely
#    DIVERGED — stashed, checked out, or committed, with a clean `git status` —
#    needs no flag: the refusal exists to protect uncommitted edits, so where
#    there are none it does not fire at all.
#
# 🔓 .--also-ignored, and why it is a separate flag
#
#   the snapshot is built with `git add -A`, which honors .gitignore — so a
#   `.env`, a lockfile, or a build artifact is absent from the snapshot TREE
#   and therefore from the mirror. that skip is the security guarantee: it is
#   what keeps credentials and node_modules off your laptop.
#
#   ⚠️ `--what` cannot reach one. `--what` filters WITHIN the snapshot, and a
#      gitignored path was never in it — so a `--what` that names one yields
#      "no path matched", which reports the wrong cause.
#
#   ⇒ so the opt-in is its own flag, narrow by construction: it matches ONLY
#     ignored files, lists every path it pulled, and refuses an empty match
#     with both causes named (absent at source · not actually ignored).
#
#   🔴 PULL-only. a gitignored file written UPWARD onto a live grove leaves no
#      trace in any tree — an upward secret belongs in the keyrack.
#
# 🪑 .the MIRROR-OWNED paths — machine state that never travels
#
#   a tracked file can still be a fact about a BOX rather than about a branch.
#   `.claude/settings.json` is the case: it is committed in every repo here, so
#   it rides every snapshot — and the local claude session rewrites it in the
#   mirror the moment a human works there.
#
#   ⇒ so it diverged with no human edit, every session, and every refresh halted
#     with a `--force` ask about a file nobody had opened. both copies were
#     correct, each for its own machine.
#
#   the mirror OWNS these paths: the sync neither overwrites one nor counts one
#   as drift. the set is exact-match and deliberately short — see
#   SYNC_MIRROR_LOCAL_OWNED in work/syncwork.sh.
#
#   ⚠️ the cost, stated plainly: a crew edit to one of these does not surface in
#      the mirror. to read one, go to the snapshot:
#        git -C <mirror> show refs/mirror/<tree>:.claude/settings.json
#
# 🔴 .--what is the safety mechanism, and it is REQUIRED upward
#
#   an unscoped write onto a live worktree clobbers a crew's in-flight edits,
#   silently, while they work. so the caller states the scope every time it
#   writes to a box someone else works on — the same guarantee
#   `git checkout <ref> -- <paths>` has: you can only touch what you NAME.
#
#   ⚠️ there is no wildcard shorthand, on purpose. if SOURCE must travel
#      upward, that is `git push` on the crew's own branch — never this.
#
# .the snapshot mutates NAUGHT
#   the diff that matters is usually UNCOMMITTED, so the snapshot captures a
#   dirty worktree via a TEMP INDEX (GIT_INDEX_FILE) — the crew's real index,
#   worktree, and branch stay untouched by construction rather than by care.
#   it is deterministic, so an idle re-sync yields the identical sha and moves
#   naught.
#
# 🔴 .the STAGED/UNSTAGED split travels too
#   a crew's uncommitted work is two piles, never one — what they staged, and
#   what they have changed since. the snapshot is therefore a CHAIN of two
#   commits (HEAD ← their index ← their worktree), and the mirror is unpacked
#   with THEIR index in place.
#
#   ⇒ so in the mirror, every verb means what it means on the grove:
#
#       git diff           what they changed SINCE they last staged
#       git diff --cached  what they have staged
#       git status         both, partitioned exactly as the crew sees it
#
#   this holds on EVERY sync, the first and each refresh — the unpack rebuilds
#   the index from the arrival snapshot each time.
#
# .what a mirror gives you that an rsync'd pile cannot
#   git show <ref>                    what they changed since they staged
#   git show <ref>^                   what they staged
#   git range-diff <ref>@{1} <ref>    what they did since you last looked
#
# guarantee:
#   - NEVER mutates the source crew's index, worktree, or branch
#   - the mirror's index IS the crew's index — `git diff` there is their
#     since-staged delta, never a flattened sum of staged + unstaged
#   - a MIRROR-OWNED path (SYNC_MIRROR_LOCAL_OWNED) is neither overwritten nor
#     counted as drift — so machine state never halts a refresh, and a refresh
#     never destroys machine state
#   - a mirror that holds YOUR uncommitted edits is REFUSED, never reset over —
#     and `--force` lists every file before it overwrites one
#   - a mirror that merely DIVERGED with no edits present is refreshed, and says
#     so. the refusal guards edits, so an empty `git status` never trips it
#   - the upward write does not stage into the destination's index
#   - exit 0 = synced, 1 = malfunction, 2 = constraint
######################################################################

set -uo pipefail

# source syncwork from the REPO's own lib
#
# 🔴 crewwork FIRST. the seat derivation (a no-arg pull from inside a mirror)
#    reads the crew ledger to learn which grove the tree sits on, and syncwork
#    sources naught of its own. absent this line bash printed `command not
#    found`, the grove came back EMPTY, and the verb announced "this is a LOCAL
#    tree" — confidently, about a grove tree (rule.forbid.failhide).
#    ⇒ the guard in syncwork now fails loud on the absence too, so the two
#      defenses are independent: this line supplies it, that one refuses to
#      proceed without it.
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/syncwork.sh"

args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --help|-h)
      # .why the end is FOUND, never a pinned line number: this read
      #   `sed -n '2,63p'`, and every edit to the header above silently
      #   moved where the help stopped — a false report about the file it
      #   lives in. the same repair git.crew.heal.sh already carries.
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    *) args+=("$1"); shift ;;
  esac
done

tree.sync "${args[@]}"
