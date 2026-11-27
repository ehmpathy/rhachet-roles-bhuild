#!/usr/bin/env bash
######################################################################
# .what = move a crew from one grove to another: its worktree, its dirty
#         bytes, and its seats' conversations. addressed by tree and grove
#
# .why  = a claude account hit its weekly limit and every crew on the grove
#         that account feeds stalled, while another grove (the laptop, a
#         second cloud grove) held free seats on another account.
#         boot, heal, fell, and restore each work on one grove, so no verb
#         could take a crew to the free seats, and the move was a hand-run
#         chain of git, tar, scp, and ssh. this is that chain, with a plan
#         before it and a proof after it
#
# usage:
#   rhx git.crew.move --tree <tree> --to <grove>                       # plan (read-only)
#   rhx git.crew.move --tree <tree> --to <grove> --mode apply [--why '<why>']
#   rhx git.crew.move --tree <tree> --to <grove> [--from <grove>] --mode verify
#   rhx git.crew.move --tree <tree> --to <grove> --setaside-why '<why>' --mode apply
#   rhx git.crew.move --tree <tree> --to <grove> --drop-twin-why '<why>' --mode apply
#   rhx git.crew.move --tree <tree> --to <grove> --setaside-twin-why '<why>' --mode apply
#   rhx git.crew.move --tree <tree> --to <grove> --into-extant [--mode apply|verify]
#   rhx git.crew.move --help
#
# args:
#   --tree   the tree slug, as git.crew.list prints it                    (required)
#   --to     local | cloud://<grove> | <grove>                            (required)
#   --from   the grove the tree stands on now
#            default: the ledger row. verify reads the move log instead, since
#            the ledger already names the destination. a tree with no row that
#            stands on this grove reads as local
#   --mode   plan (default) | apply | verify
#   --why    why the crew moves; kept in the move log ($CREWWORK_DIR/moves.jsonl)
#   --setaside-why  why a destination branch is set aside past commits that have no patch twin in
#            the source head (three words or more). without it such a branch is refused, and the
#            refusal names this flag. each such commit stays reachable under the set-aside ref
#            (refs/crew-move-setaside/<branch>/<old-sha>, read back before the branch moves); the
#            plan and the apply print each commit and the why. a merge commit the head lacks is
#            refused even with the flag
#   --drop-twin-why  why a stale twin at the destination path may go (three words or more). a twin is a
#            worktree an earlier life of the same tree left on the destination grove. without the flag it is
#            refused, as before; with it, it is dropped only when provably safe: 0 dirty paths (untracked
#            included), its upstream at ahead/behind 0/0, its head in origin/main, and no process with its cwd
#            in it. plan prints `settle: drop the stale twin worktree <path> ...` and the why; apply judges it
#            again at the grove, runs `git worktree remove` (never --force), reads back that it is gone, and
#            says so. the branch it held stays; when that branch's tip is the twin's head, it is set aside past
#            its commits with no patch twin (they are in origin/main), the old tip kept under the set-aside ref.
#            a twin that fails any check stays refused, and the refusal names each check it failed
#   --setaside-twin-why  why a stale twin that holds work (dirty paths, untracked files, bytes older than the source's) is set
#            aside so the move lands the source's bytes (three words or more). never a delete: apply renames the twin dir whole to
#            <base>/_setaside/<tree>.<utc stamp> (every byte kept: dirty, untracked, ignored), and moves its git admin dir beside it
#            as <that path>.gitadmin, which lifts its registration and frees its branch. the two are pointed at each other (each
#            prior pointer kept as *.prior), so `git -C <set-aside path> status` still reads the twin's work. read back: the repo
#            lists no worktree at the old path, the path is free, and the set-aside tree holds the same head, branch, dirty paths,
#            and sha256 of each. plan prints `settle: set aside the stale twin worktree <path> ...` and the why. refused (naught
#            touched) while the path is no registered worktree, or while any process, a claude above all, has its cwd in it.
#            refused beside --drop-twin-why and --into-extant
#   --into-extant  merge the crew into a destination worktree that already stands on the same branch at the
#            same head, with work of its own (untracked records, tracked edits). the worktree is taken as it
#            stands: no fetch, no settle, no drop, no reset. each source dirty path is judged by what the
#            destination holds at it:
#              absent                                  write
#              the same bytes                          skip
#              a clean tracked copy (git holds it)     overwrite
#              a path the source deleted, clean there  delete
#              any other state (dirty bytes that differ, an untracked or ignored copy)   conflict
#            one conflict refuses the whole apply (exit 2), names each path, and writes naught; the grove judges
#            again at the write. a destination path the source does not carry is never touched: it is proved
#            by sha256 before and after. every source path is proved at the destination by sha256, and the
#            counts (dirty paths, untracked files) of both trees print before and after. the plan prints the
#            verdict of each path and the counts it expects. refused with --drop-twin-why and --setaside-why.
#            verify with --into-extant proves each source path stands at the destination (the destination
#            may hold more). transcripts, role links, the ledger row, and the seats move as in any apply
#
# plan prints, and changes naught:
#   the source and destination groves · the branch, its head, and whether the head
#   is pushed · the uncommitted and untracked paths it would carry (gitignored
#   paths, node_modules, .log, .agent/.actors and .claude are left out) · each
#   seat, its state at the source, and its claude transcript · each settle of a
#   stale destination branch (`settle: fast-forward <branch> <old> -> <new>`,
#   `settle: remove the clean mirror worktree <path>`, and for a branch that was later
#   rebased `settle: set aside <branch> <old> as refs/crew-move-setaside/<branch>/<old-sha>,
#   then point it at <new>`) · every refusal
#
# apply, in order (a miss stops the run, and the ledger flips only after the tree is proven):
#   1. raise the tree at the destination on the same branch (clone the repo
#      there if absent; a git bundle carries commits no remote holds). a stale local
#      copy of the branch there is settled first: a clean worktree under
#      <base>/_mirrors/ that holds the branch is removed (git worktree remove, never
#      --force), and a branch behind the head is fast-forwarded to it, read back at the head.
#      a branch that diverged only by a rebase is settled losslessly: when every commit it
#      holds that the source head lacks has a patch twin in the head (what `git cherry <head>
#      <branch>` marks `-`), the old tip is first kept under
#      refs/crew-move-setaside/<branch>/<old-sha> and read back, then the branch moves to the
#      head and is read back. no commit is deleted: the set-aside ref keeps the old tip reachable
#   2. carry every uncommitted and untracked path, byte for byte, then prove it
#      (same head, same dirty paths, same sha256)
#   3. carry the newest claude transcript of each seat, so a --resume there
#      continues the conversation. no credential is carried: the destination
#      dials its own claude account
#   4. install by the repo's lockfile (pnpm install --frozen-lockfile | npm ci). an install that fails
#      with a racy ENOENT from the package manager runs once more, and says so (the first run's log is
#      kept beside the second's). an install that fails with ERR_PNPM_PATCH_FAILED on a package dir
#      whose files are read-only (a package that ships a built dist ships it 0555; pnpm copies it in with
#      that mode and its patch step cannot write it; a warm store holds a cached patched copy and applies
#      no patch, so the same lockfile installs on the source grove) makes that one dir writable by its
#      owner and runs again without the frozen preference (a frozen run imports every package afresh and the
#      dir is read-only again), once per dir the error names, and says so (the first log is kept as
#      install.log.patch1). the lockfile is held by copy: a run that changes it is restored, and the frozen
#      install must then pass over the dirs that stand, or the install failed. an install that lands every
#      dependency and then fails in the tree's own prepare, install, or postinstall hook (the header line pnpm
#      prints names the tree dir; a hook of a dependency is no such cause) runs once more over the same lockfile
#      with --ignore-scripts and says so: every dependency stands, the hook did not run, its steps (husky, rhachet
#      init) are owed, and the cause line of the first log is quoted (the first log is kept as install.log.prepare).
#      a build-first repair cannot cure that cause, since it runs the same hook, so the move cures it itself and
#      runs on to the ledger and the seats. a failure of any other cause stands. before the install, a `.claude` link the repo commits to one actor and the source tree's own
#      init relinked to another is pointed at the source's actor. an install the tree's own init refuses
#      ("<repo>/.claude is a symlink to another place") drops that link and runs once more, so the init links
#      its own (the first log is kept as install.log.claude). then link the
#      roles the source tree held (.agent/repo=<repo>/role=<role>, gitignored, so no git object
#      carries them) by `npx rhachet roles link --repo <repo> --role <role>`, each read back.
#      a link that does not stand stops the run before the ledger flips, and names the cure
#   5. move the ledger row to the destination (crew.ledger enroll --idem upsert);
#      the move log keeps the seats the move means to raise
#   6. boot the same seats there (crew.boot), each resumed where it has a transcript,
#      then read each seat. a seat with a transcript must hold a live claude: a boot that exits 0 and
#      leaves it a bare shell is a husk. the run exits 1 and names each husk seat with the exact cure
#      (rhx git.crew.boot --tree <tree> --grove <to> --roles <role> --resume <role>). a seat with NO
#      transcript (the reflector) comes up bare, as the plan says ("no transcript — the seat comes up
#      bare, no clone is hatched"): it passes as a bare shell whose duct stands, and fails only when no
#      duct stands. the move log keeps those seats (`bare`)
#   the source tree and its ducts stay on disk, untouched. a fell is a later act.
#   .meter/ (commit quota, sponsor bind) is not carried: the moved tree owes a fresh grant
#
# a cut apply resumes. apply writes a `begin` line to the move log before step 1 and one line
# per step it finishes (up, carry, conversations, install, links, ledger). a re-run of apply
# over a destination tree that a logged, unfinished apply of the same tree, branch, and head
# left takes that tree and runs from the first step the log lacks. a carry the log holds is
# proved again by sha256: bytes that still match are not carried twice, bytes that differ are
# carried again, then proved
#
# verify proves the move whole and exits 1 with each miss named: the same head and
# branch, the same dirty paths and bytes at both ends, the ledger row, and a live
# claude in each seat at the destination. the seats read are the destination's own
# plus every seat the move log says the move meant to raise, so a seat that landed
# as an unregistered bare shell is still named, with its cure command. a seat the plan
# said comes up bare (no transcript at the source: read in the move log, else at the source
# tree) passes as a bare shell whose duct stands. over a cut apply it
# names the steps the log holds and the step the apply stopped before
#
# refuses (exit 2, ConstraintError, each with its fix), in plan and apply alike:
#   - an unregistered grove at either end
#   - a source seat busy mid-turn, or with text in its box
#   - a destination path already registered as a worktree that no logged cut apply of this tree,
#     branch, and head vouches for, unless --drop-twin-why is passed and the path is a stale twin provably
#     safe to drop (0 dirty paths, upstream 0/0, head in origin/main, no process in it), or --setaside-twin-why is passed
#     and no process is at work in it (its work is kept whole under _setaside/)
#   - a destination branch with a commit the source head lacks and no patch twin in it (the
#     refusal names each such commit), a destination branch held by a worktree that is no
#     clean mirror under <base>/_mirrors/, or a dirty mirror
#   - a local-only tree onto any cloud grove, ahead of any read of a grove.
#     GIT_CREW_MOVE_LOCAL_ONLY_TREES names them: space-separated tree globs, a `!` glob spares a match
#     (e.g. 'notebook.* !notebook.direction.*'); --to local is the one place such a tree moves. unset binds none
#   - a tree under any org outside GIT_CREW_MOVE_ORGS (space-separated); unset binds no org
#   - a detached HEAD, a rebase or merge mid-run, a dirty set over GIT_CREW_MOVE_MAX_BYTES
#     (default 268435456), a tree already on the destination
#
# every direction works: cloud to local, local to cloud, cloud to cloud
#
# guarantee:
#   - you address a tree and a grove, never a host or a duct uri
#   - plan reads only; apply writes only at the destination, in the ledger, and in the move log
#   - exit 0 = planned, moved, or verified · 1 = malfunction, a husk seat, or a verify miss · 2 = constraint
######################################################################

