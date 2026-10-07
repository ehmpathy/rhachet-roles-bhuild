#!/usr/bin/env bash
######################################################################
# .what = read the RELEASE status of every tree in the fleet, in one call
#
# .why  = a supervisor decides three things from release state, and had
#         no instrument for any of them:
#
#           "got one to fell?"      -> which tree's work has MERGED
#           "what can ship?"        -> which tree is green and mergeable
#           "who is stuck?"         -> which tree failed ci or needs a rebase
#
#         `git.crew.list` answers who is at work. `duct.poll` answers
#         who MOVED. `git.tree.supervise` answers the git-LOCAL state —
#         unpushed, unstaged, merged-by-name. NOT ONE of them reads the
#         remote, so not one of them knows whether a pr exists, whether
#         ci passed, or whether the branch landed.
#
#         so a fell decision was a hand-run survey: eleven `gh pr list`
#         calls, each with an org and a branch a human had to derive from
#         a tree slug by eye. this is that survey, derived live.
#
# usage:
#   rhx git.release.poll                  # every tree that has a crew
#   rhx git.release.poll --all            # every worktree, crew or not
#   rhx git.release.poll --only rhachet   # filter on the tree slug
#   rhx git.release.poll --fellable       # ONLY trees whose work merged
#   rhx git.release.poll --help
#
# args:
#   --only      text filter on the tree slug (optional)
#   --all       poll every worktree on disk, not merely the crewed ones
#   --fellable  print only the 🪵 rows — the fell candidates
#   --timeout   seconds to wait per tree before it is called ⏳ (default: 20)
#
# .the verdicts, ordered by what a supervisor does about them
#
#   🪵 merged     the pr landed          -> FELL IT (rhx git.tree.del)
#   🟢 green      open, ci pass, clean   -> "release into prod"
#   🟡 awaited    ci still runs          -> wait a tick
#   🔴 failed     ci failed              -> rhx show.gh.test.errors
#   ⚓ behind     needs a rebase         -> rhx git.branch.rebase begin
#   🚧 blocked    open, ci pass, gated   -> a review or a branch rule holds it
#   📝 draft      pr is a draft          -> the mechanic is not done
#   🚫 no pr      pushed, no pr opened   -> rhx git.commit.push
#   ✋ unpushed   local commits only     -> the mechanic has not pushed
#   🏗️ in flight  uncommitted work only  -> a mechanic mid-route
#   🫧 no work    no commits, clean      -> naught to release
#   💥 unknown    could not be read      -> diagnose
#
#   a ✋ dirty suffix on any row means the worktree carries uncommitted
#   work — which is precisely what `git.tree.del`'s safety gate refuses,
#   so a 🪵 merged row that is dirty is NOT yet fellable
#
# .why it reads github rather than each foreman duct
#   `rhx git.release` is the AUTHORITATIVE answer, and it must run inside
#   the tree — so a fleet-wide read would mean a `duct.send` into eleven
#   foremen. that costs two things this read should not:
#
#     - a keystroke into a live shell. a foreman mid-command gets its
#       line prepended, and a foreman is a fleet member, so every send
#       fabricates a `🌊 changed` on the next babysit tick
#       (rule.require.pause-babysit-cron-after-idle-streak)
#     - a serial wait. eleven ducts, each read back after its command
#
#   the same facts — pr, ci, mergeability — come from `gh` read-only, in
#   parallel, with no duct touched at all. so this is the fleet GLANCE;
#   `rhx git.release` inside the tree stays the authoritative drill-in,
#   and every row names it.
#
# guarantee:
#   - READ-ONLY: never sends a key, never opens a duct, never mutates a
#     branch, never touches a pr
#   - fleet derived LIVE from tmux sessions on every run (never cached)
#   - all trees read in PARALLEL; output printed in stable sorted order
#   - a tree that fails to read is reported 💥 and never aborts the poll
#   - exit 0 = polled, 1 = malfunction, 2 = constraint
######################################################################

set -uo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

