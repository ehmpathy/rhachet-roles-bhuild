#!/usr/bin/env bash
######################################################################
# .what = move a TREE's state between groves, in a named direction
#
# .why  = a grove is where every clone works, so a grove is exactly the box
#         that saturates. and a human's only two read paths both ran ON it —
#         `crew.read` (a lossy pane scrape) and `crew.show` (an ssh tab, whose
#         nvim halts when the grove stalls).
#
#         measured 2026-09-09 on grove-sandpine-v20260901: load 27.8 / 4 cpu =
#         696%, runq 23, and the box had stalled on cpu for 14.9% of its
#         6.1-day life. four nvim sat on it, two of them live human review
#         sessions. ⇒ the review surface was coupled to the resource the
#         robots exhaust: the more work the crews did, the less able the human
#         was to look at it.
#
#         so the tree's state travels to a box the human owns, and the read
#         happens there, where a saturated grove cannot reach it.
#
# .the shape — three axes: a tree, a direction, and a scope
#
#   tree.sync --tree <slug> --from <grove> --into <grove> [--what <glob>...]
#
#   groves are `local` or `cloud://<name>` — the same vocabulary
#   __crew_grove_host already speaks, so no second dialect is invented.
#
# 🔴 .the two directions are NOT interchangeable, and the flags must not imply
#    they are
#
#   an earlier shape was a PULLER with a `--push-feedback` bolt-on, which made
#   the safety structural: no flag could send code upward. a symmetric verb
#   gives that away, so `--what` re-establishes it:
#
#     --into local      scope OPTIONAL, defaults WIDE. a pull writes only into
#                       a mirror dir this lib owns, so it can harm no crew
#     --into cloud://   scope REQUIRED. an unscoped write onto a live worktree
#                       clobbers a crew's in-flight edits, silently, while
#                       they work — the worst outcome available here
#
#   ⇒ the same guarantee `git checkout <ref> -- <paths>` has: you can only
#     touch what you NAME.
#
# 🔴 .why the two directions use DIFFERENT mechanisms — deliberate, not drift
#
#   into local   a real `git fetch` of a snapshot ref. the mirror must be a
#                REAL REPO, because the review act IS `git diff`. an rsync'd
#                pile of files has a dangling `.git` (a worktree's .git is a
#                FILE that points at the grove's gitdir), so the one operation
#                you opened the mirror to run is the one that breaks
#
#   into a grove `git archive <ref> -- <globs> | tar -x`. it writes the named
#                files and naught else: no ref lands in the crew's repo, and
#                — the part that matters — their INDEX is never touched.
#                `git checkout <ref> -- <paths>` would have staged what it
#                wrote, so the crew's next `git status` would show feedback
#                files staged, mid-round, with no idea who staged them
#
# .the snapshot mutates NAUGHT
#   the diff that matters is usually UNCOMMITTED, so the snapshot must capture
#   a dirty worktree and leave it exactly as it stands:
#
#     ⛔ `git stash push -u` REMOVES the work from the crew's worktree
#     ⛔ `git diff HEAD` misses untracked files, which are most of a new round
#     🟢 a TEMP INDEX — GIT_INDEX_FILE redirects every index write to a scratch
#        file, so the crew's real index, worktree, and branch stay untouched
#        by construction rather than by care
#
#   the commits are DETERMINISTIC (fixed identity, fixed dates, fixed message),
#   so an unchanged worktree yields the IDENTICAL sha. a re-sync of idle work
#   is then a true no-op rather than a fresh object every run — which is the
#   whole answer to "i dont want wasted cpu".
#
# 🔴 .the snapshot is a CHAIN of two, because staged ≠ unstaged
#   a crew's uncommitted work is never one pile. it is two, and which half a
#   file sits in is a statement the crew made on purpose:
#
#     staged        "this part I consider done"
#     since staged  "this part is still in my hands"
#
#   one HEAD+dirty tree records the SUM and forgets the split, so a mirror built
#   from it can say what the crew is at work on and cannot say what they have
#   changed since they last staged. that second question is the review question.
#
#   ⇒ so the snapshot is two commits, and the unpack restores both ends:
#
#       HEAD  ←  <index tree>  ←  <worktree tree>        ref → the tip
#
#     and in the mirror, HEAD = their tip · index = their index · worktree =
#     their worktree. every git verb there then means what it means on the
#     grove, which is the whole claim of a mirror.
#
# .what falls out for free, and must not be lost
#     git show <ref>^                   IS what they staged
#     git show <ref>                    IS what they changed since they staged
#     git diff <ref>^^ <ref>            IS the whole uncommitted delta
#     git range-diff <ref>@{1} <ref>    what they did since I last looked
#   and IN the mirror, with no ref incantation at all:
#     git diff · git diff --cached · git status
######################################################################

# .why sourced, never executed: this is the lib; `git.tree.sync.sh` is the
#      thin skill over it, exactly as crewwork/ductwork/termwork are split.

SYNCWORK_DIR="${SYNCWORK_DIR:-$HOME/.git.forest}"

# where trees and mirrors live. the REMOTE form keeps `~` unexpanded so the
# GROVE's shell expands it — the local form holds /home/bert, which is true
# of this box and false of every grove (whose user is `camper`).
SYNCWORK_GIT_ROOT="${SYNCWORK_GIT_ROOT:-${CREWWORK_GIT_ROOT:-$HOME/git}}"
SYNCWORK_GIT_ROOT_REMOTE="${SYNCWORK_GIT_ROOT_REMOTE:-${CREWWORK_GIT_ROOT_REMOTE:-~/git}}"

# .why the ssh command is a VARIABLE: it is the one seam between this lib and
#      a machine it cannot reach in a test. a hermetic test points it at a
#      shim that runs the command locally, so every path below is exercised
#      for real without a network (rule.require.hermetic-tests).
SYNCWORK_SSH="${SYNCWORK_SSH:-ssh}"

# the ref namespace the snapshot lands in. one ref per tree, on both ends.
SYNCWORK_REF_NS="${SYNCWORK_REF_NS:-refs/mirror}"

######################################################################
# internals
######################################################################

# .what = the host a grove names — '' for this box, the ssh alias otherwise
# .why  = reuses crewwork's vocabulary rather than invent a second one. when
#         crewwork is loaded its version wins; this fallback keeps syncwork
#         usable standalone (and under test) without it.
if ! declare -f __crew_grove_host >/dev/null 2>&1; then
  __crew_grove_host() {
    local grove="${1:-local}"
    case "$grove" in
      local|"") printf '' ;;
      cloud://*) printf '%s' "${grove#cloud://}" ;;
      *) echo "✋ sync: --from/--into must be 'local' or 'cloud://<name>' (got '$grove')" >&2
         return 2 ;;
    esac
  }
fi

# .what = run a command on a host — locally when the host is '', else over ssh
# .why  = every operation below is written ONCE and works in both directions.
#         a local/remote branch at each call site would be four copies of the
#         same logic, and the cloud arm would be the one nobody tests.
#
# ⚠️ `-n` on ssh: ssh reads stdin by default to forward it, so an ssh called
#    from inside a `while read` loop eats that loop's input. the flag is here
#    rather than at each caller because whether it is safe would otherwise be
#    a fact about every CALLER, and a rule with N readers is a rule that
#    drifts (the account is at __duct_list_host_sessions in ductwork.sh).
__sync_run() {
  local host="$1"; shift
  if [[ -z "$host" ]]; then
    bash -c "$*"
  else
    $SYNCWORK_SSH -n "$host" "$*"
  fi
}

# .what = the same, but STDIN is piped through to the remote command
# .why  = the narrow write is `git archive | tar -x`, and the tar half runs on
#         the destination. it needs the stream, so it cannot take `-n`.
__sync_run_stdin() {
  local host="$1"; shift
  if [[ -z "$host" ]]; then
    bash -c "$*"
  else
    $SYNCWORK_SSH "$host" "$*"
  fi
}

# .what = the git root as the given host's own shell must expand it
__sync_git_root() {
  local host="$1"
  if [[ -z "$host" ]]; then printf '%s' "$SYNCWORK_GIT_ROOT"
  else printf '%s' "$SYNCWORK_GIT_ROOT_REMOTE"; fi
}

# .what = the dir a tree slug names, ON a given host
# .why  = the convention is ours, so the host's own shell can expand it. a
#         local `-d` test cannot answer for a cloud tree.
#
# 🔴 _mirrors is searched BEFORE _worktrees, and the order carries the round
#    trip. a grove holds a tree at `<org>/_worktrees/<tree>`; a mirror this lib
#    made sits at `<org>/_mirrors/<tree>`. so a `--from local` that knew only
#    _worktrees could not find the mirror it had just written — the pull worked
#    and the feedback push answered "no worktree on local", which reads as a
#    typo'd slug rather than the gap it was. measured 2026-09-10 on
#    svc-reservations.beav.feat-spot-forecast-widget.
#
#    ⇒ so `local` means THE MIRROR for this verb, deliberately and in both
#      directions: --into local writes one, --from local reads that same one.
#      one sense per word, and the human's feedback is only ever in the mirror.
#      a grove carries no _mirrors dir, so the same order picks its worktree.
#
# ⚠️ the glob runs under `sh -c`, never a login shell: a grove's login shell is
#    zsh, and zsh ERRORS on an unmatched glob rather than leave it literal —
#    so a merely-absent tree printed a shell error and looked like a transport
#    fault. sh leaves it literal, `ls -d` fails on it, and the absent case
#    stays quiet, which is what absent should sound like.
__sync_tree_dir() {
  local host="$1" slug="$2"
  local dotted="${slug//_/.}"
  local root found
  root="$(__sync_git_root "$host")"
  found=$(__sync_run "$host" \
    "sh -c 'ls -d $root/*/_mirrors/$dotted $root/*/_mirrors/$slug $root/*/_worktrees/$dotted $root/*/_worktrees/$slug 2>/dev/null | head -1'" \
    2>/dev/null) || true
  found=$(printf '%s' "$found" | tr -d '\r' | sed '/^$/d' | head -1)
  [[ -n "$found" ]] || return 1
  printf '%s' "$found"
}

# .what = the org segment of a tree path — <root>/<org>/{_worktrees,_mirrors}/<tree>
# .why  = both shapes are trimmed, so this holds whichever kind __sync_tree_dir
#         picked. one cut per shape rather than a caller who must know which.
__sync_org_of_dir() {
  local dir="$1"
  dir="${dir%/_worktrees/*}"
  dir="${dir%/_mirrors/*}"
  printf '%s' "${dir##*/}"
}

# .what = the repo segment of a tree slug — <repo>.<user>.<slug>
__sync_repo_of_tree() {
  local slug="${1//_/.}"
  printf '%s' "${slug%%.*}"
}

######################################################################
# the snapshot — capture a DIRTY worktree, mutate naught
######################################################################

