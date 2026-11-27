#!/usr/bin/env bash
######################################################################
# .what = the operations of git.crew.move: move a crew from one grove to another
#
# 🔴 .a LIB — sourced, never executed. git.crew.move.sh and the clamps source it.
#
# .why  = the verb file (git.crew.move.sh) is a parser. all that reads a
#         grove, judges a move, carries bytes, or raises a seat lives here, so a
#         clamp can source this file, fake the boundaries (ssh, crew.boot,
#         duct.read), and run the real flow end to end against temp groves
#
# .shape = two halves (the `mvbox` prefix is the pioneer's name for the grove half)
#
#   grove half `__mvbox_*`   self-contained bash that runs ON a grove (this one,
#              or another by ssh). the runner ships every `__mvbox_` function in
#              one `bash -c`, so the half needs naught from this file and a
#              grove needs naught installed. coreutils, git, tar, sha256sum
#
#   crew half  `crew.move` + `__crew_move_*`   runs on the caller's grove. reads the
#              ledger, judges the refusals, relays the bytes between groves
#              through a temp dir here (a cloud-to-cloud move rides the caller),
#              and calls the extant verbs for the rest: crew.ledger enroll (the
#              row), crew.boot --resume (the seats)
#
# .what moves
#   - the branch at the same head (a git bundle carries unpushed commits)
#   - every uncommitted and untracked path, byte for byte (gitignored paths,
#     node_modules, .log, .agent/.actors, .agent/.cache, .claude are left out; verify leaves out the same set)
#   - the newest claude transcript of each seat, so `claude --resume` there
#     continues the conversation. NEVER a credential: the destination dials its
#     own claude account
#   - the role links (.agent/repo=<repo>/role=<role>, gitignored, so git carries none): read from
#     the source tree, made again at the destination by `npx rhachet roles link`, read back
# .build
#   a tree whose own prepare hook runs its own build output (a package that runs itself, as rhachet does through bin/run.jit)
#   is built first at the destination, before the install and the role links: dist is gitignored, so a fresh worktree has none,
#   and both the install and `npx rhachet roles link` fail on the absent dist. a resume builds the same way, then runs the
#   install again so the hooks run (__mvbox_needs_build, __mvbox_build_first)
# .what stays
#   - the source tree and its ducts, on disk, untouched. a fell is a later act
#   - .meter/ (commit quota, sponsor bind): a human's grant is per tree, so the
#     moved tree owes a fresh grant
# .resume
#   apply logs `begin` before step 1 and each step it finishes (up, carry, conversations, install,
#   links, ledger) in the move log. a re-run of apply over a destination worktree that such a log
#   (same tree, from, to, branch, head, no `ledger` step) vouches for adopts it (adopt=cut) and runs
#   from the first step the log lacks. a carry the log holds is proved again by sha256: bytes that
#   still match are not carried twice, bytes that differ are carried again, then proved. a worktree
#   that no log line vouches for stays refused
# .settle
#   a stale local copy of the branch at the destination is settled, never refused, when it is safe:
#   a branch that is an ancestor of the source head is fast-forwarded to the head, and a clean worktree
#   under <base>/_mirrors/ that holds the branch is removed (git worktree remove, never --force).
#   a branch that diverged only by a rebase is set aside, then pointed at the head: when every commit it holds that
#   the source head lacks has a patch twin in the head (`git cherry <head> <branch>` marks each `-`), the old tip is
#   kept under refs/crew-move-setaside/<branch>/<old-sha>, read back, and only then does the branch move. no commit
#   is deleted. a branch with a commit that has no twin, and a dirty mirror, stay refused; the refusal names each
#   commit with no twin, and the flag that settles past them: `--setaside-why '<why>'` (three words or more), which
#   keeps each such commit under the same set-aside ref and prints the why on plan and apply. a merge commit that
#   the head lacks is refused even then
# .twin
#   a destination path already taken by a stale twin (an earlier life of the same tree on that box) is dropped,
#   never refused, only on `--drop-twin-why '<why>'` (three words or more) and only when the twin is provably
#   safe: a registered worktree with 0 dirty paths (untracked included), an upstream at 0/0, its head in
#   origin/main, and no process at work in it. the box judges it again at apply, then `git worktree remove`
#   (never --force), read back gone; its branch stays. when the twin's head is the destination branch's tip,
#   the branch is set aside past its commits with no patch twin, since the twin check proved them in origin/main
#   a twin that holds work (dirty paths, untracked files, bytes older than the source's) is set aside, never dropped, on
#   `--setaside-twin-why '<why>'` (three words or more): its dir is renamed whole to <base>/_setaside/<slug>.<utc stamp>
#   (every byte kept: dirty, untracked, ignored), and its git admin dir moves beside it as <that path>.gitadmin, which
#   lifts its registration so the branch is free. the two are pointed at each other (each prior pointer kept as
#   *.prior), so `git -C <set-aside path> status` still reads the twin's work. read back: the registration is gone, the
#   path is free, and the set-aside tree holds the same head, branch, dirty paths, and sha256 of each. refused (naught
#   touched) while any process, a claude above all, has its cwd in the twin (__mvbox_twin_setaside). never a delete
# .extant
#   `--into-extant` lands the crew INTO a destination worktree that already stands, with work of its own, on the same
#   branch at the same head as the source. the worktree is taken as it stands: no fetch, no settle, no drop, no reset.
#   each source dirty path is judged by what the destination holds at it (__mvbox_merge_classify):
#     absent                                  write
#     the same bytes                          skip
#     a clean tracked copy (git holds it)     overwrite: the source's bytes land over bytes git keeps
#     a path the source deleted, clean there  delete
#     any other state                         conflict: dirty bytes that differ, an untracked or ignored copy
#   one conflict refuses the whole apply, and naught is written (the box judges again at the write). a destination
#   path the source does not carry is never read for a write: it is proved byte for byte by sha256 before and after.
#   write lays by `tar --skip-old-files`, so a path that appeared after the judge is never overwritten. the proof
#   holds each source path at the destination by sha256, and prints the counts (dirty, untracked) of both trees
######################################################################

__crew_move_here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# the verb file sources crewwork first and says so; a clamp that sources this file alone gets it here
[[ -n "${__crew_move_lib_ready:-}" ]] || source "$__crew_move_here/crewwork.sh"

# .what = the move's two operator guards, read at call time, both from the env:
#           GIT_CREW_MOVE_ORGS             the orgs a crew may move within (space-separated)
#           GIT_CREW_MOVE_LOCAL_ONLY_TREES tree globs that move onto no cloud grove
# .why  = the orgs and the trees are the operator's, never the package's, so unset binds none.
#         one read at the moment of use, so a knob set after the lib loads still binds; and the
#         plan says which guards bind (__crew_move_guards_said), so an unbound guard is seen
__crew_move_orgs() { printf '%s' "${GIT_CREW_MOVE_ORGS:-}"; }

# .what = one plan line on which guards bind; an unset knob is said as unbound, never left silent
__crew_move_guards_said() {
  local orgs trees
  orgs="$(__crew_move_orgs)"
  trees="${GIT_CREW_MOVE_LOCAL_ONLY_TREES:-}"
  printf 'orgs: %s · local-only trees: %s' \
    "${orgs:-unbound, every org moves (set GIT_CREW_MOVE_ORGS to bind)}" \
    "${trees:-unbound, any tree may go to a cloud grove (set GIT_CREW_MOVE_LOCAL_ONLY_TREES to bind)}"
}

######################################################################
# box half: runs ON a box. each function is self-contained
######################################################################

# .what = git with the repo's own hooks off, for every git act that writes at the destination
# .why  = a destination clone can carry a hook that cannot run there (a husky hook whose install
#         never ran); the move's own clone, fetch, worktree add, and stage are no human checkout,
#         so no repo hook may block them
__mvbox_git() { git -c core.hooksPath=/dev/null "$@"; }

# .what = rc 0 when a tree holds no dirty path the carry would list
# .why  = an unread tree is never clean: a git status that fails reads as rc 1, so no caller adopts what it could not read.
#         the status lands in a file first, since `-z` output holds NULs a shell variable cannot keep
__mvbox_tree_clean() {
  local d="$1" e st
  st="$(mktemp)" || return 1
  git -C "$d" status --porcelain=v1 -z --no-renames --untracked-files=all > "$st" 2>/dev/null || { rm -f "$st"; return 1; }
  while IFS= read -r -d '' e; do
    __mvbox_skip "${e:3}" && continue
    rm -f "$st"; return 1
  done < "$st"
  rm -f "$st"
  return 0
}

# .what = rc 0 when the destination path is a worktree a prior apply half made: registered in the
#         repo, on the branch at the head, and clean. args: main wt branch head
__mvbox_half_made() {
  local main="$1" wt="$2" branch="$3" head="$4"
  [ -e "$wt/.git" ] || return 1
  git -C "$main" worktree list --porcelain 2>/dev/null | grep -Fxq "worktree $wt" || return 1
  [ "$(git -C "$wt" symbolic-ref --short -q HEAD 2>/dev/null)" = "$branch" ] || return 1
  [ "$(git -C "$wt" rev-parse HEAD 2>/dev/null)" = "$head" ] || return 1
  __mvbox_tree_clean "$wt"
}

# .what = rc 0 when the destination path is a worktree a cut apply made: registered in the repo, on the
#         branch at the head. dirt is allowed, since a cut after the carry leaves the carried paths.
#         the caller vouches for it by the move log. args: main wt branch head
__mvbox_cut_made() {
  local main="$1" wt="$2" branch="$3" head="$4"
  [ -e "$wt/.git" ] || return 1
  git -C "$main" worktree list --porcelain 2>/dev/null | grep -Fxq "worktree $wt" || return 1
  [ "$(git -C "$wt" symbolic-ref --short -q HEAD 2>/dev/null)" = "$branch" ] || return 1
  [ "$(git -C "$wt" rev-parse HEAD 2>/dev/null)" = "$head" ] || return 1
  return 0
}

# .what = the real dir of a tree slug on THIS box; rc 1 = absent
__mvbox_tree_dir() {
  local slug="$1" dotted d
  dotted="${slug//_/.}"
  for d in "$HOME"/git/*/_worktrees/"$dotted" "$HOME"/git/*/_worktrees/"$slug" "$HOME"/git/_worktrees/"$dotted" "$HOME"/git/_worktrees/"$slug"; do
    if [ -e "$d/.git" ]; then ( cd -P "$d" && pwd -P ); return 0; fi
  done
  return 1
}