TIMEOUT=20
ONLY=""
SCOPE="crews"
FELLABLE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --only)     ONLY="${2:-}"; shift 2 ;;
    --timeout)  TIMEOUT="${2:-20}"; shift 2 ;;
    --all)      SCOPE="all"; shift ;;
    --fellable) FELLABLE="true"; shift ;;
    --help|-h)
      # both bounds are FOUND, never pinned. this read `NR>=2 && NR<=76`,
      # which printed the top fence as content and sat one header edit away
      # from a silent truncation (rule.require.help-on-demand)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;

    # ⚠️ FAIL LOUD — never `shift` an unknown flag away (rule.forbid.failhide).
    -*) echo "✋ git.release.poll: unknown flag '$1'" >&2
        echo "   known: --only --timeout --all --fellable --help" >&2
        exit 2 ;;
    *) shift ;;
  esac
done

command -v gh >/dev/null 2>&1 || {
  echo "✋ git.release.poll: gh cli not found" >&2
  echo "   fix: install the github cli, then re-run" >&2
  exit 2
}

######################################################################
# gather the trees
######################################################################

declare -a TREES=()

if [[ "$SCOPE" == "crews" ]]; then
  # a crew duct is <tree>/<role>; a one-segment duct is a human's own
  # shell and names no tree (term=duct._.choice._.md)
  declare -A SEEN=()
  while IFS= read -r session; do
    [[ -n "$session" ]] || continue
    [[ "$session" == */* ]] || continue
    SEEN["${session%/*}"]=1
  done < <(__duct_list_host_sessions localhost)
  while IFS= read -r t; do
    [[ -n "$t" ]] && TREES+=("$t")
  done < <(printf '%s\n' "${!SEEN[@]}" | sort)
else
  while IFS= read -r d; do
    [[ -d "$d" ]] && TREES+=("$(basename "$d")")
  done < <(printf '%s\n' "$CREWWORK_GIT_ROOT"/*/_worktrees/*/ | sort)
fi

if [[ -n "$ONLY" ]]; then
  declare -a KEPT=()
  for t in "${TREES[@]}"; do
    [[ "$t" == *"$ONLY"* ]] && KEPT+=("$t")
  done
  TREES=("${KEPT[@]}")
fi

echo "🦫 chew on it"
echo ""
echo "🪵 git.release.poll"

if (( ${#TREES[@]} == 0 )); then
  echo "   └─ (no trees)"
  echo ""
  echo "🦫 the pond is still"
  exit 0
fi

######################################################################
# read one tree — printed as a single tab-separated record
######################################################################

# .what = derive the release verdict for one tree
# .why  = each tree is read in its own subshell so one slow remote never
#         holds the rest; a record is emitted even on total failure, so a
#         broken tree is a 💥 row rather than an absent one
__poll_one_tree() {
  local tree="$1"
  local dir org repo branch glyph verdict detail

  dir="$(__crew_tree_dir "$tree")" || {
    printf '%s\t💥\tunknown\tno worktree on disk\t-\n' "$tree"
    return 0
  }

  # read org/repo from the REMOTE, never from the path or the slug.
  # the layout is $root/<org>/_worktrees/<repo>.<user>.<slug> — org-level,
  # so the repo is not a path segment at all, and to derive it from the
  # slug's dots would be a claim about a NAME rather than a read of the
  # subject (term=partial-audit._.choice._.md, the fourth mechanism)
  local remote
  remote="$(git -C "$dir" remote get-url origin 2>/dev/null)" || remote=""
  if [[ -z "$remote" ]]; then
    printf '%s\t💥\tunknown\tno origin remote\t-\n' "$tree"
    return 0
  fi
  # git@github.com:org/repo.git  |  https://github.com/org/repo.git
  remote="${remote%.git}"
  remote="${remote#*github.com[:/]}"
  remote="${remote#*github.com:}"
  remote="${remote#*github.com/}"
  org="${remote%%/*}"
  repo="${remote##*/}"

  branch="$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null)" || {
    printf '%s\t💥\tunknown\tcould not read branch\t%s/%s\n' "$tree" "$org" "$repo"
    return 0
  }

  # does the branch carry any work at all?
  local base commits
  base="$(git -C "$dir" merge-base HEAD origin/main 2>/dev/null || git -C "$dir" merge-base HEAD origin/master 2>/dev/null || echo "")"
  if [[ -n "$base" ]]; then
    commits="$(git -C "$dir" rev-list --count "$base"..HEAD 2>/dev/null || echo 0)"
  else
    commits="?"
  fi

  # uncommitted work is what makes a fell REFUSE (git.tree.del's safety
  # gate), so a merged tree that is dirty is not actually fellable — say
  # so on the row rather than let the fell surface it later
  local dirty=""
  [[ -n "$(git -C "$dir" status --porcelain 2>/dev/null | head -1)" ]] && dirty=" ✋ dirty"

  # the pr, if one exists — --state all so a MERGED pr is still visible
  local prjson
  prjson="$(gh pr list --repo "$org/$repo" --head "$branch" --state all \
              --json number,state,isDraft,mergeStateStatus,statusCheckRollup \
              --limit 1 2>/dev/null)" || prjson=""

  if [[ -z "$prjson" || "$prjson" == "[]" ]]; then
    # no pr. three cases, and they are NOT one case — a tree with zero
    # commits but a dirty worktree is a mechanic mid-route, not an idle
    # branch. to render both as "no work" would be true of the COMMITS
    # and false of the TREE, which is the reader-inference trap
    # (term=false-report._.choice._.md, cause = scope)
    if [[ "$commits" == "0" ]]; then
      if [[ -n "$dirty" ]]; then
        printf '%s\t🏗️\tin flight\twork uncommitted, no commit yet\t%s/%s#%s\n' \
          "$tree" "$org" "$repo" "$branch"
      else
        printf '%s\t🫧\tno work\tno commits, worktree clean\t%s/%s#%s\n' \
          "$tree" "$org" "$repo" "$branch"
      fi
      return 0
    fi
    if git -C "$dir" rev-parse --abbrev-ref '@{upstream}' >/dev/null 2>&1; then
      printf '%s\t🚫\tno pr\t%s commit(s) pushed, no pr opened%s\t%s/%s#%s\n' \
        "$tree" "$commits" "$dirty" "$org" "$repo" "$branch"
    else
      printf '%s\t✋\tunpushed\t%s local commit(s), no remote branch%s\t%s/%s#%s\n' \
        "$tree" "$commits" "$dirty" "$org" "$repo" "$branch"
    fi
    return 0
  fi

  local num state draft merge checks
  num="$(printf '%s' "$prjson" | jq -r '.[0].number')"
  state="$(printf '%s' "$prjson" | jq -r '.[0].state')"
  draft="$(printf '%s' "$prjson" | jq -r '.[0].isDraft')"
  merge="$(printf '%s' "$prjson" | jq -r '.[0].mergeStateStatus // "UNKNOWN"')"

  # roll the check runs up to one word. a FAILURE anywhere outranks a
  # unsettled run: a red check is actionable now, an unsettled one is not
  checks="$(printf '%s' "$prjson" | jq -r '
    ( .[0].statusCheckRollup // [] ) as $c
    | if   ($c | length) == 0 then "none"
      elif ($c | map(.conclusion // "") | any(. == "FAILURE" or . == "TIMED_OUT" or . == "CANCELLED" or . == "STARTUP_FAILURE")) then "failed"
      elif ($c | map(.status // "COMPLETED") | any(. != "COMPLETED")) then "awaited"
      else "pass" end')"

  if [[ "$state" == "MERGED" ]]; then
    printf '%s\t🪵\tmerged\tpr #%s landed — fell it%s\t%s/%s#%s\n' "$tree" "$num" "$dirty" "$org" "$repo" "$num"
    return 0
  fi
  if [[ "$state" == "CLOSED" ]]; then
    printf '%s\t🚫\tclosed\tpr #%s closed unmerged\t%s/%s#%s\n' "$tree" "$num" "$org" "$repo" "$num"
    return 0
  fi
  if [[ "$draft" == "true" ]]; then
    printf '%s\t📝\tdraft\tpr #%s is a draft, checks %s\t%s/%s#%s\n' "$tree" "$num" "$checks" "$org" "$repo" "$num"
    return 0
  fi

  case "$checks" in
    failed)  glyph="🔴"; verdict="failed";  detail="pr #$num — ci failed" ;;
    awaited) glyph="🟡"; verdict="awaited"; detail="pr #$num — ci still runs" ;;
    *)
      case "$merge" in
        BEHIND|DIRTY) glyph="⚓"; verdict="behind";  detail="pr #$num — needs a rebase ($merge)" ;;
        BLOCKED)      glyph="🚧"; verdict="blocked"; detail="pr #$num — ci pass, a gate holds it" ;;
        *)            glyph="🟢"; verdict="green";   detail="pr #$num — ci pass, mergeable" ;;
      esac
      ;;
  esac

  printf '%s\t%s\t%s\t%s\t%s/%s#%s\n' "$tree" "$glyph" "$verdict" "$detail" "$org" "$repo" "$num"
}