# .what = build a snapshot CHAIN of <treedir> on <host>; echo the tip sha
# .why  = see the header. the four guarantees this must hold, in order of how
#         expensive they are to lose:
#           1. the crew's index/worktree/branch are untouched
#           2. untracked files travel; gitignored files do not
#           3. the STAGED/UNSTAGED partition travels — two trees, never one
#           4. the sha is deterministic, so an idle re-sync is a true no-op
#
# 🔴 #3 is why this builds TWO commits rather than one. a single HEAD+dirty tree
#    is a LOSSY transport: it records WHAT the worktree holds and forgets which
#    half of it the crew had staged. so the mirror could answer "what is this
#    crew at work on" and could NOT answer "what have they changed SINCE they
#    last staged" — and that second question is the one a reviewer actually asks
#    of a crew mid-round. the partition cannot be recovered downstream; it lives
#    only here, in the crew's index, and only at this instant.
#
#    ⇒ the chain, oldest first:
#
#        HEAD  ←  <index tree>  ←  <worktree tree>          ref → the tip
#
#      git show <ref>^   IS what they staged
#      git show <ref>    IS what they changed since they staged
#
# ⚠️ the index tree is read from a COPY of the crew's index file, never from the
#    index itself. `git write-tree` writes its computed cache-tree extension back
#    into whatever index it read — so pointed at the real one it would rewrite
#    the crew's index bytes mid-round. semantically benign, and it breaks
#    guarantee #1 as it is actually clamped (a byte fingerprint), which is the
#    right place to find out that "benign" is a judgment nobody asked for.
#
# ⚠️ #2 is a property of `git add -A`, and it is the SNAPSHOT's guarantee, never
#    the sync's. `--also-ignored` opts a NAMED path past it on a second
#    transport (__sync_pull_ignored) — outside this commit, so #4 still holds.
#
# ⚠️ `cd` to the worktree ROOT carries real weight: `git add -A` from a
#    subdirectory does not reach upward, so a snapshot taken from anywhere
#    else silently omits all above it.
__sync_snapshot() {
  local host="$1" dir="$2" ref="$3"
  local out sha

  # the sentinel is what parts "ran, and here is the sha" from "never ran".
  # without it a failed ssh yields an empty sha, which every caller below
  # would read as an empty tree (term=false-report).
  out=$(__sync_run "$host" "$(cat <<EOSNAP
set -e
cd '$dir'
tmp=\$(mktemp)
tmpi=\$(mktemp)
trap 'rm -f "\$tmp" "\$tmpi"' EXIT

# ── tree 1: the WORKTREE — HEAD, overlaid with all that sits on disk ──
export GIT_INDEX_FILE="\$tmp"
git read-tree HEAD
git add -A
tree=\$(git write-tree)
unset GIT_INDEX_FILE

# ── tree 2: the INDEX — exactly what the crew has staged ──
# the COPY is the point; see the header. an unmerged index cannot be written to
# a tree at all, so a crew mid-conflict degrades to "naught staged" rather than
# a hard stop on the whole sync — their worktree still travels in tree 1.
idxreal=\$(git rev-parse --git-path index)
if [ -f "\$idxreal" ]; then cp "\$idxreal" "\$tmpi"; else GIT_INDEX_FILE="\$tmpi" git read-tree HEAD; fi
itree=\$(GIT_INDEX_FILE="\$tmpi" git write-tree 2>/dev/null) || itree=\$(git rev-parse 'HEAD^{tree}')

# ── the chain: HEAD ← index ← worktree ──
isha=\$(GIT_AUTHOR_NAME=tree.sync GIT_AUTHOR_EMAIL=tree.sync@local \
      GIT_COMMITTER_NAME=tree.sync GIT_COMMITTER_EMAIL=tree.sync@local \
      GIT_AUTHOR_DATE='@0 +0000' GIT_COMMITTER_DATE='@0 +0000' \
      git commit-tree "\$itree" -p HEAD -m 'tree.sync snapshot: staged')
sha=\$(GIT_AUTHOR_NAME=tree.sync GIT_AUTHOR_EMAIL=tree.sync@local \
      GIT_COMMITTER_NAME=tree.sync GIT_COMMITTER_EMAIL=tree.sync@local \
      GIT_AUTHOR_DATE='@0 +0000' GIT_COMMITTER_DATE='@0 +0000' \
      git commit-tree "\$tree" -p "\$isha" -m 'tree.sync snapshot')
git update-ref '$ref' "\$sha"
echo "\$sha"
echo '--snap-ran--'
EOSNAP
)" 2>&1) || true

  case "$out" in
    *--snap-ran--*) : ;;
    *)
      echo "✋ the snapshot did not complete on '${host:-local}'" >&2
      printf '%s\n' "$out" | sed 's/^/   │ /' >&2
      return 1 ;;
  esac

  sha=$(printf '%s\n' "$out" | sed '/--snap-ran--/d' | sed '/^$/d' | tail -1)
  printf '%s' "$sha"
}

######################################################################
# the SECOND transport — gitignored paths, named one at a time
######################################################################

# .what = copy gitignored paths from the source tree into the mirror, OUTSIDE
#         the snapshot commit. echoes what landed; refuses an empty match.
# .why  = `git add -A` honors .gitignore, so a gitignored path is absent from
#         the snapshot TREE and therefore from every step downstream. `--what`
#         cannot reach it either — `--what` filters WITHIN the snapshot, a set
#         the file was never in.
#
#         ⇒ so a `.env` a human needs to `source` in the seat had no route down
#           at all, and the refusal they got named the wrong cause.
#
# 🔴 the skip stays the DEFAULT, and that is the whole security claim: it is
#    what keeps secrets, node_modules, and build output off the human's laptop.
#    this is an OPT-IN, per path, named out loud on every run.
#
# ⚠️ `ls-files --others --ignored` matches ONLY ignored files, and that is a
#    guarantee rather than an implementation detail: a caller who names a
#    tracked path gets an empty match, never a silent second copy of a file the
#    snapshot already carried. one path, one transport.
__sync_pull_ignored() {
  local host_from="$1" dir_from="$2" host_into="$3" dir_into="$4"; shift 4
  local -a globs=("$@")
  local -a spec=()
  local g; for g in "${globs[@]}"; do spec+=("'$g'"); done

  local ls_base="cd '$dir_from' && git ls-files --others --ignored --exclude-standard"

  local files n
  files=$(__sync_run "$host_from" "$ls_base -- ${spec[*]}" 2>/dev/null) || true
  files=$(printf '%s\n' "$files" | tr -d '\r' | sed '/^$/d')
  n=$(printf '%s\n' "$files" | grep -c . || true)

  # 🔴 an empty match names BOTH causes. a human at the mirror cannot tell
  #    "the sync skipped it" from "it was never at the source" — and that
  #    ambiguity is itself the defect this flag exists to close. measured
  #    2026-09-11: the file was simply absent upstream, and the read cost two
  #    round trips to settle.
  if [[ "$n" -eq 0 ]]; then
    echo "   ├─ ✋ --also-ignored matched no file: ${globs[*]}" >&2
    echo "   │     two causes, and they read identically from the mirror:" >&2
    echo "   │       · the path does not exist on the source at all" >&2
    echo "   │       · the path is NOT gitignored — so it already travelled" >&2
    echo "   │         in the snapshot, and needs no flag" >&2
    echo "   │     look: rhx git.grove.send <grove> --what \"$ls_base\"" >&2
    return 2
  fi

  local tar_c tar_x out
  tar_c="$ls_base -z -- ${spec[*]} | tar -c --null -T - -f -"
  tar_x="mkdir -p '$dir_into' && tar -x -C '$dir_into' && echo '--ignored-ran--'"

  out=$(__sync_run "$host_from" "$tar_c" 2>/dev/null \
        | __sync_run_stdin "$host_into" "$tar_x" 2>&1) || true

  case "$out" in
    *--ignored-ran--*) : ;;
    *)
      echo "   ├─ 💥 the also-ignored copy did not complete" >&2
      printf '%s\n' "$out" | sed 's/^/   │     /' >&2
      return 1 ;;
  esac

  # 🔓, never ✔ — a human who pulls a secret onto their laptop is owed a glyph
  # that says so. the paths are listed in full, every run, never summarized.
  echo "   ├─ 🔓 also-ignored — $n path(s) pulled OUTSIDE the snapshot:"
  printf '%s\n' "$files" | sed 's/^/   │     ├─ /'
  echo "   │     └─ ⚠️ gitignored for a reason. these do NOT travel back up."
}

######################################################################
# tree.sync — the verb
######################################################################
# .what = every mirror on this box that is a real git worktree, by tree slug.
# .why  = the subject set for `--all`, DERIVED rather than named. a caller who
#         types a list syncs the trees they remembered (rule.require.bulk-over-byhand).
# ⚠️ mirrors ONLY. a tree with no mirror has naught to refresh, and to pull one
#    for it would mint a checkout the human never asked for.
__sync_mirrors_here() {
  local d slug
  for d in "$SYNCWORK_GIT_ROOT"/*/_mirrors/*; do
    [[ -d "$d" ]] || continue
    git -C "$d" rev-parse --git-dir >/dev/null 2>&1 || continue
    slug="${d##*/}"
    printf '%s\n' "$slug"
  done
}

# .what = run tree.sync over every mirror on this box.
# .why  = 18 mirrors went stuck at once, and the alternative was 18 hand-typed
#         calls — the exact by-hand loop a flag is owed for.
# ⚠️ each tree's grove is read from the LEDGER, never assumed to be one grove.
#    a fleet spans groves, and a wrong --from syncs the wrong box's state.
__sync_all() {
  local -a passthru=("$@")
  local slug grove rc=0 n_ok=0 n_skip=0 n_fail=0
  local -a failed=()

  if ! declare -F __crew_ledger_grove_of >/dev/null 2>&1; then
    echo "💥 tree.sync --all: the crew ledger reader is unavailable here" >&2
    return 1
  fi

  while IFS= read -r slug; do
    [[ -n "$slug" ]] || continue
    grove="$(__crew_ledger_grove_of "$slug")"
    if [[ "$grove" != "cloud://"* ]]; then
      echo "   ⏭️  $slug — no grove row, or a local tree. skipped"
      n_skip=$((n_skip + 1))
      continue
    fi
    echo ""
    echo "══ $slug"
    if tree.sync --tree "$slug" --from "$grove" --into local "${passthru[@]}"; then
      n_ok=$((n_ok + 1))
    else
      n_fail=$((n_fail + 1)); failed+=("$slug"); rc=1
    fi
  done < <(__sync_mirrors_here)

  echo ""
  echo "🌲 tree.sync --all  ·  ✔ $n_ok  ·  ⏭️ $n_skip skipped  ·  ✋ $n_fail refused/failed"
  # ⚠️ the failures are NAMED, never merely counted. a tally the reader must
  #    scroll back to decode is a report that hid its own subject
  #    (rule.always.vouch-for-what-you-just-wrote).
  local f; for f in "${failed[@]}"; do echo "   ├─ ✋ $f"; done
  return $rc
}

