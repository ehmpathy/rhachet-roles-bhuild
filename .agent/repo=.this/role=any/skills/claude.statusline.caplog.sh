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
# usage (as a statusLine command, in .claude/settings.local.json):
#   { "statusLine": { "type": "command",
#       "command": ".agent/repo=.this/role=any/skills/claude.statusline.caplog.sh" } }
#
# guarantee:
#   - stdout is exactly bhrain's routeStatusLine for the same input
#   - one ledger row per change of (account, 5h %, 7d %), per seat
#   - ledger lives at .log/role=any/skill=claude.statusline.caplog/caps.jsonl
#     (gitignored; wall-clock time is fine there)
#   - a ledger fault never breaks the statusline
######################################################################
set -uo pipefail

# read the statusline input once
input=$(cat)

# log the cap row, if it changed; never fail the render
{
  root=$(printf '%s' "$input" | jq -r '.workspace.project_dir // .cwd // empty')
  [[ -n "$root" ]] || root="$PWD"
  dir="$root/.log/role=any/skill=claude.statusline.caplog"
  ledger="$dir/caps.jsonl"
  mkdir -p "$dir"

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
  key=$(printf '%s' "$row" | jq -c '[.session, .account, .five_hour.used_percentage, .seven_day.used_percentage]')
  prior=""
  [[ -f "$ledger" ]] && prior=$(grep -F "\"session\":$(printf '%s' "$row" | jq -c '.session')" "$ledger" | tail -1 | jq -c '[.session, .account, .five_hour.used_percentage, .seven_day.used_percentage]')
  [[ "$key" == "$prior" ]] || printf '%s\n' "$row" >> "$ledger"
} 2>/dev/null || true

# render bhrain's route statusline from the same input
printf '%s' "$input" | node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeStatusLine())"