######################################################################
# read every tree at once
######################################################################

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

for tree in "${TREES[@]}"; do
  (
    slot="$WORK/$(printf '%s' "$tree" | tr '/' '_').row"
    if ! timeout "$TIMEOUT" bash -c "$(declare -f __poll_one_tree __crew_tree_dir); CREWWORK_GIT_ROOT='$CREWWORK_GIT_ROOT'; __poll_one_tree '$tree'" > "$slot" 2>/dev/null
    then
      printf '%s\t⏳\ttimeout\tno answer within %ss\t-\n' "$tree" "$TIMEOUT" > "$slot"
    fi
  ) &
done
wait

######################################################################
# print, in stable order
######################################################################

declare -A TALLY=()
ROWS=0

for tree in "${TREES[@]}"; do
  row="$(cat "$WORK/$(printf '%s' "$tree" | tr '/' '_').row" 2>/dev/null)"
  [[ -n "$row" ]] || row="$(printf '%s\t💥\tunknown\tno record emitted\t-' "$tree")"
  IFS=$'\t' read -r t glyph verdict detail ref <<< "$row"
  ROWS=$((ROWS + 1))
  TALLY["$verdict"]=$(( ${TALLY[$verdict]:-0} + 1 ))

  # a MERGED tree that is dirty is NOT fellable — git.tree.del's safety
  # gate refuses uncommitted work. count the two apart, or the summary
  # promises a fell the fell itself will refuse
  if [[ "$verdict" == "merged" && "$detail" == *"✋ dirty"* ]]; then
    TALLY[merged-dirty]=$(( ${TALLY[merged-dirty]:-0} + 1 ))
  fi

  if [[ "$FELLABLE" == "true" && "$verdict" != "merged" ]]; then continue; fi

  echo "   ├─ $t"
  echo "   │  ├─ $glyph $verdict"
  echo "   │  ├─ $detail"
  echo "   │  └─ $ref"
