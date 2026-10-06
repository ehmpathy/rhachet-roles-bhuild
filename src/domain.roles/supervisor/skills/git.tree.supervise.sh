#!/usr/bin/env bash
######################################################################
# .what = survey all worktrees with status and attention signals
#
# .why  = 115 worktrees is cognitive overload. see at a glance:
#         - what's the git state?
#         - who spoke last?
#         - who is blocked on me?
#
# usage:
#   git.tree.supervise get                    # active in last 24h (default)
#   git.tree.supervise get --all              # full survey (no time filter)
#   git.tree.supervise get --needs-me         # filter: human must act
#   git.tree.supervise get --org sandpine       # filter by org
#   git.tree.supervise get --stale            # filter: no activity > 7 days
#   git.tree.supervise get --since 48h        # active in last 48 hours
#
# guarantee:
#   - scans ~/git/{org}/_worktrees/
#   - reads claude transcripts for last message info
#   - reports git status per worktree
#   - read-only (no mutations)
#   - fail-fast on errors
######################################################################

set -o pipefail
# note: removed -e and -u; errors handled via conditional checks

# --- parse args ---
# rhachet passes --repo, --role, --skill before user args
ORG_FILTER=""
NEEDS_ME=false
STALE_ONLY=false
SHOW_ALL=false
SINCE_HOURS=24
CMD=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo|--role|--skill) shift 2 ;;  # skip rhachet metadata
    get) CMD="get"; shift ;;
    --org) ORG_FILTER="$2"; shift 2 ;;
    --needs-me) NEEDS_ME=true; shift ;;
    --stale) STALE_ONLY=true; shift ;;
    --all) SHOW_ALL=true; shift ;;
    --since)
      # parse hours from "24h" or "48h" format
      SINCE_HOURS="${2%h}"
      shift 2
      ;;

    # .why the header's OWN terminator, never a pinned line number: a literal
    #   bound goes stale the moment the header grows, and stays silent when it
    #   does — a false report about the file it lives in (git.crew.poll:477)
    --help|-h)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ "$CMD" != "get" ]]; then
  echo "usage: rhx git.tree.supervise get [--org ORG] [--needs-me] [--stale] [--all] [--since Nh]" >&2
  exit 2
fi

# --- claude transcript functions ---
CLAUDE_PROJECTS="$HOME/.claude/projects"

# encode path to claude project dir format
# /home/bert/git/sandpine/_worktrees/repo.user.branch -> -home-bert-git-sandpine--worktrees-repo-user-branch
encode_claude_path() {
  local path="$1"
  # strip trail slash, replace /, _, and . with dash
  path="${path%/}"
  echo "$path" | sed 's|[/._]|-|g'
}

# get last message info from claude transcripts
# returns: "who|when|snippet|epoch" or empty if no transcript
get_claude_last_message() {
  local wt_path="$1"
  local encoded
  encoded=$(encode_claude_path "$wt_path")
  local project_dir="$CLAUDE_PROJECTS/$encoded"

  # no claude project dir = no transcript
  [[ -d "$project_dir" ]] || return

  # find most recent .jsonl file (may be nested in uuid/[subagents/] dirs)
  local latest_jsonl
  latest_jsonl=$(find "$project_dir" -name "*.jsonl" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
  [[ -n "$latest_jsonl" && -f "$latest_jsonl" ]] || return

  # get file modification time as relative
  local file_mtime
  file_mtime=$(stat -c %Y "$latest_jsonl" 2>/dev/null || echo "0")
  local now_epoch
  now_epoch=$(date +%s)
  local diff=$((now_epoch - file_mtime))
  local relative_time
  if [[ $diff -lt 60 ]]; then
    relative_time="${diff}s ago"
  elif [[ $diff -lt 3600 ]]; then
    relative_time="$((diff / 60))m ago"
  elif [[ $diff -lt 86400 ]]; then
    relative_time="$((diff / 3600))h ago"
  else
    relative_time="$((diff / 86400))d ago"
  fi

    # get last user/assistant message with actual text content
  local last_info
  last_info=$(tail -200 "$latest_jsonl" 2>/dev/null | jq -rs '
    # filter for messages that have actual text content
    [.[] | select(.type == "user" or .type == "assistant") |
      # compute text content
      . as $msg |
      (if .message.content | type == "string" then
        .message.content
      elif .message.content | type == "array" then
        [.message.content[] | select(.type == "text") | .text] | join(" ")
      else
        ""
      end) as $text |
      # only keep messages with non-empty text
      select($text != "") |
      { type: .type, text: $text }
    ] | last |
    if . then
      .type + "|" + (.text | .[0:60])
    else
      ""
    end
  ' 2>/dev/null || true)

  [[ -n "$last_info" ]] || return

  local last_type snippet
  IFS='|' read -r last_type snippet <<< "$last_info"

  # who spoke last
  local who
  [[ "$last_type" == "user" ]] && who="human" || who="agent"

  echo "${who}|${relative_time}|${snippet}|${file_mtime}"
}

# check if worktree has claude activity within threshold
has_recent_claude_activity() {
  local wt_path="$1"
  local hours_threshold="$2"
  local encoded
  encoded=$(encode_claude_path "$wt_path")
  local project_dir="$CLAUDE_PROJECTS/$encoded"

  [[ -d "$project_dir" ]] || return 1

  # find most recent .jsonl file (may be nested in uuid/[subagents/] dirs)
  local latest_jsonl
  latest_jsonl=$(find "$project_dir" -name "*.jsonl" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
  [[ -n "$latest_jsonl" && -f "$latest_jsonl" ]] || return 1

  # check file modification time
  local file_mtime
  file_mtime=$(stat -c %Y "$latest_jsonl" 2>/dev/null || echo "0")
  local now_epoch
  now_epoch=$(date +%s)
  local threshold_seconds=$((hours_threshold * 3600))
  local age=$((now_epoch - file_mtime))

  [[ $age -lt $threshold_seconds ]]
}

# --- scan worktrees ---
GIT_ROOT="$HOME/git"

get_worktree_status() {
  local wt_path="$1"
  local status="clean"

  cd "$wt_path" || return 1

  # check if merged to main
  local branch
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [[ -z "$branch" ]]; then
    echo "unknown"
    return
  fi

  # check for unstaged changes first (takes priority)
  if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
    echo "unstaged"
    return
  fi

  # check for unpushed commits
  local upstream
  upstream=$(git rev-parse --abbrev-ref '@{upstream}' 2>/dev/null || echo "")
  if [[ -n "$upstream" ]]; then
    local ahead
    ahead=$(git rev-list --count "$upstream..HEAD" 2>/dev/null || echo "0")
    if [[ "$ahead" -gt 0 ]]; then
      echo "unpushed"
      return
    fi
  else
    # no upstream = unpushed
    echo "unpushed"
    return
  fi

  # only report merged if clean and merged
  local is_merged
  is_merged=$(git branch -r --contains HEAD 2>/dev/null | grep "origin/main" || true)
  if [[ -n "$is_merged" ]]; then
    echo "merged"
    return
  fi

  echo "clean"
}

status_icon() {
  case "$1" in
    merged) echo "👌" ;;
    clean) echo "👌" ;;
    unstaged) echo "✋" ;;
    unpushed) echo "✋" ;;
    *) echo "❓" ;;
  esac
}

