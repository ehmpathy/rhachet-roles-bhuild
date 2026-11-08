#!/usr/bin/env bash
######################################################################
# .what = a statusline command that logs each account's cap % to a
#         gitignored ledger, then renders bhrain's route statusline
#
# .why  = the cap ledger (F8): pool calibration needs each account's
#         5h and 7d % at many instants, and the statusline input is
#         the one place claude code hands them over, per seat, free
#         - transcripts name no account; the config dir's .claude.json
#           names the account signed in at that tick
#
# usage:
#   as a statusLine command, in this seat's .claude/settings.local.json:
#     { "statusLine": { "type": "command",
#         "command": ".agent/repo=.this/role=any/skills/claude.statusline.caplog.sh" } }
#   rhx claude.statusline.caplog --status   # is it wired? did it run? what did it log?
#
# guarantee:
#   - stdout is exactly bhrain's routeStatusLine for the same input
#   - one ledger row per change of (account, 5h %, 7d %), per session,
#     even when two seats of one worktree tick at once (a lock guards
#     the read, the compare, and the append), plus a keepalive row once
#     a flat % has gone CAPLOG_KEEPALIVE_MIN (4) unrecorded, so a quiet
#     account never reads as a dead seat
#   - the row shape and the change key are capwork's (the reader's own)
#   - every run stamps a heartbeat, so "never ran" and "ran, no change"
#     read apart
#   - a ledger fault never breaks the render, and never hides: it lands
#     in faults.log beside the ledger, or on stderr where that dir
#     cannot be made; --status names it
#   - --status reads the ledger of the worktree it runs in, from any cwd
#   - all files live under .log/role=any/skill=claude.statusline.caplog/
#     (gitignored; wall-clock time is fine there)
######################################################################
set -uo pipefail

# a flat % owes a fresh row this often: under the reader's 5 min floor of freshness
CAPLOG_KEEPALIVE_MIN=4

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# .what = the worktree root of a path: git's top level, else the path itself
get_root_of() {
  git -C "$1" rev-parse --show-toplevel 2>/dev/null || printf '%s\n' "$1"
}

# the ledger contract: the path, the row, the change key (supervisor's capwork)
REPO_ROOT=$(get_root_of "$SCRIPT_DIR")
PATH_CAPWORK=""
for candidate in "$REPO_ROOT/.agent/repo=bhuild/role=supervisor/skills/work/capwork.sh" \
                 "$REPO_ROOT/src/domain.roles/supervisor/skills/work/capwork.sh"; do
  [[ -r "$candidate" ]] && { PATH_CAPWORK="$candidate"; break; }
done

# the --help mode: the two ways to call it, and where its files live
if [[ " $* " == *" --help "* || " $* " == *" -h "* ]]; then
  cat <<'HELP'
🐚 claude.statusline.caplog — log each account's cap % to a ledger, then render the route statusline

usage:
  as a statusLine command, in a seat's .claude/settings.local.json (it reads the statusline input on stdin):
    { "statusLine": { "type": "command",
        "command": ".agent/repo=.this/role=any/skills/claude.statusline.caplog.sh" } }
  rhx claude.statusline.caplog --status   # is it wired? did it run? what did it log?
  rhx claude.statusline.caplog --help     # this

files (gitignored), under the worktree root:
  .log/role=any/skill=claude.statusline.caplog/caps.jsonl   one row per change of (account, 5h %, 7d %)
  .log/role=any/skill=claude.statusline.caplog/heartbeat    the last run
  .log/role=any/skill=claude.statusline.caplog/faults.log   every ledger fault
HELP
  exit 0
fi

# any flag but --status (and the --skill/--repo/--role pair rhachet passes) is unknown:
# fail loud, never fall through to a stdin read
args=("$@")
i=0
while (( i < ${#args[@]} )); do
  case "${args[$i]}" in
    --status) i=$((i + 1)) ;;
    --skill|--repo|--role) i=$((i + 2)) ;;
    *) echo "✋ ConstraintError: unknown argument '${args[$i]}' (see --help)" >&2; exit 2 ;;
  esac
done