# .what = rc 0 for a path the carry and the verify compare both leave out: install output, logs, the actors' own state,
#         and the caches a box's own tools write (.agent/.cache)
# .note = the one list: __mvbox_collect reads it for the carry, the digest, the counts, and the merge judge
__mvbox_skip() {
  case "/$1" in
    */node_modules/*|/.git|/.git/*|*/.git/*|/.log/*|/.agent/.actors/*|/.agent/.cache|/.agent/.cache/*|/.claude|/.claude/*) return 0 ;;
  esac
  return 1
}

# .what = every dirty path of a tree as `<XY>\t<path>` lines in <out>/entries.txt
# .note = git status is the one truth: modified, staged, deleted, and untracked-not-ignored.
#         rc 3 when a path holds a newline (the lists are line-based)
__mvbox_collect() {
  local d="$1" o="$2" e xy p
  : > "$o/entries.txt"
  while IFS= read -r -d '' e; do
    xy="${e:0:2}"; p="${e:3}"
    case "$p" in *$'\n'*) echo "✋ ConstraintError: a dirty path holds a newline, which the carry cannot list: $p" >&2; echo "   └─ fix: rename that path so it holds no newline (or commit or clear it), then plan the move again" >&2; return 3 ;; esac
    __mvbox_skip "$p" && continue
    printf '%s\t%s\n' "$xy" "$p" >> "$o/entries.txt"
  done < <(git -C "$d" status --porcelain=v1 -z --no-renames --untracked-files=all)
  return 0
}

# .what = the facts of a tree, as `key=value` lines. rc 3 = no such tree on this grove
__mvbox_facts() {
  local d wtp org common main branch head ahead gd op="" m root
  d="$(__mvbox_tree_dir "$1")" || { echo "absent=yes"; return 3; }
  echo "dir=$d"
  wtp="$(dirname "$(dirname "$d")")"
  root="$(cd -P "$HOME/git" 2>/dev/null && pwd -P)"
  if [ "$(cd -P "$wtp" && pwd -P)" = "$root" ]; then org=""; else org="$(basename "$wtp")"; fi
  echo "org=$org"
  common="$(git -C "$d" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || { echo "💥 MalfunctionError: git cannot read the tree at $d" >&2; echo "   └─ fix: read it (git -C $d status), repair what git names, then plan the move again" >&2; return 1; }
  main="$(dirname "$common")"
  echo "main=$main"
  echo "repodir=$(basename "$main")"
  echo "origin=$(git -C "$d" config --get remote.origin.url 2>/dev/null)"
  branch="$(git -C "$d" symbolic-ref --short -q HEAD 2>/dev/null)"
  echo "branch=$branch"
  head="$(git -C "$d" rev-parse HEAD 2>/dev/null)"
  echo "head=$head"
  ahead="$(git -C "$d" rev-list --count HEAD --not --remotes 2>/dev/null)"
  echo "ahead=${ahead:-0}"
  gd="$(git -C "$d" rev-parse --absolute-git-dir 2>/dev/null)"
  for m in rebase-merge rebase-apply MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD BISECT_LOG; do
    [ -e "$gd/$m" ] && op="$m"
  done
  echo "op=$op"
  return 0
}

# .what = the dirty set of a tree: a `bytes=<n>` line, then `<XY>\t<path>` lines. rc 3 = unlistable
__mvbox_dirty() {
  local d tmp xy p bytes=0 n
  d="$(__mvbox_tree_dir "$1")" || return 3
  tmp="$(mktemp -d)"
  __mvbox_collect "$d" "$tmp" || { rm -rf "$tmp"; return 3; }
  while IFS=$'\t' read -r xy p; do
    if [ -e "$d/$p" ] || [ -L "$d/$p" ]; then
      n="$(stat -c %s -- "$d/$p" 2>/dev/null || echo 0)"
      bytes=$((bytes + n))
    fi
  done < "$tmp/entries.txt"
  echo "bytes=$bytes"
  cat "$tmp/entries.txt"
  rm -rf "$tmp"
  return 0
}

# .what = stdout: a tgz of the dirty set. meta.txt (D = delete, S = restage, X = restage a deletion)
#         and files.tar (every present dirty path, modes kept)
__mvbox_pack() {
  local d tmp xy p rc
  d="$(__mvbox_tree_dir "$1")" || return 3
  tmp="$(mktemp -d)"
  __mvbox_collect "$d" "$tmp" || { rm -rf "$tmp"; return 3; }
  : > "$tmp/present.z"; : > "$tmp/meta.txt"
  while IFS=$'\t' read -r xy p; do
    if [ -e "$d/$p" ] || [ -L "$d/$p" ]; then
      printf '%s\0' "$p" >> "$tmp/present.z"
    else
      printf 'D\t%s\n' "$p" >> "$tmp/meta.txt"
    fi
    case "${xy:0:1}" in
      A|M|T) printf 'S\t%s\n' "$p" >> "$tmp/meta.txt" ;;
      D) printf 'X\t%s\n' "$p" >> "$tmp/meta.txt" ;;
    esac
  done < "$tmp/entries.txt"
  rc=0
  if [ -s "$tmp/present.z" ]; then
    tar -C "$d" --null -T "$tmp/present.z" -cf "$tmp/files.tar" || { rm -rf "$tmp"; return 1; }
    tar -czf - -C "$tmp" meta.txt files.tar || rc=$?
  else
    tar -czf - -C "$tmp" meta.txt || rc=$?
  fi
  rm -rf "$tmp"
  return $rc
}

# .what = restage one path as the source had it: `S` adds it to the index, `X` drops it from the index
# .why  = the digest proof reads bytes, never the index, so a restage that failed would pass it in silence;
#         a failure here names the path and halts the unpack
# args: dir kind path · rc: 0 = restaged (or a kind with no restage) · 1 = git refused
__mvbox_restage() {
  local d="$1" k="$2" p="$3" err="" rc=0
  case "$k" in
    S) err="$(__mvbox_git -C "$d" add -- "$p" 2>&1)" || rc=$? ;;
    X) err="$(__mvbox_git -C "$d" rm -q --cached --ignore-unmatch -- "$p" 2>&1)" || rc=$? ;;
    *) return 0 ;;
  esac
  [ "$rc" -eq 0 ] && return 0
  echo "💥 MalfunctionError: the staged state of $p could not be restored (git rc $rc): ${err:-no reason given}" >&2
  return 1
}

# .what = stdin: the tgz __mvbox_pack made. lays the files into the tree, removes the deleted, restages
__mvbox_unpack() {
  local d tmp k p
  d="$(__mvbox_tree_dir "$1")" || { echo "✋ ConstraintError: no tree $1 on this grove to unpack into" >&2; echo "   └─ fix: plan the move again; the plan re-reads where the tree stands" >&2; return 2; }
  tmp="$(mktemp -d)"
  tar -xzf - -C "$tmp" || { rm -rf "$tmp"; return 1; }
  if [ -f "$tmp/files.tar" ]; then
    tar -xpf "$tmp/files.tar" -C "$d" --no-same-owner || { rm -rf "$tmp"; return 1; }
  fi
  while IFS=$'\t' read -r k p; do
    if [ "$k" = D ]; then rm -f -- "$d/$p"; fi
  done < "$tmp/meta.txt"
  while IFS=$'\t' read -r k p; do
    __mvbox_restage "$d" "$k" "$p" || { rm -rf "$tmp"; return 1; }
  done < "$tmp/meta.txt"
  rm -rf "$tmp"
  return 0
}

# .what = the proof of a tree: head, branch, then `<sha256>\t<path>` per dirty path, sorted
# .note = a symlink hashes as `link:<target>`; a deleted path reads ABSENT only when HEAD holds it
__mvbox_digest() {
  local d tmp xy p h
  d="$(__mvbox_tree_dir "$1")" || return 3
  tmp="$(mktemp -d)"
  __mvbox_collect "$d" "$tmp" || { rm -rf "$tmp"; return 3; }
  echo "head=$(git -C "$d" rev-parse HEAD 2>/dev/null)"
  echo "branch=$(git -C "$d" symbolic-ref --short -q HEAD 2>/dev/null)"
  while IFS=$'\t' read -r xy p; do
    if [ -L "$d/$p" ]; then
      h="link:$(readlink -- "$d/$p")"
    elif [ -e "$d/$p" ]; then
      h="$(sha256sum -- "$d/$p" | awk '{print $1}')"
    elif git -C "$d" cat-file -e "HEAD:$p" 2>/dev/null; then
      h="ABSENT"
    else
      continue
    fi
    printf '%s\t%s\n' "$h" "$p"
  done < "$tmp/entries.txt" | LC_ALL=C sort -t$'\t' -k2
  rm -rf "$tmp"
  return 0
}

# .what = the hash of one path under a base dir: the sha256 of a file, `link:<target>` of a symlink, `DIR` of a dir.
#         empty when the path is absent
__mvbox_hash_at() {
  local base="$1" p="$2"
  if [ -L "$base/$p" ]; then
    printf 'link:%s' "$(readlink -- "$base/$p")"
  elif [ -d "$base/$p" ]; then
    printf 'DIR'
  elif [ -e "$base/$p" ]; then
    sha256sum -- "$base/$p" | awk '{ printf "%s", $1 }'
  fi
  return 0
}

# .what = the proof rows of a tree: `<sha256>\t<path>` per dirty path, sorted by path (the digest without its head and branch)
__mvbox_manifest() {
  local out
  out="$(__mvbox_digest "$1")" || return $?
  printf '%s\n' "$out" | tail -n +3
  return 0
}

# .what = the counts of a tree: `dirty=<n>` (every dirty path the carry lists) and `untracked=<n>` (the untracked among them)
__mvbox_counts() {
  local d tmp
  d="$(__mvbox_tree_dir "$1")" || return 3
  tmp="$(mktemp -d)"
  __mvbox_collect "$d" "$tmp" || { rm -rf "$tmp"; return 3; }
  echo "dirty=$(wc -l < "$tmp/entries.txt" | tr -d ' ')"
  echo "untracked=$(awk -F'\t' '$1 == "??"' "$tmp/entries.txt" | wc -l | tr -d ' ')"
  rm -rf "$tmp"
  return 0
}

# .what = judge each source row against the tree at <dir>. read-only. args: dir. stdin: `<sha256|ABSENT>\t<path>` rows
# .out  = `R\t<verdict>\t<new dirty: yes|no>\t<path>\t<why>` per row, then `dirty_before`, `untracked_before`, `dest_only`
#         (the dirty paths of the tree the rows do not name). a verdict, by what the tree holds at the path:
#           write      absent: the row lays it
#           overwrite  a clean tracked copy (git holds those bytes), so the row loses naught
#           skip       the same bytes already
#           delete     the source deleted it, and the copy is a clean tracked one
#           gone       the source deleted it, and it is absent already
#           conflict   any other state: dirty bytes that differ, an untracked or ignored copy, a file where a dir is owed
__mvbox_merge_classify() {
  local d="$1" tmp h p cur dirty tracked v new why q bad
  tmp="$(mktemp -d)"
  __mvbox_collect "$d" "$tmp" || { rm -rf "$tmp"; return 3; }
  cut -f2- "$tmp/entries.txt" > "$tmp/dest.paths"
  cat > "$tmp/src.rows"
  cut -f2 "$tmp/src.rows" > "$tmp/src.paths"
  while IFS=$'\t' read -r h p; do
    [ -n "$p" ] || continue
    cur="$(__mvbox_hash_at "$d" "$p")"
    dirty=no; grep -Fxq -- "$p" "$tmp/dest.paths" && dirty=yes
    tracked=no; git -C "$d" cat-file -e "HEAD:$p" 2>/dev/null && tracked=yes
    new=no; why=""; bad=""; q="$p"
    while q="$(dirname "$q")"; [ "$q" != "." ] && [ "$q" != "/" ]; do
      if [ -e "$d/$q" ] || [ -L "$d/$q" ]; then
        if [ -L "$d/$q" ] || [ ! -d "$d/$q" ]; then bad="$q"; fi
      fi
    done
    if [ -n "$bad" ]; then
      v=conflict; why="a file at $bad where the source needs a directory"
    elif [ "$h" = ABSENT ]; then
      if [ -z "$cur" ]; then v=gone
      elif [ "$dirty" = no ] && [ "$tracked" = yes ]; then v=delete; new=yes
      else v=conflict; why="a changed copy, and the source deleted it"; fi
    elif [ -z "$cur" ]; then
      v=write; [ "$dirty" = yes ] || new=yes
    elif [ "$cur" = "$h" ]; then
      v=skip
    elif [ "$dirty" = no ] && [ "$tracked" = yes ]; then
      v=overwrite; new=yes
    else
      v=conflict; why="other bytes (source ${h:0:12}, destination ${cur:0:12})"
    fi
    printf 'R\t%s\t%s\t%s\t%s\n' "$v" "$new" "$p" "$why"
  done < "$tmp/src.rows"
  echo "dirty_before=$(wc -l < "$tmp/entries.txt" | tr -d ' ')"
  echo "untracked_before=$(awk -F'\t' '$1 == "??"' "$tmp/entries.txt" | wc -l | tr -d ' ')"
  echo "dest_only=$(grep -vxFf "$tmp/src.paths" "$tmp/dest.paths" | wc -l | tr -d ' ')"
  rm -rf "$tmp"
  return 0
}

# .what = the judge of a merge, ON the box that holds the extant tree. args: slug. stdin: the source's proof rows
__mvbox_merge_judge() {
  local d
  d="$(__mvbox_tree_dir "$1")" || { echo "✋ ConstraintError: no tree $1 on this grove to judge" >&2; echo "   └─ fix: plan the move again; the plan re-reads where the tree stands" >&2; return 2; }
  __mvbox_merge_classify "$d"
}

# .what = stdin: the tgz __mvbox_pack made. lands each source path INTO the extant tree, never over destination work:
#         the paths are judged again against the bytes the tree holds now (__mvbox_merge_classify), and when any
#         path conflicts naught is written (rc 2)
#         - write      laid by `tar --skip-old-files`, so a path that appeared since the judge is never overwritten
#         - overwrite  laid over a clean tracked copy
#         - delete     the source deleted it, and the copy is clean
#         - skip, gone untouched
#         a path the source held staged is staged again, and a delete the source held staged is staged again.
#         a destination path the source does not carry is never read for a write, so never touched
# .out  = the judge rows and stats, then `written`, `overwritten`, `deleted`, `skipped`, `gone` (counts)
__mvbox_merge_unpack() {
  local d tmp k p r v n_w=0 n_o=0 n_d=0 n_s=0 n_g=0
  d="$(__mvbox_tree_dir "$1")" || { echo "✋ ConstraintError: no tree $1 on this grove to merge into" >&2; echo "   └─ fix: plan the move again; the plan re-reads where the tree stands" >&2; return 2; }
  tmp="$(mktemp -d)"
  mkdir "$tmp/in"
  tar -xzf - -C "$tmp" || { rm -rf "$tmp"; return 1; }
  if [ -f "$tmp/files.tar" ]; then
    tar -xpf "$tmp/files.tar" -C "$tmp/in" --no-same-owner || { rm -rf "$tmp"; return 1; }
  fi
  : > "$tmp/rows.txt"
  while IFS= read -r -d '' p; do
    p="${p#./}"
    printf '%s\t%s\n' "$(__mvbox_hash_at "$tmp/in" "$p")" "$p" >> "$tmp/rows.txt"
  done < <(cd "$tmp/in" && find . \( -type f -o -type l \) -print0)
  while IFS=$'\t' read -r k p; do
    [ "$k" = D ] && printf 'ABSENT\t%s\n' "$p" >> "$tmp/rows.txt"
  done < "$tmp/meta.txt"
  __mvbox_merge_classify "$d" < "$tmp/rows.txt" > "$tmp/verdicts.txt" || { rm -rf "$tmp"; return 1; }
  cat "$tmp/verdicts.txt"
  if awk -F'\t' '$1 == "R" && $2 == "conflict" { found = 1 } END { exit !found }' "$tmp/verdicts.txt"; then
    rm -rf "$tmp"
    return 2
  fi
  # a nul-separated list, by tr (awk builds differ on a nul in printf)
  awk -F'\t' '$1 == "R" && $2 == "write" { print $4 }' "$tmp/verdicts.txt" | tr '\n' '\0' > "$tmp/write.z"
  awk -F'\t' '$1 == "R" && $2 == "overwrite" { print $4 }' "$tmp/verdicts.txt" | tr '\n' '\0' > "$tmp/over.z"
  awk -F'\t' '$1 == "R" && ($2 == "write" || $2 == "overwrite") { print $4 }' "$tmp/verdicts.txt" > "$tmp/laid.paths"
  awk -F'\t' '$1 == "R" && $2 == "delete" { print $4 }' "$tmp/verdicts.txt" > "$tmp/del.paths"
  if [ -s "$tmp/write.z" ]; then
    tar -C "$tmp/in" --null -T "$tmp/write.z" -cf "$tmp/write.tar" || { rm -rf "$tmp"; return 1; }
    tar -xpf "$tmp/write.tar" -C "$d" --no-same-owner --skip-old-files || { rm -rf "$tmp"; return 1; }
  fi
  if [ -s "$tmp/over.z" ]; then
    tar -C "$tmp/in" --null -T "$tmp/over.z" -cf "$tmp/over.tar" || { rm -rf "$tmp"; return 1; }
    tar -xpf "$tmp/over.tar" -C "$d" --no-same-owner || { rm -rf "$tmp"; return 1; }
  fi
  while IFS=$'\t' read -r r v _ p _; do
    case "$v" in
      write) n_w=$((n_w + 1)) ;;
      overwrite) n_o=$((n_o + 1)) ;;
      skip) n_s=$((n_s + 1)) ;;
      gone) n_g=$((n_g + 1)) ;;
      delete) rm -f -- "$d/$p" && n_d=$((n_d + 1)) ;;
    esac
  done < <(awk -F'\t' '$1 == "R"' "$tmp/verdicts.txt")
  while IFS=$'\t' read -r k p; do
    # restage only a path this merge laid (S) or deleted (X); a skipped path keeps the destination's index
    case "$k" in
      S) grep -Fxq -- "$p" "$tmp/laid.paths" || continue ;;
      X) grep -Fxq -- "$p" "$tmp/del.paths" || continue ;;
      *) continue ;;
    esac
    __mvbox_restage "$d" "$k" "$p" || { rm -rf "$tmp"; return 1; }
  done < "$tmp/meta.txt"
  echo "written=$n_w"; echo "overwritten=$n_o"; echo "deleted=$n_d"; echo "skipped=$n_s"; echo "gone=$n_g"
  rm -rf "$tmp"
  return 0
}

# .what = per role, the newest claude transcript titled for it: `<role>\t<kind>\t<rel>\t<bytes>\t<mtime>`
#         kind = tree (rel is relative to the tree) | legacy (rel is a name in the tree's legacy project dir)
#         a role with none reads `<role>\tabsent`
# .note = the same search the resume probe makes (crewwork.sh __crew_session_adopt_cmd): the seat record's
#         actor first, then every actor's brain projects and clone history, then the legacy dir
__mvbox_transcripts() {
  local d A cs lg w t f rec_dir rt c kind rel
  d="$(__mvbox_tree_dir "$1")" || return 3
  shift
  A="$d/.agent/.actors"
  cs="$(printf '%s' "$d" | sed 's#[^A-Za-z0-9]#-#g')"
  lg="${CREW_LEGACY_CLAUDE_DIR:-$HOME/.claude}/projects/$cs"
  for w in "$@"; do
    t="\"customTitle\":\"$w\""; f=""; rec_dir=""
    if [ -L "$A/.slugs/$w" ]; then
      rt="$(readlink -f "$A/.slugs/$w" 2>/dev/null)"
      rec_dir="$(printf '%s' "$rt" | sed -nE 's#^(.*/actor\.via\.[^/]+)/.*$#\1#p')"
    fi
    if [ -n "$rec_dir" ]; then
      f="$(grep -l "$t" "$rec_dir"/brain/.claude/projects/*/*.jsonl "$rec_dir"/clones/serial=*/history/*.jsonl 2>/dev/null | xargs -r ls -t 2>/dev/null | head -1)"
    fi
    if [ -z "$f" ]; then
      f="$(grep -l "$t" "$A"/actor.via.*=*/brain/.claude/projects/*/*.jsonl "$A"/actor.via.*=*/clones/serial=*/history/*.jsonl "$lg"/*.jsonl 2>/dev/null | xargs -r ls -t 2>/dev/null | head -1)"
    fi
    if [ -z "$f" ] && [ "$w" = mechanic ]; then
      f="$(for c in $(grep -L '"customTitle"' "$A"/actor.via.*=*/brain/.claude/projects/*/*.jsonl "$lg"/*.jsonl 2>/dev/null); do grep -m1 '"type":"user"' "$c" | grep -q 'hi, please drive' && echo "$c"; done | xargs -r ls -t 2>/dev/null | head -1)"
    fi
    if [ -z "$f" ]; then printf '%s\tabsent\n' "$w"; continue; fi
    case "$f" in
      "$d"/*) kind=tree; rel="${f#"$d"/}" ;;
      *) kind=legacy; rel="$(basename "$f")" ;;
    esac
    printf '%s\t%s\t%s\t%s\t%s\n' "$w" "$kind" "$rel" "$(stat -c %s -- "$f")" "$(stat -c %Y -- "$f")"
  done
  return 0
}

# .what = stdout: a tgz of the roles' transcripts (and the session dir that sits beside each one)
#         list.txt, intree.tar (paths relative to the tree), legacy.tar (names in the legacy project dir)
__mvbox_transcripts_pack() {
  local slug="$1" d tmp cs lg w kind rel bytes mtime sid rc
  shift
  d="$(__mvbox_tree_dir "$slug")" || return 3
  tmp="$(mktemp -d)"
  cs="$(printf '%s' "$d" | sed 's#[^A-Za-z0-9]#-#g')"
  lg="${CREW_LEGACY_CLAUDE_DIR:-$HOME/.claude}/projects/$cs"
  : > "$tmp/intree.z"; : > "$tmp/legacy.z"
  __mvbox_transcripts "$slug" "$@" > "$tmp/list.txt"
  while IFS=$'\t' read -r w kind rel bytes mtime; do
    [ "$kind" = absent ] && continue
    sid="${rel%.jsonl}"
    if [ "$kind" = tree ]; then
      printf '%s\0' "$rel" >> "$tmp/intree.z"
      if [ -d "$d/$sid" ]; then printf '%s\0' "$sid" >> "$tmp/intree.z"; fi
    else
      printf '%s\0' "$rel" >> "$tmp/legacy.z"
      if [ -d "$lg/$sid" ]; then printf '%s\0' "$sid" >> "$tmp/legacy.z"; fi
    fi
  done < "$tmp/list.txt"
  local -a members=(list.txt)
  if [ -s "$tmp/intree.z" ]; then tar -C "$d" --null -T "$tmp/intree.z" -cf "$tmp/intree.tar" || { rm -rf "$tmp"; return 1; }; members+=(intree.tar); fi
  if [ -s "$tmp/legacy.z" ]; then tar -C "$lg" --null -T "$tmp/legacy.z" -cf "$tmp/legacy.tar" || { rm -rf "$tmp"; return 1; }; members+=(legacy.tar); fi
  rc=0
  tar -czf - -C "$tmp" "${members[@]}" || rc=$?
  rm -rf "$tmp"
  return $rc
}

# .what = stdin: the tgz __mvbox_transcripts_pack made. lays each transcript where the resume probe looks.
#         a brain project dir is renamed to this tree's own (claude keys it on the cwd), and an older copy
#         never overwrites a newer one
# .out  = `placed=<n>`
__mvbox_transcripts_unpack() {
  local d tmp enc lgd f pre rest dst err n=0
  d="$(__mvbox_tree_dir "$1")" || { echo "✋ ConstraintError: no tree $1 on this grove to unpack into" >&2; echo "   └─ fix: plan the move again; the plan re-reads where the tree stands" >&2; return 2; }
  tmp="$(mktemp -d)"
  tar -xzf - -C "$tmp" || { rm -rf "$tmp"; return 1; }
  enc="$(printf '%s' "$d" | sed 's#[^A-Za-z0-9]#-#g')"
  if [ -f "$tmp/intree.tar" ]; then
    mkdir -p "$tmp/in"
    tar -xpf "$tmp/intree.tar" -C "$tmp/in" || { rm -rf "$tmp"; return 1; }
    while IFS= read -r -d '' f; do
      f="${f#./}"
      case "$f" in
        */brain/.claude/projects/*/*)
          pre="${f%%/projects/*}/projects"; rest="${f#*/projects/*/}"; dst="$d/$pre/$enc/$rest" ;;
        *) dst="$d/$f" ;;
      esac
      # a copy that fails is a transcript the resume cannot read: say which, and halt, never count past it
      err="$( { mkdir -p "$(dirname "$dst")" && cp -pu -- "$tmp/in/$f" "$dst"; } 2>&1)" || {
        echo "💥 MalfunctionError: the transcript $f could not be placed at $dst: ${err:-no reason given}" >&2
        rm -rf "$tmp"; return 1
      }
      n=$((n + 1))
    done < <(cd "$tmp/in" && find . -type f -print0)
  fi
  if [ -f "$tmp/legacy.tar" ]; then
    lgd="${CREW_LEGACY_CLAUDE_DIR:-$HOME/.claude}/projects/$enc"
    mkdir -p "$tmp/lg" "$lgd"
    tar -xpf "$tmp/legacy.tar" -C "$tmp/lg" || { rm -rf "$tmp"; return 1; }
    err="$(cp -pru "$tmp/lg/." "$lgd/" 2>&1)" || {
      echo "💥 MalfunctionError: the legacy transcripts could not be placed at $lgd: ${err:-no reason given}" >&2
      rm -rf "$tmp"; return 1
    }
    n=$((n + $(find "$tmp/lg" -type f | wc -l)))
  fi
  echo "placed=$n"
  rm -rf "$tmp"
  return 0
}

# .what = stdout: a git bundle of the commits no remote holds (the branch, minus every remote ref)
__mvbox_bundle() {
  local d branch
  d="$(__mvbox_tree_dir "$1")" || return 3
  branch="$(git -C "$d" symbolic-ref --short -q HEAD)" || return 2
  git -C "$d" bundle create - "$branch" --not --remotes 2>/dev/null
}

# .what = rc 0 when a path sits under <base>/_mirrors/ (the mirror worktrees a repo keeps beside its tree dirs)
#         args: base path
__mvbox_in_mirrors() {
  local base="$1" p="$2" real
  case "$p" in "$base/_mirrors/"*) return 0 ;; esac
  real="$(cd -P "$base/_mirrors" 2>/dev/null && pwd -P)" || return 1
  case "$p" in "$real/"*) return 0 ;; esac
  return 1
}

# .what = rc 0 when a worktree holds no change at all: no modified, staged, or untracked path
#         rc 1 when it does, or when git cannot read it. stricter than __mvbox_tree_clean, since a delete rides on it
__mvbox_strict_clean() {
  local out
  out="$(git -C "$1" status --porcelain --untracked-files=all 2>/dev/null)" || return 1
  [ -z "$out" ]
}

# .what = whether a commit stands in the history of the tree's HEAD, read ON the source grove. args: slug sha
# .out  = `ancestor=yes|no`. a commit the source lacks reads `no`: the source head cannot hold it
# .why  = the destination may not hold the head yet when the plan reads it, but the source always does
__mvbox_is_ancestor() {
  local d head
  d="$(__mvbox_tree_dir "$1")" || return 3
  head="$(git -C "$d" rev-parse HEAD 2>/dev/null)"
  if [ -n "$head" ] && git -C "$d" merge-base --is-ancestor "$2" "$head" 2>/dev/null; then echo "ancestor=yes"; else echo "ancestor=no"; fi
  return 0
}

# .what = the commits of the tree's head history, newest first (a window of at most 5000), read ON the source grove
# .why  = the destination keeps out of its own walk every commit of this window that it holds, so what remains
#         is what the head lacks
__mvbox_head_window() {
  local d
  d="$(__mvbox_tree_dir "$1")" || return 3
  # an unread history is never an empty one: the twin judge would read it as "the head holds naught"
  git -C "$d" rev-list -n 5000 HEAD 2>/dev/null || { echo "💥 MalfunctionError: git cannot read the head history of $1 at $d" >&2; return 1; }
  return 0
}

# .what = the commits of a destination branch that the head window lacks, read ON the destination grove
#         args: org repodir sha. stdin: the head window. at most 2000 commits are listed
# .out  = `<sha>\t<patch-id, ->\t<subject>` per commit, or `overflow=yes` past the bound
#         a merge commit reads `merge`, since it has no patch of its own; a root or empty commit reads `-`
__mvbox_dest_only() {
  local org="$1" repodir="$2" sha="$3" main win have list c n pid subj
  main="$HOME/git${org:+/$org}/$repodir"
  win="$(cat)"
  # each read that decides "no commit is lost" keeps its rc: an unread walk is never an empty one
  have="$(printf '%s\n' "$win" | git -C "$main" cat-file --batch-check='%(objectname) %(objecttype)' 2>/dev/null)" || {
    echo "💥 MalfunctionError: git cannot check which head commits the destination holds, in $main" >&2; return 1; }
  have="$(printf '%s\n' "$have" | awk '$2 == "commit" { print $1 }')"
  list="$({ printf '%s\n' "$sha"; printf '%s\n' "$have" | sed '/^$/d; s/^/^/'; } | git -C "$main" rev-list --stdin -n 2001 2>/dev/null)" || {
    echo "💥 MalfunctionError: git cannot walk the destination branch at $sha, in $main" >&2; return 1; }
  if [ "$(printf '%s\n' "$list" | sed '/^$/d' | wc -l)" -gt 2000 ]; then echo "overflow=yes"; return 0; fi
  while IFS= read -r c; do
    [ -n "$c" ] || continue
    n="$(git -C "$main" rev-list --parents -n 1 "$c" 2>/dev/null | wc -w)"
    pid="-"
    if [ "$n" -gt 2 ]; then pid="merge"; fi
    if [ "$n" -eq 2 ]; then
      pid="$(git -C "$main" diff-tree -p "$c" 2>/dev/null | git patch-id --stable | awk '{print $1}')"
      [ -n "$pid" ] || pid="-"
    fi
    subj="$(git -C "$main" log -n 1 --format=%s "$c" 2>/dev/null)"
    printf '%s\t%s\t%s\n' "$c" "$pid" "$subj"
  done <<< "$list"
  return 0
}

# .what = which destination-only commits the source head holds by patch identity, read ON the source grove
#         args: slug. stdin: the `<sha>\t<patch-id>\t<subject>` rows __mvbox_dest_only printed
# .out  = `<sha>\ttwin|none|merge\t<subject>` per row. a patch-id of `-` has no twin; `merge` marks a merge commit
__mvbox_twin_judge() {
  local d ids c pid subj
  d="$(__mvbox_tree_dir "$1")" || return 3
  ids="$(git -C "$d" log -p --no-merges -n 5000 HEAD 2>/dev/null | git patch-id --stable | awk '{print $1}')"
  while IFS=$'\t' read -r c pid subj; do
    [ -n "$c" ] || continue
    if [ "$pid" = merge ]; then
      printf '%s\tmerge\t%s\n' "$c" "$subj"
    elif [ "$pid" != "-" ] && printf '%s\n' "$ids" | grep -Fxq -- "$pid"; then
      printf '%s\ttwin\t%s\n' "$c" "$subj"
    else
      printf '%s\tnone\t%s\n' "$c" "$subj"
    fi
  done
  return 0
}

# .what = settle a stale copy of the branch at the destination, so the worktree can rise on the head
#         args: org repodir branch head
#         - a clean mirror worktree under <base>/_mirrors/ that holds the branch is removed (git worktree remove, never --force)
#         - a branch behind the head (an ancestor of it) is fast-forwarded to the head
#         - a branch that diverged only by a rebase (setaside = yes, and every commit it holds that the head lacks
#           has a patch twin in the head, judged again here) is set aside under refs/crew-move-setaside/<branch>/<sha>,
#           read back, then pointed at the head. no commit is ever deleted: the ref keeps the old tip reachable
#         - setaside = force does the same past commits with no patch twin (the caller named why they are kept);
#           a merge commit the head lacks is refused either way
#         rc 2, naught touched, when any holder is not a clean mirror, or the branch holds a commit the head lacks
#         that no setaside vouches for
# .out  = `removed_mirror=<path>`, `settled=fast-forward|set-aside`, `settled_from=<sha>`, and for a set-aside
#         `setaside_ref=<ref>`; each act is read back before it prints
__mvbox_settle() {
  local org="$1" repodir="$2" branch="$3" head="$4" setaside="${5:-}" base main sha at aref="" ff=yes cherry="" merges=""
  base="$HOME/git${org:+/$org}"; main="$base/$repodir"
  sha="$(git -C "$main" rev-parse --verify -q "refs/heads/$branch" 2>/dev/null)"
  [ -n "$sha" ] || return 0
  at="$(git -C "$main" worktree list --porcelain 2>/dev/null | awk -v b="refs/heads/$branch" '/^worktree /{p=substr($0,10)} $0=="branch " b {print p}')"
  # judge first: naught is touched until every check holds
  if [ -n "$at" ]; then
    __mvbox_in_mirrors "$base" "$at" || { echo "✋ ConstraintError: branch $branch is checked out at the destination in $at, which is no mirror worktree" >&2; echo "   └─ fix: free the branch there (git -C $at switch --detach, or move that tree first), then plan the move again" >&2; return 2; }
    __mvbox_strict_clean "$at" || { echo "✋ ConstraintError: the mirror worktree $at that holds branch $branch is dirty" >&2; echo "   └─ fix: read it (git -C $at status), commit or clear its dirt, then plan the move again" >&2; return 2; }
  fi
  if [ "$sha" != "$head" ]; then
    if ! git -C "$main" merge-base --is-ancestor "$sha" "$head" 2>/dev/null; then
      ff=no
      [ -n "$setaside" ] || { echo "✋ ConstraintError: branch $branch at the destination ($sha) holds commits that $head lacks" >&2; echo "   └─ fix: pass --setaside-why '<why>' to keep the old tip and settle past it, or settle the branch at the destination, then plan the move again" >&2; return 2; }
      # the box judges the twins again: a commit of the branch with no patch twin in the head stays refused, unless
      # the caller named a reason to keep it (setaside = force); a merge stays refused either way
      # each re-judge keeps its rc: a cherry or a merge walk that fails is no proof of a twin, so it halts the settle
      cherry="$(git -C "$main" cherry "$head" "$sha" 2>/dev/null)" || {
        echo "💥 MalfunctionError: git cherry could not compare branch $branch at the destination ($sha) with $head" >&2; return 1; }
      merges="$(git -C "$main" rev-list --merges "$sha" --not "$head" 2>/dev/null)" || {
        echo "💥 MalfunctionError: git could not list the merge commits of branch $branch at the destination ($sha)" >&2; return 1; }
      if [ "$setaside" = yes ] && printf '%s\n' "$cherry" | grep -q '^+'; then
        echo "✋ ConstraintError: branch $branch at the destination ($sha) holds a commit with no patch twin in $head" >&2
        echo "   └─ fix: carry that commit into the source branch (cherry-pick it there), or settle the branch at the destination, then plan the move again" >&2; return 2
      fi
      if [ -n "$merges" ]; then
        echo "✋ ConstraintError: branch $branch at the destination ($sha) holds a merge commit that $head lacks" >&2
        echo "   └─ fix: settle the branch at the destination by hand (a merge is never set aside), then plan the move again" >&2; return 2
      fi
      aref="refs/crew-move-setaside/$branch/$sha"
    fi
  fi
  # act, and read each act back
  if [ -n "$at" ]; then
    git -C "$main" worktree remove "$at" >&2 || return 1
    if git -C "$main" worktree list --porcelain 2>/dev/null | grep -Fxq "worktree $at"; then return 1; fi
    echo "removed_mirror=$at"
  fi
  if [ -n "$aref" ]; then
    # the old tip is kept first, and read back, before the branch moves
    if [ "$(git -C "$main" rev-parse --verify -q "$aref" 2>/dev/null)" != "$sha" ]; then
      __mvbox_git -C "$main" update-ref -m "git.crew.move: set aside $branch" "$aref" "$sha" "" >&2 || return 1
    fi
    [ "$(git -C "$main" rev-parse --verify -q "$aref" 2>/dev/null)" = "$sha" ] || return 1
  fi
  if [ "$sha" != "$head" ]; then
    __mvbox_git -C "$main" update-ref -m "git.crew.move: settle $branch" "refs/heads/$branch" "$head" "$sha" >&2 || return 1
    [ "$(git -C "$main" rev-parse --verify -q "refs/heads/$branch" 2>/dev/null)" = "$head" ] || return 1
    if [ "$ff" = yes ]; then echo "settled=fast-forward"; else echo "settled=set-aside"; echo "setaside_ref=$aref"; fi
    echo "settled_from=$sha"
  fi
  return 0
}

# .what = judge a stale twin: a worktree that already stands at the destination path of the tree, left by an
#         earlier life of the same tree on this box. read-only. args: org repodir slug
# .out  = `twin_registered`, `twin_head`, `twin_branch`, `twin_dirty` (count of `git status --porcelain` lines,
#         untracked included), `twin_upstream` (none when unset or gone), `twin_ahead`, `twin_behind`,
#         `twin_main_ref`, `twin_in_main` (yes|no), `twin_procs` (processes whose cwd sits in the twin), and
#         `twin_safe=yes|no` with one `twin_unsafe=<why>` per check that fails
# .why  = a twin is safe to drop only when naught it holds would be lost: no dirty path, no commit its upstream
#         lacks or holds beyond it, its head already in origin/main, and no process at work in it
__mvbox_twin_state() {
  local org="$1" repodir="$2" slug="$3" base main wt head branch dirty up ab ahead="" behind="" mref inmain=no p cwd procs=0 claude=0 safe=yes
  base="$HOME/git${org:+/$org}"; main="$base/$repodir"; wt="$base/_worktrees/$slug"
  if ! { [ -e "$wt/.git" ] && git -C "$main" worktree list --porcelain 2>/dev/null | grep -Fxq "worktree $wt"; }; then
    echo "twin_registered=no"; echo "twin_safe=no"; echo "twin_unsafe=the path is no worktree the destination repo registers"; return 0
  fi
  echo "twin_registered=yes"
  head="$(git -C "$wt" rev-parse HEAD 2>/dev/null)"; echo "twin_head=$head"
  branch="$(git -C "$wt" symbolic-ref --short -q HEAD 2>/dev/null)"; echo "twin_branch=$branch"
  if dirty="$(git -C "$wt" status --porcelain --untracked-files=all 2>/dev/null)"; then
    # one row per line, each closed by a newline: `$(...)` strips the last one, and wc -l counts newlines, so a
    # bare printf '%s' would read one dirty path as 0 and call the twin safe
    dirty="$(printf '%s\n' "$dirty" | sed '/^$/d' | wc -l | tr -d ' ')"
  else
    dirty="unreadable"
  fi
  echo "twin_dirty=$dirty"
  [ "$dirty" = 0 ] || { safe=no; echo "twin_unsafe=$dirty dirty path(s)"; }
  up=""
  [ -n "$branch" ] && up="$(git -C "$wt" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null)"
  if [ -z "$up" ]; then
    echo "twin_upstream=none"; safe=no; echo "twin_unsafe=no upstream to prove its commits pushed"
  else
    echo "twin_upstream=$up"
    ab="$(git -C "$wt" rev-list --left-right --count 'HEAD...@{u}' 2>/dev/null)"
    ahead="$(printf '%s' "$ab" | awk '{print $1}')"; behind="$(printf '%s' "$ab" | awk '{print $2}')"
    echo "twin_ahead=$ahead"; echo "twin_behind=$behind"
    if [ "$ahead" != 0 ] || [ "$behind" != 0 ]; then safe=no; echo "twin_unsafe=upstream ahead/behind ${ahead:-?}/${behind:-?}, not 0/0"; fi
  fi
  mref="$(git -C "$main" symbolic-ref -q refs/remotes/origin/HEAD 2>/dev/null)"
  [ -n "$mref" ] || mref="refs/remotes/origin/main"
  echo "twin_main_ref=${mref#refs/remotes/}"
  if [ -n "$head" ] && git -C "$main" rev-parse --verify -q "$mref" >/dev/null 2>&1 && git -C "$main" merge-base --is-ancestor "$head" "$mref" 2>/dev/null; then inmain=yes; fi
  echo "twin_in_main=$inmain"
  [ "$inmain" = yes ] || { safe=no; echo "twin_unsafe=its head is not in ${mref#refs/remotes/}"; }
  for p in /proc/[0-9]*; do
    cwd="$(readlink "$p/cwd" 2>/dev/null)" || continue
    case "$cwd" in
      "$wt"|"$wt"/*)
        procs=$((procs + 1))
        case "$(tr '\0' ' ' < "$p/cmdline" 2>/dev/null)" in *claude*) claude=$((claude + 1)) ;; esac ;;
    esac
  done
  echo "twin_procs=$procs"
  echo "twin_claude=$claude"
  [ "$procs" = 0 ] || { safe=no; echo "twin_unsafe=$procs process(es) at work in it"; }
  echo "twin_safe=$safe"
  return 0
}

# .what = drop a stale twin the caller vouched for: judge it again here, then `git worktree remove` (never --force,
#         so git itself refuses any modified or untracked path), and read back that it is gone. args: org repodir slug
# .out  = `dropped_twin=<path>`, `dropped_twin_head=<sha>`. rc 2 = the twin is not safe (naught touched)
# .note = the branch the twin held stays; only the worktree goes. its gitignored files (install output, actor
#         state) go with it, since none of them is work
__mvbox_twin_drop() {
  local org="$1" repodir="$2" slug="$3" base main wt st
  base="$HOME/git${org:+/$org}"; main="$base/$repodir"; wt="$base/_worktrees/$slug"
  st="$(__mvbox_twin_state "$org" "$repodir" "$slug")"
  if ! printf '%s\n' "$st" | grep -Fxq "twin_safe=yes"; then
    echo "✋ ConstraintError: the stale twin $wt is not safe to drop: $(printf '%s\n' "$st" | sed -n 's/^twin_unsafe=//p' | paste -sd ';' - | sed 's/;/; /g')" >&2
    echo "   └─ fix: pass --setaside-twin-why '<why>' to keep the twin whole, or clear what it holds, then plan the move again" >&2
    return 2
  fi
  __mvbox_git -C "$main" worktree remove "$wt" >&2 || return 1
  if git -C "$main" worktree list --porcelain 2>/dev/null | grep -Fxq "worktree $wt"; then return 1; fi
  [ ! -e "$wt" ] || return 1
  echo "dropped_twin=$wt"
  echo "dropped_twin_head=$(printf '%s\n' "$st" | sed -n 's/^twin_head=//p')"
  return 0
}

# .what = the digest of a worktree's work, read-only: its head, its branch, its top-level entry count, and one row per path
#         `git status` lists (untracked included): `<XY>\t<sha256 | link:<target> | dir | absent>\t<path>`. args: dir
# .why  = the proof that a set-aside tree holds the same work the twin held: the same digest before and after the rename
# .note = --no-optional-locks: the read never writes the index, so the digest before a rename cannot change what it reads
__mvbox_aside_digest() {
  local d="$1" e x p sum
  git -C "$d" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 1
  printf 'head=%s\n' "$(git -C "$d" rev-parse HEAD 2>/dev/null)"
  printf 'branch=%s\n' "$(git -C "$d" symbolic-ref --short -q HEAD 2>/dev/null)"
  printf 'entries=%s\n' "$(find "$d" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l | tr -d ' ')"
  while IFS= read -r -d '' e; do
    x="${e:0:2}"; p="${e:3}"
    if [ -L "$d/$p" ]; then sum="link:$(readlink "$d/$p")"
    elif [ -f "$d/$p" ]; then sum="$(sha256sum < "$d/$p" | cut -c1-64)"
    elif [ -d "$d/$p" ]; then sum="dir"
    else sum="absent"; fi
    printf '%s\t%s\t%s\n' "$x" "$sum" "$p"
  done < <(git --no-optional-locks -C "$d" status --porcelain=v1 -z --no-renames --untracked-files=all 2>/dev/null)
  return 0
}

# .what = aim a renamed twin and its renamed git admin dir at each other, each prior pointer kept as *.prior
#         args: aside aadmin common
# .out  = rc 0 = every pointer written; rc 1 = a write failed (the caller undoes)
__mvbox_twin_setaside_point() {
  local aside="$1" aadmin="$2" common="$3" f
  cp -p "$aside/.git" "$aadmin/gitlink.prior" || return 1
  for f in gitdir commondir; do
    [ ! -e "$aadmin/$f" ] || cp -p "$aadmin/$f" "$aadmin/$f.prior" || return 1
  done
  # each write names its own refusal: bash's own redirect error carries a source line number, which drifts with every edit
  { printf 'gitdir: %s\n' "$aadmin" > "$aside/.git"; } 2>/dev/null || { echo "the write of $aside/.git was refused" >&2; return 1; }
  { printf '%s\n' "$aside/.git" > "$aadmin/gitdir"; } 2>/dev/null || { echo "the write of $aadmin/gitdir was refused" >&2; return 1; }
  { printf '%s\n' "$common" > "$aadmin/commondir"; } 2>/dev/null || { echo "the write of $aadmin/commondir was refused" >&2; return 1; }
}

# .what = undo a set-aside whose pointer writes failed: each prior pointer back, then both renames back
#         args: aside aadmin wt admin
# .out  = a 💥 line on stderr that says where the twin stands now, with its cure
__mvbox_twin_setaside_undo() {
  local aside="$1" aadmin="$2" wt="$3" admin="$4" f
  [ ! -e "$aadmin/gitlink.prior" ] || cp -p "$aadmin/gitlink.prior" "$aside/.git"
  for f in gitdir commondir; do
    [ ! -e "$aadmin/$f.prior" ] || cp -p "$aadmin/$f.prior" "$aadmin/$f"
  done
  rm -f "$aadmin/gitlink.prior" "$aadmin/gitdir.prior" "$aadmin/commondir.prior"
  if mv "$aadmin" "$admin" && mv "$aside" "$wt"; then
    echo "💥 MalfunctionError: a pointer of the set-aside twin could not be written; the twin was put back at $wt" >&2
    echo "   └─ fix: read the twin (git -C $wt status), clear the cause (disk space, permissions), then run this again" >&2
    return 0
  fi
  echo "💥 MalfunctionError: a pointer of the set-aside twin could not be written, and the put-back did not finish" >&2
  echo "   └─ fix: the twin's bytes stand at $aside or $wt, its git admin at $aadmin or $admin; move each back by hand, then run this again" >&2
}

# .what = set a stale twin aside, losslessly, so the destination path and its branch are free for the move:
#         1. judge it again here: a registered worktree, with no process (a claude above all) whose cwd sits in it
#         2. digest its work (__mvbox_aside_digest)
#         3. rename the twin dir whole to <base>/_setaside/<slug>.<stamp>, and its git admin dir (.git/worktrees/<id>)
#            beside it as <that path>.gitadmin. the admin dir out of .git/worktrees/ IS the registration: the repo no
#            longer lists the twin, so the branch is free. no byte is deleted; the index and the twin's own refs ride along
#         4. point the two at each other (the .git link of the tree, and gitdir and commondir of the admin dir), each
#            prior pointer kept as *.prior in the admin dir, so `git -C <set-aside path> status` reads the twin's work
#         5. read back: the repo lists no worktree at the old path, the old path is free, and the set-aside tree digests
#            the same as the twin did
#         args: org repodir slug stamp
# .out  = `set_aside_twin=<path>`, `set_aside_admin=<path>`, `set_aside_head=<sha>`, `set_aside_dirty=<n>`.
#         rc 2 = refused, naught touched. rc 1 = a miss; a rename that fails midway is undone
# .note = the set-aside tree is unregistered, so a gc in the repo never counts its index as a root: a blob staged there and
#         nowhere else is kept by the gc grace window alone. its head is a commit of its branch, which the repo keeps
__mvbox_twin_setaside() {
  local org="$1" repodir="$2" slug="$3" stamp="$4" base main wt st procs claude gl admin common aside aadmin before after f
  base="$HOME/git${org:+/$org}"; main="$base/$repodir"; wt="$base/_worktrees/$slug"
  st="$(__mvbox_twin_state "$org" "$repodir" "$slug")"
  if ! printf '%s\n' "$st" | grep -Fxq "twin_registered=yes"; then
    echo "✋ ConstraintError: $wt is no worktree the destination repo registers, so there is no twin to set aside" >&2
    echo "   └─ fix: plan the move again; the plan re-reads that path" >&2
    return 2
  fi
  procs="$(printf '%s\n' "$st" | sed -n 's/^twin_procs=//p')"; claude="$(printf '%s\n' "$st" | sed -n 's/^twin_claude=//p')"
  if [ "${claude:-0}" != 0 ]; then
    echo "✋ ConstraintError: a live claude is at work in the stale twin $wt ($claude process(es) with its cwd there); a twin in use is never set aside" >&2
    echo "   └─ fix: end that claude at the destination (its seat lives in the twin), then run this again" >&2
    return 2
  fi
  if [ "${procs:-0}" != 0 ]; then
    echo "✋ ConstraintError: $procs process(es) at work in the stale twin $wt; a twin in use is never set aside" >&2
    echo "   └─ fix: end each process whose cwd sits in $wt at the destination, then run this again" >&2
    return 2
  fi
  # each miss below lands before the rename, so naught was touched: the cure is a hand read of the twin
  local cure_twin="   └─ fix: naught was touched; read the twin by hand (git -C $wt status; git -C $main worktree list), repair it, then run this again"
  gl="$(sed -n 's/^gitdir: //p' "$wt/.git" 2>/dev/null | head -n 1)"
  [ -n "$gl" ] || { echo "💥 MalfunctionError: the .git of the stale twin $wt names no gitdir" >&2; echo "$cure_twin" >&2; return 1; }
  case "$gl" in /*) admin="$gl" ;; *) admin="$wt/$gl" ;; esac
  admin="$(cd "$admin" 2>/dev/null && pwd -P)" || { echo "💥 MalfunctionError: the git admin dir of the stale twin ($gl) is absent" >&2; echo "$cure_twin" >&2; return 1; }
  common="$(cd "$admin" 2>/dev/null && cd "$(cat commondir 2>/dev/null || echo ../..)" 2>/dev/null && pwd -P)" || {
    echo "💥 MalfunctionError: the common git dir of the stale twin could not be read from $admin/commondir" >&2; echo "$cure_twin" >&2; return 1; }
  aside="$base/_setaside/$slug.$stamp"; aadmin="$aside.gitadmin"
  if [ -e "$aside" ] || [ -e "$aadmin" ]; then
    echo "✋ ConstraintError: the set-aside path $aside (or $aadmin) is already taken" >&2
    echo "   └─ fix: read what stands there, move it elsewhere, then run this again" >&2
    return 2
  fi
  before="$(__mvbox_aside_digest "$wt")" || { echo "💥 MalfunctionError: the work of the stale twin $wt could not be read" >&2; echo "$cure_twin" >&2; return 1; }

  # the rename: the tree whole, then its admin dir; a second rename that fails puts the first back
  mkdir -p "$base/_setaside" || return 1
  mv "$wt" "$aside" || { echo "💥 MalfunctionError: the stale twin $wt could not be renamed to $aside" >&2; return 1; }
  if ! mv "$admin" "$aadmin"; then
    mv "$aside" "$wt"
    echo "💥 MalfunctionError: the git admin dir $admin could not be moved to $aadmin; the twin was put back at $wt" >&2
    return 1
  fi

  # the pointers: each prior one kept, then each aimed at the set-aside pair. a write that fails puts
  # each prior pointer back and both renames back, so a miss here never leaves a tree whose .git names naught
  if ! __mvbox_twin_setaside_point "$aside" "$aadmin" "$common"; then
    __mvbox_twin_setaside_undo "$aside" "$aadmin" "$wt" "$admin"
    return 1
  fi

  # read back: the registration is gone, the path is free, the work stands whole at the set-aside path.
  # each miss below lands after the rename: every byte stands at $aside, so the cure reads it there
  local cure_aside="   └─ fix: the twin's bytes stand at $aside (its git admin at $aadmin); read it (git -C $aside status), then run this again"
  if git -C "$main" worktree list --porcelain 2>/dev/null | grep -Fxq "worktree $wt"; then
    echo "💥 MalfunctionError: the repo still lists a worktree at $wt after the set-aside" >&2; echo "$cure_aside" >&2; return 1
  fi
  [ ! -e "$wt" ] || { echo "💥 MalfunctionError: $wt still stands after the set-aside" >&2; echo "$cure_aside" >&2; return 1; }
  after="$(__mvbox_aside_digest "$aside")" || { echo "💥 MalfunctionError: the set-aside tree $aside could not be read back" >&2; echo "$cure_aside" >&2; return 1; }
  if [ "$before" != "$after" ]; then
    echo "💥 MalfunctionError: the set-aside tree $aside does not digest as the twin did:" >&2
    diff <(printf '%s\n' "$before") <(printf '%s\n' "$after") | sed -n 's/^[<>] /   /p' >&2
    echo "$cure_aside" >&2
    return 1
  fi
  echo "set_aside_twin=$aside"
  echo "set_aside_admin=$aadmin"
  echo "set_aside_head=$(printf '%s\n' "$before" | sed -n 's/^head=//p')"
  echo "set_aside_dirty=$(printf '%s\n' "$before" | grep -c $'\t')"
  return 0
}

# .what = the destination's facts (read-only). args: org repodir slug branch head
__mvbox_dest_facts() {
  local org="$1" repodir="$2" slug="$3" branch="$4" head="$5" base main wt sha at gd op m
  base="$HOME/git${org:+/$org}"; main="$base/$repodir"; wt="$base/_worktrees/$slug"
  echo "main=$main"
  echo "tree=$wt"
  if [ -d "$main/.git" ] || [ -f "$main/.git" ]; then
    echo "main_present=yes"
    if git -C "$main" cat-file -e "$head^{commit}" 2>/dev/null; then echo "has_head=yes"; else echo "has_head=no"; fi
    if git -C "$main" worktree list --porcelain 2>/dev/null | grep -Fxq "worktree $wt"; then echo "registered=yes"; else echo "registered=no"; fi
    sha="$(git -C "$main" rev-parse --verify -q "refs/heads/$branch" 2>/dev/null)"
    if [ -z "$sha" ]; then echo "branch_state=absent"
    elif [ "$sha" = "$head" ]; then echo "branch_state=at_head"
    else echo "branch_state=elsewhere"; fi
    echo "branch_sha=$sha"
    at="$(git -C "$main" worktree list --porcelain 2>/dev/null | awk -v b="refs/heads/$branch" '/^worktree /{p=substr($0,10)} $0=="branch " b {print p}')"
    echo "branch_at=$at"
    if [ -n "$at" ] && __mvbox_in_mirrors "$base" "$at"; then echo "branch_at_mirror=yes"; else echo "branch_at_mirror=no"; fi
    if [ -n "$at" ] && __mvbox_strict_clean "$at"; then echo "branch_at_clean=yes"; else echo "branch_at_clean=no"; fi
  else
    echo "main_present=no"
    echo "has_head=no"
    echo "registered=no"
    echo "branch_state=absent"
    echo "branch_sha="
    echo "branch_at="
    echo "branch_at_mirror=no"
    echo "branch_at_clean=no"
  fi
  if [ -e "$wt" ]; then echo "tree_exists=yes"; else echo "tree_exists=no"; fi
  if [ -e "$wt/.git" ]; then
    echo "tree_branch=$(git -C "$wt" symbolic-ref --short -q HEAD 2>/dev/null)"
    echo "tree_head=$(git -C "$wt" rev-parse HEAD 2>/dev/null)"
    gd="$(git -C "$wt" rev-parse --absolute-git-dir 2>/dev/null)"; op=""
    for m in rebase-merge rebase-apply MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD BISECT_LOG; do
      [ -e "$gd/$m" ] && op="$m"
    done
    echo "tree_op=$op"
  fi
  if __mvbox_half_made "$main" "$wt" "$branch" "$head"; then echo "half_made=yes"; else echo "half_made=no"; fi
  if __mvbox_cut_made "$main" "$wt" "$branch" "$head"; then echo "cut_made=yes"; else echo "cut_made=no"; fi
  return 0
}

# .what = make the destination repo ready: clone it if absent, fetch origin. args: org repodir origin head
# .out  = `cloned=yes|no`, `fetch=failed` + `fetch_said=<git's first line>` when the fetch failed, `has_head=yes|no`
__mvbox_prep() {
  local org="$1" repodir="$2" origin="$3" head="$4" main said
  main="$HOME/git${org:+/$org}/$repodir"
  if [ -d "$main/.git" ] || [ -f "$main/.git" ]; then
    echo "cloned=no"
  else
    [ -n "$origin" ] || { echo "✋ ConstraintError: the destination holds no $main and the source names no origin url to clone" >&2; echo "   └─ fix: give the source repo an origin (git remote add origin <url>), or clone the repo at the destination by hand, then plan the move again" >&2; return 2; }
    mkdir -p "$(dirname "$main")" || return 1
    __mvbox_git clone --quiet "$origin" "$main" >&2 || { echo "💥 MalfunctionError: git clone $origin failed at the destination" >&2; echo "   └─ fix: check the destination reaches the origin (git ls-remote $origin), then run this again" >&2; return 1; }
    echo "cloned=yes"
  fi
  # git's own words ride the facts, so a refusal names the network cause, not only its symptom
  if ! said="$(__mvbox_git -C "$main" fetch --quiet origin 2>&1 >/dev/null)"; then
    echo "fetch=failed"
    # git's first line names the cause (`fatal: ...`); its tail is advice
    echo "fetch_said=$(printf '%s\n' "$said" | grep -m1 .)"
  fi
  if git -C "$main" cat-file -e "$head^{commit}" 2>/dev/null; then echo "has_head=yes"; else echo "has_head=no"; fi
  return 0
}

# .what = stdin: a git bundle. its objects land in the destination repo. args: org repodir
__mvbox_unbundle() {
  local org="$1" repodir="$2" main tmp rc=0
  main="$HOME/git${org:+/$org}/$repodir"
  tmp="$(mktemp)"
  cat > "$tmp"
  __mvbox_git -C "$main" bundle unbundle "$tmp" >/dev/null 2>&1 || rc=$?
  rm -f "$tmp"
  return $rc
}

# .what = make the destination worktree on the branch at the head. args: org repodir slug branch head adopt settle
#         adopt = yes: a worktree a prior apply half made (registered, on the branch at the head, clean) is
#         taken as is, so a re-run of apply converges over it
#         adopt = cut: a worktree a logged cut apply left (registered, on the branch at the head, dirt allowed)
#         is taken as is; the move log vouches for it, and the carry is proved again after
#         settle = yes: a stale copy of the branch is settled first (__mvbox_settle), when the worktree is made new
#         setaside = yes | force: the settle may set aside a branch that diverged only by a rebase (patch twins), or
#         with force past commits with no twin; see __mvbox_settle
# .out  = `tree=<path>`, and `adopted=yes` when a half-made worktree was taken; with settle, the
#         `removed_mirror` and `settled` facts. rc 2 = a path or branch conflict, naught was made
__mvbox_up() {
  local org="$1" repodir="$2" slug="$3" branch="$4" head="$5" adopt="${6:-}" settle="${7:-}" setaside="${8:-}" base main wt sha
  base="$HOME/git${org:+/$org}"; main="$base/$repodir"; wt="$base/_worktrees/$slug"
  if [ -e "$wt" ]; then
    if [ "$adopt" = yes ] && __mvbox_half_made "$main" "$wt" "$branch" "$head"; then
      echo "adopted=yes"
    elif [ "$adopt" = cut ] && __mvbox_cut_made "$main" "$wt" "$branch" "$head"; then
      echo "adopted=yes"
    else
      echo "✋ ConstraintError: $wt already exists at the destination" >&2
      echo "   └─ fix: plan the move again; the plan judges that path (a twin to drop or set aside, or --into-extant)" >&2; return 2
    fi
  else
    mkdir -p "$base/_worktrees" || return 1
    if [ "$settle" = yes ]; then
      __mvbox_settle "$org" "$repodir" "$branch" "$head" "$setaside" || return $?
    fi
    sha="$(git -C "$main" rev-parse --verify -q "refs/heads/$branch" 2>/dev/null)"
    if [ -n "$sha" ]; then
      if [ "$sha" != "$head" ]; then echo "✋ ConstraintError: branch $branch exists at the destination at $sha, not at $head" >&2; echo "   └─ fix: plan the move again; the plan judges how to settle that branch (or pass --setaside-why '<why>')" >&2; return 2; fi
      __mvbox_git -C "$main" worktree add -q "$wt" "$branch" >&2 || return 1
    else
      __mvbox_git -C "$main" worktree add -q -b "$branch" "$wt" "$head" >&2 || return 1
    fi
  fi
  if git -C "$main" show-ref --verify -q "refs/remotes/origin/$branch"; then
    __mvbox_git -C "$wt" branch -q --set-upstream-to="origin/$branch" "$branch" >/dev/null 2>&1
  fi
  echo "tree=$(cd -P "$wt" && pwd -P)"
  return 0
}

# .what = the package dir a pnpm patch step named in its last ERR_PNPM_PATCH_FAILED line, when it is a dir under the
#         tree's own virtual store. args: tree-dir log. empty = no such line, or a dir outside the store
__mvbox_patch_failed_dir() {
  local d="$1" log="$2" p
  p="$(sed -n 's/.*ERR_PNPM_PATCH_FAILED.* Could not apply patch .* to \(.*\)$/\1/p' "$log" 2>/dev/null | tail -n 1)"
  case "$p" in
    *..*) return 0 ;;
    "$d"/node_modules/.pnpm/*) ;;
    *) return 0 ;;
  esac
  [ -d "$p" ] || return 0
  printf '%s' "$p"
  return 0
}

# .what = install the tree's dependencies by the repo's paved path. args: slug cmd shell
#         cmd empty = pnpm install --frozen-lockfile (pnpm-lock.yaml) | npm ci (package-lock.json) | none
#         shell empty = zsh -ic where zsh stands (the shell a seat runs, so fnm picks the node), else bash -lc
# .out  = `install=<cmd>`. rc 1 = the install failed (the log tail rides stderr)
# .note = two causes get one more run each, and no other cause does:
#         - a racy ENOENT from the package manager
#         - ERR_PNPM_PATCH_FAILED on a package dir whose files are read-only. a package that ships a built dist
#           ships it 0555/0444, pnpm copies it into the virtual store with that mode, and its patch step cannot
#           write such a file. a store that holds a cached patched copy (the source box, warm) applies no patch,
#           so the same lockfile installs there and fails on a cold store. the error names the package dir:
#           that dir alone is made writable by its owner, and the install runs again, once per named dir. the
#           run again is `--no-prefer-frozen-lockfile`: a frozen run imports every package afresh, and the dir is
#           read-only again; a run without it keeps each dir that stands and applies the patch there. the lockfile
#           is held by copy and compared after, and a change is restored and fails the install
__mvbox_install() {
  local slug="$1" cmd="${2:-}" shell="${3:-}" d log pdir rel rcmd cur shown lock_before="" n=0
  local -a fixed=()
  d="$(__mvbox_tree_dir "$slug")" || return 3
  if [ -z "$cmd" ]; then
    if [ -f "$d/pnpm-lock.yaml" ]; then cmd="pnpm install --frozen-lockfile"
    elif [ -f "$d/package-lock.json" ]; then cmd="npm ci"
    else cmd="none"; fi
  fi
  if [ "$cmd" = none ]; then echo "install=none"; return 0; fi
  # the report reads the first line of `install=...`, so a command that spans lines is shown on one
  shown="${cmd//$'\n'/ }"
  if [ -z "$shell" ]; then
    if command -v zsh >/dev/null 2>&1; then shell="zsh -ic"; else shell="bash -lc"; fi
  fi
  log="$d/.log/git.crew.move/install.log"
  mkdir -p "$(dirname "$log")"
  if ( cd "$d" && $shell "$cmd" ) > "$log" 2>&1; then
    echo "install=$shown"
    return 0
  fi
  # a package manager races itself on a fresh tree (a file it listed is gone before it reads it) and exits
  # with ENOENT, which a second run clears. one retry for that cause alone: any other failure stands, and
  # the first run's log is kept beside the second's
  if grep -q 'ENOENT' "$log"; then
    mv "$log" "$log.first"
    if ( cd "$d" && $shell "$cmd" ) > "$log" 2>&1; then
      echo "install=$shown (retried once after a racy ENOENT; first log: $log.first)"
      return 0
    fi
  fi
  # the retry runs the same install without the frozen preference: a frozen (headless) run imports every package again,
  # which makes the dir read-only again, while a run without it keeps each dir that stands and applies the patch there
  rcmd="${cmd//--frozen-lockfile/--no-prefer-frozen-lockfile}"
  # loop: bounded=8 one run per package dir the patch step names, and a dir named twice stops the loop
  while [ "$n" -lt 8 ]; do
    pdir="$(__mvbox_patch_failed_dir "$d" "$log")"
    [ -n "$pdir" ] || break
    case " ${fixed[*]:-} " in *" $pdir "*) break ;; esac
    chmod -R u+w -- "$pdir" || break
    n=$((n + 1))
    fixed+=("$pdir")
    mv "$log" "$log.patch$n"
    # the lockfile is the repo's; a run that may pick versions must leave it as it was, so a copy is held and compared
    if [ -z "$lock_before" ] && [ -f "$d/pnpm-lock.yaml" ]; then
      lock_before="$(dirname "$log")/pnpm-lock.yaml.before"
      cp -p -- "$d/pnpm-lock.yaml" "$lock_before" || break
    fi
    if ( cd "$d" && $shell "$rcmd" ) > "$log" 2>&1; then
      if [ -n "$lock_before" ] && ! cmp -s -- "$lock_before" "$d/pnpm-lock.yaml"; then
        # the run again picked versions: the lockfile goes back as it was, and the install the lockfile owns runs once
        # more, over the dirs that now stand and are patched. it must pass, or the install failed
        cp -p -- "$d/pnpm-lock.yaml" "$(dirname "$log")/pnpm-lock.yaml.after"
        cp -p -- "$lock_before" "$d/pnpm-lock.yaml"
        mv "$log" "$log.patch$((n + 1))"
        if ! ( cd "$d" && $shell "$cmd" ) > "$log" 2>&1; then
          tail -n 20 "$log" >&2
          echo "install=$shown (failed: the run after ERR_PNPM_PATCH_FAILED changed pnpm-lock.yaml, it was restored from the copy taken before (the changed copy is $(dirname "$log")/pnpm-lock.yaml.after), and the install of the restored lockfile failed; log: $log)"
          return 1
        fi
        echo "install=$shown (retried after ERR_PNPM_PATCH_FAILED: made ${#fixed[@]} read-only package dir(s) writable; the run again changed pnpm-lock.yaml, so it was restored from the copy taken before and the frozen install passed over the dirs that stand; the changed copy is $(dirname "$log")/pnpm-lock.yaml.after; first log: $log.patch1)"
        return 0
      fi
      rel=""
      for pdir in "${fixed[@]}"; do
        pdir="${pdir#"$d"/node_modules/.pnpm/}"
        rel+="${rel:+, }${pdir%%/*}"
      done
      echo "install=$shown (retried after ERR_PNPM_PATCH_FAILED: made ${#fixed[@]} read-only package dir(s) writable: $rel; the run kept each dir that stood and left the lockfile as it was; first log: $log.patch1)"
      return 0
    fi
  done
  # the tree's own init (its prepare hook) refuses to replace a committed `.claude` link to another actor than the one it
  # wants ("is a symlink to another place: found <A>, wanted <B>"), and the source tree's link may be the committed one
  # (an older init accepted it), so no mirror of the source can name the wanted actor. the link is the box-local,
  # gitignored-by-the-carry half of the tree: it is dropped, and the install runs once more so the init links its own
  if grep -q '\.claude is a symlink to another place' "$log" 2>/dev/null && [ -L "$d/.claude" ]; then
    cur="$(readlink -- "$d/.claude")"
    case "$cur" in
      .agent/.actors/*)
        rm -f -- "$d/.claude" || return 1
        mv "$log" "$log.claude"
        if ( cd "$d" && $shell "$cmd" ) > "$log" 2>&1; then
          if [ ! -e "$d/.claude" ]; then
            echo "install=$shown (ran again after the .claude link to $cur was dropped, but the init left no .claude; first log: $log.claude)"
            return 1
          fi
          echo "install=$shown (retried after the init refused the .claude link to $cur: dropped it, and the init linked $(readlink -- "$d/.claude"); first log: $log.claude)"
          return 0
        fi
        ;;
    esac
  fi
  # the dependencies all landed, and the tree's OWN lifecycle hook (its prepare, install, or postinstall: the header line pnpm prints names the
  # tree dir) is what failed. a fresh install runs that hook where the source box, installed long before, never ran it again: a hook of a
  # branch whose content the installed tool now refuses (2026-11-20, rhachet-roles-bhrain.beav.feat-subconscious-term-distill: `rhachet repo
  # introspect` exit 2 inside prepare, the build before it done). a build-first repair cannot cure it, since it runs the same hook. the
  # install runs once more over the lockfile with the lifecycle hooks off: every dependency stands and the lockfile is untouched, and the run
  # says the hook did not run, with its cause, so the tree is a moved tree with a named gap, never a half-moved one
  if [ -d "$d/node_modules" ] && [ "$cmd" != "${cmd//--frozen-lockfile/}" ] && grep -q 'ELIFECYCLE' "$log" 2>/dev/null \
    && grep -qE 'added [0-9]+, done' "$log" 2>/dev/null \
    && grep -E '^> [^ ]+ (prepare|install|postinstall) ' "$log" 2>/dev/null | grep -qF "/$(basename "$d")"; then
    local hook_name hook_cause
    hook_name="$(grep -E '^> [^ ]+ (prepare|install|postinstall) ' "$log" | grep -F "/$(basename "$d")" | tail -n 1 | awk '{print $3}')"
    hook_cause="$(grep -m1 -E 'ConstraintError|MalfunctionError|Error:' "$log" 2>/dev/null | cut -c1-160)"
    mv "$log" "$log.prepare"
    rcmd="${cmd//--frozen-lockfile/--frozen-lockfile --ignore-scripts}"
    if ( cd "$d" && $shell "$rcmd" ) > "$log" 2>&1; then
      echo "install=$shown (the tree's own $hook_name hook failed after every dependency landed${hook_cause:+ ($hook_cause)}; ran again with --ignore-scripts over the same lockfile: every dependency stands and the $hook_name hook did NOT run, so its steps (hooks, init) are owed; first log: $log.prepare)"
      return 0
    fi
  fi
  tail -n 20 "$log" >&2
  echo "install=$shown (failed; log: $log)"
  return 1
}

# .what = rc 0 when the tree's own prepare hook runs the tree's own build, and that build stands absent
# .why  = a package that runs itself (rhachet: "prepare" runs "npm run prepare:rhachet", which resolves through
#         its own "bin" entry to ./bin/run, which requires the dist build) has no dist in a fresh worktree, since
#         dist is gitignored. its install fails in prepare, and every `npx rhachet roles link` fails on the same
#         absent dist (2026-11-21: two rhachet trees, each moved to a cloud grove, the second twice over).
#         first: the tell read the dist DIR alone, and a cut apply (a crashed build, or a build step that
#         `mkdir -p dist`s before it writes its first file) can leave that dir stood with no file inside it to
#         prove a build: cured by a file tell instead of a dir tell. second, on the SAME tree: the file tell
#         still never fired, since the tell also required the "prepare" command's own text to match "bin/" word
#         for word, and the real package's "prepare" never does — it runs "npm run prepare:rhachet", which reaches
#         a bin/ path only through the package's OWN "bin" field, several calls removed. the match never fired
#         on the real repo, so __mvbox_build_first was skipped on every apply and every resume alike, and the
#         role links failed the same way apply after apply
# .note = the tell is static: a build:compile:tsc entry, a non-empty "prepare" entry, a "bin" object (the package
#         ships its own CLI, so "prepare" may reach it through any chain of "npm run" calls, never with "bin/"
#         anywhere in its own text), and the build's own completion stamp (dist/.build.stamp, the file
#         "build:complete" writes last, the same stamp the package's own "build:ifstale" command reads) absent.
#         a dist dir or one compiled file alone, partial or stale, is no proof of a FINISHED build — only the
#         stamp is
__mvbox_needs_build() {
  local d="$1"
  [ -f "$d/package.json" ] || return 1
  [ ! -f "$d/dist/.build.stamp" ] || return 1
  grep -q '"build:compile:tsc"' "$d/package.json" || return 1
  grep -qE '"prepare"[[:space:]]*:[[:space:]]*"[^"]+"' "$d/package.json" || return 1
  grep -qE '"bin"[[:space:]]*:[[:space:]]*\{' "$d/package.json"
}

# .what = build a self-hosted tree before its install and its role links. args: slug cmd shell
#         cmd empty = the paved build of a pnpm tree: install with the lifecycle hooks off, then build:compile:tsc and build:complete
#         shell empty = zsh -ic where zsh stands (the shell a seat runs, so fnm picks the node), else bash -lc
# .out  = `build=none` (the tree needs no build first) | `build=<cmd> (...)`. rc 1 = the build failed, or the tree needs one
#         and holds no pnpm-lock.yaml to build by (the log tail rides stderr)
# .note = the bun binaries the hooks of the tree run come after, by `pnpm run build:compile:bun`. a miss is named in the line,
#         never hidden: the hooks of a tree with no bun binary fail open
__mvbox_build_first() {
  local slug="$1" cmd="${2:-}" shell="${3:-}" d log shown given="$cmd" bun=""
  d="$(__mvbox_tree_dir "$slug")" || return 3
  if ! __mvbox_needs_build "$d"; then echo "build=none"; return 0; fi
  if [ -z "$cmd" ]; then
    if [ ! -f "$d/pnpm-lock.yaml" ]; then
      echo "build=none (failed: the tree's own prepare hook needs the tree's own build, and the tree holds no pnpm-lock.yaml to build by)"
      return 1
    fi
    cmd="pnpm install --config.confirm-modules-purge=false --frozen-lockfile --ignore-scripts && pnpm run build:compile:tsc && pnpm run build:complete"
  fi
  shown="${cmd//$'\n'/ }"
  if [ -z "$shell" ]; then
    if command -v zsh >/dev/null 2>&1; then shell="zsh -ic"; else shell="bash -lc"; fi
  fi
  log="$d/.log/git.crew.move/build.log"
  mkdir -p "$(dirname "$log")"
  if ! ( cd "$d" && $shell "$cmd" ) > "$log" 2>&1; then
    tail -n 20 "$log" >&2
    echo "build=$shown (failed; log: $log)"
    return 1
  fi
  if [ -z "$given" ] && grep -q '"build:compile:bun"' "$d/package.json"; then
    if ( cd "$d" && $shell "pnpm run build:compile:bun" ) > "$log.bun" 2>&1; then bun="; the bun binaries are built"
    else bun="; the bun binaries are NOT built (log: $log.bun), so the hooks of the tree fail open until the bun build runs there: cd $d && pnpm run build:compile:bun"; fi
  fi
  echo "build=$shown (the tree's own prepare hook runs the tree's own build, absent in a fresh tree: built first, so the install and the role links find it$bun)"
  return 0
}

# .what = the role links a tree holds, as `<repo>\t<role>` lines. rc 3 = no such tree on this grove
# .note = the links sit under .agent/repo=<repo>/role=<role> and are gitignored, so git carries none of them.
#         repo=.this is the repo's own, tracked in git, and is left out
__mvbox_role_links() {
  local d p repo role
  d="$(__mvbox_tree_dir "$1")" || return 3
  for p in "$d"/.agent/repo=*/role=*; do
    if [ ! -e "$p" ] && [ ! -L "$p" ]; then continue; fi
    repo="${p#"$d"/.agent/repo=}"; repo="${repo%%/*}"
    role="${p##*/role=}"
    if [ "$repo" = ".this" ]; then continue; fi
    printf '%s\t%s\n' "$repo" "$role"
  done
  return 0
}