# --- collect worktrees ---
declare -A inflight
declare -A stale
declare -A merged_trees

for org_dir in "$GIT_ROOT"/*/; do
  org_name=$(basename "$org_dir")

  # skip non-org dirs
  [[ "$org_name" == "_worktrees" ]] && continue

  # filter by org if specified
  if [[ -n "$ORG_FILTER" && "$org_name" != "$ORG_FILTER" ]]; then
    continue
  fi

  wt_dir="${org_dir%/}/_worktrees"
  [[ -d "$wt_dir" ]] || continue

  for wt_path in "$wt_dir"/*/; do
    [[ -d "$wt_path/.git" || -f "$wt_path/.git" ]] || continue

    # filter by recent claude activity unless --all
    if [[ "$SHOW_ALL" != true ]]; then
      if ! has_recent_claude_activity "$wt_path" "$SINCE_HOURS"; then
        continue
      fi
    fi

    wt_name=$(basename "$wt_path")
    slug="$org_name/$wt_name"

    status=$(get_worktree_status "$wt_path")
    icon=$(status_icon "$status")

    # get claude message info
    claude_info=$(get_claude_last_message "$wt_path")

    entry="$slug|${wt_path%/}|$icon $status|$claude_info"

    if [[ "$status" == "merged" ]]; then
      merged_trees["$slug"]="$entry"
    else
      inflight["$slug"]="$entry"
    fi
  done
done

# --- output ---
print_section() {
  local title="$1"
  local -n items=$2
  local count=${#items[@]}

  [[ $count -eq 0 ]] && return

  echo ""
  echo "$title ($count)"

  # sort entries by epoch (most recent first)
  # entry format: slug|wt_path|icon status|who|relative_time|snippet|epoch
  local sorted_entries
  sorted_entries=$(for slug in "${!items[@]}"; do
    echo "${items[$slug]}"
  done | sort -t'|' -k7 -rn)

  local i=0
  while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    i=$((i + 1))
    local name wt_path status claude_who claude_when claude_snippet epoch
    IFS='|' read -r name wt_path status claude_who claude_when claude_snippet epoch <<< "$entry"

    local prefix="├─"
    local cont="│"
    if [[ $i -eq $count ]]; then
      prefix="└─"
      cont=" "
    fi

    echo "  │"
    echo "  $prefix $name"
    echo -e "  $cont  ├─ \033[2mat $wt_path\033[0m"

    # show claude info if present, with status on same structure
    if [[ -n "${claude_who:-}" && -n "${claude_when:-}" ]]; then
      echo "  $cont  ├─ $status"
      echo "  $cont  └─ $claude_who $claude_when"
      if [[ -n "${claude_snippet:-}" ]]; then
        echo "  $cont     └─ \"$claude_snippet\""
      fi
    else
      echo "  $cont  └─ $status"
    fi
  done <<< "$sorted_entries"
}

if [[ "$SHOW_ALL" == true ]]; then
  echo "🌲 git.tree.supervise get --all"
else
  echo "🌲 git.tree.supervise get (active in last ${SINCE_HOURS}h)"
fi

if [[ "$NEEDS_ME" == true ]]; then
  print_section "inflight" inflight
elif [[ "$STALE_ONLY" == true ]]; then
  print_section "stale" stale
else
  print_section "inflight" inflight
  print_section "merged" merged_trees
fi

# check if any worktrees found
if [[ ${#inflight[@]} -eq 0 && ${#merged_trees[@]} -eq 0 ]]; then
  echo ""
  echo "  └─ (none)"
fi
