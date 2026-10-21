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
#   - one ledger row per change of (account, 5h %, 7d %), per session
#   - every run stamps a heartbeat, so "never ran" and "ran, no change"
#     read apart
#   - a ledger fault never breaks the render, and never hides: it lands
#     in faults.log beside the ledger, and --status names it
#   - all files live under .log/role=any/skill=claude.statusline.caplog/
#     (gitignored; wall-clock time is fine there)
######################################################################
set -uo pipefail

# the --status mode: report the wire and the ledger, then exit
if [[ " $* " == *" --status "* ]]; then
  dir=".log/role=any/skill=claude.statusline.caplog"
  wire=".claude/settings.local.json"
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

# locate the ledger dir; fall back to cwd
root=$(printf '%s' "$input" | jq -r '.workspace.project_dir // .cwd // empty' 2>/dev/null)
[[ -n "$root" ]] || root="$PWD"
dir="$root/.log/role=any/skill=claude.statusline.caplog"
mkdir -p "$dir" 2>/dev/null

# log the cap row, if it changed; a fault goes to faults.log, never to the render
(
  set -e
  date -u +%Y-%m-%dT%H:%M:%SZ > "$dir/heartbeat"
  ledger="$dir/caps.jsonl"

  # the account signed in now, from this seat's config dir
  confdir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
  conf="$confdir/.claude.json"
  [[ -f "$conf" ]] || conf="$HOME/.claude.json"
  account=$(jq -r '.oauthAccount.emailAddress // "unknown"' "$conf")

  # compose the row
  row=$(printf '%s' "$input" | jq -c \
    --arg account "$account" \
    --arg confdir "$confdir" \
    --arg at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{
      at: $at,
      account: $account,
      confdir: $confdir,
      session: .session_id,
      version: .version,
      model: .model.id,
      five_hour: .rate_limits.five_hour,
      seven_day: .rate_limits.seven_day,
      spend_limit: .rate_limits.spend_limit,
      rate_limits_present: (.rate_limits != null)
    }')

  # append only on a change of (account, 5h %, 7d %) for this session
  keyof='[.session, .account, .five_hour.used_percentage, .seven_day.used_percentage]'
  key=$(printf '%s' "$row" | jq -c "$keyof")
  session=$(printf '%s' "$row" | jq -c '.session')
  prior=""
  if [[ -f "$ledger" ]]; then
    prior=$( (grep -F "\"session\":$session" "$ledger" || true) | tail -1)
    [[ -z "$prior" ]] || prior=$(printf '%s' "$prior" | jq -c "$keyof")
  fi
  [[ "$key" == "$prior" ]] || printf '%s\n' "$row" >> "$ledger"
) 2>> "$dir/faults.log"
rc=$?
# a subshell under `||` would ignore set -e, so test its exit apart
[[ $rc -eq 0 ]] || echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ledger fault, exit $rc" >> "$dir/faults.log"

# render bhrain's route statusline from the same input
printf '%s' "$input" | node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeStatusLine())"