# .what = link one role into the tree by rhachet, unless the link stands. args: slug repo role shell cmd
#         shell empty = zsh -ic where zsh stands (the shell a seat runs, so fnm picks the node), else bash -lc
#         cmd empty = npx rhachet roles link; `--repo <repo> --role <role>` follows it
# .out  = `present` | `linked`. rc 1 = the link did not stand after the command (the log tail rides stderr)
__mvbox_role_link() {
  local slug="$1" repo="$2" role="$3" shell="${4:-}" cmd="${5:-}" d log at
  d="$(__mvbox_tree_dir "$slug")" || return 3
  at="$d/.agent/repo=$repo/role=$role"
  if [ -e "$at" ] || [ -L "$at" ]; then echo "present"; return 0; fi
  if [ -z "$shell" ]; then
    if command -v zsh >/dev/null 2>&1; then shell="zsh -ic"; else shell="bash -lc"; fi
  fi
  log="$d/.log/git.crew.move/link.$repo.$role.log"
  mkdir -p "$(dirname "$log")"
  ( cd "$d" && $shell "${cmd:-npx rhachet roles link} --repo $repo --role $role" ) > "$log" 2>&1
  # the link is read back: a green exit is no proof
  if [ -e "$at" ] || [ -L "$at" ]; then echo "linked"; return 0; fi
  tail -n 20 "$log" >&2
  return 1
}