# the --status mode: report the wire and the ledger, then exit
if [[ " $* " == *" --status "* ]]; then
  [[ -n "$PATH_CAPWORK" ]] || { echo "💥 MalfunctionError: the ledger lib is absent (work/capwork.sh); run: npx rhachet roles link --role supervisor" >&2; exit 1; }
  # shellcheck source=/dev/null
  source "$PATH_CAPWORK"
  root=$(get_root_of "$PWD")
  dir="$root/$CAPWORK_LEDGER_REL"
  wire="$root/.claude/settings.local.json"
  echo "🐚 claude.statusline.caplog"
  if [[ -f "$wire" ]] && grep -q 'claude.statusline.caplog' "$wire"; then
    echo "   ├─ wired: yes ($wire)"
  else
    echo "   ├─ wired: no — add the statusLine to $wire, then restart the seat"
  fi
  if [[ -f "$dir/heartbeat" ]]; then
    echo "   ├─ last run: $(cat "$dir/heartbeat")"
  else
    echo "   ├─ last run: never — a seat reads statusLine at boot; restart it"
  fi
  rows=0
  [[ -f "$dir/caps.jsonl" ]] && rows=$(wc -l < "$dir/caps.jsonl")
  echo "   ├─ rows: $rows"
  [[ "$rows" -gt 0 ]] && echo "   │  └─ last: $(tail -1 "$dir/caps.jsonl")"
  faults=0
  [[ -f "$dir/faults.log" ]] && faults=$(wc -l < "$dir/faults.log")
  echo "   └─ faults: $faults"
  [[ "$faults" -gt 0 ]] && echo "      └─ last: $(tail -1 "$dir/faults.log")"
  exit 0
fi

# read the statusline input once
input=$(cat)

# .what = log the cap row, if it changed, under the ledger lock
# .note = the lock spans the read of the prior row, the compare, and the append: two seats
#         of one worktree that tick at once would else both see "changed" and both append
log_cap_row() {
  local dir="$1" ledger="$1/caps.jsonl" confdir conf account row key session prior
  set -e
  date -u +%Y-%m-%dT%H:%M:%SZ > "$dir/heartbeat"

  # the account signed in now, from this seat's config dir
  confdir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
  conf="$confdir/.claude.json"
  [[ -f "$conf" ]] || conf="$HOME/.claude.json"
  account=$(jq -r '.oauthAccount.emailAddress // "unknown"' "$conf")

  row=$(printf '%s' "$input" | jq -c --arg account "$account" --arg confdir "$confdir" \
    --arg at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$CAPWORK_JQ_DEFS"'caprow($account; $confdir; $at)')
  key=$(printf '%s' "$row" | jq -c "$CAPWORK_JQ_DEFS"'capkey')
  session=$(printf '%s' "$row" | jq -c '.session')

  exec 8> "$dir/.lock"
  flock -w 5 8
  prior=""
  prior_age_min=0
  if [[ -f "$ledger" ]]; then
    prior=$( (grep -F "\"session\":$session" "$ledger" || true) | tail -1)
    if [[ -n "$prior" ]]; then
      prior_age_min=$(printf '%s' "$prior" | jq -r '((now - (.at | fromdateiso8601)) / 60) | floor')
      prior=$(printf '%s' "$prior" | jq -c "$CAPWORK_JQ_DEFS"'capkey')
    fi
  fi
  # .note = a quiet account holds its % flat for hours. the reader drops a row older than its
  #         freshness bound (5 min at the least), so a flat % still owes a keepalive row every
  #         CAPLOG_KEEPALIVE_MIN; else a live seat on a quiet account reads as a dead one
  if [[ "$key" != "$prior" ]] || (( prior_age_min >= CAPLOG_KEEPALIVE_MIN )); then
    printf '%s\n' "$row" >> "$ledger"
  fi
  flock -u 8
}

# locate the ledger dir; fall back to cwd
# .note = an input with no project dir falls back to the cwd in silence (an expected shape);
#         an input that does not parse falls back too, but is named in faults.log, never hidden
root_fault=""
if ! root=$(printf '%s' "$input" | jq -r '.workspace.project_dir // .cwd // empty' 2>/dev/null); then
  root=""
  root_fault="the statusline input does not parse as json; the ledger root fell back to the cwd ($PWD)"
fi
[[ -n "$root" ]] || root="$PWD"
if [[ -z "$PATH_CAPWORK" ]]; then
  echo "💥 MalfunctionError: caplog: the ledger lib is absent (work/capwork.sh); no row logged" >&2
else
  # shellcheck source=/dev/null
  source "$PATH_CAPWORK"
  dir="$root/$CAPWORK_LEDGER_REL"
  if ! mkdir -p "$dir" 2>/dev/null; then
    # the faults.log would live in the dir that could not be made, so the fault goes to stderr
    echo "💥 MalfunctionError: caplog: the ledger dir could not be made: $dir" >&2
  else
    [[ -z "$root_fault" ]] || echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $root_fault" >> "$dir/faults.log"
    # a fault goes to faults.log, never to the render; a subshell keeps its set -e local
    ( log_cap_row "$dir" ) 2>> "$dir/faults.log"
    rc=$?
    [[ $rc -eq 0 ]] || echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ledger fault, exit $rc" >> "$dir/faults.log"
  fi
fi

# .what = render bhrain's route statusline for one input, via its package export
# .note = the dispatch shape of portable-skills-pattern: node imports the published entry,
#         so the render is bhrain's own, never a copy of it
render_route_statusline() {
  node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeStatusLine())"
}

printf '%s' "$input" | render_route_statusline