done

echo ""

MERGED=${TALLY[merged]:-0}
GREEN=${TALLY[green]:-0}
DIRTY=${TALLY[merged-dirty]:-0}
CLEAN=$(( MERGED - DIRTY ))

if [[ "$FELLABLE" == "true" ]]; then
  if (( MERGED == 0 )); then
    echo "🦫 no tree to fell — $ROWS polled, none merged"
  else
    echo "🦫 dam fine! $CLEAN to fell — rhx git.tree.del --name <tree>"
    (( DIRTY > 0 )) && echo "   └─ ✋ $DIRTY merged but DIRTY — the fell will refuse until the work is set aside"
  fi
  exit 0
fi

SUMMARY=""
for k in merged green awaited failed behind blocked draft "no pr" unpushed "in flight" "no work" closed unknown timeout; do
  n=${TALLY[$k]:-0}
  (( n > 0 )) && SUMMARY+="$n $k, "
done
echo "🦫 $ROWS tree(s) — ${SUMMARY%, }"

(( CLEAN > 0 )) && echo "   ├─ 🪵 $CLEAN to fell   — rhx git.tree.del --name <tree>"
(( DIRTY > 0 )) && echo "   ├─ ✋ $DIRTY merged but DIRTY — the fell refuses until the work is set aside"
(( GREEN  > 0 )) && echo "   ├─ 🟢 $GREEN to ship   — tell its mechanic \"release into prod\""
echo "   └─ 🔎 drill in — run \`rhx git.release\` inside the tree for the authoritative read"

exit 0