# .what = the target of the tree's `.claude` link, read ON the box the tree stands on. args: slug
# .out  = `claude_link=<target>`, empty when `.claude` is no link
__mvbox_claude_link() {
  local d t=""
  d="$(__mvbox_tree_dir "$1")" || return 3
  if [ -L "$d/.claude" ]; then t="$(readlink -- "$d/.claude")"; fi
  echo "claude_link=$t"
  return 0
}

# .what = at the destination, point the tree's `.claude` link at the actor the SOURCE tree's link names. args: slug wanted
# .why  = a repo may commit `.claude` as a link to one actor, while the tree's own init (its prepare hook) relinks it
#         to the actor it wants, box-local, so the source tree shows the change and the carry leaves `.claude` out.
#         the destination is made from the committed link, and the same init there refuses to replace a link to
#         another actor ("is a symlink to another place: found <A>, wanted <B>"), which stops the install
# .out  = `claude_link=none` (no link at the destination) | `kept` (the link stands as it is: the source names no
#         actor link, the destination link is no actor link, or both name one actor) | `relinked:<wanted> (was <cur>)`
#         | `dropped:<cur>` (the wanted actor dir is absent here, so the init links its own). each act is read back
__mvbox_claude_link_settle() {
  local d wanted="${2:-}" at cur
  d="$(__mvbox_tree_dir "$1")" || return 3
  at="$d/.claude"
  if [ ! -L "$at" ]; then echo "claude_link=none"; return 0; fi
  case "$wanted" in .agent/.actors/*) ;; *) echo "claude_link=kept"; return 0 ;; esac
  cur="$(readlink -- "$at")"
  case "$cur" in .agent/.actors/*) ;; *) echo "claude_link=kept"; return 0 ;; esac
  if [ "$cur" = "$wanted" ]; then echo "claude_link=kept"; return 0; fi
  rm -f -- "$at" || return 1
  if [ -e "$d/$wanted" ]; then
    ln -sn -- "$wanted" "$at" || return 1
    [ "$(readlink -- "$at")" = "$wanted" ] || return 1
    echo "claude_link=relinked:$wanted (was $cur)"
  else
    if [ -e "$at" ] || [ -L "$at" ]; then return 1; fi
    echo "claude_link=dropped:$cur"
  fi
  return 0
}

######################################################################
# crew half: runs on the caller's box
######################################################################

# .what = a --to / --from value in the ledger's vocabulary: `local` | `cloud://<grove>`
#         a bare name is a grove name. rc 1 = not a usable value
__crew_move_as_grove() {
  local g="${1:-}" name
  case "$g" in
    ""|"cloud://") return 1 ;;
    local) printf 'local' ;;
    cloud://*) name="${g#cloud://}"; [[ "$name" =~ ^[A-Za-z0-9._-]+$ ]] || return 1; printf '%s' "$g" ;;
    *) [[ "$g" =~ ^[A-Za-z0-9._-]+$ ]] || return 1; printf 'cloud://%s' "$g" ;;
  esac
}

# .what = a byte count as a human size
__crew_move_as_size() {
  awk -v n="${1:-0}" 'BEGIN { split("B KB MB GB", u, " "); i = 1; while (n >= 1024 && i < 4) { n /= 1024; i++ } if (i == 1) printf "%d %s", n, u[i]; else printf "%.1f %s", n, u[i] }'
}

# .what = one key of a `key=value` fact blob
__crew_move_fact() {
  printf '%s\n' "$1" | sed -n "s/^$2=//p" | head -n 1
}

# .what = a grove command as a fix hint: the bare command on `local`, else the same over git.grove.send
#   in: $1 grove (`local` | `cloud://<g>`) · $2 the command, free of single quotes
# .why  = a hint must name a verb this package ships. a cure the caller cannot run is worse than none
__crew_move_box_hint() {
  local grove="$1" cmd="$2"
  [[ "$grove" == local ]] && { printf '%s' "$cmd"; return 0; }
  printf "rhx git.grove.send %s --what '%s'" "${grove#cloud://}" "$cmd"
}

# .what = the fix hint that shows one tree's state on its grove
# .why  = a refusal about a tree's branch or dirt names the read that shows it, at the end it sits on
__crew_move_tree_hint() {
  __crew_move_box_hint "$1" "cd ~/git/*/_worktrees/$2 && git status --short --branch"
}

# .what = run a grove-half (`__mvbox_`) function ON a grove: `local` here, a cloud grove by ssh
#   in: $1 grove · $2 function · $3.. its args. stdin and stdout pass through
# .note = every `__mvbox_` function ships in one `bash -c`, so the grove needs naught installed
# .why NO `-n` on the ssh: the bytes of a pack, a bundle, or a transcript ARE its stdin. a caller that
#      has no payload passes `</dev/null` itself, so a `while read` loop around a call is never eaten
__crew_move_box_run() {
  local grove="$1" fn="$2" host program a q=""
  shift 2
  host="$(__crew_grove_host "$grove")" || return 2
  program="$(declare -f $(compgen -A function __mvbox_))"$'\n'"$fn \"\$@\""
  if [[ -z "$host" ]]; then
    bash -c "$program" _ "$@"
    return $?
  fi
  for a in "$@"; do q+=" $(printf '%q' "$a")"; done
  # stdin: forwarded on purpose. the connect and a silent peer are both bounded: this call runs under the
  # per-tree move lock, so an unbounded wait on one dark grove would hold every later apply of the tree
  ssh -o BatchMode=yes -o ConnectTimeout=8 -o ServerAliveInterval=15 -o ServerAliveCountMax=4 \
    "$host" "bash -c $(printf '%q' "$program") _$q"
}

# .what = run a box call as `__crew_move_box_run` does, its stderr held, then rendered under the tree
# .why  = a caller captures the call's stdout with `$(...)`; its stderr (an install's own tail, a refused
#         `cp`) passed straight through, flush-left, between a step header and its 💥 bullet. held and
#         indented, the grove's own words ride under the step they belong to, and before its verdict
__crew_move_box_run_held() {
  local errf rc=0
  errf="$(mktemp)" || { __crew_move_box_run "$@"; return $?; }
  __crew_move_box_run "$@" 2>"$errf" || rc=$?
  [[ -s "$errf" ]] && sed 's/^/   │  │  /' "$errf" >&2
  rm -f "$errf"
  return $rc
}

