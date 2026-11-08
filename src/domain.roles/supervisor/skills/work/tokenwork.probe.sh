#!/usr/bin/env bash
######################################################################
# tokenwork.probe — the token read's one communicator: the payload that
#                   reads a grove's transcripts, accounts, and cap rows
#
# 🔴 .a LIB: sourced, never executed. the verb that sources it is
#     `rhx git.crew.tokens` (read and calibrate alike).
#
# .what = TOKENWORK_PROBE — one self-contained payload, run under `bash -c`
#         on local and handed to ssh for a grove, so both arms read with
#         the same bytes
#
# .why  = the payload is the only code that knows the transcript and
#         config-dir layout of a grove. inline in the verb, it sat between
#         the arg parse and the fold, so the verb read as three grains at
#         once; here it is one communicator the verb composes
#
# .in   = TOK_SINCE, TOK_UNTIL (utc, second grain), TOK_FIND_MIN (0 = cap rows
#         alone, no transcript scan); and the
#         libs the verb prepends (grovework, tokenwork, capwork payload libs)
# .out  = one json record: the grove's crews, burn, unread paths, cap rows
#
# guarantee:
#   - defines one variable; runs no command on source
#   - a parse that fails is a malfunction (exit 1), never an empty burn
######################################################################

# shellcheck disable=SC2034 # read by the verb that sources this lib
TOKENWORK_PROBE=$(cat <<'REMOTE'
set -uo pipefail
command -v jq >/dev/null || { echo "💥 MalfunctionError: jq is absent on this grove; install it, then re-read: rhx git.grove.send <grove> --what 'sudo apt-get install -y jq'" >&2; exit 1; }

UNREAD_FILE=$(mktemp)
HITS_FILE=$(mktemp)
trap 'rm -f "$UNREAD_FILE" "$HITS_FILE"' EXIT

# every claude config dir on this grove: home, plus each actor dir of each repo and worktree
get_config_dirs() {
  local d
  [[ -d "$HOME/.claude/projects" ]] && echo "$HOME/.claude"
  for d in "$HOME"/git/*/_worktrees/*/.agent/.actors/*/brain/.claude "$HOME"/git/*/*/.agent/.actors/*/brain/.claude; do
    [[ -d "$d/projects" ]] && echo "$d"
  done
}

# the account a config dir is signed in to now (transcripts record none)
# .note = a .claude.json that does not parse is named in the unread list, never laundered
#         into a plausible account; its seats read "unparsed"
get_account_of_config_dir() {
  local cfg="$1" file account
  for file in "$cfg/.claude.json" "$(dirname "$cfg")/.claude.json"; do
    [[ -f "$file" ]] || continue
    if account=$(jq -r '.oauthAccount.emailAddress // "unsigned"' "$file" 2>/dev/null); then
      echo "$account"
    else
      echo "$file (does not parse)" >> "$UNREAD_FILE"
      echo "unparsed"
    fi
    return 0
  done
  echo "unknown"
}

# every usage line in the span, one grep pass over every transcript the span touched
# .note = the process count is fixed, never per config dir: one find, one grep (via xargs),
#         one jq, and an account read only for the dirs that burned. a few processes per dir
#         took ~200s over 263 dirs at load 30-53 on 4 cpus — even for a 5 min window — since
#         a spawn is what a loaded box rations. grep hands jq only lines with a usage block
get_usage_hits() {
  local cfg projects=()
  while read -r cfg; do
    if [[ -r "$cfg/projects" && -x "$cfg/projects" ]]; then projects+=("$cfg/projects"); else echo "$cfg/projects" >> "$UNREAD_FILE"; fi
  done < <(get_config_dirs)
  (( ${#projects[@]} > 0 )) || return 0
  # a find window of 0 asks for the cap rows alone: no transcript is scanned
  (( TOK_FIND_MIN > 0 )) || return 0
  find "${projects[@]}" -name '*.jsonl' -mmin "-$TOK_FIND_MIN" ! -readable 2>/dev/null >> "$UNREAD_FILE"
  find "${projects[@]}" -name '*.jsonl' -mmin "-$TOK_FIND_MIN" -readable -print0 2>/dev/null \
    | xargs -0 -r grep -H -F '"usage":' 2>/dev/null
}

CONFIG_DIR_COUNT=$(get_config_dirs | wc -l)
get_usage_hits > "$HITS_FILE"
ACCOUNTS=$(
  jq -R -r 'capture("^(?<cfg>.*?)/projects/").cfg' "$HITS_FILE" 2>/dev/null | sort -u | while read -r cfg; do
    [[ -n "$cfg" ]] && printf '%s\t%s\n' "$cfg" "$(get_account_of_config_dir "$cfg")"
  done | jq -R -s 'split("\n") | map(select(length > 0) | split("\t") | {(.[0]): .[1]}) | add // {}'
)
USES=$(
  jq -R -c --arg since "$TOK_SINCE" --arg until "$TOK_UNTIL" --argjson accounts "$ACCOUNTS" '
    capture("^(?<cfg>.*?)/projects/(?<rest>[^:]*):(?<line>.*)$") as $hit
    | ($hit.line | fromjson?) | select(type == "object")
    | select(.timestamp? != null and .timestamp >= $since and .timestamp < $until and .message.usage? != null)
    | { id: (.message.id // .uuid), cwd: (.cwd // ""), cfg: $hit.cfg,
        account: ($accounts[$hit.cfg] // "unknown"),
        fork: ($hit.rest | test("/subagents/")),
        session: (.sessionId // ""), u: .message.usage }
  ' "$HITS_FILE"
)
USES_RC=$?

# a parse that failed is a malfunction, never an empty burn: 0 would read as an idle fleet
if [[ "$USES_RC" != "0" ]]; then
  echo "💥 MalfunctionError: the usage lines did not parse (jq exit $USES_RC)" >&2
  exit 1
fi

# each crew root once, and its kind (grovework: crewroot, get_crew_kinds)
KINDS=$(printf '%s\n' "$USES" | jq -r -s --arg home "$HOME" "$GROVEWORK_JQ_CREW"'
  map(crewroot(.cwd; $home)) | unique | .[]' | get_crew_kinds)
CAPS=$(get_cap_rows)
UNREAD=$(jq -R -s -c 'split("\n") | map(select(length > 0)) | unique' "$UNREAD_FILE")

printf '%s\n' "$USES" | jq -s -c \
  --arg host "$(hostname)" --arg home "$HOME" --argjson kinds "$KINDS" --argjson caps "$CAPS" \
  --argjson unread "$UNREAD" --argjson dirs "$CONFIG_DIR_COUNT" "$GROVEWORK_JQ_CREW$TOKENWORK_JQ_WEIGHT"'
  unique_by(.id)
  | map(. + {crew: crewroot(.cwd; $home)} + (.u | usagefields))
  | map(. + {weighted: weighted})
  | { host: $host,
      config_dirs: $dirs,
      unread: $unread,
      caps: $caps,
      crews: (group_by(.crew) | map({
        crew: .[0].crew,
        kind: ($kinds[.[0].crew] // "other"),
        accounts: (map(.account) | unique),
        seats: (map(.session) | unique | length),
        calls: length,
        calls_fork: (map(select(.fork)) | length),
        input: (map(.input) | add), write5m: (map(.write5m) | add), write1h: (map(.write1h) | add),
        read: (map(.read) | add), output: (map(.output) | add),
        weighted: (map(.weighted) | add | floor),
        weighted_fork: (map(select(.fork) | .weighted) | add // 0 | floor) })
        | sort_by(-.weighted)) }'
REMOTE
)