# .note = test seams, kept out of --help: GIT_CREW_MOVE_INSTALL_CMD (replaces the lockfile install) ·
#   GIT_CREW_MOVE_INSTALL_SHELL (default: zsh -ic, else bash -lc) · GIT_CREW_MOVE_LINK_CMD (replaces
#   `npx rhachet roles link`; `--repo <repo> --role <role>` follows it) · GIT_CREW_MOVE_LIVE_TRIES
#   (default 6) and GIT_CREW_MOVE_LIVE_WAIT (default 5 seconds): the reads of a seat after its boot

set -uo pipefail

args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift; [[ $# -gt 0 ]] && shift ;;  # a trailer with no value never spins the loop
    --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"; exit 0 ;;
    *) args+=("$1"); shift ;;
  esac
done

# crewwork from the REPO's own lib (it loads ductwork + termwork); the operations then skip their own load
# .note = no bar stamp here: every seat the move raises comes up through duct.open, which pins its bar
# .why = a lib that failed to load marks naught ready: its own part error stands, at the entrypoint, before any grove is read
dir_skills="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$dir_skills/work/crewwork.sh" || { echo "💥 MalfunctionError: the crew lib failed to load ($dir_skills/work/crewwork.sh); naught was judged" >&2; exit 1; }
__crew_move_lib_ready=1
source "$dir_skills/work/movework.sh" || { echo "💥 MalfunctionError: the move lib failed to load ($dir_skills/work/movework.sh); naught was judged" >&2; exit 1; }

crew.move "${args[@]}"