# .what = the seats a crew moves: the ledger's booted roles, then the registry's
# .out  = one role per line; a local-only seat as `local:<role>`
__crew_move_seat_roles() {
  local tree="$1" roles r seen="," dir
  roles="$(__crew_ledger_roles_of "$tree")"
  dir="${DUCTWORK_DIR:-$HOME/.ductwork}/ducts/$tree"
  if [[ -d "$dir" ]]; then
    roles="${roles:+$roles,}$(find "$dir" -maxdepth 1 -type f -name '*.json' -exec basename {} .json \; 2>/dev/null | sort | paste -sd, -)"
  fi
  local -a list=()
  __crew_roles_into list "$roles"
  for r in "${list[@]}"; do
    [[ "$seen" == *",$r,"* ]] && continue
    seen+="$r,"
    if __crew_role_is_local "$r"; then printf 'local:%s\n' "$r"; else printf '%s\n' "$r"; fi
  done
}

# .what = the state of one seat at the source: down | unread | idle | busy:<why> | typed
# .why unread: only duct.read's `is absent` proves a seat down. any other failed
#      read is no verdict, and a seat read as down would pass the busy refusal
#      while a clone may be mid-turn in it
__crew_move_seat_state() {
  local host="$1" tree="$2" role="$3" uri pane live errfile
  uri="$(__crew_duct_uri "$host" "$tree" "$role")"
  errfile="$(mktemp)" || { printf 'unread'; return 0; }
  if ! pane="$(duct.read --on "$uri" --raw --lines 60 2>"$errfile")"; then
    if grep -qa 'is absent' "$errfile"; then printf 'down'; else printf 'unread'; fi
    rm -f "$errfile"
    return 0
  fi
  rm -f "$errfile"
  # rc 1 = no live turn frame in the pane: a verdict, never a failure
  live="$(__duct_pane_turn_live "$pane" || true)"
  if [[ -n "$live" ]]; then printf 'busy:%s' "$live"; return 0; fi
  if __duct_pane_box_holds_typed_text "$pane"; then printf 'typed'; return 0; fi
  printf 'idle'
}

# .what = the grove a tree last moved from into <to>, per the move log
__crew_move_log_from() {
  local tree="$1" to="$2" log="${CREWWORK_DIR:-$HOME/.crewwork}/moves.jsonl"
  [[ -f "$log" ]] || return 0
  jq -r --arg t "$tree" --arg to "$to" 'select(.tree == $t and .to == $to) | .from' "$log" 2>/dev/null | tail -n 1
}

# .what = append one line of a move to the log; roles = the seats the move meant to raise, comma-joined
# .note = apply writes `begin` before step 1 and one line per step it finishes (up, carry, conversations,
#         install, links, ledger); a resumed apply writes `resume` in place of `begin`. every line carries
#         the whole record, so a reader of any one line needs no other
__crew_move_log_set() {
  local tree="$1" from="$2" to="$3" why="$4" head="$5" roles="${6:-}" step="${7:-ledger}" branch="${8:-}" log="${CREWWORK_DIR:-$HOME/.crewwork}/moves.jsonl"
  mkdir -p "$(dirname "$log")"
  jq -nc --arg t "$tree" --arg f "$from" --arg to "$to" --arg w "$why" --arg h "$head" --arg r "$roles" --arg s "$step" --arg b "$branch" --arg bare "${__mv_bare_csv:-}" --arg at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{at: $at, tree: $t, from: $f, to: $to, head: $h, branch: $b, step: $s, why: $w, roles: ($r | split(",") | map(select(. != ""))), bare: ($bare | split(",") | map(select(. != "")))}' >> "$log"
}