tree.sync() {
  local tree="" from="" into="" mode=""
  local -a globs=()
  local -a ignored=()

  # ⚠️ reset per invocation, never merely defaulted. the lib is SOURCED, so a
  #    --force from one call would otherwise persist into the next in the same
  #    shell — and a seat's shell is long-lived by construction.
  SYNCWORK_FORCE=""
  # ⚠️ whether --mode was TYPED, never merely what it resolved to. a pull
  #    defaults to apply (see below), so "mode == apply" cannot tell a
  #    deliberate apply from a defaulted one — and a force that destroys must
  #    ride a deliberate one.
  SYNCWORK_MODE_EXPLICIT=""
  # ⚠️ the soft-merge handoff, reset for the same reason: a stale rescue dir
  #    from a prior call would be reapplied over a tree it never came from.
  SYNCWORK_FORCE_DRIFT=""
  SYNCWORK_FORCE_RESCUE=""
  SYNCWORK_FROM_SEAT=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; shift 2 ;;
      --from) from="$2"; shift 2 ;;
      --into) into="$2"; shift 2 ;;
      --what) globs+=("$2"); shift 2 ;;
      --also-ignored) ignored+=("$2"); shift 2 ;;
      --mode) mode="$2"; SYNCWORK_MODE_EXPLICIT=1; shift 2 ;;
      # 🔴 PULL-only, and it discards. --force overrides the mirror's dirty
      #    refusal — it can only ever destroy the HUMAN's own edits in their own
      #    mirror, never a crew's work, because the mirror is a read surface and
      #    naught in it travels upward on its own.
      #    ⚠️ it does NOT loosen the upward direction's `--what` requirement.
      #      that guard protects a LIVE worktree someone else is at work in, and
      #      no flag on this verb may stand in for the caller's own scope.
      #
      # 🔴 the MODE is REQUIRED — hard or soft — and the two are opposites:
      #      hard  discard the drifted files, take the grove's state whole
      #      soft  keep them, as merge conflicts, for the human to settle
      #    ⇒ a bare `--force` is NOT a parse error. it is a QUESTION, and it is
      #      deferred to the refusal on purpose: a human cannot choose between
      #      hard and soft from the flag line, they choose from the FILE LIST.
      #      so it records the intent and the gate below makes them pick with
      #      the enumeration in view (rule.require.discoverability).
      --force)
        if [[ -n "${2:-}" && "$2" != -* ]]; then
          SYNCWORK_FORCE="$2"; shift 2
        else
          SYNCWORK_FORCE="ask"; shift
        fi
        case "$SYNCWORK_FORCE" in
          hard|soft|ask) : ;;
          *) echo "✋ tree.sync: --force takes 'hard' or 'soft', got '$SYNCWORK_FORCE'" >&2
             echo "   hard  discard your drifted files — take the grove's state whole" >&2
             echo "   soft  keep them as merge conflicts, for you to settle" >&2
             return 2 ;;
        esac
        ;;
      # ⚠️ dispatched here rather than parsed into a variable: --all is a
      #    DIFFERENT subject (every mirror), so it runs its own sweep and hands
      #    each tree the rest of this call's flags verbatim.
      --all)
        shift
        __sync_all "$@"
        return $?
        ;;
      --skill|--repo|--role) shift 2 ;;
      # ⚠️ FAIL LOUD — never `shift` an unknown flag away (rule.forbid.failhide)
      -*) echo "✋ tree.sync: unknown flag '$1'" >&2
          echo "   known: --tree --from --into --what --also-ignored --mode --force hard|soft --all" >&2
          return 2 ;;
      *)  echo "✋ tree.sync: unexpected argument '$1'" >&2; return 2 ;;
    esac
  done

  ######################################################################
  # 🔴 the SEAT derivation — a pull from inside a mirror takes NO args
  ######################################################################
  # .why  a human in a reviewer seat wants one outcome: the crew's work, here,
  #       now. every arg that outcome needs is already true of where they sit,
  #       and to demand all three is to ask them to restate their own location:
  #
  #         --tree   the mirror dir IS named for the tree
  #         --from   the ledger knows which grove that tree is on
  #         --into   they sit in the destination
  #
  #       ⇒ so from a mirror, `rhx git.tree.sync` is the whole call. a flag
  #         given explicitly always wins — this fills the absent ones only.
  #
  # ⚠️ it derives ONLY inside a mirror. anywhere else the three stay required,
  #    because a guess about which tree to overwrite is the one guess a sync
  #    must never make.
  local derived=""
  if [[ -z "$tree" && -z "$from" && -z "$into" ]]; then
    local here; here="$(pwd -P)"
    case "$here" in
      */_mirrors/*)
        tree="${here##*/_mirrors/}"
        tree="${tree%%/*}"
        into="local"

        # 🔴 FAIL LOUD if the ledger reader is absent. it was, on the first run
        #    of this derivation, and the cost is the reason this guard exists:
        #    bash printed `command not found` to stderr, `from` came back EMPTY,
        #    the `!= cloud://` test then passed, and the verb announced
        #    "'<tree>' is a LOCAL tree" — confidently, about a GROVE tree.
        #    ⇒ an absent function must never settle into a verdict
        #      (rule.forbid.failhide · term=false-report).
        if ! declare -F __crew_ledger_grove_of >/dev/null 2>&1; then
          echo "💥 tree.sync: the crew ledger reader is unavailable here" >&2
          echo "   the seat derivation needs __crew_ledger_grove_of to learn" >&2
          echo "   which grove '$tree' sits on, and it is not sourced" >&2
          echo "   fix: name the three flags explicitly —" >&2
          echo "     rhx git.tree.sync --tree $tree --from cloud://<grove> --into local" >&2
          return 1
        fi

        from="$(__crew_ledger_grove_of "$tree")"
        if [[ -z "$from" ]]; then
          echo "✋ tree.sync: no ledger row for '$tree' — its grove is unknown" >&2
          echo "   fix: name it — --from cloud://<grove> --into local" >&2
          return 2
        fi
        if [[ "$from" != "cloud://"* ]]; then
          echo "✋ tree.sync: '$tree' is a LOCAL tree — its work is already on this box" >&2
          echo "   a mirror exists to move a GROVE tree here, so naught is owed" >&2
          echo "   open the worktree itself instead of this mirror" >&2
          return 2
        fi
        derived=1
        ;;

      # 🔴 a LOCAL tree's seat sits in the WORKTREE, never a mirror — the seat
      #    provision points it there on purpose, since a local tree needs no
      #    copy of itself. so a human in one runs the bare verb, misses the
      #    `_mirrors` case above, and falls through to the required-arg error.
      #
      #    ⚠️ that error then reads `⇒ or run it with NO args from inside a
      #       reviewer seat` — and they ARE in a reviewer seat. it prescribes
      #       the exact act that just failed, so the human's own conclusion is
      #       that the verb is broken (rule.require.errors-name-the-fix).
      #
      #    ⇒ measured 2026-09-13 in the sdk-aws-lambda seat. the truth is
      #      simpler than the error: naught is owed, and they are already there.
      */_worktrees/*)
        local intree="${here##*/_worktrees/}"
        intree="${intree%%/*}"
        echo "🌲 tree.sync: you are IN '$intree' — this is the worktree itself" >&2
        echo "   a sync moves a GROVE tree's state onto this box. this tree is" >&2
        echo "   already here, so there is naught to pull — read it directly:" >&2
        echo "     git status · git diff · nvim ." >&2
        return 2
        ;;
    esac
  fi

  if [[ -z "$tree" && -z "$from" && -z "$into" ]]; then
    echo "✋ tree.sync: --tree, --from, and --into are required" >&2
    echo "   ⇒ or run it with NO args from inside a reviewer seat on a GROVE" >&2
    echo "     tree, where all three derive from the mirror you sit in" >&2
    return 2
  fi

  [[ -n "$tree" ]] || { echo "✋ tree.sync: --tree is required" >&2; return 2; }
  [[ -n "$from" ]] || { echo "✋ tree.sync: --from is required (local | cloud://<grove>)" >&2; return 2; }
  [[ -n "$into" ]] || { echo "✋ tree.sync: --into is required (local | cloud://<grove>)" >&2; return 2; }

  # name what was derived, never assume it silently — a pull that picked its
  # own subject must say which subject it picked (rule.require.status-feedback)
  if [[ -n "$derived" ]]; then
    echo "   ├─ 🪑 seat: derived from the mirror you sit in"
    echo "   │     tree=$tree · from=$from · into=local"
    # ⚠️ remembered so a REFUSAL can echo back the short call the human made,
    #    never a three-flag restatement of where they already sit. a fix line
    #    that is longer than the call it repairs does not get pasted.
    SYNCWORK_FROM_SEAT=1
  fi

  local host_from host_into
  host_from="$(__crew_grove_host "$from")" || return 2
  host_into="$(__crew_grove_host "$into")" || return 2

  if [[ "$host_from" == "$host_into" ]]; then
    echo "✋ tree.sync: --from and --into name the same box ('$from')" >&2
    echo "   a sync moves state BETWEEN groves; there is naught to move here" >&2
    return 2
  fi

  ######################################################################
  # 🔴 the scope gate — the whole safety claim of the symmetric shape
  ######################################################################
  if [[ -n "$host_into" && ${#globs[@]} -eq 0 ]]; then
    echo "✋ tree.sync: --what is REQUIRED when --into names a grove" >&2
    echo "" >&2
    echo "   .why  a grove holds a LIVE worktree with a clone at work in it." >&2
    echo "         an unscoped write clobbers their in-flight edits, silently," >&2
    echo "         mid-round. so the caller names what travels, every time." >&2
    echo "" >&2
    echo "   fix: name the scope —" >&2
    echo "     rhx git.tree.sync --tree $tree --from $from --into $into \\" >&2
    echo "       --what '*.feedback.*.md'" >&2
    echo "" >&2
    echo "   ⚠️ there is no wildcard shorthand, on purpose. if SOURCE must travel" >&2
    echo "      upward, that is 'git push' on the crew's own branch — never this." >&2
    return 2
  fi

  # 🔴 --also-ignored is DOWNWARD ONLY, and the asymmetry is deliberate rather
  #    than unfinished. a gitignored file on a grove is generated there — a
  #    `.env` filled from the camp, a lockfile, a build artifact. to write one
  #    UPWARD is to hand a crew a credential from a laptop with no record of it
  #    in any tree, which is the one direction no audit can follow.
  if [[ -n "$host_into" && ${#ignored[@]} -gt 0 ]]; then
    echo "✋ tree.sync: --also-ignored is a PULL-only flag" >&2
    echo "" >&2
    echo "   .why  a gitignored file written onto a live grove leaves no trace" >&2
    echo "         in any tree — not the crew's, not yours. an upward secret" >&2
    echo "         belongs in the keyrack, never in a sync." >&2
    echo "" >&2
    echo "   fix: put it there deliberately, and say so —" >&2
    echo "     rhx git.grove.send ${into#cloud://} --file <path> --into '<remote path>'" >&2
    return 2
  fi

  # ⚠️ the default differs BY DIRECTION, and the asymmetry is the point:
  #    a pull writes only into a mirror dir this lib owns, so it can harm no
  #    crew and needs no ceremony. a write onto a live grove worktree is the
  #    destructive act, so it is the deliberate one (rule.require.safe-by-default).
  if [[ -z "$mode" ]]; then
    if [[ -n "$host_into" ]]; then mode="plan"; else mode="apply"; fi
  fi
  if [[ "$mode" != "plan" && "$mode" != "apply" ]]; then
    echo "✋ tree.sync: --mode takes 'plan' or 'apply', got '$mode'" >&2
    return 2
  fi

  local ref="$SYNCWORK_REF_NS/${tree//_/.}"

  echo "🌲 git.tree.sync $tree"
  echo "   ├─ from: $from"
  echo "   ├─ into: $into"
  [[ ${#globs[@]} -gt 0 ]] && echo "   ├─ what: ${globs[*]}"
  [[ ${#ignored[@]} -gt 0 ]] && echo "   ├─ 🔓 also-ignored: ${ignored[*]}"
  echo "   ├─ mode: $mode"

  # ── derive the source tree ─────────────────────────────────────────
  local dir_from
  if ! dir_from="$(__sync_tree_dir "$host_from" "$tree")"; then
    echo "   └─ ✋ no tree for '$tree' on $from" >&2
    echo "" >&2
    if [[ -z "$host_from" ]]; then
      # ⚠️ name the LIKELY cause, never merely the absence. `--from local` reads
      #    the MIRROR, so the common way to land here is a pull never run — and
      #    "no tree on local" reads as a typo'd slug rather than that.
      echo "      ⚠️ '--from local' reads the MIRROR, and there is none yet." >&2
      echo "         pull it down first:" >&2
      echo "           rhx git.tree.sync --tree $tree --from cloud://<grove> --into local" >&2
    else
      echo "      see what is there: rhx git.crew.ledger" >&2
    fi
    return 2
  fi
  echo "   ├─ src:  ${host_from:-local}:$dir_from"

  if [[ "$mode" == "plan" ]]; then
    echo "   │"

    # 🔴 a plan that does not name the LOSS is not a plan. this arm returned
    #    "moved naught" and stopped — so the one question a human asks before
    #    they force ("what do I stand to lose?") had no cheap answer, and the
    #    only way to see the list was to run the apply and be refused.
    #    ⇒ enumerate it HERE, where the act has not happened yet
    #      (rule.require.status-feedback, rule.prefer.prevent-over-correct).
    #
    # ⚠️ it reports a LOWER bound on annotation: the arrival snapshot is not
    #    taken until apply, so this cannot say which drifted paths the arrival
    #    state restores. it says so out loud rather than imply completeness
    #    (term=false-report).
    if [[ -z "$host_into" ]]; then
      local plan_mirror plan_drift
      plan_mirror="$SYNCWORK_GIT_ROOT/$(__sync_org_of_dir "$dir_from")/_mirrors/${tree//_/.}"
      if [[ -d "$plan_mirror" ]] && ! __sync_mirror_is_pristine "$plan_mirror"; then
        plan_drift=$(__sync_mirror_drift "$plan_mirror" 2>/dev/null) || plan_drift=""
        if [[ -n "$plan_drift" ]]; then
          # 🔴 the SAME partition the apply gate runs. a plan that warns about
          #    residue trains the human to ignore the warning, and then the one
          #    that names their own file reads the same as the noise.
          local plan_parted plan_mine plan_res
          plan_parted=$(__sync_drift_partition "$plan_mirror" "$ref" "$plan_drift")
          plan_res="${plan_parted%%--- MINE ---*}"
          plan_mine="${plan_parted#*--- MINE ---$'\n'}"
          plan_res="${plan_res%$'\n'}"; plan_mine="${plan_mine%$'\n'}"

          if [[ -n "$plan_res" ]]; then
            local prn; prn=$(printf '%s\n' "$plan_res" | sed '/^$/d' | wc -l | tr -d ' ')
            echo "   ├─ 🧹 $prn residue file(s) — an earlier sync wrote them. an apply"
            echo "   │     clears them. no action owed."
          fi

          if [[ -n "$plan_mine" ]]; then
            local pn pseen
            pn=$(printf '%s\n' "$plan_mine" | sed '/^$/d' | wc -l | tr -d ' ')
            pseen=$(__sync_snapshot_seen "$plan_mirror" "$ref" | head -1)
            if [[ -z "$pseen" ]]; then
              echo "   ├─ ⚠️ $pn file(s) differ — no snapshot history here, so it cannot"
              echo "   │     tell yours from its own leavings. an apply refuses over them:"
            else
              echo "   ├─ ⚠️ $pn file(s) here are YOURS — an apply refuses over them:"
            fi
            printf '%s\n' "$plan_mine" | sed '/^$/d;s/^/   │     /'
            echo "   │"
            echo "   │     ⭐ the ask — pick one:"
            echo "   │          --force hard   discard them, take the grove's state whole"
            echo "   │          --force soft   keep them, as merge conflicts, to settle by hand"
            echo "   │     (whether the arrival snapshot restores any is unknown until apply)"
            echo "   │"
          fi
        fi
      fi
    fi

    echo "   └─ 🌙 plan — moved naught. to run it:"
    local shown="rhx git.tree.sync --tree $tree --from $from --into $into"
    local g; for g in "${globs[@]}"; do shown="$shown --what '$g'"; done
    for g in "${ignored[@]}"; do shown="$shown --also-ignored '$g'"; done
    echo "         $shown --mode apply"
    return 0
  fi

  # ── snapshot the source ────────────────────────────────────────────
  local sha
  if ! sha="$(__sync_snapshot "$host_from" "$dir_from" "$ref")"; then
    return 1
  fi
  if [[ -z "$sha" ]]; then
    echo "   └─ 💥 the snapshot returned no sha" >&2
    return 1
  fi
  echo "   ├─ snap: ${sha:0:12}"

  if [[ -z "$host_into" ]]; then
    __sync_into_local "$tree" "$host_from" "$dir_from" "$ref" "$sha" "${ignored[@]}"
  else
    __sync_into_grove "$tree" "$host_from" "$dir_from" "$host_into" "$sha" "${globs[@]}"
  fi
}

######################################################################
# the WIDE direction — into a local mirror, as a real git repo
######################################################################
__sync_into_local() {
  local tree="$1" host_from="$2" dir_from="$3" ref="$4" sha="$5"; shift 5
  local -a ignored=("$@")
  local org repo clone mirror remote

  org="$(__sync_org_of_dir "$dir_from")"
  repo="$(__sync_repo_of_tree "$tree")"
  clone="$SYNCWORK_GIT_ROOT/$org/$repo"
  mirror="$SYNCWORK_GIT_ROOT/$org/_mirrors/${tree//_/.}"

  # ⚠️ the fetch targets the MAIN repo path, never the worktree path —
  #    refs/mirror/* lands in the shared ref store, so a worktree-as-a-remote
  #    never enters the picture.
  if [[ ! -d "$clone/.git" ]]; then
    echo "   └─ ✋ no local clone at $clone" >&2
    echo "" >&2
    echo "      the mirror is a worktree OFF your clone, so the clone must exist:" >&2
    echo "        gh repo clone $org/$repo $clone" >&2
    return 2
  fi

  if [[ -z "$host_from" ]]; then
    remote="$SYNCWORK_GIT_ROOT/$org/$repo"
  else
    remote="$host_from:$(__sync_git_root "$host_from")/$org/$repo"
  fi

  # 🔴 git's OWN reason is printed, never swallowed. this ended `2>/dev/null`,
  #    so a saturated grove, a dropped ssh, an absent clone on the far side, and
  #    a genuinely absent ref all rendered as one line. the whole point of this
  #    verb is to survive a saturated grove, and a swallowed transport error is
  #    exactly the case it cannot afford to render as "could not fetch".
  local out_fetch
  if ! out_fetch=$(git -C "$clone" fetch --quiet "$remote" "+$ref:$ref" 2>&1); then
    echo "   └─ 💥 could not fetch $ref from $remote" >&2
    printf '%s\n' "$out_fetch" | sed 's/^/      │ /' >&2
    echo "" >&2
    echo "      the usual causes, cheapest first:" >&2
    echo "        · the grove is saturated or asleep — rhx git.grove.saturation" >&2
    echo "        · ssh dropped mid-transfer — re-run; this verb is idempotent" >&2
    echo "        · no clone on the far side at $remote" >&2
    return 1
  fi
  echo "   ├─ ref:  $ref"

  __sync_into_local_rest \
    "$tree" "$mirror" "$clone" "$sha" "$ref" "$host_from" "$dir_from" "${ignored[@]}"
  return $?
}

######################################################################
# 🔴 the mirror operations below were NESTED INSIDE __sync_into_local
#
#    bash defines a function when its definition STATEMENT RUNS, never when
#    the file is sourced — so an operation written inside another function
#    does not exist until that outer function has been called. these sat
#    between the fetch and the materialize step, so they worked from there
#    and from NOWHERE else.
#
#    ⇒ measured 2026-09-13: a drift enumeration added to the PLAN arm called
#      `__sync_mirror_is_pristine` and `__sync_mirror_drift`. plan never
#      enters __sync_into_local, so both were undefined — `command not
#      found`, exit 127. the `|| plan_drift=""` then swallowed it and the
#      arm printed NAUGHT, over a mirror that apply refused four files on.
#      a silent no-op, in a verb whose whole job was to enumerate a loss
#      (rule.forbid.failhide).
#
# ⚠️ so every operation here is TOP-LEVEL, and the rest of __sync_into_local's
#    body is __sync_into_local_rest below them. do not re-nest one.
######################################################################

# .what = the sha of the snapshot this mirror was last unpacked from
# .why  = a mirror is DIRTY by design (see __sync_mirror_unpack), so
#         `status --porcelain` can no longer tell the human's edits from the
#         crew's synced work. this file is what parts them: the worktree is
#         PRISTINE when it still equals the snapshot we put there.
__sync_mirror_applied_path() {
  local mirror="$1" gitdir
  gitdir=$(git -C "$mirror" rev-parse --git-dir 2>/dev/null) || return 1
  case "$gitdir" in
    /*) : ;;
    *) gitdir="$mirror/$gitdir" ;;
  esac
  printf '%s/tree-sync.applied' "$gitdir"
}

# .what = does the mirror still hold exactly what the last sync put there?
# .why  = the refusal guard's question, asked correctly. a plain
#         `status --porcelain` answers "is it dirty", which is now ALWAYS yes
#         and would refuse every refresh forever.
__sync_mirror_is_pristine() {
  local mirror="$1" applied_path applied tmp cur want
  applied_path=$(__sync_mirror_applied_path "$mirror") || return 1

  # ⚠️ the LEGACY arm. a mirror made before the unpack existed sits AT the
  #    snapshot with a clean worktree and no `applied` record. it is pristine
  #    exactly when git says clean — the old question, asked only of the old
  #    shape. absent this, every extant mirror would refuse its next refresh.
  if [[ ! -f "$applied_path" ]]; then
    [[ -z "$(git -C "$mirror" status --porcelain 2>/dev/null)" ]]
    return
  fi

  applied=$(cat "$applied_path" 2>/dev/null) || return 1
  [[ -n "$applied" ]] || return 1
  git -C "$mirror" rev-parse --verify --quiet "$applied^{commit}" >/dev/null 2>&1 || return 1

  # 🔴 pristine IS "no drift" — the very same instrument, rather than a second
  #    tree comparison that could disagree with it.
  #
  #    it used to be its own temp-index + write-tree + compare. that was already
  #    the same dance, so the two agreed by care rather than by construction —
  #    and the mirror-owned set is exactly the input that would have split them:
  #    the gate would halt on `.claude/settings.json` while the refusal, which
  #    drops it, printed an EMPTY list of files at risk. a halt that can name no
  #    file is the worst shape this surface has (term=false-report).
  #
  #    ⇒ so the gate now reads the drift directly. a path the drift drops is a
  #      path the gate cannot halt on, by construction rather than by care.
  local drift
  drift=$(__sync_mirror_drift "$mirror") || return 1
  [[ -z "$drift" ]]
}

######################################################################
# the MIRROR-LOCAL-OWNED set — paths the mirror keeps, whatever arrives
######################################################################

# .what = paths a MIRROR owns. the sync never overwrites one, and never counts
#         one as drift.
#
# 🔴 .why = a tracked path can still be MACHINE state rather than review
#    content, and `.claude/settings.json` is the case that proves it: it is
#    committed in every repo here, so it travels in every snapshot — and the
#    local claude session REWRITES it in the mirror the moment a human works
#    there (a permission grant, a hook path).
#
#    ⇒ so it diverges on its own, with no human edit, every single session. the
#      pristine gate then reads that divergence as "yours", and every refresh
#      halts with a `--force` ask about a file the human never opened:
#
#        ✋ 1 file(s) here are YOURS — this refresh would overwrite them
#           M  .claude/settings.json   ↩ this sync restores it
#
#      reported 2026-09-15 on svc-reservations.beav.feat-rec-waitlist-capture.
#      the refusal was accurate and useless: both copies are correct, each for
#      its own machine, and there is naught to choose between them.
#
# ⚠️ the COST, stated rather than hidden: a crew edit to one of these paths does
#    not surface in the mirror. that is the trade, and it is the right one here —
#    the file records which machine you are on, so a reviewer who took the
#    grove's copy would learn a fact about a box rather than about a branch. to
#    review a real change to it, read the snapshot directly:
#      git -C <mirror> show refs/mirror/<tree>:.claude/settings.json
#
# ⚠️ an exact path match, never a glob. the set is meant to stay short and
#    auditable; a pattern here would quietly widen what the mirror withholds,
#    which is the one property this list must never lose by accident.
SYNC_MIRROR_LOCAL_OWNED=(
  '.claude/settings.json'
)

# .what = is this path one the mirror owns?
__sync_is_local_owned() {
  local path="$1" owned
  for owned in "${SYNC_MIRROR_LOCAL_OWNED[@]}"; do
    if [[ "$path" == "$owned" ]]; then return 0; fi
  done
  return 1
}

# .what = drop the mirror-owned rows from a `name-status` stream
# ⚠️ name-status is "<X>\t<path>"; the path is all past the FIRST tab, so a
#    rename row (which carries two paths) is judged on its source. a rename of
#    an owned path is not a case this set is meant to cover.
__sync_drift_drop_local_owned() {
  local line path
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    path="${line#*$'\t'}"
    if __sync_is_local_owned "$path"; then continue; fi
    printf '%s\n' "$line"
  done
}

# .what = name-status of the files that DIVERGED from the last applied snapshot
#
# 🔴 .why = the refusal above computes divergence against `applied`, then printed
#    `status --porcelain` as though that were the cause. it is not. a mirror is
#    DIRTY BY DESIGN (__sync_mirror_unpack lays the crew's inflight work over
#    their branch tip, unstaged), so porcelain lists the crew's normal work —
#    every time, on every mirror, whether or not a file diverged.
#
#    ⇒ so the human was handed a list of files they never touched, labelled
#      "yours, most likely", and told a refresh would overwrite them. every
#      word of it read true and the whole of it pointed at the wrong files
#      (term=false-report).
#
#    reported 2026-09-13 on rhachet-roles-bhrain.beav.feat-prescribed-brain-per-stone:
#    the refusal listed `.behavior/`, `.dream/`, `.seeds/` and two lockfiles —
#    the crew's own output, synced down by this very tool.
#
# ⚠️ the same temp-index trick the pristine test uses, so the two can never
#    disagree about what "diverged" means (one subject, one instrument).
__sync_mirror_drift() {
  local mirror="$1" applied_path applied tmp rc
  applied_path=$(__sync_mirror_applied_path "$mirror") || return 1
  [[ -f "$applied_path" ]] || return 1
  applied=$(cat "$applied_path" 2>/dev/null) || return 1
  [[ -n "$applied" ]] || return 1

  tmp=$(mktemp) || return 1
  GIT_INDEX_FILE="$tmp" git -C "$mirror" read-tree "$applied" >/dev/null 2>&1 || { rm -f "$tmp"; return 1; }
  GIT_INDEX_FILE="$tmp" git -C "$mirror" add -A >/dev/null 2>&1 || { rm -f "$tmp"; return 1; }
  # ⚠️ the mirror-owned rows are dropped HERE, at the one instrument both the
  #    pristine gate and the refusal read — so the two can never disagree about
  #    what counts as drift (one subject, one instrument, as above).
  # ⚠️ PIPESTATUS, never `$?`: with the filter on the end, `$?` is the FILTER's
  #    exit, which is always 0 — so a diff-index failure would read as a clean
  #    "no drift" rather than an error (term=false-report).
  GIT_INDEX_FILE="$tmp" git -C "$mirror" diff-index --name-status --cached "$applied" 2>/dev/null \
    | __sync_drift_drop_local_owned
  rc=${PIPESTATUS[0]}
  rm -f "$tmp"
  return $rc
}

# .what = annotate each drift row with whether the ARRIVAL snapshot holds that
#         path — so the human knows what a discard actually costs
#
# 🔴 .why = the refusal asks the human to choose between `clean -fd`, a push up,
#    and `--force`, and it gave them no fact on which to choose. the fact that
#    settles the choice is one lookup: does the snapshot about to land still
#    carry this file?
#
#      it does      → a discard costs naught; the sync restores it
#      it does not  → a discard is the ONLY copy gone
#
#    ⇒ absent that, the human either runs a destructive command blind, or opens
#      the grove by hand to check — and a tool that sends its reader elsewhere
#      for the fact that decides the call has not finished the job.
#
# ⚠️ reads the snapshot COMMIT, already fetched into the mirror by this run —
#    no ssh, no second transport.
__sync_drift_annotate() {
  local mirror="$1" snap="$2" drift="$3"
  local line path
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    # name-status is "<X>\t<path>"; take all past the first tab
    path="${line#*$'\t'}"
    if git -C "$mirror" cat-file -e "$snap:$path" 2>/dev/null; then
      printf '%s   ↩ this sync restores it\n' "$line"
    else
      printf '%s   🔴 NOT in the arrival snapshot — a discard is final\n' "$line"
    fi
  done < <(printf '%s\n' "$drift")
}

# .what = is this drifted path RESIDUE — a file an EARLIER sync put here, byte
#         for byte, that the crew has since dropped? exit 0 = residue.
#
# 🔴 .why = `drift` and `your work` are NOT the same set, and the guard treated
#    them as one. the pristine test asks *"does the mirror still hold what the
#    last sync put there"* — and a file the crew DELETED between two snapshots
#    makes that false with no human edit at all:
#
#      sync N    the snapshot carries X. the unpack lays it down, `reset HEAD`
#                leaves it UNTRACKED
#      the crew  deletes X
#      sync N+1  the snapshot lacks X. `applied` becomes N+1. X is still on disk
#      ⇒ X now differs from `applied`, so it reads as DRIFT — and the refusal
#        calls it *"yours, a discard is final"* over a file the human has never
#        opened (term=false-report).
#
#    ⚠️ and the refusal is SELF-SEALING: the `clean -fd` that clears residue
#      sits INSIDE the unpack, which is past the gate. so residue makes the gate
#      refuse, and the refusal stops its own cure from ever getting to run. every
#      mirror that carried residue is stuck until a human forces — over a file
#      that was never theirs to lose. measured twice on 2026-09-13, both as "wtf".
#
# .the discriminator, and it needs NO new record
#    `refs/mirror/<tree>` keeps a REFLOG — every snapshot this mirror ever
#    unpacked. a path whose current bytes match that path in ANY prior snapshot
#    is a file THIS TOOL wrote. one whose bytes match no snapshot ever is the
#    human's, and that one still earns the full refusal.
#
# ⚠️ a DELETED or EDITED path is the human's by construction — a delete has no
#    bytes to match, and an edit's bytes match no snapshot. both fall through to
#    exit 1, which is the safe side.

# .what = every snapshot sha this mirror is known to have unpacked, newest last.
#
# 🔴 .why = git writes a reflog ONLY for refs/heads/*, refs/remotes/*,
#    refs/notes/* and HEAD (core.logAllRefUpdates defaults to that set). the
#    snapshot ref lives under `refs/mirror/*`, so it has NO reflog — and a
#    residue check built on `rev-list -g` finds zero prior snapshots and grades
#    EVERY drifted file as the human's. measured 2026-09-13: the check ran, the
#    walk was empty, and the verdict read exactly as it had before the check
#    existed. a discriminator that always answers one way is not a
#    discriminator (term=false-report).
#
#    ⇒ so the record is KEPT, never inferred from a git default we do not own.
#      `tree-sync.applied` already holds the latest; this is its append-only
#      twin, written by the same step.
#
# ⚠️ prints NAUGHT where no history exists — and an empty list means UNKNOWN,
#    never "no residue". the caller must part those two.
__sync_snapshot_seen() {
  local mirror="$1" ref="$2" gitdir hist
  gitdir=$(git -C "$mirror" rev-parse --git-dir 2>/dev/null) || return 0
  case "$gitdir" in /*) : ;; *) gitdir="$mirror/$gitdir" ;; esac
  hist="$gitdir/tree-sync.history"
  [[ -f "$hist" ]] && cat "$hist" 2>/dev/null
  # the reflog too, for a ref whose namespace someone HAS configured to log
  git -C "$mirror" rev-list -g "$ref" 2>/dev/null || true
}

__sync_drift_is_residue() {
  local mirror="$1" path="$2"; shift 2
  local -a seen=("$@")
  local blob snapsha want

  [[ ${#seen[@]} -gt 0 ]] || return 1
  [[ -f "$mirror/$path" ]] || return 1
  blob=$(git -C "$mirror" hash-object -- "$mirror/$path" 2>/dev/null) || return 1
  [[ -n "$blob" ]] || return 1

  for snapsha in "${seen[@]}"; do
    [[ -n "$snapsha" ]] || continue
    want=$(git -C "$mirror" rev-parse --quiet --verify "$snapsha:$path" 2>/dev/null) || continue
    [[ "$want" == "$blob" ]] && return 0
  done

  return 1
}

# .what = split a drift list into RESIDUE and MINE, parted by a sentinel line.
# .why  = one walk, two readers — the plan arm and the apply gate must agree on
#         which files are the human's, and two copies of this loop would drift
#         (rule.always.vouch-for-what-you-just-wrote: ONE implementation).
__sync_drift_partition() {
  local mirror="$1" ref="$2" drift="$3"
  local line path mine="" residue=""
  local -a seen=()

  while IFS= read -r line; do
    [[ -n "$line" ]] && seen+=("$line")
  done < <(__sync_snapshot_seen "$mirror" "$ref")

  # ⚠️ do NOT set a global here to signal "unknown". this runs inside a command
  #    SUBSTITUTION, so a global set in this frame dies with the subshell and
  #    the caller reads the stale value — the identical failhide that made
  #    `__crew_view_defects` grade zero tabs and report a clean bill
  #    (crewwork.sh, measured the same day). the caller derives it in ITS OWN
  #    frame, from __sync_snapshot_seen directly.

  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    path="${line#*$'\t'}"
    if __sync_drift_is_residue "$mirror" "$path" "${seen[@]}"; then
      residue+="$line"$'\n'
    else
      mine+="$line"$'\n'
    fi
  done < <(printf '%s\n' "$drift")

  printf '%s--- MINE ---\n%s' "$residue" "$mine"
}

# .what = the shortest call that re-runs THIS invocation, for a fix line.
# .why  = a human who typed a bare `git.tree.sync` from their seat is handed a
#         three-flag restatement of where they already sit. they will not paste
#         it (rule.require.errors-name-the-fix — a fix nobody runs is no fix).
__sync_ask_cmd() {
  local tree="$1" from="$2" into="$3"
  if [[ -n "${SYNCWORK_FROM_SEAT:-}" ]]; then
    printf 'rhx git.tree.sync'
  else
    printf 'rhx git.tree.sync --tree %s --from %s --into %s' "$tree" "$from" "$into"
  fi
}

# .what = copy every drifted path out of harm's way before --force destroys it.
#         echoes the rescue dir; exit 1 where naught could be saved.
#
# 🔴 .why = a human must be able to FORCE, and a force must GUIDE rather than
#    punish. it printed a list and then destroyed it — so the only safe way to
#    force was to hand-copy the files first, which is a chore the tool knew how
#    to do and left to the reader (rule.require.safe-by-default: the easy path
#    must be the correct one).
#
#    ⇒ with a rescue, --force costs naught that cannot be undone. that is what
#      makes it usable rather than feared, and a feared flag gets replaced by a
#      hand-run `clean -fd`, which rescues not one file.
#
# ⚠️ the rescue lands in the GITDIR, never the worktree — a copy inside the
#    tree would itself read as drift on the next sync, which is the very loop
#    this file just closed.
__sync_drift_rescue() {
  local mirror="$1" drift="$2"
  local gitdir dest line path saved=0

  gitdir=$(git -C "$mirror" rev-parse --git-dir 2>/dev/null) || return 1
  case "$gitdir" in /*) : ;; *) gitdir="$mirror/$gitdir" ;; esac
  dest="$gitdir/tree-sync.rescued/$(date -u +%Y%m%dT%H%M%SZ)"

  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    path="${line#*$'\t'}"
    # a D row names a path the worktree no longer holds — naught to copy
    [[ -e "$mirror/$path" ]] || continue
    mkdir -p "$dest/$(dirname -- "$path")" || return 1
    cp -a -- "$mirror/$path" "$dest/$path" || return 1
    saved=$((saved + 1))
  done < <(printf '%s\n' "$drift")

  [[ $saved -gt 0 ]] || return 1
  printf '%s' "$dest"
}

# .what = put the rescued drift back over the freshly-unpacked mirror, as a
#         3-way merge, so a path the grove also changed lands with conflict
#         markers rather than silently picking a side.
#
# 🔴 .why = `soft` promises *"keep my work"*, and the naive read of that promise
#    is a straight copy-back. a straight copy-back is WORSE than `hard`: it
#    overwrites the grove's version of the same path with the human's stale one
#    and reports success, so the human reviews a tree that is neither state and
#    is told it is both (term=false-report).
#
#    ⇒ so the two modes are not "discard" vs "keep". they are "take theirs" vs
#      "hold BOTH up and make the disagreement visible" — which is exactly what
#      a merge is for, and why `soft` is worth a mode of its own.
#
# .the three inputs, per path:
#    ours   = the rescued copy — what the human had
#    base   = the version the LAST sync laid down (tree-sync.applied)
#    theirs = what this sync just unpacked — the grove's current state
#
# ⚠️ a path with no base and no theirs is not a merge at all — it is the
#    human's own file, and it is simply restored.
__sync_force_soft_reapply() {
  local mirror="$1" rescue="$2" drift="$3"
  local applied_path applied line path base_tmp theirs_tmp
  local n_clean=0 n_conflict=0 n_restored=0
  local -a conflicted=()

  applied_path=$(__sync_mirror_applied_path "$mirror" 2>/dev/null) || applied_path=""
  applied=""
  [[ -n "$applied_path" && -f "$applied_path" ]] && applied=$(cat "$applied_path" 2>/dev/null)

  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    path="${line#*$'\t'}"
    [[ -f "$rescue/$path" ]] || continue

    # theirs absent → the grove does not carry this path. restore it whole.
    if [[ ! -f "$mirror/$path" ]]; then
      mkdir -p "$mirror/$(dirname -- "$path")" || return 1
      cp -a -- "$rescue/$path" "$mirror/$path" || return 1
      n_restored=$((n_restored + 1))
      continue
    fi

    # theirs present → a real 3-way.
    #
    # ⚠️ `git merge-file A B C` writes its RESULT into A, so A must be OURS.
    #    the grove's freshly-unpacked copy is moved aside to a temp first, and
    #    the rescued copy takes its place as the merge target.
    base_tmp=$(mktemp) || return 1
    theirs_tmp=$(mktemp) || { rm -f "$base_tmp"; return 1; }

    cp -a -- "$mirror/$path" "$theirs_tmp" || { rm -f "$base_tmp" "$theirs_tmp"; return 1; }

    # base = what the LAST sync laid down. where there is none, an empty base
    # makes every differing line a conflict — the honest answer, never a guess.
    if [[ -n "$applied" ]]; then
      git -C "$mirror" cat-file -p "$applied:$path" 2>/dev/null | cat >"$base_tmp" || : >"$base_tmp"
    fi

    cp -a -- "$rescue/$path" "$mirror/$path" || { rm -f "$base_tmp" "$theirs_tmp"; return 1; }

    if git merge-file \
         -L "yours (rescued)" -L "last sync" -L "grove now" \
         "$mirror/$path" "$base_tmp" "$theirs_tmp" >/dev/null 2>&1; then
      n_clean=$((n_clean + 1))
    else
      # ⚠️ a NEGATIVE exit is an ERROR, never a conflict count — git returns
      #    255 where it could not merge at all. bash sees both as non-zero, so
      #    a naive `else` would report a failed merge as a settled conflict
      #    and leave the human to hunt markers that are not there.
      #    ⇒ a file with no marker after a non-zero exit is the error case.
      if grep -q '^<<<<<<< ' "$mirror/$path" 2>/dev/null; then
        n_conflict=$((n_conflict + 1))
        conflicted+=("$path")
      else
        echo "   │     💥 could not merge $path — yours is kept, the grove's is at" >&2
        echo "   │        $theirs_tmp" >&2
        rm -f "$base_tmp"
        continue   # leave theirs_tmp in place; it is the only copy of that side
      fi
    fi
    rm -f "$base_tmp" "$theirs_tmp"
  done < <(printf '%s\n' "$drift")

  echo "   ├─ 🧩 soft: $n_restored restored · $n_clean merged clean · $n_conflict conflicted"
  if [[ ${#conflicted[@]} -gt 0 ]]; then
    local c; for c in "${conflicted[@]}"; do echo "   │     ⚔️  $c"; done
    echo "   │     settle each by hand — search for '<<<<<<< yours'"
  fi
  return 0
}

# 🔴 .what = leave the mirror looking like the GROVE WORKTREE it mirrors —
#            their branch tip checked out, their in-progress work DIRTY.
#
# .why  = the snapshot commit is a TRANSPORT, never a destination. a commit is
#         how you move a tree over git; it is not how a human reviews one.
#
#         the mirror used to be checked out AT the snapshot, so the crew's
#         uncommitted work arrived already committed. every normal review verb
#         then reported the opposite of the truth:
#
#           git status  →  reports a CLEAN worktree
#           git diff    →  empty
#
#         ⇒ the one question a reviewer opens the mirror to ask — WHAT IS THIS
#           CREW CHANGING RIGHT NOW — was the one the transport destroyed. to
#           see it at all took `git show refs/mirror/…` or `git diff <sha>^ <sha>`,
#           incantations the tool printed and no human retains.
#
#         reported twice by the human on 2026-09-11, against a mirror that was
#         correct and current both times (term=false-report — the instrument
#         answered a question nobody asked).
#
# .how  = three steps, and the third is the one that makes it reviewable:
#           1. checkout their HEAD  — so the branch tip is the base, not the snapshot
#           2. read-tree --reset -u SNAP — worktree + index := the crew's live content
#           3. read-tree IDX        — index := the crew's INDEX, worktree untouched
#
#         end state: HEAD = their tip · index = their index · worktree = their
#         inflight work. so `git status`, `git diff`, and `git diff --cached` in
#         the mirror each read exactly as they do on the grove.
#
# 🔴 .why step 3 is a `read-tree` and no longer a `reset HEAD`
#
#    `reset HEAD` set the index to the branch TIP, which collapsed the crew's
#    staged half into the unstaged one — every change arrived unstaged, whatever
#    the crew had done. the transport carried the partition (the snapshot chain
#    holds it) and the unpack threw it away at the last step.
#
#    ⇒ so the one question that needs the index — "what have they changed SINCE
#      they last staged" — had no answer in the mirror, and `git diff` there
#      quietly meant something other than `git diff` on the grove. a review
#      surface whose verbs mean something ELSE than the verbs they imitate is
#      the whole failure this unpack exists to prevent (term=false-report).
#
# ⚠️ a bare `read-tree <tree-ish>` replaces the index and does NOT touch the
#    worktree — that asymmetry with `-u` is exactly what step 3 needs. it drops
#    the stat cache, so the refresh below restores it; without that every tracked
#    file reads as maybe-dirty until git re-hashes it.
__sync_mirror_unpack() {
  local mirror="$1" snap="$2" head="$3" idx="${4:-$2^}"
  local out

  # 🔴 CLEAR THE RESIDUE FIRST, or a mirror can never be pristine again.
  #
  #    step 3 below ends with `reset HEAD`, so every file the snapshot carried
  #    that the branch tip does not is left UNTRACKED. `read-tree --reset -u`
  #    on the next sync only rewrites paths git TRACKS — so an untracked file
  #    from snapshot N that snapshot N+1 no longer holds is never removed.
  #
  #    ⇒ it survives forever, and the pristine check (which `add -A`s the whole
  #      worktree) reads it as an `A` drift against every later snapshot. so the
  #      sync refuses, the human cleans by hand, and it returns on the next
  #      cycle. reported twice on 2026-09-13 — "again" — on
  #      rhachet-roles-bhrain.beav.feat-prescribed-brain-per-stone, then on
  #      sdk-config.beav.feat-org-scoped-param-derive with four residue files.
  #
  # ⚠️ SAFE precisely here and nowhere else: this runs only past the pristine
  #    gate, which has already proven the worktree still equals `applied`. so
  #    every untracked file present is one THIS TOOL put there, and the fresh
  #    snapshot restores whatever still exists. a human edit cannot reach this
  #    line — the gate refuses first.
  # ⚠️ no `-x`: ignored paths (node_modules, .env, build output) are NOT ours
  #    to destroy, and they never travel in a snapshot.
  local applied_prior
  applied_prior=$(__sync_mirror_applied_path "$mirror" 2>/dev/null) || applied_prior=""
  if [[ -n "$applied_prior" && -f "$applied_prior" ]]; then
    if ! out=$(git -C "$mirror" clean -fd 2>&1); then
      printf '%s' "$out"; return 1
    fi
  fi

  # 🔴 HOLD the mirror-owned paths aside for the whole reset.
  #    the gate no longer halts on one (see SYNC_MIRROR_LOCAL_OWNED), so without
  #    this the very next step — `read-tree --reset -u` — would simply overwrite
  #    it with the grove's copy. to stop the halt and keep the clobber is the
  #    worse of the two states: it takes the human's warning away and leaves the
  #    loss in place.
  # ⚠️ held OUTSIDE the mirror. a stash-aside inside it would be swept by the
  #    `clean -fd` above on the following sync, or read as drift by the gate.
  local hold owned
  hold=$(mktemp -d) || { printf 'could not make a hold dir'; return 1; }
  for owned in "${SYNC_MIRROR_LOCAL_OWNED[@]}"; do
    [[ -f "$mirror/$owned" ]] || continue
    mkdir -p "$hold/$(dirname "$owned")" 2>/dev/null || continue
    cp -p "$mirror/$owned" "$hold/$owned" 2>/dev/null || true
  done

  # hooks off at every step — a repo's checkout hooks have no business on a
  # read surface, and `.husky/_/husky.sh` does not travel in a snapshot
  #
  # 🔴 the snapshot commit is a TRANSPORT, never a DESTINATION. to sit AT it
  #    delivers the crew's inflight work already COMMITTED — so `git status`
  #    reads clean and `git diff` reads empty, and the review surface reports
  #    the opposite of the truth (term=false-report).
  # ⇒ so: sit at their BRANCH TIP, and lay the snapshot's CONTENT over it as
  #   uncommitted work. three steps, and each one carries weight.
  if ! out=$(git -c core.hooksPath=/dev/null -C "$mirror" \
               checkout --quiet --detach "$head" 2>&1); then
    printf '%s' "$out"; return 1
  fi

  # `--reset -u`, never `-m`: a single-tree `-m` merge demands the index already
  # match HEAD and fails where it does not. `--reset` states the intent plainly —
  # make the worktree BE this tree — and discards whatever sat there.
  if ! out=$(git -c core.hooksPath=/dev/null -C "$mirror" \
               read-tree --reset -u "$snap" 2>&1); then
    printf '%s' "$out"; return 1
  fi

  # 🔴 the index := THEIR index. the worktree keeps the snapshot's content, so
  #    the gap between the two is precisely their unstaged work, and the gap
  #    between their index and HEAD is precisely their staged work. both gaps
  #    are the crew's own, rather than one flattened sum of the pair.
  if ! out=$(git -C "$mirror" read-tree "$idx" 2>&1); then
    printf '%s' "$out"; return 1
  fi

  # 🔴 PUT BACK the mirror-owned paths, after both read-trees and before the
  #    refresh — so the stat cache below is rebuilt over the files that actually
  #    sit on disk rather than the ones the snapshot laid down.
  for owned in "${SYNC_MIRROR_LOCAL_OWNED[@]}"; do
    [[ -f "$hold/$owned" ]] || continue
    mkdir -p "$mirror/$(dirname "$owned")" 2>/dev/null || true
    cp -p "$hold/$owned" "$mirror/$owned" 2>/dev/null || true
  done
  rm -rf "$hold"

  # ⚠️ best-effort, and its non-zero exit is EXPECTED: `--refresh` reports a
  #    non-zero status when files differ from the index, which is the normal
  #    state of this mirror. it is run for the stat cache it rebuilds, never for
  #    a verdict — so its exit is read as naught.
  git -C "$mirror" update-index -q --refresh >/dev/null 2>&1 || true

  local applied_path
  applied_path=$(__sync_mirror_applied_path "$mirror") \
    || { printf 'could not derive the mirror gitdir'; return 1; }
  printf '%s' "$snap" > "$applied_path" \
    || { printf 'could not record the applied snapshot at %s' "$applied_path"; return 1; }

  # 🔴 the APPEND-ONLY twin, and the whole basis of the residue check. without
  #    it there is no way to tell a file THIS TOOL wrote from one the human
  #    did, because `refs/mirror/*` carries no reflog (see __sync_snapshot_seen).
  # ⚠️ best-effort: a failure here costs a future classification, never this
  #    sync. the residue check degrades to UNKNOWN, which is its safe side.
  local hist_path="${applied_path%/tree-sync.applied}/tree-sync.history"
  if ! grep -qxF -- "$snap" "$hist_path" 2>/dev/null; then
    printf '%s\n' "$snap" >> "$hist_path" 2>/dev/null || true
  fi
}

# .what = the rest of __sync_into_local — each step past the fetch.
# .why  = split out so the mirror operations above can sit at TOP LEVEL. see
#         the banner above; they were unreachable from any other caller.
# ⚠️ `from` and `into` are read from tree.sync's frame by dynamic scope, as
#    they already were when this body was nested — the error text names them.
__sync_into_local_rest() {
  local tree="$1" mirror="$2" clone="$3" sha="$4" ref="$5" host_from="$6" dir_from="$7"
  shift 7
  local -a ignored=("$@")

  # 🔴 the snapshot is a CHAIN of two, so the crew's branch tip is two steps
  #    back rather than one: HEAD ← index ← worktree (see __sync_snapshot).
  #    named here once, because `$sha^` read as "their tip" at five sites and
  #    now means "their index" at every one of them — a rename that leaves the
  #    old spelling valid is the kind that gets half-applied.
  local snap_idx="$sha^"    # their INDEX, as a commit
  local snap_head="$sha^^"  # their BRANCH TIP

  # ── materialize the mirror ─────────────────────────────────────────
  # 🔴 the test is "is this a git WORKTREE", never "does this dir exist".
  #    `crew.boot` registers the reviewer seat with an EMPTY mirror dir as its
  #    cwd — deliberately, so a seat can be booted before it is filled. a bare
  #    `-d` then read that empty dir as an EXTANT mirror, took the refresh arm,
  #    and the pristine check failed on a dir with no gitdir at all.
  #
  #    ⇒ so `crew.boot` then `git.tree.sync` — the documented order, in this
  #      file's own footer — refused with `the mirror was edited since its last
  #      sync` over a dir that held NOT ONE file, and printed an empty list
  #      under "yours, most likely". measured 2026-09-12 on
  #      declastruct-aws.beav.feat-s3-backup-store-properties.
  if [[ -d "$mirror" ]] && git -C "$mirror" rev-parse --git-dir >/dev/null 2>&1; then
    # 🔴 a dirty mirror is REFUSED rather than reset. the human writes feedback
    #    in here, and `reset --hard` to a fresh snapshot would destroy it with
    #    no warning — the review-side twin of the clobber the upward direction
    #    is so careful to prevent.
    # 🔴 the question is NOT "is it dirty" — a mirror is dirty BY DESIGN now,
    #    so that `git status` shows the crew's inflight work. it is "does it
    #    still hold what the last sync put there". a porcelain check here would
    #    refuse every refresh, forever, on the very state this tool creates.
    if ! __sync_mirror_is_pristine "$mirror"; then
      local edits
      edits=$(git -C "$mirror" status --porcelain 2>/dev/null)

      # 🔴 an EMPTY porcelain RETIRES the refusal — there is naught to protect.
      #
      #    the guard's whole justification is *"a refresh would overwrite THEM"*,
      #    and `them` is the porcelain list. where that list is empty the clause
      #    refers to no file at all, the refusal protects nobody, and the remedy
      #    it printed (`git checkout .`) is INERT on a clean tree — so the human
      #    is handed a fix that cannot work, against a claim that is not true.
      #
      #    ⇒ measured 2026-09-13 on declastruct-aws.beav.feat-s3-backup-store-
      #      properties: `status --short` printed naught, the refusal printed an
      #      empty list, and the cause was `stash@{0}: WIP on (no branch)` — a
      #      `git stash` in the DETACHED mirror had taken the snapshot content
      #      away. the tree genuinely differed from `tree-sync.applied`, and the
      #      human had lost naught and could lose naught.
      #
      #    ⚠️ the pristine test answers *"does this still hold what the last sync
      #       put there"*. that is the right question, and it is NOT the same
      #       question as *"is there human work here to protect"*. the guard
      #       must ask the second before it refuses (rule.forbid.failhide: a
      #       divergence with no edits must never settle into a verdict about
      #       edits).
      if [[ -z "$edits" ]]; then
        echo "   ├─ ⚠️ diverged from its last snapshot — and holds NO uncommitted edits"
        echo "   │     a stash, a checkout, or a commit moved it. naught of yours is at"
        echo "   │     risk, so the refresh proceeds. expected edits here? git stash list"

      else
        # 🔴 the DRIFT, never the porcelain. a mirror is dirty by design, so the
        #    porcelain list names the crew's own synced work and points the
        #    human at files they never touched (see __sync_mirror_drift).
        local drift; drift=$(__sync_mirror_drift "$mirror" 2>/dev/null) || drift=""

        # 🔴 PART the drift before any verdict. a file an earlier sync wrote is
        #    RESIDUE, never the human's work — and to refuse over it is to block
        #    a reviewer on a file they have never opened
        #    (see __sync_drift_is_residue for the mechanism and the measurement).
        # ⚠️ derived HERE, in this frame — the partition runs in a subshell and
        #    cannot hand a flag back (see the note inside it).
        local seen_any; seen_any=$(__sync_snapshot_seen "$mirror" "$ref" | head -1)
        local unknown=""; [[ -n "$seen_any" ]] || unknown=1

        local list="" residue=""
        if [[ -n "$drift" ]]; then
          local parted; parted=$(__sync_drift_partition "$mirror" "$ref" "$drift")
          residue="${parted%%--- MINE ---*}"
          list="${parted#*--- MINE ---$'\n'}"
          residue="${residue%$'\n'}"
          list="${list%$'\n'}"
        else
          # ⚠️ an un-itemizable drift is UNKNOWN, never residue. it falls to the
          #    human's side, which keeps the refusal (rule.forbid.failhide).
          list="$edits"
        fi

        # residue is stated, never asked about — the unpack's `clean -fd` clears
        # it a few lines below, so the human owes no decision at all.
        if [[ -n "$residue" ]]; then
          local nr; nr=$(printf '%s\n' "$residue" | sed '/^$/d' | wc -l | tr -d ' ')
          echo "   ├─ 🧹 $nr file(s) here are RESIDUE — an earlier sync wrote them,"
          echo "   │     the crew has since dropped them. cleaned, no action owed."
        fi

        local n; n=$(printf '%s\n' "$list" | sed '/^$/d' | wc -l | tr -d ' ')
        local force="${SYNCWORK_FORCE:-}"
        local ask; ask=$(__sync_ask_cmd "$tree" "$from" "$into")

        # 🔴 NO drift of the human's own → NO complaint. this is the whole point
        #    of the partition: a mirror whose only divergence is this tool's own
        #    leavings is a mirror with naught to protect.
        if [[ -n "$list" ]]; then

        ####################################################################
        # gate 1 — no --force at all: refuse, and name EVERY door
        ####################################################################
        if [[ -z "$force" ]]; then
          if [[ -n "$unknown" ]]; then
            echo "   └─ ✋ $n file(s) differ from the last sync — and this mirror keeps no" >&2
            echo "      snapshot history, so it CANNOT tell yours from its own leavings." >&2
            echo "      ⚠️ it says so rather than call them yours. a sync from here on" >&2
            echo "         records the history, and the next refusal will know." >&2
          else
            echo "   └─ ✋ $n file(s) here are YOURS — this refresh would overwrite them" >&2
          fi
          echo "" >&2
          # ⭐ THE ASK, FIRST and RUNNABLE. this block used to open with `.why`
          #    and bury two commands under six lines of prose, so the human had
          #    to read the whole thing to learn what to type. lead with the act
          #    (rule.require.errors-name-the-fix · define.wick-dense: point first).
          echo "      ⭐ the ask — pick one, then re-run:" >&2
          echo "           $ask --force hard --mode apply    # discard them, take the grove's" >&2
          echo "           $ask --force soft --mode apply    # keep them, as merge conflicts" >&2
          echo "         either way every file below is copied aside first. neither is final." >&2
          echo "" >&2
          if [[ -n "$list" ]]; then
            echo "      .what  yours, and how this sync would land on each:" >&2
            __sync_drift_annotate "$mirror" "$sha" "$list" | sed 's/^/             /' >&2
          else
            echo "      .what  the drift could not be itemized (no applied record, or an" >&2
            echo "             unreadable index). the whole tree is at risk, so it refuses." >&2
            echo "             look: git -C $mirror status --short" >&2
          fi
          echo "" >&2
          echo "      .or  send them up to the crew instead, then re-sync —" >&2
          echo "             rhx git.tree.sync --tree $tree --from local --into <grove> \\" >&2
          echo "               --what '<glob>' --mode apply" >&2
          return 2
        fi

        ####################################################################
        # gate 2 — a bare --force: make them PICK, with the list in view
        ####################################################################
        # 🔴 this refusal is the POINT of the deferral. `hard` and `soft` differ
        #    in what survives, so the choice needs the enumeration, and the flag
        #    line has none. a default here would pick for them, and whichever
        #    way it defaulted would be wrong half the time
        #    (rule.require.safe-by-default — no default is safe over a fork).
        if [[ "$force" == "ask" ]]; then
          echo "   └─ ✋ --force needs a mode. $n file(s) of yours hang on the answer" >&2
          echo "" >&2
          echo "      ⭐ the ask — pick one, then re-run:" >&2
          echo "           $ask --force hard --mode apply    # discard them, take the grove's" >&2
          echo "           $ask --force soft --mode apply    # keep them, as merge conflicts" >&2
          echo "         either way every file below is copied aside first. neither is final." >&2
          echo "" >&2
          echo "      .what  yours, and how this sync would land on each:" >&2
          __sync_drift_annotate "$mirror" "$sha" "$list" | sed 's/^/             /' >&2
          return 2
        fi

        ####################################################################
        # gate 3 — a force that DESTROYS rides a DELIBERATE apply
        ####################################################################
        # 🔴 a pull DEFAULTS to apply (see the mode block above), so `--force
        #    hard` alone would destroy on a call that never typed `apply`. the
        #    default exists because a pull into a mirror harms no crew — and a
        #    force is the one pull that can harm the HUMAN, so it does not
        #    inherit that default (rule.require.safe-by-default).
        if [[ -z "${SYNCWORK_MODE_EXPLICIT:-}" ]]; then
          echo "   └─ ✋ --force $force would touch $n file(s) of yours — say apply out loud" >&2
          echo "" >&2
          echo "      ⭐ the ask — re-run with the mode typed:" >&2
          echo "           $ask --force $force --mode apply" >&2
          echo "" >&2
          echo "      .why  a pull defaults to --mode apply because it harms no crew." >&2
          echo "            a force can harm YOU, so it does not inherit that default." >&2
          echo "" >&2
          echo "      .what  yours, and how this sync would land on each:" >&2
          __sync_drift_annotate "$mirror" "$sha" "$list" | sed 's/^/             /' >&2
          return 2
        fi

        ####################################################################
        # the RESCUE — always, before either mode touches a byte
        ####################################################################
        # 🔴 a force must GUIDE, never punish. it printed a list and then
        #    destroyed the very files it had just named, which is a countdown
        #    rather than a safeguard. the copy makes both modes recoverable, so
        #    a wrong pick costs a `cp -a` and not a day
        #    (rule.prefer.prevent-over-correct, rung 2).
        local rescue=""
        if ! rescue=$(__sync_drift_rescue "$mirror" "$list"); then
          rescue=""
        fi

        echo "   ├─ ⚠️ --force $force over $n drifted file(s):"
        __sync_drift_annotate "$mirror" "$sha" "$list" | sed 's/^/   │     /'
        if [[ -n "$rescue" ]]; then
          echo "   ├─ 🛟 copied aside first — $rescue"
          echo "   │     restore any of them: cp -a $rescue/<path> $mirror/<path>"
        else
          # ⚠️ a rescue that could save NO file is the normal case for a drift
          #    that is all D rows — there is no content to copy. it is a defect
          #    only where files exist and the copy failed, and the two read the
          #    same from here, so it says so rather than claim a safety net.
          echo "   ├─ ⚠️ no copy was put aside (no file content to save, or the copy failed)"
        fi

        # hand the soft merge its inputs — it runs PAST the unpack, and the
        # unpack destroys both the drift list and the worktree copies.
        SYNCWORK_FORCE_DRIFT="$list"
        SYNCWORK_FORCE_RESCUE="$rescue"

        fi   # ← closes `if [[ -n "$list" ]]`: no work of the human's, no gate
      fi
    fi
    # 🔴 git's OWN reason is printed, never swallowed. this line ended
    #    `2>/dev/null` and reported only "could not check out <sha>" — which
    #    names the act and withholds the cause, so every failure of this step
    #    reads identically: a stale gitdir, a held index.lock, an absent object,
    #    a locked worktree. the reader is then left to guess, and the guess is
    #    where the hours go (rule.forbid.failhide, rule.require.failloud).
    # 🔴 core.hooksPath=/dev/null — the mirror is a READ SURFACE, and a repo's
    #    checkout hooks have no business on it.
    #
    #    a husky `post-checkout` sources `.husky/_/husky.sh`, which `npm install`
    #    generates and `.gitignore` excludes — so it does not travel in a git
    #    snapshot, by design. the hook then fails, `git checkout` exits non-zero,
    #    and the whole sync dies on a shim the mirror was never meant to have.
    #    measured on declastruct-aws @ grove-sandpine-v20260901: the mirror was at
    #    the CORRECT sha and every refresh refused, so it was frozen in place.
    #
    #    ⇒ the same defect `git.tree.duct.sh:create_worktree_on_grove` was
    #      repaired for, with the same flag
    #      (.dream/2026_09_06.worktree-add-runs-repo-checkout-hooks.dream.md).
    local out_co
    if ! out_co=$(__sync_mirror_unpack "$mirror" "$sha" "$snap_head" "$snap_idx"); then
      echo "   └─ 💥 could not unpack $sha in $mirror" >&2
      printf '%s\n' "$out_co" | sed 's/^/      │ /' >&2
      echo "" >&2
      echo "      the usual causes, cheapest first:" >&2
      echo "        · a stale worktree registration — git -C $clone worktree repair" >&2
      echo "        · a held lock — remove $mirror/.git/index.lock if no process owns it" >&2
      echo "        · the worktree was pruned — rhx rmsafe -r $mirror, then re-sync" >&2
      return 1
    fi
  else
    mkdir -p "$(dirname "$mirror")"
    # hooks off here too — `worktree add` fires post-checkout just as a checkout
    # does, so a first sync would die where a refresh does. see the twin above.
    #
    # ⚠️ the worktree is added at their HEAD, never at the snapshot — the unpack
    #    below is what puts the crew's inflight work into it, unstaged.
    local out_wt
    if ! out_wt=$(git -c core.hooksPath=/dev/null -C "$clone" \
                    worktree add --quiet --detach "$mirror" "$snap_head" 2>&1); then
      echo "   └─ 💥 could not add a mirror worktree at $mirror" >&2
      printf '%s\n' "$out_wt" | sed 's/^/      │ /' >&2
      return 1
    fi
    local out_up
    if ! out_up=$(__sync_mirror_unpack "$mirror" "$sha" "$snap_head" "$snap_idx"); then
      echo "   └─ 💥 could not unpack $sha into the new mirror at $mirror" >&2
      printf '%s\n' "$out_up" | sed 's/^/      │ /' >&2
      return 1
    fi
  fi

  echo "   ├─ tree: $mirror"

  # ── --force soft: put the drifted files BACK, as conflicts ─────────
  # 🔴 this runs PAST the unpack on purpose. `soft` promises the human keeps
  #    their work, and the unpack's `clean -fd` + `read-tree --reset -u` has
  #    just wiped the worktree copies — so the only surviving copy is the
  #    rescue, and this is where it is reapplied over the arrival state.
  if [[ "${SYNCWORK_FORCE:-}" == "soft" && -n "${SYNCWORK_FORCE_RESCUE:-}" ]]; then
    __sync_force_soft_reapply \
      "$mirror" "$SYNCWORK_FORCE_RESCUE" "$SYNCWORK_FORCE_DRIFT" || return 1
  fi

  # ⚠️ AFTER the unpack, never before: `read-tree --reset -u` writes only paths
  #    that are IN the snapshot tree, so it cannot disturb a gitignored file —
  #    but the order makes that independent of read-tree's semantics rather than
  #    reliant on them, and a re-sync then refreshes the ignored copy too.
  #
  # 🔴 a FAILED --also-ignored fails the SYNC. the human named a path they
  #    intend to `source`; to mirror the tree and quietly omit it hands them a
  #    seat that looks complete and is not (term=false-report).
  if [[ ${#ignored[@]} -gt 0 ]]; then
    __sync_pull_ignored "$host_from" "$dir_from" "" "$mirror" "${ignored[@]}" || return $?
  fi

  # ⚠️ READ BACK what landed, never report a success code as a result
  #    (rule.require.verify-after-send). the narrow direction already lists the
  #    files it sent; this arm claimed "mirrored" off an exit status alone, so
  #    an empty snapshot and a full one printed the identical line.
  #
  #    the number that matters is the DELTA AGAINST HEAD — that is the review
  #    subject, and the whole reason the snapshot exists. a mirror whose delta
  #    is 0 is a tree with naught uncommitted, which the human is owed up front
  #    rather than after they open nvim and find out.
  # 🔴 the delta is reported in its TWO halves, never as one sum. the mirror now
  #    holds the crew's index, so "staged" and "unstaged" are two real numbers
  #    here — and a single "N uncommitted" would re-flatten in the REPORT the
  #    exact partition the transport was rebuilt to carry.
  #
  # 🔴 each half is measured FROM THE MIRROR'S OWN index and worktree — never
  #    from a tree-to-tree diff of the snapshot chain. the two are not the same
  #    question, and the tree form answers the wrong one:
  #
  #      the snapshot's worktree tree was built with `git add -A`, so it HOLDS
  #      files the crew never tracked. a `diff <index tree> <worktree tree>`
  #      therefore counts every untracked file as a change, while the crew's own
  #      `git diff` does not see one.
  #
  #    ⚠️ measured on a real tree, 2026-09-15: the tree form printed 189 where
  #       the grove read 81 — 81 tracked, plus ~108 untracked. the count was
  #       accurate about a question nobody asked, and it was NOT the number the
  #       very next line tells the human to go run (term=false-report).
  #
  #    ⇒ the mirror's index IS their index and its worktree IS their worktree,
  #      so these three commands here return exactly what they return on the
  #      grove. the report is then computed the same way the reader will
  #      recompute it, which is what makes it checkable rather than merely true.
  local head_sha n_delta n_files n_staged n_unstaged n_untracked
  head_sha=$(git -C "$mirror" rev-parse "$snap_head" 2>/dev/null) || head_sha=""
  n_delta=$(git -C "$mirror" diff --name-only "$snap_head" "$sha" 2>/dev/null | grep -c . || true)
  n_staged=$(git -C "$mirror" diff --cached --name-only 2>/dev/null | grep -c . || true)
  n_unstaged=$(git -C "$mirror" diff --name-only 2>/dev/null | grep -c . || true)
  n_untracked=$(git -C "$mirror" ls-files --others --exclude-standard 2>/dev/null | grep -c . || true)
  n_files=$(git -C "$mirror" ls-tree -r --name-only "$sha" 2>/dev/null | grep -c . || true)

  echo "   ├─ head: ${head_sha:0:12}   (their branch tip — the snapshot's base)"
  echo "   ├─ read: $n_files file(s) tracked · 🔎 $n_delta uncommitted vs head"
  echo "   ├─ ✋ staged: $n_staged  ·  ✍️ since staged: $n_unstaged  ·  ❔ untracked: $n_untracked"
  echo "   │"
  if [[ "$n_delta" -eq 0 ]]; then
    echo "   └─ ✔ mirrored  ·  ⚠️ NAUGHT uncommitted — their work is all in commits."
    echo "         review the branch instead:"
    echo "           git -C $mirror log --oneline $head_sha"
    return 0
  fi
  echo "   └─ ✔ mirrored  ·  their index came WITH the work, so every verb reads"
  echo "      as it does on the grove:"
  echo "         git -C $mirror diff              # what they changed SINCE they staged"
  echo "         git -C $mirror diff --cached     # what they have staged"
  echo "         git -C $mirror status            # both, partitioned as they see it"
  echo "         git -C $mirror range-diff $ref@{1} $ref     # since you last looked"
  echo "         nvim $mirror"
}

######################################################################
# the NARROW direction — onto a live grove worktree, named paths only
######################################################################
__sync_into_grove() {
  local tree="$1" host_from="$2" dir_from="$3" host_into="$4" sha="$5"; shift 5
  local -a globs=("$@")
  local dir_into

  if ! dir_into="$(__sync_tree_dir "$host_into" "$tree")"; then
    echo "   └─ ✋ no worktree for '$tree' on the destination" >&2
    return 2
  fi
  echo "   ├─ dst:  $host_into:$dir_into"

  # 🔴 `git archive … | tar -x` rather than `git checkout <ref> -- <paths>`.
  #    both write only the named paths, but checkout ALSO STAGES them — so the
  #    crew's next `git status` would show feedback files staged, mid-round,
  #    with no idea who staged them. archive writes the files and naught else.
  local -a spec=()
  local g; for g in "${globs[@]}"; do spec+=("'$g'"); done

  local archive_cmd tar_cmd out
  archive_cmd="cd '$dir_from' && git archive --format=tar '$sha' -- ${spec[*]}"
  tar_cmd="mkdir -p '$dir_into' && tar -x -C '$dir_into' && echo '--extract-ran--'"

  # ⚠️ an EMPTY match must not read as a success. `git archive` exits non-zero
  #    when a pathspec matches naught, which is the signal we want — a caller
  #    who typo'd a glob is owed a refusal, never a cheerful "sent 0 files".
  if ! out=$(__sync_run "$host_from" "$archive_cmd" 2>&1 >/dev/null); then
    echo "   └─ ✋ no path matched --what on the source" >&2
    printf '%s\n' "$out" | sed 's/^/      │ /' >&2
    echo "" >&2
    echo "      the globs are matched as git pathspecs, from the tree root." >&2
    return 2
  fi

  out=$(__sync_run "$host_from" "$archive_cmd" 2>/dev/null \
        | __sync_run_stdin "$host_into" "$tar_cmd" 2>&1) || true

  case "$out" in
    *--extract-ran--*) : ;;
    *)
      echo "   └─ 💥 the write did not complete on $host_into" >&2
      printf '%s\n' "$out" | sed 's/^/      │ /' >&2
      echo "" >&2
      echo "      ⚠️ some files may have landed. this run makes NO claim either way." >&2
      return 1 ;;
  esac

  # the file list is READ BACK from the archive, never inferred from a success
  # code (rule.require.verify-after-send)
  local files n
  files=$(__sync_run "$host_from" "$archive_cmd | tar -t" 2>/dev/null) || true
  files=$(printf '%s\n' "$files" | sed '/\/$/d' | sed '/^$/d')
  n=$(printf '%s\n' "$files" | grep -c . || true)

  echo "   ├─ sent: $n file(s)"
  printf '%s\n' "$files" | sed 's/^/   │     ├─ /'
  echo "   │"
  echo "   └─ ✔ delivered  ·  their index was NOT touched — the files are unstaged"
}

######################################################################
# 🔴 .there is NO `crew.boot.reviewer`, and its absence is the design
#
#   the reviewer IS a crew seat. `crew.boot` opens its duct and `crew.show`
#   gives it a tab, exactly as for every other seat — the one property that
#   sets it apart is that its duct opens on THIS box, cwd'd into the mirror,
#   and that is handled at two seams in crewwork (__crew_role_host for the box,
#   __crew_role_cwd for the dir).
#
#   ⚠️ a verb by that name existed from 2026-09-10 to 2026-09-11. it bundled
#      three acts — sync, duct, tab — because "a seat you cannot read is no
#      seat", which is true and is not a reason to fuse them. the fusion then
#      forced the reviewer OUT of CREWWORK_ROLES_DEFAULT, to keep `crew.boot`
#      free of a network round trip — so a verb invented to add a seat had to
#      remove that seat from the roster to exist. the human struck it:
#
#        "why would crew.boot exclude it? it can BOot it without the
#         sync" / "sync is separate to boot" / "why would you cut the
#         crew registration out, just to arbitrarily bind sync to crew
#         registration"
#
#   ⇒ so: `crew.boot` REGISTERS the seat (an empty mirror dir is a fine cwd),
#     `git.tree.sync` FILLS it, and `crew.show` shows it. three verbs, three
#     acts, each callable alone (rule.forbid.bind-a-costly-act-to-a-cheap-one).
######################################################################