# .what = the steps of the newest logged apply of a tree from <from> to <to>, space-joined in the order logged
#         (`begin` first). empty = no logged apply to resume, or the newest one finished its ledger step
# .args = tree from to [head] [branch]; an empty head or branch is not matched on (verify reads the log loose)
# .why  = the vouch for a destination worktree a cut apply left: a path no log line names stays refused
__crew_move_log_resume() {
  local tree="$1" from="$2" to="$3" head="${4:-}" branch="${5:-}" log="${CREWWORK_DIR:-$HOME/.crewwork}/moves.jsonl"
  [[ -f "$log" ]] || return 0
  jq -rs --arg t "$tree" --arg f "$from" --arg to "$to" --arg h "$head" --arg b "$branch" '
    map(select(.tree == $t and .from == $f and .to == $to and ($h == "" or .head == $h) and ($b == "" or (.branch // "") == $b))) as $rows
    | ([range(0; $rows | length)] | map(select($rows[.].step == "begin")) | last) as $i
    | if $i == null then empty
      else ($rows[$i:] | map(.step // "")) as $steps
        | if ($steps | index("ledger")) != null then empty else ($steps | join(" ")) end
      end' "$log" 2>/dev/null
}

# .what = the first step of an apply that a list of logged steps lacks
__crew_move_next_step() {
  local seen=" ${1:-} " s
  for s in up carry conversations install links ledger; do
    [[ "$seen" == *" $s "* ]] || { printf '%s' "$s"; return 0; }
  done
}

# .what = the seats the last move of a tree into <to> meant to raise, one role per line, per the move log
# .why  = the destination's registry and ledger name only the seats that came up; a seat that landed as a
#         bare shell sits in neither, so verify reads the roles the move itself recorded
__crew_move_log_roles() {
  local tree="$1" to="$2" log="${CREWWORK_DIR:-$HOME/.crewwork}/moves.jsonl"
  [[ -f "$log" ]] || return 0
  jq -r --arg t "$tree" --arg to "$to" 'select(.tree == $t and .to == $to) | (.roles // []) | join(",")' "$log" 2>/dev/null | tail -n 1 | tr ',' '\n' | sed '/^$/d'
}

# .what = the seats of the last move of a tree into <to> that held no transcript at the source, so they came up bare
#         (the plan says: "no transcript — the seat comes up bare, no clone is hatched"), one role per line, per the
#         move log. a log written before the field stood holds none; verify then reads the source (__crew_move_bare_roles)
__crew_move_log_bare() {
  local tree="$1" to="$2" log="${CREWWORK_DIR:-$HOME/.crewwork}/moves.jsonl"
  [[ -f "$log" ]] || return 0
  jq -r --arg t "$tree" --arg to "$to" 'select(.tree == $t and .to == $to) | (.bare // []) | join(",")' "$log" 2>/dev/null | tail -n 1 | tr ',' '\n' | sed '/^$/d'
}

# .what = the roles, of those given, that verify holds to the plan's word that they come up bare: those the move log
#         names, and those the SOURCE tree holds no transcript for (read there, since the source stays on disk).
#         args: tree role... . a source that cannot be read adds none
__crew_move_bare_roles() {
  local tree="$1" r tr_out="" found
  shift
  {
    __crew_move_log_bare "$tree" "$__mv_to"
    if [[ $# -gt 0 && -n "${__mv_from:-}" ]]; then
      tr_out="$(__crew_move_box_run "$__mv_from" __mvbox_transcripts "$tree" "$@" </dev/null 2>/dev/null)" || tr_out=""
      if [[ -n "$tr_out" ]]; then
        for r in "$@"; do
          found="$(printf '%s\n' "$tr_out" | awk -F'\t' -v r="$r" '$1 == r && $2 != "absent" { print "yes"; exit }')"
          [[ "$found" == yes ]] || printf '%s\n' "$r"
        done
      fi
    fi
  } | awk 'NF && !seen[$0]++'
}

# .what = the state of a seat that came up with no transcript, after its boot: live | bare | unread | absent
#         live = a live claude; bare = a bare shell whose duct stands (what the plan said); unread = the box did not
#         answer; absent = no duct stands. a slow launch is waited for, as for a live seat
__crew_move_seat_bare_state() {
  local host="$1" tree="$2" role="$3" uri n rc state="absent" said=""
  local tries="${GIT_CREW_MOVE_LIVE_TRIES:-6}" wait="${GIT_CREW_MOVE_LIVE_WAIT:-5}"
  uri="$(__crew_duct_uri "$host" "$tree" "$role")"
  # loop: bounded=6 a retry with a max: GIT_CREW_MOVE_LIVE_TRIES reads (6 by default), so the wait always stops
  for ((n = 1; n <= tries; n++)); do
    rc=0; __duct_uri_holds_live_claude "$uri" || rc=$?
    if [[ $rc -eq 0 ]]; then state="live"
    elif [[ $rc -eq 3 ]]; then state="unread"
    else
      # only duct.read's `is absent` proves no duct; any other failed read is unread
      rc=0; said="$(duct.read --on "$uri" --raw --lines 5 2>&1 1>/dev/null)" || rc=$?
      if [[ $rc -eq 0 ]]; then state="bare"
      elif [[ "$said" == *"is absent"* ]]; then state="absent"
      else state="unread"
      fi
    fi
    [[ "$state" == live || "$state" == bare ]] && break
    (( n < tries )) && sleep "$wait"
  done
  printf '%s' "$state"
}

# .what = rc 0 when a seat holds a live claude at the grove; a slow launch is waited for. rc 3 = the box did not answer
# .note = GIT_CREW_MOVE_LIVE_TRIES (default 6) reads, GIT_CREW_MOVE_LIVE_WAIT (default 5) seconds apart
__crew_move_seat_live() {
  local host="$1" tree="$2" role="$3" uri n rc=1
  local tries="${GIT_CREW_MOVE_LIVE_TRIES:-6}" wait="${GIT_CREW_MOVE_LIVE_WAIT:-5}"
  uri="$(__crew_duct_uri "$host" "$tree" "$role")"
  # loop: bounded=6 a retry with a max: GIT_CREW_MOVE_LIVE_TRIES reads (6 by default), so the wait always stops
  for ((n = 1; n <= tries; n++)); do
    rc=0; __duct_uri_holds_live_claude "$uri" || rc=$?
    [[ $rc -eq 0 ]] && return 0
    (( n < tries )) && sleep "$wait"
  done
  return $rc
}

# .what = the exact command that raises one seat at the destination, its conversation resumed
__crew_move_seat_cure() {
  printf 'rhx git.crew.boot --tree %s --grove %s --roles %s --resume %s' "$1" "$2" "$3" "$3"
}

# refusals are gathered, so one plan names every one at once
__mv_refusals=()
__crew_move_refuse() { __mv_refusals+=("$1"$'\t'"$2"); }

# .what = refuse the grove if it is unknown. args: label grove
__crew_move_judge_grove() {
  local label="$1" grove="$2" name
  [[ "$grove" == "local" ]] && return 0
  name="${grove#cloud://}"
  if [[ ! -f "${GIT_FOREST_DIR:-$HOME/.git.forest}/groves/$name.json" ]]; then
    __crew_move_refuse "the $label grove '$name' is not registered" "rhx git.grove.list   # the groves this machine knows"
    return 1
  fi
  return 0
}

# .what = the digest of a tree on one grove
#   in: $1 grove · $2 tree
# .out = the digest on stdout, rc 0. a read that fails: the first line its own stderr said, rc 3 (unread, no verdict)
# .why = a failed read is no content: a caller that folded it into a diff would report a mismatch it never saw
__crew_move_digest_of() {
  local grove="$1" tree="$2" errfile out rc=0
  errfile="$(mktemp)" || { echo "a temp file for the digest read could not be made"; return 3; }
  out="$(__crew_move_box_run "$grove" __mvbox_digest "$tree" </dev/null 2>"$errfile")" || rc=$?
  if [[ $rc -ne 0 ]]; then
    printf '%s\n' "$(sed -n '/./{p;q}' "$errfile")"
    rm -f "$errfile"
    return 3
  fi
  rm -f "$errfile"
  printf '%s\n' "$out"
}

# .what = the digest of a tree on one grove vs on another: a diff text, empty when equal
# .out  = rc 0 with the diff (empty = equal); rc 3 with the unread cause, when either end could not be read
__crew_move_digest_diff() {
  local tree="$1" from="$2" to="$3" a b
  a="$(__crew_move_digest_of "$from" "$tree")" || { echo "the source digest is unread: ${a:-its read said naught}"; return 3; }
  b="$(__crew_move_digest_of "$to" "$tree")" || { echo "the destination digest is unread: ${b:-its read said naught}"; return 3; }
  [[ "$a" == "$b" ]] && return 0
  diff <(printf '%s\n' "$a") <(printf '%s\n' "$b") | sed -n 's/^< /source only:      /p; s/^> /destination only: /p'
  # diff exits 1 when the ends differ: under pipefail that is the verdict "differ", never "unread" (rc 3 is reserved for that)
  return 0
}

# ── the gathered facts (globals) ───────────────────────────────────────
__mv_from="" ; __mv_to="" ; __mv_from_why="" ; __mv_src_facts="" ; __mv_dst_facts=""
__mv_dirty="" ; __mv_dirty_bytes=0 ; __mv_dirty_n=0
__mv_roles=() ; __mv_state=() ; __mv_tr=() ; __mv_local_roles=()
__mv_dst_tree="" ; __mv_adopt="" ; __mv_resume="" ; __mv_settle=() ; __mv_setaside="" ; __mv_setaside_why=""
__mv_twin_why="" ; __mv_twin_drop="" ; __mv_twin_facts="" ; __mv_setaside_note=""
__mv_twin_aside_why="" ; __mv_twin_aside=""
__mv_extant="" ; __mv_merge_rows="" ; __mv_merge_stats=""

# .what = the digest of the source, held against what the extant destination holds: a diff text, empty when every
#         source path stands at the destination with the same bytes, at the same head and branch.
#         the destination may hold more; a path the source does not carry is never judged
# .out  = rc 0 with the diff (empty = contained); rc 3 with the unread cause, when either end could not be read
__crew_move_merge_contain_diff() {
  local tree="$1" from="$2" to="$3" a b
  a="$(__crew_move_digest_of "$from" "$tree")" || { echo "the source digest is unread: ${a:-its read said naught}"; return 3; }
  b="$(__crew_move_digest_of "$to" "$tree")" || { echo "the destination digest is unread: ${b:-its read said naught}"; return 3; }
  [[ "$(printf '%s\n' "$a" | head -n 2)" == "$(printf '%s\n' "$b" | head -n 2)" ]] || echo "the head or the branch differs between the ends"
  LC_ALL=C comm -23 <(printf '%s\n' "$a" | tail -n +3 | sed '/^$/d' | LC_ALL=C sort) <(printf '%s\n' "$b" | tail -n +3 | sed '/^$/d' | LC_ALL=C sort) \
    | awk -F'\t' '{ printf "source path not at the destination with the same bytes: %s (%s)\n", $2, substr($1, 1, 12) }'
  # a rendered diff is a verdict: rc 3 is reserved for an unread end
  return 0
}

# .what = halt an apply whose digest proof could not be read: the carry is unproven, so the ledger stays
#   in: $1 tree · $2 the unread cause __crew_move_digest_diff said
__crew_move_digest_unread_halt() {
  echo "   │  └─ 💥 the tree digest is unread, so the carry is unproven: $2" >&2
  echo "      the ledger was NOT flipped. once both groves answer, resume: rhx git.crew.move --tree $1 --to $__mv_to --mode apply" >&2
}

# .what = how many rows of the merge judge hold one verdict
__crew_move_merge_count() {
  printf '%s\n' "$__mv_merge_rows" | awk -F'\t' -v v="$1" '$1 == "R" && $2 == v { n++ } END { print n + 0 }'
}

# .what = one counts line of two trees: `source: <n> dirty, <n> untracked · destination: <n> dirty, <n> untracked`
#         args: source dirty, source untracked, destination dirty, destination untracked
__crew_move_counts_line() {
  printf 'source: %s dirty, %s untracked · destination: %s dirty, %s untracked' "$1" "$2" "$3" "$4"
}

# .what = judge a merge into the extant destination worktree. the refusals gather; the verdict of each source path
#         lands in __mv_merge_rows and the destination's stats in __mv_merge_stats. args: tree branch head
# .note = it stands, on the branch, at the head, mid no operation; and no source path may land over destination work
__crew_move_judge_extant() {
  local tree="$1" branch="$2" head="$3" tbranch thead top ok=yes manifest rows v p why
  __mv_merge_rows=""; __mv_merge_stats=""
  if [[ "$(__crew_move_fact "$__mv_dst_facts" registered)" != yes ]]; then
    __crew_move_refuse "the destination holds no extant worktree for this tree at $__mv_dst_tree" "drop --into-extant for a fresh move: rhx git.crew.move --tree $tree --to $__mv_to"
    return 0
  fi
  tbranch="$(__crew_move_fact "$__mv_dst_facts" tree_branch)"; thead="$(__crew_move_fact "$__mv_dst_facts" tree_head)"
  top="$(__crew_move_fact "$__mv_dst_facts" tree_op)"
  if [[ "$tbranch" != "$branch" ]]; then
    __crew_move_refuse "the extant destination worktree is on branch ${tbranch:-<detached>}, not $branch" "check out $branch there, then move"
    ok=no
  fi
  [[ "$thead" == "$head" ]] || { __crew_move_refuse "the extant destination worktree is not at the source head (source ${head:0:12}, destination ${thead:0:12})" "check out ${head:0:12} there (a pull, a fast-forward), then move"; ok=no; }
  if [[ -n "$top" ]]; then
    __crew_move_refuse "the extant destination worktree is mid-operation ($top)" "finish or abort it there, then move"
    ok=no
  fi
  [[ "$ok" == yes ]] || return 0
  manifest="$(__crew_move_box_run "$__mv_from" __mvbox_manifest "$tree" </dev/null 2>/dev/null)" || {
    __crew_move_refuse "the proof rows of the source cannot be read" "$(__crew_move_tree_hint "$__mv_from" "$tree")"; return 0; }
  rows="$(printf '%s\n' "$manifest" | sed '/^$/d' | __crew_move_box_run "$__mv_to" __mvbox_merge_judge "$tree" 2>/dev/null)" || {
    __crew_move_refuse "the destination worktree cannot be judged for a merge" "$(__crew_move_tree_hint "$__mv_to" "$tree")"; return 0; }
  __mv_merge_rows="$(printf '%s\n' "$rows" | awk -F'\t' '$1 == "R"')"
  __mv_merge_stats="$(printf '%s\n' "$rows" | awk -F'\t' '$1 != "R"')"
  while IFS=$'\t' read -r _ v _ p why; do
    [[ "$v" == conflict ]] || continue
    __crew_move_refuse "the extant destination worktree holds $p with $why" "move or commit that path at the destination, or clear it at the source; --into-extant never overwrites destination work"
  done <<< "$__mv_merge_rows"
}

# .what = judge a destination branch that is no ancestor of the source head: does the head hold, by patch
#         identity, every commit the branch holds that the head lacks (a branch that was later rebased)?
#         args: tree org repodir branch-sha
# .out  = rc 0: every such commit has a patch twin (or none lacks), naught printed
#         rc 1: some commit has no twin; one `<sha12> <subject>` per such commit on stdout
#         rc 2: the judge could not read (a box did not answer, or the span passed the bound); the cause on stdout
#         rc 3: some commit is a merge, which is never set aside; one `<sha12> <subject>` per merge on stdout
__crew_move_judge_twins() {
  local tree="$1" org="$2" repodir="$3" bsha="$4" window cands verdict c kind subj none="" merges=""
  window="$(__crew_move_box_run "$__mv_from" __mvbox_head_window "$tree" </dev/null 2>/dev/null)" || { echo "the source head history could not be read"; return 2; }
  cands="$(printf '%s\n' "$window" | __crew_move_box_run "$__mv_to" __mvbox_dest_only "$org" "$repodir" "$bsha" 2>/dev/null)" || { echo "the destination branch could not be walked"; return 2; }
  [[ "$cands" == overflow=yes* ]] && { echo "the branch holds over 2000 commits the source head window lacks"; return 2; }
  [[ -n "$cands" ]] || return 0
  verdict="$(printf '%s\n' "$cands" | __crew_move_box_run "$__mv_from" __mvbox_twin_judge "$tree" 2>/dev/null)" || { echo "the patch twins could not be read at the source"; return 2; }
  while IFS=$'\t' read -r c kind subj; do
    case "$kind" in
      none) none+="${none:+$'\n'}${c:0:12} $subj" ;;
      merge) merges+="${merges:+$'\n'}${c:0:12} $subj" ;;
    esac
  done <<< "$verdict"
  if [[ -n "$merges" ]]; then printf '%s' "$merges"; return 3; fi
  [[ -z "$none" ]] && return 0
  printf '%s' "$none"
  return 1
}

# .what = name the source grove: --from, else the move log (verify), else the ledger row, else this box
#         rc 2 = it cannot be named (the refusal is printed)
__crew_move_derive_from() {
  local tree="$1" given="$2" mode="$3"
  if [[ -n "$given" ]]; then
    __mv_from="$(__crew_move_as_grove "$given")" || { echo "✋ ConstraintError: --from '$given' is neither local nor a grove name" >&2; echo "   └─ fix: --from local | cloud://<grove> | <grove>   # rhx git.grove.list, or omit it to read the ledger row" >&2; return 2; }
    __mv_from_why="the --from flag"
  elif [[ "$mode" == verify ]]; then
    __mv_from="$(__crew_move_log_from "$tree" "$__mv_to")"
    __mv_from_why="the move log"
    if [[ -z "$__mv_from" ]]; then
      echo "✋ ConstraintError: the move log names no move of $tree into $__mv_to, so verify has no source to compare" >&2
      echo "   └─ fix: pass the grove it left: rhx git.crew.move --tree $tree --to $__mv_to --from <grove> --mode verify" >&2
      return 2
    fi
  else
    __mv_from="$(__crew_ledger_grove_of "$tree")"
    __mv_from_why="the ledger row"
    if [[ -z "$__mv_from" ]]; then
      if __crew_tree_dir "$tree" >/dev/null 2>&1; then
        __mv_from="local"; __mv_from_why="local (no ledger row; the tree stands on this box)"
      else
        echo "✋ ConstraintError: no ledger row for '$tree', and the tree is not on this box, so its source grove is unknown" >&2
        echo "   └─ fix: pass --from cloud://<grove>, or place it in the ledger: rhx git.crew.ledger --tree $tree --grove cloud://<grove>" >&2
        return 2
      fi
    fi
  fi
  if [[ "$__mv_from" == "$__mv_to" ]]; then
    local why_same="the source, per $__mv_from_why, is $__mv_from"
    [[ -n "$given" ]] && why_same="--from and --to both name $__mv_to"
    echo "✋ ConstraintError: $tree is on $__mv_to already ($why_same)" >&2
    echo "   └─ fix: rhx git.crew.move --tree $tree --to $__mv_to --from <grove> --mode verify   # <grove> = the one it left; verify proves the move" >&2
    return 2
  fi
  return 0
}

# .what = the last line a failed box call wrote on stderr, as ` — said: <line>`, or naught
# .why  = "did not answer (exit 255)" reads the same for no such host, a refused port, and a refused key, and
#         each takes another cure. the transport's own last words name which one it was
__crew_move_said_of() {
  local errf="$1" last
  [[ -s "$errf" ]] || return 0
  last="$(sed '/^[[:space:]]*$/d' "$errf" | tail -n 1)"
  [[ -n "$last" ]] && printf ' — said: %s' "${last//[[:cntrl:]]/?}"
}

# .what = read both ends and judge every refusal. rc 0 = read (refusals may stand); rc 1 = a box did not answer
__crew_move_gather() {
  local tree="$1"
  local rc=0 errf
  errf="$(mktemp)" || errf=/dev/null
  __mv_src_facts="$(__crew_move_box_run "$__mv_from" __mvbox_facts "$tree" </dev/null 2>"$errf")" || rc=$?
  if [[ $rc -eq 3 ]]; then
    __mv_src_facts=""
    [[ "$errf" == /dev/null ]] || rm -f "$errf"
    __crew_move_refuse "no tree $tree on the source $__mv_from" "check the slug and the grove: $(__crew_move_box_hint "$__mv_from" 'ls -d ~/git/*/_worktrees/*')"
    return 0
  elif [[ $rc -ne 0 ]]; then
    echo "💥 MalfunctionError: the source $__mv_from did not answer (exit $rc$(__crew_move_said_of "$errf")), so naught was judged" >&2
    echo "   └─ fix: $(__grove_unreached_cure "${__mv_from#cloud://}"); then run this again" >&2
    [[ "$errf" == /dev/null ]] || rm -f "$errf"
    return 1
  fi
  local org branch head op ahead repodir orgs
  orgs="$(__crew_move_orgs)"
  org="$(__crew_move_fact "$__mv_src_facts" org)"
  branch="$(__crew_move_fact "$__mv_src_facts" branch)"
  head="$(__crew_move_fact "$__mv_src_facts" head)"
  op="$(__crew_move_fact "$__mv_src_facts" op)"
  repodir="$(__crew_move_fact "$__mv_src_facts" repodir)"
  if [[ -n "$orgs" ]] && [[ -z "$org" || " $orgs " != *" $org "* ]]; then
    __crew_move_refuse "the tree's org '${org:-<none>}' is outside ${orgs// /, } (GIT_CREW_MOVE_ORGS)" "a crew moves only within those orgs; widen GIT_CREW_MOVE_ORGS to move it"
  fi
  [[ -n "$branch" ]] || __crew_move_refuse "the tree holds a detached HEAD, so there is no branch to raise" "check out the branch in the source tree first"
  [[ -z "$op" ]] || __crew_move_refuse "the source tree is mid-operation ($op)" "finish or abort it at the source, then move"

  # the dirty set
  local rc2=0
  __mv_dirty="$(__crew_move_box_run "$__mv_from" __mvbox_dirty "$tree" </dev/null 2>&1)" || rc2=$?
  if [[ $rc2 -ne 0 ]]; then
    __crew_move_refuse "the dirty set of the source cannot be listed" "${__mv_dirty//$'\n'/ }"
    __mv_dirty=""
  fi
  __mv_dirty_bytes="$(__crew_move_fact "$__mv_dirty" bytes)"; __mv_dirty_bytes="${__mv_dirty_bytes:-0}"
  # a dirty row is `<XY><tab><path>`; any other line is channel noise (an ssh notice rides stderr into this capture)
  __mv_dirty="$(printf '%s\n' "$__mv_dirty" | sed '/^bytes=/d; /^$/d' | awk -F'\t' 'NF >= 2 && length($1) == 2')"
  __mv_dirty_n=0; [[ -n "$__mv_dirty" ]] && __mv_dirty_n="$(printf '%s\n' "$__mv_dirty" | wc -l)"
  local cap="${GIT_CREW_MOVE_MAX_BYTES:-268435456}"
  if (( __mv_dirty_bytes > cap )); then
    __crew_move_refuse "the dirty set is $(__crew_move_as_size "$__mv_dirty_bytes"), over the $(__crew_move_as_size "$cap") bound" "commit or drop the large paths at the source, or raise GIT_CREW_MOVE_MAX_BYTES"
  fi

  # the destination
  local rc3=0
  __mv_dst_facts="$(__crew_move_box_run "$__mv_to" __mvbox_dest_facts "$org" "$repodir" "$tree" "$branch" "$head" </dev/null 2>"$errf")" || rc3=$?
  if [[ $rc3 -ne 0 ]]; then
    echo "💥 MalfunctionError: the destination $__mv_to did not answer (exit $rc3$(__crew_move_said_of "$errf")), so naught was judged" >&2
    echo "   └─ fix: $(__grove_unreached_cure "${__mv_to#cloud://}"); then run this again" >&2
    [[ "$errf" == /dev/null ]] || rm -f "$errf"
    return 1
  fi
  [[ "$errf" == /dev/null ]] || rm -f "$errf"
  __mv_dst_tree="$(__crew_move_fact "$__mv_dst_facts" tree)"
  # a worktree a prior apply half made (its step 1 failed after the worktree stood, the ledger never
  # flipped) is adopted, so a re-run of apply converges; any other extant path is refused
  # a worktree a logged cut apply left (the carried paths stand, so it is no longer clean) is adopted
  # the same way, vouched for by the move log of this tree, branch, and head
  __mv_adopt=""; __mv_resume=""; __mv_settle=(); __mv_setaside=""; __mv_twin_drop=""; __mv_twin_facts=""; __mv_setaside_note=""; __mv_twin_aside=""
  # --into-extant takes the destination worktree as it stands: no adopt, no twin, no settle of a branch
  if [[ -z "$__mv_extant" && "$(__crew_ledger_grove_of "$tree")" != "$__mv_to" ]]; then
    local steps; steps="$(__crew_move_log_resume "$tree" "$__mv_from" "$__mv_to" "$head" "$branch")"
    if [[ "$(__crew_move_fact "$__mv_dst_facts" half_made)" == yes ]]; then
      __mv_adopt=yes; __mv_resume="$steps"
    elif [[ "$(__crew_move_fact "$__mv_dst_facts" cut_made)" == yes && -n "$steps" ]]; then
      __mv_adopt=cut; __mv_resume="$steps"
    fi
  fi
  if [[ -z "$__mv_extant" && -z "$__mv_adopt" ]]; then
    if [[ "$(__crew_move_fact "$__mv_dst_facts" tree_exists)" == yes || "$(__crew_move_fact "$__mv_dst_facts" registered)" == yes ]]; then
      # a stale twin (an earlier life of this tree on the destination box) is dropped only when the caller named
      # why and every check proves naught it holds would be lost; else it stays refused, as before
      __mv_twin_facts="$(__crew_move_box_run "$__mv_to" __mvbox_twin_state "$org" "$repodir" "$tree" </dev/null 2>/dev/null)"
      local twin_safe twin_unsafe twin_head
      twin_safe="$(__crew_move_fact "$__mv_twin_facts" twin_safe)"
      twin_head="$(__crew_move_fact "$__mv_twin_facts" twin_head)"
      twin_unsafe="$(printf '%s\n' "$__mv_twin_facts" | sed -n 's/^twin_unsafe=//p' | paste -sd ';' - | sed 's/;/; /g')"
      if [[ -n "$__mv_twin_aside_why" ]]; then
        # a twin that holds work is set aside whole, never dropped: refused only while it is no registered worktree, or in use
        local twin_procs twin_claude twin_dirty aside_base
        twin_procs="$(__crew_move_fact "$__mv_twin_facts" twin_procs)"; twin_claude="$(__crew_move_fact "$__mv_twin_facts" twin_claude)"
        twin_dirty="$(__crew_move_fact "$__mv_twin_facts" twin_dirty)"
        aside_base="$(dirname "$(dirname "$__mv_dst_tree")")/_setaside"
        if [[ "$(__crew_move_fact "$__mv_twin_facts" twin_registered)" != yes ]]; then
          __crew_move_refuse "the destination path $__mv_dst_tree is taken, and it is no worktree the destination repo registers, so --setaside-twin-why has no twin to set aside" "clear that path at the destination, then move"
        elif [[ "${twin_claude:-0}" != 0 ]]; then
          __crew_move_refuse "a live claude is at work in the stale twin $__mv_dst_tree (${twin_claude} process(es) with its cwd there); a twin in use is never set aside" "end that claude session at the destination, then move"
        elif [[ "${twin_procs:-0}" != 0 ]]; then
          __crew_move_refuse "${twin_procs} process(es) at work in the stale twin $__mv_dst_tree; a twin in use is never set aside" "end each process whose cwd sits in it, then move"
        else
          __mv_twin_aside=yes
          __mv_settle+=("set aside the stale twin worktree $__mv_dst_tree at ${twin_head:0:12} (${twin_dirty:-?} dirty path(s), untracked included, kept byte for byte): rename it whole to $aside_base/$tree.<utc stamp>, its git admin dir beside it as <that path>.gitadmin, so its registration lifts and its branch is free; never a delete")
          __mv_settle+=("set-aside-twin why: $__mv_twin_aside_why")
        fi
      elif [[ "$twin_safe" == yes && -n "$__mv_twin_why" ]]; then
        __mv_twin_drop=yes
        __mv_settle+=("drop the stale twin worktree $__mv_dst_tree at ${twin_head:0:12} (0 dirty paths, upstream $(__crew_move_fact "$__mv_twin_facts" twin_upstream) 0/0, head in $(__crew_move_fact "$__mv_twin_facts" twin_main_ref), no process in it; git worktree remove, never --force; its branch stays)")
        __mv_settle+=("drop-twin why: $__mv_twin_why")
      elif [[ "$twin_safe" == yes ]]; then
        __crew_move_refuse "the destination path $__mv_dst_tree is already a worktree (a stale twin at ${twin_head:0:12}: 0 dirty paths, upstream 0/0, head in $(__crew_move_fact "$__mv_twin_facts" twin_main_ref))" "pass --drop-twin-why '<why>' (three words or more) to drop it (git worktree remove, never --force), or prove a prior move (--mode verify)"
      elif [[ -n "$__mv_twin_why" ]]; then
        __crew_move_refuse "the destination path $__mv_dst_tree is already a worktree, and it is no stale twin safe to drop: ${twin_unsafe:-the twin could not be judged}" "--drop-twin-why drops only a twin with 0 dirty paths, upstream 0/0, and its head in origin/main; to keep its work and free the path, pass --setaside-twin-why '<why>' instead (renames it whole under _setaside/, never a delete)"
      else
        __crew_move_refuse "the destination path $__mv_dst_tree is already a worktree" "a prior move left it: prove it (--mode verify); or keep its work and free the path: --setaside-twin-why '<why>' (three words or more; renames it whole under _setaside/, never a delete)"
      fi
    fi
    # a clean mirror worktree that holds the branch is settled by removal; any other holder stays refused
    local at; at="$(__crew_move_fact "$__mv_dst_facts" branch_at)"
    if [[ -z "$at" ]]; then
      :
    elif [[ ( "$__mv_twin_drop" == yes || "$__mv_twin_aside" == yes ) && "$at" == "$__mv_dst_tree" ]]; then
      : # the twin holds the branch; its drop or its set-aside frees it
    elif [[ "$(__crew_move_fact "$__mv_dst_facts" branch_at_mirror)" != yes ]]; then
      __crew_move_refuse "branch $branch is checked out at the destination in $at" "free the branch there, then move"
    elif [[ "$(__crew_move_fact "$__mv_dst_facts" branch_at_clean)" != yes ]]; then
      __crew_move_refuse "branch $branch is checked out at the destination in the mirror worktree $at, which is dirty" "commit or clear the changes there, then move"
    else
      __mv_settle+=("remove the clean mirror worktree $at (git worktree remove, never --force)")
    fi
  fi
  if [[ -z "$__mv_extant" && "$(__crew_move_fact "$__mv_dst_facts" branch_state)" == elsewhere ]]; then
    # a branch behind the source head is fast-forwarded; the source judges it, since the destination may not hold the head yet
    local bsha anc; bsha="$(__crew_move_fact "$__mv_dst_facts" branch_sha)"
    anc="$(__crew_move_box_run "$__mv_from" __mvbox_is_ancestor "$tree" "$bsha" </dev/null 2>/dev/null | sed -n 's/^ancestor=//p')"
    if [[ "$anc" == yes ]]; then
      __mv_settle+=("fast-forward $branch ${bsha:0:12} -> ${head:0:12}")
    else
      # a branch that diverged only by a rebase is set aside, never refused: every commit it holds that the head lacks has a patch twin
      local twin_out twin_rc=0
      twin_out="$(__crew_move_judge_twins "$tree" "$org" "$repodir" "$bsha")" || twin_rc=$?
      local aref="refs/crew-move-setaside/$branch/$bsha" nt
      if [[ $twin_rc -eq 0 ]]; then
        __mv_setaside=yes
        __mv_settle+=("set aside $branch ${bsha:0:12} as $aref, then point it at ${head:0:12}")
      elif [[ $twin_rc -eq 1 && -n "$__mv_setaside_why" ]]; then
        # the caller named why the commits with no twin are kept: each rides the set-aside ref, none is deleted
        __mv_setaside=force
        __mv_settle+=("set aside $branch ${bsha:0:12} as $aref, then point it at ${head:0:12}")
        while IFS= read -r nt; do
          [[ -n "$nt" ]] && __mv_settle+=("no patch twin, kept under $aref: $nt")
        done <<< "$twin_out"
        __mv_settle+=("set-aside why: $__mv_setaside_why")
      elif [[ $twin_rc -eq 1 && "$__mv_twin_drop" == yes && "$bsha" == "$(__crew_move_fact "$__mv_twin_facts" twin_head)" ]]; then
        # the branch tip is the head of the stale twin, which the twin check proved is in origin/main: every commit
        # with no patch twin is shipped already. the old tip still rides the set-aside ref; none is deleted
        __mv_setaside=force
        __mv_setaside_note="the old tip is the stale twin's head, already in $(__crew_move_fact "$__mv_twin_facts" twin_main_ref); drop-twin why: $__mv_twin_why"
        __mv_settle+=("set aside $branch ${bsha:0:12} as $aref, then point it at ${head:0:12}")
        while IFS= read -r nt; do
          [[ -n "$nt" ]] && __mv_settle+=("no patch twin, already in $(__crew_move_fact "$__mv_twin_facts" twin_main_ref), kept under $aref: $nt")
        done <<< "$twin_out"
      elif [[ $twin_rc -eq 1 ]]; then
        # an empty twin list drops the clause whole, so the refusal never ends in a bare `: )`
        __mv_twin_clause=""
        [[ -n "${twin_out//[[:space:]]/}" ]] && __mv_twin_clause=" (no patch twin: ${twin_out//$'\n'/, })"
        __crew_move_refuse "branch $branch exists at the destination at another commit (${bsha:0:12}) that holds commits the source head lacks${__mv_twin_clause}" "pass --setaside-why '<why>' (three words or more) to keep the old tip under $aref and settle past them, or settle the branch at the destination, then move"
      elif [[ $twin_rc -eq 3 ]]; then
        __crew_move_refuse "branch $branch exists at the destination at another commit (${bsha:0:12}) that holds commits the source head lacks, and a merge commit among them is never set aside (merge: ${twin_out//$'\n'/, })" "settle the branch at the destination, then move"
      else
        __crew_move_refuse "branch $branch exists at the destination at another commit (${bsha:0:12}) that holds commits the source head lacks (the patch twins could not be judged: $twin_out)" "settle the branch at the destination, then move"
      fi
    fi
  fi

  # a merge into an extant worktree: judge it stands at the head, and that no source path lands over destination work
  __mv_merge_rows=""; __mv_merge_stats=""
  [[ -z "$__mv_extant" ]] || __crew_move_judge_extant "$tree" "$branch" "$head"

  # the seats and their conversations
  __mv_roles=(); __mv_state=(); __mv_tr=(); __mv_local_roles=()
  local r host i
  host="$(__crew_grove_host "$__mv_from")"
  while IFS= read -r r; do
    [[ -n "$r" ]] || continue
    if [[ "$r" == local:* ]]; then __mv_local_roles+=("${r#local:}"); continue; fi
    __mv_roles+=("$r")
    __mv_state+=("$(__crew_move_seat_state "$host" "$tree" "$r")")
  done < <(__crew_move_seat_roles "$tree")
  for ((i = 0; i < ${#__mv_roles[@]}; i++)); do
    case "${__mv_state[$i]}" in
      busy:*) __crew_move_refuse "seat ${__mv_roles[$i]} is busy mid-turn at the source (${__mv_state[$i]#busy:})" "wait for its turn to end: rhx git.crew.read --tree $tree --who ${__mv_roles[$i]}" ;;
      typed) __crew_move_refuse "seat ${__mv_roles[$i]} has text in its box at the source" "let its owner submit or clear the box: rhx git.crew.read --tree $tree --who ${__mv_roles[$i]}" ;;
      unread) __crew_move_refuse "seat ${__mv_roles[$i]} could not be read at the source, so it cannot be judged idle" "read it, then run this again: rhx git.crew.read --tree $tree --who ${__mv_roles[$i]}" ;;
    esac
  done
  local tr_out="" rc4=0
  if [[ ${#__mv_roles[@]} -gt 0 ]]; then
    tr_out="$(__crew_move_box_run "$__mv_from" __mvbox_transcripts "$tree" "${__mv_roles[@]}" </dev/null 2>/dev/null)" || rc4=$?
    if [[ $rc4 -ne 0 ]]; then
      __crew_move_refuse "the transcripts of the source cannot be listed (exit $rc4)" "$(__crew_move_tree_hint "$__mv_from" "$tree")"
    fi
    for ((i = 0; i < ${#__mv_roles[@]}; i++)); do
      __mv_tr+=("$(printf '%s\n' "$tr_out" | awk -F'\t' -v r="${__mv_roles[$i]}" '$1 == r { print; exit }')")
    done
  fi
  return 0
}

# .what = the one footer every judgment-stage refusal ends with (stderr)
# .why  = a refusal before any box is touched owes the human the same assurance, whichever guard raised it
# args: n (default 1)
__crew_move_said_unmoved() {
  local n="${1:-1}"
  echo "" >&2
  if (( n == 1 )); then echo "🌊 naught was moved — 1 refusal" >&2; return 0; fi
  echo "🌊 naught was moved — $n refusals" >&2
}

# .what = print the refusals (stderr) and return 2 when any stand
__crew_move_print_refusals() {
  local n=${#__mv_refusals[@]} row msg fix
  (( n > 0 )) || return 0
  for row in "${__mv_refusals[@]}"; do
    msg="${row%%$'\t'*}"; fix="${row#*$'\t'}"
    echo "✋ ConstraintError: $msg" >&2
    echo "   └─ fix: $fix" >&2
  done
  __crew_move_said_unmoved "$n"
  return 2
}

# .what = the plan: every fact the apply would act on
__crew_move_print_plan() {
  local tree="$1" mode="$2" why="$3"
  local branch head ahead dir origin pushed i r rel bytes pre tr trs s
  branch="$(__crew_move_fact "$__mv_src_facts" branch)"; head="$(__crew_move_fact "$__mv_src_facts" head)"
  ahead="$(__crew_move_fact "$__mv_src_facts" ahead)"; dir="$(__crew_move_fact "$__mv_src_facts" dir)"
  origin="$(__crew_move_fact "$__mv_src_facts" origin)"
  if [[ "${ahead:-0}" -eq 0 ]]; then pushed="yes — a remote ref holds it"; else pushed="no — ${ahead} commit(s) no remote holds; a git bundle carries them"; fi
  echo "🦫 git.crew.move --tree $tree --to $__mv_to --mode $mode${__mv_extant:+ --into-extant}${why:+ --why '$why'}"
  echo "   ├─ from: $__mv_from — from $__mv_from_why"
  echo "   ├─ to: $__mv_to"
  echo "   ├─ tree: $dir  →  $__mv_dst_tree"
  echo "   ├─ guards: $(__crew_move_guards_said)"
  if [[ "$__mv_adopt" == cut ]]; then
    echo "   │  └─ the destination tree stands, cut by a prior apply (registered, on the branch at the head; the move log vouches for it); apply adopts it"
  elif [[ -n "$__mv_adopt" ]]; then
    echo "   │  └─ the destination tree stands, half made by a prior apply (registered, on the branch at the head, clean); apply adopts it"
  fi
  if [[ -n "$__mv_adopt" && -n "$__mv_resume" ]]; then
    echo "   │  └─ the move log holds: ${__mv_resume}; apply resumes at: $(__crew_move_next_step "$__mv_resume")"
  fi
  echo "   ├─ branch: $branch @ ${head:0:12}"
  echo "   │  └─ pushed: $pushed"
  if [[ "$(__crew_move_fact "$__mv_dst_facts" main_present)" == yes ]]; then
    echo "   ├─ destination repo: $(__crew_move_fact "$__mv_dst_facts" main) — present (holds the head: $(__crew_move_fact "$__mv_dst_facts" has_head); a fetch settles it)"
  else
    echo "   ├─ destination repo: $(__crew_move_fact "$__mv_dst_facts" main) — absent; apply clones ${origin:-<no origin>}"
  fi
  for s in "${__mv_settle[@]}"; do echo "   ├─ settle: $s"; done
  # a merge into an extant worktree: each source path has a verdict by what the destination holds
  local -A verdict_of=(); local -A xy_of=()
  if [[ -n "$__mv_extant" && -n "$__mv_merge_stats" ]]; then
    local verdict is_new mp src_untracked dst_dirty dst_untracked after_dirty after_untracked dest_only xy
    while IFS=$'\t' read -r xy mp; do [[ -n "$mp" ]] && xy_of["$mp"]="$xy"; done <<< "$__mv_dirty"
    src_untracked="$(printf '%s\n' "$__mv_dirty" | awk -F'\t' '$1 == "??"' | wc -l | tr -d ' ')"
    dst_dirty="$(__crew_move_fact "$__mv_merge_stats" dirty_before)"; dst_untracked="$(__crew_move_fact "$__mv_merge_stats" untracked_before)"
    dest_only="$(__crew_move_fact "$__mv_merge_stats" dest_only)"
    after_dirty="$dst_dirty"; after_untracked="$dst_untracked"
    while IFS=$'\t' read -r _ verdict is_new mp _; do
      [[ -n "$mp" ]] || continue
      verdict_of["$mp"]="$verdict"
      [[ "$is_new" == yes ]] && after_dirty=$((after_dirty + 1))
      [[ "$is_new" == yes && "$verdict" == write && "${xy_of[$mp]:-}" == '??' ]] && after_untracked=$((after_untracked + 1))
    done <<< "$__mv_merge_rows"
    echo "   ├─ merge: into the extant destination worktree $__mv_dst_tree (same branch, same head)"
    echo "   │  ├─ write: $(__crew_move_merge_count write) · overwrite a clean tracked copy: $(__crew_move_merge_count overwrite) · delete: $(__crew_move_merge_count delete) · skip, same bytes: $(__crew_move_merge_count skip) · already gone: $(__crew_move_merge_count gone) · conflict: $(__crew_move_merge_count conflict)"
    echo "   │  ├─ destination-only paths, never touched: $dest_only"
    echo "   │  ├─ before — $(__crew_move_counts_line "$__mv_dirty_n" "$src_untracked" "$dst_dirty" "$dst_untracked")"
    echo "   │  └─ after (expected) — $(__crew_move_counts_line "$__mv_dirty_n" "$src_untracked" "$after_dirty" "$after_untracked")"
  fi
  echo "   ├─ carry: $__mv_dirty_n path(s), $(__crew_move_as_size "$__mv_dirty_bytes")   (left out: gitignored paths, node_modules, .log, .agent/.actors, .claude)"
  if [[ "$__mv_dirty_n" -gt 0 ]]; then
    local -a lines=(); mapfile -t lines <<< "$__mv_dirty"
    local row_text row_path
    for ((i = 0; i < ${#lines[@]}; i++)); do
      pre="├─"; (( i == ${#lines[@]} - 1 )) && pre="└─"
      row_text="${lines[$i]//$'\t'/  }"
      row_path="${lines[$i]#*$'\t'}"
      if [[ -n "${verdict_of[$row_path]:-}" ]]; then
        row_text="$(printf '%-9s %s' "${verdict_of[$row_path]}" "$row_text")"
      fi
      echo "   │  $pre $row_text"
    done
  fi
  echo "   ├─ seats: ${#__mv_roles[@]}"
  if [[ ${#__mv_roles[@]} -eq 0 ]]; then
    echo "   │  └─ none booted for this tree; raise them after the move: rhx git.crew.boot --tree $tree"
  fi
  for ((i = 0; i < ${#__mv_roles[@]}; i++)); do
    pre="├─"; (( i == ${#__mv_roles[@]} - 1 && ${#__mv_local_roles[@]} == 0 )) && pre="└─"
    tr="${__mv_tr[$i]:-}"
    if [[ -z "$tr" || "$tr" == *$'\t'absent ]]; then
      trs="no transcript — the seat comes up bare, no clone is hatched"
    else
      IFS=$'\t' read -r _ _ rel bytes _ <<< "$tr"
      trs="transcript $(__crew_move_as_size "$bytes") (${rel##*/})"
    fi
    echo "   │  $pre ${__mv_roles[$i]}: ${__mv_state[$i]%%:*} at the source · $trs"
  done
  for r in "${__mv_local_roles[@]}"; do echo "   │  └─ $r: a local-only seat by design — it stays where it is"; done
  echo "   ├─ the source tree and its ducts stay on disk, untouched; a fell is a later act"
  echo "   ├─ not carried: .meter/ (commit quota, sponsor bind) — the moved tree owes a fresh grant (a human runs: rhx git.commit.uses set --quant <n> --push allow)"
  echo "   └─ the destination dials its own claude account; no credential is carried"
}

# .what = apply the merge into the extant destination: count both trees, lay each path the box judged, then prove it:
#         every source path stands at the destination at the same sha256, and every destination-only path holds the
#         same sha256 as before. args: tree relay-dir. rc 2 = a conflict at the box (naught written); rc 1 = a miss
__crew_move_apply_merge() {
  local tree="$1" relay="$2" out="" rc=0 miss only_before only_after n_only
  local c_src_b c_dst_b c_src_a c_dst_a
  c_src_b="$(__crew_move_box_run "$__mv_from" __mvbox_counts "$tree" </dev/null)" || { echo "   │  └─ 💥 the counts of the source could not be read" >&2; return 1; }
  c_dst_b="$(__crew_move_box_run "$__mv_to" __mvbox_counts "$tree" </dev/null)" || { echo "   │  └─ 💥 the counts of the destination could not be read" >&2; return 1; }
  __crew_move_box_run "$__mv_from" __mvbox_manifest "$tree" </dev/null > "$relay/source.manifest" || { echo "   │  └─ 💥 the proof rows of the source could not be read" >&2; return 1; }
  __crew_move_box_run "$__mv_to" __mvbox_manifest "$tree" </dev/null > "$relay/dest.before" || { echo "   │  └─ 💥 the proof rows of the destination could not be read" >&2; return 1; }
  echo "   │  ├─ before — $(__crew_move_counts_line "$(__crew_move_fact "$c_src_b" dirty)" "$(__crew_move_fact "$c_src_b" untracked)" "$(__crew_move_fact "$c_dst_b" dirty)" "$(__crew_move_fact "$c_dst_b" untracked)")"

  # the box judges each path again against the bytes it holds, and writes naught when any path conflicts
  if [[ "$__mv_dirty_n" -gt 0 ]]; then
    __crew_move_box_run "$__mv_from" __mvbox_pack "$tree" </dev/null > "$relay/dirty.tgz" || { echo "   │  └─ 💥 the pack failed" >&2; return 1; }
    rc=0; out="$(__crew_move_box_run "$__mv_to" __mvbox_merge_unpack "$tree" < "$relay/dirty.tgz")" || rc=$?
    if [[ $rc -eq 2 ]]; then
      printf '%s\n' "$out" | awk -F'\t' '$1 == "R" && $2 == "conflict" { printf "   │  ├─ 💥 the destination holds %s with %s\n", $4, $5 }' >&2
      echo "   │  └─ 💥 the merge wrote naught: a source path would land over destination work. the ledger was NOT flipped; the destination is as it was" >&2
      return 2
    fi
    [[ $rc -eq 0 ]] || { echo "   │  └─ 💥 the merge failed at the destination (exit $rc); the ledger was NOT flipped" >&2; return 1; }
  fi
  local n_w n_o n_d n_s n_g
  n_w="$(__crew_move_fact "$out" written)"; n_o="$(__crew_move_fact "$out" overwritten)"; n_d="$(__crew_move_fact "$out" deleted)"
  n_s="$(__crew_move_fact "$out" skipped)"; n_g="$(__crew_move_fact "$out" gone)"
  echo "   │  ├─ written: ${n_w:-0} · overwritten: ${n_o:-0} · deleted: ${n_d:-0} · skipped, same bytes: ${n_s:-0} · already gone: ${n_g:-0}"

  # the proof: counts after, each source path by sha256, each destination-only path as before
  c_src_a="$(__crew_move_box_run "$__mv_from" __mvbox_counts "$tree" </dev/null)" || { echo "   │  └─ 💥 the counts of the source could not be read" >&2; return 1; }
  c_dst_a="$(__crew_move_box_run "$__mv_to" __mvbox_counts "$tree" </dev/null)" || { echo "   │  └─ 💥 the counts of the destination could not be read" >&2; return 1; }
  __crew_move_box_run "$__mv_to" __mvbox_manifest "$tree" </dev/null > "$relay/dest.after" || { echo "   │  └─ 💥 the proof rows of the destination could not be read" >&2; return 1; }
  echo "   │  ├─ after — $(__crew_move_counts_line "$(__crew_move_fact "$c_src_a" dirty)" "$(__crew_move_fact "$c_src_a" untracked)" "$(__crew_move_fact "$c_dst_a" dirty)" "$(__crew_move_fact "$c_dst_a" untracked)")"
  miss="$(LC_ALL=C comm -23 <(LC_ALL=C sort "$relay/source.manifest") <(LC_ALL=C sort "$relay/dest.after") | awk -F'\t' '{ print $2 }')"
  only_before="$(__crew_move_only_of "$relay/source.manifest" "$relay/dest.before")"
  only_after="$(__crew_move_only_of "$relay/source.manifest" "$relay/dest.after")"
  if [[ -n "$miss" ]]; then
    echo "   │  └─ 💥 a source path does not stand at the destination with the same bytes:" >&2
    printf '%s\n' "$miss" | sed 's/^/   │     /' >&2
    echo "      the ledger was NOT flipped. inspect the destination tree: $(__crew_move_tree_hint "$__mv_to" "$tree")" >&2
    return 1
  fi
  if [[ "$only_before" != "$only_after" ]]; then
    echo "   │  └─ 💥 a destination-only path changed (sha256 before and after differ):" >&2
    diff <(printf '%s\n' "$only_before") <(printf '%s\n' "$only_after") | sed -n 's/^[<>] /   │     /p' >&2
    echo "      the ledger was NOT flipped. inspect the destination tree: $(__crew_move_tree_hint "$__mv_to" "$tree")" >&2
    return 1
  fi
  n_only="$(printf '%s\n' "$only_before" | sed '/^$/d' | wc -l | tr -d ' ')"
  echo "   │  ├─ destination-only paths: $n_only, sha256 before and after equal (naught touched)"
  echo "   │  └─ every source path stands at the destination with the same bytes (sha256 read back)"
  return 0
}

# .what = the proof rows of one manifest file whose path the source manifest does not name, sorted
#         args: source manifest, manifest
__crew_move_only_of() {
  awk -F'\t' -v src="$1" 'BEGIN { while ((getline line < src) > 0) { split(line, a, "\t"); s[a[2]] = 1 } } !($2 in s)' "$2" | LC_ALL=C sort
}

# .what = apply: raise the tree, carry the bytes, prove it, flip the ledger, raise the seats
__crew_move_apply() {
  local tree="$1" why="$2" relay="$3"
  local org repodir branch head origin ahead i rc
  org="$(__crew_move_fact "$__mv_src_facts" org)"; repodir="$(__crew_move_fact "$__mv_src_facts" repodir)"
  branch="$(__crew_move_fact "$__mv_src_facts" branch)"; head="$(__crew_move_fact "$__mv_src_facts" head)"
  origin="$(__crew_move_fact "$__mv_src_facts" origin)"; ahead="$(__crew_move_fact "$__mv_src_facts" ahead)"

  # the log is written before step 1 and after each step, so an apply cut at any step can be resumed or proved
  local roles_csv resume=" $__mv_resume "
  roles_csv="$(IFS=,; printf '%s' "${__mv_roles[*]}")"
  # the seats with no transcript come up bare, as the plan says; the log keeps them, so verify judges them by that word
  __mv_bare_csv=""
  for ((i = 0; i < ${#__mv_roles[@]}; i++)); do
    [[ -n "${__mv_tr[$i]:-}" && "${__mv_tr[$i]}" != *$'\t'absent ]] || __mv_bare_csv+="${__mv_bare_csv:+,}${__mv_roles[$i]}"
  done
  if [[ -n "$__mv_resume" ]]; then
    __crew_move_log_set "$tree" "$__mv_from" "$__mv_to" "$why" "$head" "$roles_csv" resume "$branch"
  else
    __crew_move_log_set "$tree" "$__mv_from" "$__mv_to" "$why" "$head" "$roles_csv" begin "$branch"
  fi

  echo "   ├─ 1. the tree at the destination"
  local up=""
  if [[ -n "$__mv_extant" ]]; then
    up="tree=$__mv_dst_tree"
    echo "   │  └─ $branch stands at $__mv_dst_tree at ${head:0:12}, the source head (--into-extant: taken as it stands; no fetch, no settle, no drop)"
  else
    # a stale twin that holds work is set aside first, whole: the box judges it again (registered, no process in it), renames
    # it under _setaside/ with its git admin dir beside it, and reads back that the path is free and the work stands there
    if [[ "$__mv_twin_aside" == yes ]]; then
      local aside_out aside_stamp
      aside_stamp="$(date -u +%Y%m%dT%H%M%SZ)"
      rc=0; aside_out="$(__crew_move_box_run_held "$__mv_to" __mvbox_twin_setaside "$org" "$repodir" "$tree" "$aside_stamp" </dev/null)" || rc=$?
      if [[ $rc -ne 0 ]]; then echo "   │  └─ 💥 the stale twin could not be set aside at the destination (exit $rc); naught else was touched" >&2; return $(( rc == 2 ? 2 : 1 )); fi
      echo "   │  ├─ set aside the stale twin worktree $__mv_dst_tree at $(__crew_move_fact "$aside_out" set_aside_head | cut -c1-12): now at $(__crew_move_fact "$aside_out" set_aside_twin), its git admin dir at $(__crew_move_fact "$aside_out" set_aside_admin)"
      echo "   │  ├─ read back: the repo lists no worktree at the old path, the path is free, and the set-aside tree holds the same head, branch, $(__crew_move_fact "$aside_out" set_aside_dirty) dirty path(s), and sha256 of each"
      echo "   │  ├─ set-aside-twin why: $__mv_twin_aside_why"
    fi
    # a stale twin the caller vouched for is dropped first, before the fetch moves its remote refs, so the box
    # judges it again on the same refs the plan read. a twin that fails the judge now is not touched
    if [[ "$__mv_twin_drop" == yes ]]; then
      local dropped
      rc=0; dropped="$(__crew_move_box_run_held "$__mv_to" __mvbox_twin_drop "$org" "$repodir" "$tree" </dev/null)" || rc=$?
      if [[ $rc -ne 0 ]]; then echo "   │  └─ 💥 the stale twin could not be dropped at the destination (exit $rc); naught else was touched" >&2; return $(( rc == 2 ? 2 : 1 )); fi
      echo "   │  ├─ dropped the stale twin worktree $(__crew_move_fact "$dropped" dropped_twin) at $(__crew_move_fact "$dropped" dropped_twin_head | cut -c1-12) (0 dirty paths, upstream 0/0, head in $(__crew_move_fact "$__mv_twin_facts" twin_main_ref)); read back: gone; its branch stays"
      echo "   │  ├─ drop-twin why: $__mv_twin_why"
    fi
    local prep
    prep="$(__crew_move_box_run "$__mv_to" __mvbox_prep "$org" "$repodir" "$origin" "$head" </dev/null)" || {
      echo "   │  └─ 💥 the destination repo could not be made ready" >&2; return 1; }
    [[ "$(__crew_move_fact "$prep" cloned)" == yes ]] && echo "   │  ├─ cloned $origin"
    local fetch_why=""
    [[ "$(__crew_move_fact "$prep" fetch)" == failed ]] && fetch_why=" (the fetch failed: $(__crew_move_fact "$prep" fetch_said))"
    [[ -n "$fetch_why" ]] && echo "   │  ├─ 🟡 the fetch failed: $(__crew_move_fact "$prep" fetch_said); the head may still stand there"
    if [[ "$(__crew_move_fact "$prep" has_head)" != yes ]]; then
      if [[ "${ahead:-0}" -le 0 ]]; then
        echo "   │  └─ 💥 the destination cannot fetch ${head:0:12}${fetch_why}, and the source holds no unpushed commit to bundle" >&2
        return 1
      fi
      __crew_move_box_run "$__mv_from" __mvbox_bundle "$tree" </dev/null > "$relay/head.bundle" || { echo "   │  └─ 💥 the bundle of the unpushed commits failed" >&2; return 1; }
      __crew_move_box_run "$__mv_to" __mvbox_unbundle "$org" "$repodir" < "$relay/head.bundle" || { echo "   │  └─ 💥 the destination refused the bundle" >&2; return 1; }
      echo "   │  ├─ the unpushed commits rode a git bundle ($(__crew_move_as_size "$(stat -c %s "$relay/head.bundle")"))"
    fi
    # a stale copy of the branch is settled in the same box run that raises the worktree; the box judges it again
    local settle=""
    [[ ${#__mv_settle[@]} -gt 0 ]] && settle=yes
    rc=0; up="$(__crew_move_box_run_held "$__mv_to" __mvbox_up "$org" "$repodir" "$tree" "$branch" "$head" "$__mv_adopt" "$settle" "$__mv_setaside" </dev/null)" || rc=$?
    if [[ $rc -ne 0 ]]; then echo "   │  └─ 💥 the worktree could not be made at the destination (exit $rc)" >&2; return $(( rc == 2 ? 2 : 1 )); fi
    local removed settled_from
    removed="$(__crew_move_fact "$up" removed_mirror)"
    settled_from="$(__crew_move_fact "$up" settled_from)"
    [[ -n "$removed" ]] && echo "   │  ├─ settled: removed the clean mirror worktree $removed"
    local setaside_ref; setaside_ref="$(__crew_move_fact "$up" setaside_ref)"
    if [[ -n "$setaside_ref" ]]; then
      echo "   │  ├─ settled: set aside $branch ${settled_from:0:12} as $setaside_ref; read back: the ref holds the old tip, and the branch sits at the source head ${head:0:12}"
      [[ "$__mv_setaside" == force ]] && echo "   │  ├─ settled: commits with no patch twin are kept under that ref; set-aside why: ${__mv_setaside_why:-$__mv_setaside_note}"
    elif [[ -n "$settled_from" ]]; then
      echo "   │  ├─ settled: fast-forwarded $branch ${settled_from:0:12} -> ${head:0:12}; read back: the branch sits at the source head"
    fi
    if [[ "$(__crew_move_fact "$up" adopted)" == yes && "$__mv_adopt" == cut ]]; then
      echo "   │  └─ $branch up at $(__crew_move_fact "$up" tree) (adopted: a prior apply was cut after it; the move log holds: ${__mv_resume})"
    elif [[ "$(__crew_move_fact "$up" adopted)" == yes ]]; then
      echo "   │  └─ $branch up at $(__crew_move_fact "$up" tree) (adopted: a prior apply half made it)"
    else
      echo "   │  └─ $branch up at $(__crew_move_fact "$up" tree)"
    fi
  fi
  __crew_move_log_set "$tree" "$__mv_from" "$__mv_to" "$why" "$head" "$roles_csv" up "$branch"

  echo "   ├─ 2. the uncommitted and untracked paths ($__mv_dirty_n)"
  local dd=""
  if [[ -n "$__mv_extant" ]]; then
    __crew_move_apply_merge "$tree" "$relay" || return $?
  else
    # a carry the log holds is proved again first: bytes that still match are not carried twice
    if [[ "$resume" == *" carry "* ]]; then
      dd="$(__crew_move_digest_diff "$tree" "$__mv_from" "$__mv_to")" || { __crew_move_digest_unread_halt "$tree" "$dd"; return 1; }
      [[ -z "$dd" ]] && echo "   │  ├─ carried by the prior apply; re-proved, not carried again"
    fi
    if [[ "$resume" != *" carry "* || -n "$dd" ]]; then
      if [[ "$__mv_dirty_n" -gt 0 ]]; then
        __crew_move_box_run "$__mv_from" __mvbox_pack "$tree" </dev/null > "$relay/dirty.tgz" || { echo "   │  └─ 💥 the pack failed" >&2; return 1; }
        __crew_move_box_run "$__mv_to" __mvbox_unpack "$tree" < "$relay/dirty.tgz" || { echo "   │  └─ 💥 the unpack failed at the destination" >&2; return 1; }
      fi
      dd="$(__crew_move_digest_diff "$tree" "$__mv_from" "$__mv_to")" || { __crew_move_digest_unread_halt "$tree" "$dd"; return 1; }
    fi
    if [[ -n "$dd" ]]; then
      echo "   │  └─ 💥 the destination tree does not match the source:" >&2
      printf '%s\n' "$dd" | sed 's/^/   │     /' >&2
      echo "      the ledger was NOT flipped. the destination tree stands at $(__crew_move_fact "$up" tree); inspect it: $(__crew_move_tree_hint "$__mv_to" "$tree")" >&2
      return 1
    fi
    echo "   │  └─ same head, same dirty paths, same bytes (sha256)"
  fi
  __crew_move_log_set "$tree" "$__mv_from" "$__mv_to" "$why" "$head" "$roles_csv" carry "$branch"

  echo "   ├─ 3. the conversations"
  local -a with_tr=()
  for ((i = 0; i < ${#__mv_roles[@]}; i++)); do
    [[ -n "${__mv_tr[$i]:-}" && "${__mv_tr[$i]}" != *$'\t'absent ]] && with_tr+=("${__mv_roles[$i]}")
  done
  if [[ "$resume" == *" conversations "* ]]; then
    echo "   │  └─ placed by the prior apply"
  elif [[ ${#with_tr[@]} -gt 0 ]]; then
    __crew_move_box_run "$__mv_from" __mvbox_transcripts_pack "$tree" "${with_tr[@]}" </dev/null > "$relay/transcripts.tgz" || { echo "   │  └─ 💥 the transcript pack failed" >&2; return 1; }
    local placed
    placed="$(__crew_move_box_run "$__mv_to" __mvbox_transcripts_unpack "$tree" < "$relay/transcripts.tgz")" || { echo "   │  └─ 💥 the transcripts could not be placed" >&2; return 1; }
    echo "   │  └─ $(__crew_move_fact "$placed" placed) file(s) placed for: ${with_tr[*]}"
  else
    echo "   │  └─ none to carry"
  fi
  __crew_move_log_set "$tree" "$__mv_from" "$__mv_to" "$why" "$head" "$roles_csv" conversations "$branch"

  echo "   ├─ 4. install"
  local inst built
  # a tree that runs itself in its prepare hook is built first, on a fresh apply and on a resume alike: a resume that skipped the
  # build would link roles against a dist that never stood. a build made on a resume owes the install again, so its hooks run
  built="$(__crew_move_box_run_held "$__mv_to" __mvbox_build_first "$tree" "${GIT_CREW_MOVE_BUILD_CMD:-}" "${GIT_CREW_MOVE_INSTALL_SHELL:-}" </dev/null)" || {
    printf '%s\n' "$built" | sed 's/^/   │  └─ 💥 /' >&2
    echo "      the tree stands at the destination, not yet in the ledger. the move log holds the steps done. repair the build there and run this apply again to resume: rhx git.crew.move --tree $tree --to $__mv_to --mode apply" >&2
    return 1; }
  if [[ "$(__crew_move_fact "$built" build)" != none ]]; then
    echo "   │  ├─ $(__crew_move_fact "$built" build)"
    resume="${resume// install / }"
  fi
  if [[ "$resume" == *" install "* ]]; then
    echo "   │  ├─ installed by the prior apply"
  else
    # a `.claude` link the repo commits to one actor, and the source tree's init relinked to another, is settled to the
    # source's before the install: the same init at the destination refuses to replace it
    local src_link dst_link
    src_link="$(__crew_move_box_run "$__mv_from" __mvbox_claude_link "$tree" </dev/null 2>/dev/null)" || src_link=""
    dst_link="$(__crew_move_box_run "$__mv_to" __mvbox_claude_link_settle "$tree" "$(__crew_move_fact "$src_link" claude_link)" </dev/null)" || {
      echo "   │  └─ 💥 the .claude link of the destination tree could not be settled; the tree stands there, not yet in the ledger" >&2
      return 1; }
    case "$(__crew_move_fact "$dst_link" claude_link)" in
      relinked:*|dropped:*) echo "   │  ├─ .claude link $(__crew_move_fact "$dst_link" claude_link) (the tree's own init refuses a link to another actor than its source tree's; settled before the install)" ;;
    esac
    inst="$(__crew_move_box_run_held "$__mv_to" __mvbox_install "$tree" "${GIT_CREW_MOVE_INSTALL_CMD:-}" "${GIT_CREW_MOVE_INSTALL_SHELL:-}" </dev/null)" || {
      printf '%s\n' "$inst" | sed 's/^/   │  └─ 💥 /' >&2
      echo "      the tree stands at the destination, not yet in the ledger. the move log holds the steps done. repair the install there and run this apply again to resume: rhx git.crew.move --tree $tree --to $__mv_to --mode apply" >&2
      echo "      or place the row by hand: rhx git.crew.ledger --tree $tree --grove $__mv_to --idem upsert" >&2
      return 1; }
    echo "   │  ├─ $(__crew_move_fact "$inst" install)"
    __crew_move_log_set "$tree" "$__mv_from" "$__mv_to" "$why" "$head" "$roles_csv" install "$branch"
  fi

  # the role links ride no git object: read from the source, made again at the destination, and read back
  local links
  links="$(__crew_move_box_run "$__mv_from" __mvbox_role_links "$tree" </dev/null)" || {
    echo "   │  └─ 💥 the role links of the source could not be read" >&2; return 1; }
  local lrepo lrole lout linked="" lfail=""
  while IFS=$'\t' read -r lrepo lrole; do
    [[ -n "$lrepo" ]] || continue
    if ! [[ "$lrepo" =~ ^[A-Za-z0-9._-]+$ && "$lrole" =~ ^[A-Za-z0-9._-]+$ ]]; then
      lfail+="${lfail:+, }$lrepo/$lrole (not a linkable name)"; continue
    fi
    if lout="$(__crew_move_box_run_held "$__mv_to" __mvbox_role_link "$tree" "$lrepo" "$lrole" "${GIT_CREW_MOVE_INSTALL_SHELL:-}" "${GIT_CREW_MOVE_LINK_CMD:-}" </dev/null)"; then
      linked+="${linked:+, }$lrepo/$lrole"
    else
      lfail+="${lfail:+, }$lrepo/$lrole"
    fi
  done <<< "$links"
  if [[ -n "$lfail" ]]; then
    echo "   │  └─ 💥 the role link(s) did not stand at the destination: $lfail" >&2
    echo "      the tree stands at the destination, not yet in the ledger. link each in the destination tree (npx rhachet roles link --repo <repo> --role <role>), then place the row: rhx git.crew.ledger --tree $tree --grove $__mv_to --idem upsert" >&2
    echo "      or run this apply again to resume from the move log: rhx git.crew.move --tree $tree --to $__mv_to --mode apply" >&2
    return 1
  fi
  echo "   │  └─ roles linked: ${linked:-none held at the source}"
  __crew_move_log_set "$tree" "$__mv_from" "$__mv_to" "$why" "$head" "$roles_csv" links "$branch"

  echo "   ├─ 5. the ledger"
  local led
  led="$(crew.ledger enroll "$tree" "$__mv_to" "" upsert 2>&1)" || { printf '%s\n' "$led" | sed 's/^/   │  └─ 💥 /' >&2; return 1; }
  # the ledger's own row line; if its words ever change, its whole output shows, never a blank bullet
  local led_row
  led_row="$(printf '%s\n' "$led" | grep -m1 'row ' | sed 's/^ *[├└]─ //')"
  if [[ -n "$led_row" ]]; then echo "   │  └─ $led_row"; else printf '%s\n' "$led" | sed 's/^/   │  └─ /'; fi
  # the seats the move means to raise ride the log, so verify can name a seat that never registered
  __crew_move_log_set "$tree" "$__mv_from" "$__mv_to" "$why" "$head" "$roles_csv" ledger "$branch"

  echo "   ├─ 6. the seats"
  local seat_fail=0 husks=0 unread=0 hasconv pre boot_rc dest_host c bare_state live_rc bootcap="" nostamp=0
  local -a husk_cures=()
  dest_host="$(__crew_grove_host "$__mv_to")"
  # each boot's lines are kept, so a bar the stamp could not pin is counted, never left buried in a nested line
  bootcap="$(mktemp)" || bootcap=""
  for ((i = 0; i < ${#__mv_roles[@]}; i++)); do
    hasconv=""
    [[ -n "${__mv_tr[$i]:-}" && "${__mv_tr[$i]}" != *$'\t'absent ]] && hasconv=1
    # the exit code of crew.boot is read at once: any later command resets PIPESTATUS
    if [[ -n "$hasconv" ]]; then
      crew.boot --tree "$tree" --grove "$__mv_to" --roles "${__mv_roles[$i]}" --resume "${__mv_roles[$i]}" 2>&1 | tee -a "${bootcap:-/dev/null}" | sed 's/^/   │  │  /'; boot_rc="${PIPESTATUS[0]}"
    else
      crew.boot --tree "$tree" --grove "$__mv_to" --roles "${__mv_roles[$i]}" 2>&1 | tee -a "${bootcap:-/dev/null}" | sed 's/^/   │  │  /'; boot_rc="${PIPESTATUS[0]}"
    fi
    pre="├─"; (( i == ${#__mv_roles[@]} - 1 )) && pre="└─"
    if [[ "$boot_rc" -ne 0 ]]; then
      echo "   │  $pre 💥 ${__mv_roles[$i]}: the boot failed" >&2
      seat_fail=$((seat_fail + 1))
    elif [[ -z "$hasconv" ]]; then
      # no transcript: the plan said the seat comes up bare and no clone is hatched. it passes as a bare shell
      # whose duct stands (a live claude passes too); a seat with no duct is the miss
      bare_state="$(__crew_move_seat_bare_state "$dest_host" "$tree" "${__mv_roles[$i]}")"
      case "$bare_state" in
        live) echo "   │  $pre ${__mv_roles[$i]}: up at $__mv_to, a live claude" ;;
        bare) echo "   │  $pre ${__mv_roles[$i]}: up at $__mv_to, a bare shell (no transcript at the source, so no clone is hatched, as the plan said)" ;;
        unread) echo "   │  $pre 💥 ${__mv_roles[$i]}: $__mv_to did not answer, so the seat is unread" >&2; seat_fail=$((seat_fail + 1)) ;;
        *) echo "   │  $pre 💥 ${__mv_roles[$i]}: no duct stands at $__mv_to" >&2; seat_fail=$((seat_fail + 1)) ;;
      esac
    else
      # a boot that exits 0 can leave a bare shell: only a live claude counts as up.
      # rc 3 is no verdict: the grove did not answer, so the seat is unread, never a husk
      live_rc=0; __crew_move_seat_live "$dest_host" "$tree" "${__mv_roles[$i]}" || live_rc=$?
      case $live_rc in
        0) echo "   │  $pre ${__mv_roles[$i]}: up at $__mv_to${hasconv:+, resumed}, a live claude" ;;
        3)
          echo "   │  $pre 💥 ${__mv_roles[$i]}: $__mv_to did not answer, so the seat is unread" >&2
          unread=$((unread + 1)) ;;
        *)
          echo "   │  $pre 💥 ${__mv_roles[$i]}: the boot returned, but the seat holds no live claude at $__mv_to (a bare shell)" >&2
          husks=$((husks + 1))
          husk_cures+=("$(__crew_move_seat_cure "$tree" "$__mv_to" "${__mv_roles[$i]}")") ;;
      esac
    fi
  done
  # a bar is cosmetic, so a miss fails no move. but it is the wish's gate, so it is said here once, with the cure
  # the count is the stamp's own (__duct_stamp_misses_count), never a second copy of its words
  nostamp=""
  if [[ -n "$bootcap" ]]; then
    nostamp="$(__duct_stamp_misses_count "$bootcap")" || nostamp=""
    rm -f "$bootcap"
  fi
  if [[ -z "$nostamp" ]]; then
    echo "   ├─ 🟡 the seat bars are unread — the boot capture could not be kept or read. the seats stand; to be sure of the bars: rhx git.crew.refresh --tree $tree"
  fi
  if [[ -n "$nostamp" && "$nostamp" -gt 0 ]]; then
    echo "   ├─ 🟡 $nostamp seat bar(s) NOT stamped (each says why, above). the seats stand; repaint the bars: rhx git.crew.refresh --tree $tree"
  fi
  if [[ $unread -gt 0 ]]; then
    echo "   └─ 💥 $unread seat(s) unread at $__mv_to. the tree and the ledger moved; read them once it answers: rhx git.crew.move --tree $tree --to $__mv_to --from $__mv_from --mode verify" >&2
  fi
  if [[ $unread -gt 0 && $seat_fail -eq 0 && $husks -eq 0 ]]; then
    return 1
  fi
  if [[ $seat_fail -gt 0 || $husks -gt 0 ]]; then
    if [[ $seat_fail -gt 0 ]]; then
      echo "   └─ 💥 $seat_fail seat(s) failed to boot. the tree and the ledger moved; cure the seats: rhx git.crew.heal --tree $tree --what boot --mode apply" >&2
    fi
    if [[ $husks -gt 0 ]]; then
      echo "   └─ 💥 $husks seat(s) left as a bare shell at $__mv_to. the tree and the ledger moved; cure each:" >&2
      for c in "${husk_cures[@]}"; do echo "        $c" >&2; done
    fi
    return 1
  fi
  echo "   └─ ✅ moved. prove it whole: rhx git.crew.move --tree $tree --to $__mv_to --from $__mv_from --mode verify"
  echo "      the source seats may still run at $__mv_from and the duct registry now points at $__mv_to; to stop them and to fell the source are later acts"
  echo "      the seat bars are not read from here; on $__mv_to, read each one: rhx duct.bar.probe"
  return 0
}

# .what = verify: the same head, the same dirty bytes, the ledger row, a live claude in each seat
# .note = the seats checked are the destination's own named seats plus the seats the move log says the
#         move meant to raise, so a seat that landed as an unregistered bare shell is still read
__crew_move_verify() {
  local tree="$1" miss=0 row uri host led dd rc
  echo "🦫 git.crew.move --tree $tree --to $__mv_to --mode verify"
  echo "   ├─ from: $__mv_from — from $__mv_from_why"
  # an apply cut before its ledger step: name the steps the log holds and the step it stopped before
  local cut; cut="$(__crew_move_log_resume "$tree" "$__mv_from" "$__mv_to")"
  if [[ -n "$cut" ]]; then
    echo "   ├─ move log: an apply was cut; it holds: $cut — cut before: $(__crew_move_next_step "$cut"); resume: rhx git.crew.move --tree $tree --to $__mv_to --mode apply"
  fi
  led="$(__crew_ledger_grove_of "$tree")"
  if [[ "$led" == "$__mv_to" ]]; then echo "   ├─ ✓ ledger: $tree is on $__mv_to"; else echo "   ├─ ✗ ledger: holds ${led:-<no row>}, not $__mv_to"; miss=$((miss + 1)); fi
  local tree_ok="the same head, branch, dirty paths, and bytes at both ends" ddrc=0
  if [[ -n "$__mv_extant" ]]; then
    # the extant destination holds work of its own, so the ends are no equal sets: each source path must stand there
    dd="$(__crew_move_merge_contain_diff "$tree" "$__mv_from" "$__mv_to")" || ddrc=$?
    tree_ok="every source path stands at the destination with the same bytes"
  else
    dd="$(__crew_move_digest_diff "$tree" "$__mv_from" "$__mv_to")" || ddrc=$?
  fi
  # an unread end is no verdict: it is never said as "the ends differ"
  if [[ $ddrc -ne 0 ]]; then
    echo "   ├─ ✗ tree: unread — $dd"; miss=$((miss + 1))
  elif [[ -z "$dd" ]]; then
    echo "   ├─ ✓ tree: $tree_ok"
  else
    echo "   ├─ ✗ tree: the ends differ"; printf '%s\n' "$dd" | sed 's/^/   │     /'; miss=$((miss + 1))
  fi
  host="$(__crew_grove_host "$__mv_to")"
  local -a roles=()
  mapfile -t roles < <({ __crew_move_seat_roles "$tree" | grep -v '^local:'; __crew_move_log_roles "$tree" "$__mv_to"; } | awk 'NF && !seen[$0]++')
  # a seat the plan said comes up bare (no transcript at the source, no clone hatched) passes as a bare shell that stands
  local -a bare=()
  if [[ ${#roles[@]} -gt 0 ]]; then mapfile -t bare < <(__crew_move_bare_roles "$tree" "${roles[@]}"); fi
  for row in "${roles[@]}"; do
    [[ -n "$row" ]] || continue
    uri="$(__crew_duct_uri "$host" "$tree" "$row")"
    rc=0; __duct_uri_holds_live_claude "$uri" || rc=$?
    case $rc in
      0) echo "   ├─ ✓ seat $row: a live claude at $__mv_to" ;;
      3) echo "   ├─ ✗ seat $row: unread — $__mv_to did not answer"; miss=$((miss + 1)) ;;
      *)
        local said="" read_rc=0
        if [[ " ${bare[*]:-} " == *" $row "* ]]; then
          said="$(duct.read --on "$uri" --raw --lines 5 2>&1 1>/dev/null)" || read_rc=$?
        fi
        if [[ " ${bare[*]:-} " != *" $row "* ]]; then
          echo "   ├─ ✗ seat $row: no live claude at $__mv_to — cure: $(__crew_move_seat_cure "$tree" "$__mv_to" "$row")"; miss=$((miss + 1))
        elif [[ $read_rc -eq 0 ]]; then
          echo "   ├─ ✓ seat $row: a bare shell at $__mv_to (no transcript at the source, so it comes up bare, as the plan said)"
        elif [[ "$said" != *"is absent"* ]]; then
          # only `is absent` proves no duct; any other failed read is no verdict
          echo "   ├─ ✗ seat $row: unread — $__mv_to did not answer"; miss=$((miss + 1))
        else
          # a bare seat has no conversation to resume: its cure boots it plain
          echo "   ├─ ✗ seat $row: no duct stands at $__mv_to — cure: rhx git.crew.boot --tree $tree --grove $__mv_to --roles $row"; miss=$((miss + 1))
        fi ;;
    esac
  done
  if [[ $miss -gt 0 ]]; then
    echo "   └─ 💥 $miss check(s) missed" >&2
    return 1
  fi
  echo "   └─ ✅ the move holds"
  echo "      the seat bars are not read from here; on $__mv_to, read each one: rhx duct.bar.probe"
  return 0
}

# .what = refuse a move of a local-only tree onto any cloud grove
# .why  = some trees hold work that must land on the operator's own box (a notebook whose
#         lessons promote upward from it). the trees are the operator's, so they come from
#         GIT_CREW_MOVE_LOCAL_ONLY_TREES: space-separated tree globs, a `!` glob spares a match.
#         e.g. 'notebook.* !notebook.direction.*'. unset binds none
# args: tree to · rc: 0 = the move may proceed · 2 = refused, said on stderr
__crew_move_guard_local_only() {
  local tree="$1" to="$2" glob held=""
  [[ "$to" == cloud://* ]] || return 0
  local -a globs
  read -r -a globs <<< "${GIT_CREW_MOVE_LOCAL_ONLY_TREES:-}"
  for glob in "${globs[@]}"; do
    [[ "$glob" == '!'* ]] && continue
    # shellcheck disable=SC2053 # the glob is meant to match
    [[ "$tree" == $glob ]] && held="$glob"
  done
  [[ -n "$held" ]] || return 0
  for glob in "${globs[@]}"; do
    [[ "$glob" == '!'* ]] || continue
    # shellcheck disable=SC2053 # the glob is meant to match
    [[ "$tree" == ${glob#!} ]] && return 0
  done
  echo "✋ ConstraintError: '$tree' is a local-only tree (it matches '$held'), so it moves onto no cloud grove" >&2
  echo "   ├─ bound by: GIT_CREW_MOVE_LOCAL_ONLY_TREES='${GIT_CREW_MOVE_LOCAL_ONLY_TREES}'   # a '!' glob spares a match" >&2
  echo "   └─ fix: rhx git.crew.move --tree $tree --to local" >&2
  return 2
}

# .what = the verb
crew.move() {
  local tree="" to="" from="" mode="plan" why="" sa_why="" sa_given="" tw_why="" tw_given="" ta_why="" ta_given="" extant=""
  while [[ $# -gt 0 ]]; do
    # a flag that takes a value refuses a value absent or a value that is the next flag: `--tree --to local` would
    # read `--to` as the tree, then blame `--to` as absent, so the caller is sent to inspect the flag they did pass.
    # a name (tree, grove, mode) never starts with `--`; a prose reason may (`--why '-- the cap moved'`), so a
    # reason is refused only when its value is one of this verb's own flags
    local __mv_unvalued=""
    case "$1" in
      --tree|--to|--from|--mode)
        [[ $# -lt 2 || "$2" == --* ]] && __mv_unvalued=yes ;;
      --why|--setaside-why|--drop-twin-why|--setaside-twin-why)
        [[ $# -lt 2 ]] && __mv_unvalued=yes
        case "${2:-}" in
          --tree|--to|--from|--mode|--why|--setaside-why|--drop-twin-why|--setaside-twin-why|--into-extant|--help|-h) __mv_unvalued=yes ;;
        esac ;;
    esac
    if [[ -n "$__mv_unvalued" ]]; then
      local __mv_got="none"; [[ $# -ge 2 ]] && __mv_got="the next flag '$2'"
      echo "✋ ConstraintError: $1 takes a value, got $__mv_got" >&2
      echo "   └─ fix: rhx git.crew.move --tree <tree> --to <grove>   # each flag with its value beside it" >&2
      return 2
    fi
    case "$1" in
      --into-extant) extant=yes; shift ;;
      --setaside-twin-why) ta_why="${2:-}"; ta_given=yes; shift 2 ;;
      --setaside-why) sa_why="${2:-}"; sa_given=yes; shift 2 ;;
      --drop-twin-why) tw_why="${2:-}"; tw_given=yes; shift 2 ;;
      --tree) tree="${2:-}"; shift 2 ;;
      --to) to="${2:-}"; shift 2 ;;
      --from) from="${2:-}"; shift 2 ;;
      --mode) mode="${2:-}"; shift 2 ;;
      --why) why="${2:-}"; shift 2 ;;
      *) echo "✋ ConstraintError: unknown arg '$1'" >&2
         echo "   ├─ valid args: --tree <tree> · --to <grove> · --from <grove> · --mode plan|apply|verify · --why <why> · --setaside-why <why> · --drop-twin-why <why> · --setaside-twin-why <why> · --into-extant · --help" >&2
         echo "   └─ fix: rhx git.crew.move --tree <tree> --to <grove>   # see --help for each" >&2
         return 2 ;;
    esac
  done
  [[ -n "$tree" ]] || { echo "✋ ConstraintError: --tree is required" >&2; echo "   └─ fix: rhx git.crew.move --tree <tree> --to <grove>" >&2; return 2; }
  if [[ ! "$tree" =~ ^[A-Za-z0-9._-]+$ ]]; then
    echo "✋ ConstraintError: --tree '$tree' is no bare tree slug" >&2
    echo "   ├─ a slug holds letters, digits, '.', '_', and '-' alone (no '/', space, or path), e.g. svc-lessons.beav.feat-book-a-lesson" >&2
    echo "   └─ fix: rhx git.crew.list   # it prints each tree's slug" >&2
    return 2
  fi
  [[ -n "$to" ]] || { echo "✋ ConstraintError: --to is required" >&2; echo "   └─ fix: rhx git.crew.move --tree $tree --to local | cloud://<grove>   # rhx git.grove.list names them" >&2; return 2; }
  case "$mode" in plan|apply|verify) : ;; *) echo "✋ ConstraintError: --mode takes plan | apply | verify (got '$mode')" >&2; echo "   └─ fix: --mode plan | apply | verify   # plan reads, apply moves, verify proves a finished move" >&2; return 2 ;; esac
  if [[ -n "$sa_given" && "$(printf '%s' "$sa_why" | wc -w)" -lt 3 ]]; then
    echo "✋ ConstraintError: --setaside-why needs a reason of three words or more (got '$sa_why')" >&2
    echo "   └─ fix: --setaside-why '<why the commits with no patch twin are kept>'" >&2
    return 2
  fi
  if [[ -n "$tw_given" && "$(printf '%s' "$tw_why" | wc -w)" -lt 3 ]]; then
    echo "✋ ConstraintError: --drop-twin-why needs a reason of three words or more (got '$tw_why')" >&2
    echo "   └─ fix: --drop-twin-why '<why the stale worktree at the destination may go>'" >&2
    return 2
  fi
  # a merge takes the destination worktree as it stands: a flag that settles a fresh raise has no meaning beside it
  if [[ -n "$extant" && -n "$tw_given" ]]; then
    echo "✋ ConstraintError: --into-extant takes no --drop-twin-why: it never drops or settles the destination worktree" >&2
    echo "   └─ fix: drop one of the two flags" >&2
    return 2
  fi
  if [[ -n "$extant" && -n "$sa_given" ]]; then
    echo "✋ ConstraintError: --into-extant takes no --setaside-why: it never settles a branch at the destination" >&2
    echo "   └─ fix: drop one of the two flags" >&2
    return 2
  fi
  if [[ -n "$ta_given" && "$(printf '%s' "$ta_why" | wc -w)" -lt 3 ]]; then
    echo "✋ ConstraintError: --setaside-twin-why needs a reason of three words or more (got '$ta_why')" >&2
    echo "   └─ fix: --setaside-twin-why '<why the stale worktree at the destination is set aside>'" >&2
    return 2
  fi
  # a twin is either dropped (provably safe) or set aside (kept whole): one act per twin
  if [[ -n "$ta_given" && -n "$tw_given" ]]; then
    echo "✋ ConstraintError: --setaside-twin-why and --drop-twin-why name two acts on one twin" >&2
    echo "   └─ fix: drop one of the two flags (--setaside-twin-why keeps every byte; --drop-twin-why removes only a provably safe twin)" >&2
    return 2
  fi
  if [[ -n "$extant" && -n "$ta_given" ]]; then
    echo "✋ ConstraintError: --into-extant takes no --setaside-twin-why: it lands into the destination worktree as it stands" >&2
    echo "   └─ fix: drop one of the two flags" >&2
    return 2
  fi
  __mv_extant="$extant"
  __mv_setaside_why="$sa_why"
  __mv_twin_why="$tw_why"
  __mv_twin_aside_why="$ta_why"
  tree="$(__crew_canon_name "$tree")"
  __mv_to="$(__crew_move_as_grove "$to")" || { echo "✋ ConstraintError: --to '$to' is neither local nor a grove name" >&2; echo "   └─ fix: --to local | cloud://<grove> | <grove>   # rhx git.grove.list" >&2; __crew_move_said_unmoved; return 2; }
  # 🔴 a crew tree of a local-only repo moves onto no cloud grove, in plan or apply: refused ahead of any read of a box
  local rc=0
  __crew_move_guard_local_only "$tree" "$__mv_to" || { rc=$?; [[ $rc -eq 2 ]] && __crew_move_said_unmoved; return $rc; }
  __mv_refusals=()

  __crew_move_derive_from "$tree" "$from" "$mode" || { rc=$?; [[ $rc -eq 2 ]] && __crew_move_said_unmoved; return $rc; }

  # the two ends: known, before any box is read
  local ends=0
  __crew_move_judge_grove source "$__mv_from" || ends=1
  __crew_move_judge_grove destination "$__mv_to" || ends=1
  if [[ $ends -ne 0 ]]; then __crew_move_print_refusals; return $?; fi

  if [[ "$mode" == verify ]]; then
    __crew_move_verify "$tree"
    return $?
  fi

  if [[ "$mode" == apply ]]; then
    __crew_move_locked "$tree" "$mode" "$why"
    return $?
  fi
  __crew_move_judge_then_act "$tree" "$mode" "$why"
}

# .what = run an apply under a per-tree lock, from the gather to the last seat
# .why  = gather reads the destination (worktree, branch, twin) and apply writes it.
#         two applies of one tree that both read the same pre-state would both raise,
#         carry, enroll, and boot. the lock spans the read AND the write, so a second
#         apply is refused at once rather than run against a state the first now changes
# .bound = the lock is on the caller's grove: two callers on two groves are not
#         serialized by it. the supervisor of a tree is one seat, so that is a bound
#         a human crosses only by hand
# .note = `flock -n`: a held lock is refused (exit 2), never waited on, since a
#         waited apply would judge a destination the first apply already moved
__crew_move_locked() {
  local tree="$1" mode="$2" why="$3" dir lockpath
  dir="${CREWWORK_DIR:-$HOME/.crewwork}/.locks"
  mkdir -p "$dir" || { echo "💥 MalfunctionError: could not make the lock dir $dir" >&2; return 1; }
  lockpath="$dir/move.$tree.lock"
  # flock exits non-zero both for a held lock and for its own absence; only the first is contention
  command -v flock >/dev/null || {
    echo "💥 MalfunctionError: flock is not on this box's PATH, so the move lock cannot be taken" >&2
    echo "   └─ fix: install util-linux (it ships flock), then run this again" >&2
    return 1
  }
  {
    if ! flock -n 8; then
      echo "✋ ConstraintError: another apply of $tree holds the move lock, so this one judges naught" >&2
      echo "   ├─ lock: $lockpath" >&2
      echo "   └─ fix: wait for it to finish, then run this again: rhx git.crew.move --tree $tree --to $__mv_to --mode apply" >&2
      __crew_move_said_unmoved
      return 2
    fi
    __crew_move_judge_then_act "$tree" "$mode" "$why"
  } 8>"$lockpath"
}

# .what = gather both ends, print the plan and every refusal, then apply when asked
__crew_move_judge_then_act() {
  local tree="$1" mode="$2" why="$3" rc=0
  __crew_move_gather "$tree" || return $?

  # the plan prints whenever both ends were read, refusals or not: the refusals then stand beside the facts
  if [[ -n "$__mv_src_facts" && -n "$__mv_dst_facts" ]]; then
    __crew_move_print_plan "$tree" "$mode" "$why"
  fi
  if [[ ${#__mv_refusals[@]} -gt 0 ]]; then
    echo ""
    __crew_move_print_refusals
    return $?
  fi
  if [[ "$mode" == plan ]]; then
    echo ""
    echo "🌊 plan only: naught was moved. apply: rhx git.crew.move --tree $tree --to $__mv_to --mode apply${__mv_extant:+ --into-extant}${__mv_setaside_why:+ --setaside-why '$__mv_setaside_why'}${__mv_twin_why:+ --drop-twin-why '$__mv_twin_why'}${__mv_twin_aside_why:+ --setaside-twin-why '$__mv_twin_aside_why'}"
    return 0
  fi

  echo ""
  local relay; relay="$(mktemp -d)"
  rc=0
  __crew_move_apply "$tree" "$why" "$relay" || rc=$?
  rm -rf "$relay"
  return $rc
}
