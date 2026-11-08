#!/usr/bin/env bash
######################################################################
# .what = read each crew's token burn, cost-weighted, on every grove —
#         and calibrate the account pool's cap % into tokens
#
# .why  = "how many crews can we afford" has a token half, and the
#         meter before this one could not answer it:
#           - it globbed ~/.claude only, so it was blind to every crew
#             whose seats run from a worktree's actor dir — most of them
#           - it carried no cost weight and no % of cap
#           - it died with EPIPE under `| head`
#         this verb reads every claude config dir on each grove, groups
#         seats into crews by worktree, tags each crew by kind, weighs
#         the burn by api price ratio, and turns the statusline cap
#         ledger into tokens-per-% for the pool of accounts (F2, F8)
#
# usage:
#   rhx git.crew.tokens                         # every grove + local, last 180 min
#   rhx git.crew.tokens <grove>                 # one grove (or `local`)
#   rhx git.crew.tokens --window 60             # a shorter window, in minutes
#   rhx git.crew.tokens --since <iso> --until <iso>
#   rhx git.crew.tokens --json                  # records, for a tick
#   rhx git.crew.tokens calibrate               # tokens-per-% per cap window, pooled
#   rhx git.crew.tokens calibrate --json
#
# args:
#   <grove>      a registered grove name, or `local`; also `--grove <grove>`
#   --window     burn window, in minutes back from now (default: 180)
#   --since      burn from this utc instant, in place of --window
#   --until      burn up to this utc instant (default: now)
#   --span-5h    calibrate: minutes between the two 5h cap reads (default: 120)
#   --span-7d    calibrate: minutes between the two 7d cap reads (default: 1440)
#   --timeout    seconds to wait per grove (default: 90)
#   --json       emit one json record in place of the tree
#
# .the parts, each named once in a lib this verb sources
#   work/grovework.sh   the grove fan-out, the result ladder, the crew kind (F11)
#   work/tokenwork.sh   the cost weight (F3) and the render defs
#   work/capwork.sh     the cap ledger contract and the calibration math (F2, F8)
#
# guarantee:
#   - read-only: reads transcripts, cap ledgers, and .claude.json; writes no file
#   - usage is deduped per api message id (one call spans many lines)
#   - an asleep or slow grove is reported, never fatal to the sweep
#   - an unreadable transcript, or a .claude.json that does not parse, is
#     named, and the total marked a lower bound
#   - a span under one minute is refused: a rate per hour needs a span
#   - a record that did not build is a malfunction, never an empty answer
#   - a closed stdout (`| head`) exits 0, with no broken-pipe trace
#   - exit 0 = read, 1 = malfunction or a grove you named could not be
#     read, 2 = constraint
######################################################################
set -uo pipefail

# a reader that closes stdout early ends the read quietly, never as a fault
trap 'exit 0' PIPE

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# every git.crew.* verb sources crewwork, the crew layer (work.surface.layout [case3]);
# it is sourced first, so the libs below own every name this verb calls
# shellcheck source=work/crewwork.sh
source "$SKILL_DIR/work/crewwork.sh"
# shellcheck source=work/tokenwork.sh
source "$SKILL_DIR/work/tokenwork.sh"
# shellcheck source=work/grovework.sh
source "$SKILL_DIR/work/grovework.sh"
# shellcheck source=work/capwork.sh
source "$SKILL_DIR/work/capwork.sh"
# shellcheck source=work/tokenwork.probe.sh
source "$SKILL_DIR/work/tokenwork.probe.sh"

MODE="read"
ONLY=""
WINDOW_MIN=180
SINCE_AT=""
UNTIL_AT=""
SPAN_5H_MIN=120
SPAN_7D_MIN=1440
TIMEOUT=90
AS_JSON=false

print_help() {
  cat <<'HELP'
🌲 git.crew.tokens — each crew's token burn, cost-weighted, on every grove

usage:
  rhx git.crew.tokens                         every grove + local, last 180 min
  rhx git.crew.tokens <grove>                 one grove (or `local`)
  rhx git.crew.tokens --window 60             a shorter window, in minutes
  rhx git.crew.tokens --since <iso> --until <iso>
                                              the burn between two utc instants
  rhx git.crew.tokens --json                  one json record in place of the tree, for a tick
  rhx git.crew.tokens calibrate               what 1% of each cap costs, in tokens
  rhx git.crew.tokens calibrate --json        the same, as one json record, for a tick

inputs:
  calibrate          read the cap ledger: weighted tokens per 1% of the 5h and
                     the 7d cap, over every account's reads at once
  <grove> | --grove  a registered grove, or `local`        (default: all + local)
  --window           burn window, minutes back from now    (default: 180)
  --since, --until   burn span, two utc instants           (default: the window)
                     the span between them must be 1 min or more
  --span-5h          calibrate: minutes between 5h reads   (default: 120)
  --span-7d          calibrate: minutes between 7d reads   (default: 1440)
  --timeout          seconds per grove                     (default: 90)
  --json             one json record in place of the tree, for a tick

example:
  rhx git.crew.tokens local --window 60
HELP
}

# .what = refuse a flag whose value is absent, before `$2` is read under `set -u`
need_value() {
  [[ $# -ge 2 && "$2" != --* ]] || {
    echo "✋ ConstraintError: $1 needs a value" >&2
    echo "   └─ see: rhx git.crew.tokens --help" >&2
    exit 2
  }
}

while [[ $# -gt 0 ]]; do
  case $1 in
    # rhachet passes these; ignore them
    --skill|--repo|--role) shift 2 ;;
    calibrate) MODE="calibrate"; shift ;;
    --grove) need_value "$@"; ONLY="$2"; shift 2 ;;
    --window) need_value "$@"; WINDOW_MIN="$2"; shift 2 ;;
    --since) need_value "$@"; SINCE_AT="$2"; shift 2 ;;
    --until) need_value "$@"; UNTIL_AT="$2"; shift 2 ;;
    --span-5h) need_value "$@"; SPAN_5H_MIN="$2"; shift 2 ;;
    --span-7d) need_value "$@"; SPAN_7D_MIN="$2"; shift 2 ;;
    --timeout) need_value "$@"; TIMEOUT="$2"; shift 2 ;;
    --json) AS_JSON=true; shift ;;
    --help|-h) print_help; exit 0 ;;
    # fail loud — never shift an unknown flag away (rule.forbid.failhide)
    -*)
      echo "✋ ConstraintError: unknown flag '$1'" >&2
      echo "   ├─ known subcommands" >&2
      echo "   │  └─ calibrate" >&2
      echo "   ├─ known flags" >&2
      printf '   │  %s\n' '├─ --grove' '├─ --window' '├─ --since' '├─ --until' '├─ --span-5h' \
        '├─ --span-7d' '├─ --timeout' '├─ --json' '└─ --help' >&2
      echo "   └─ see: rhx git.crew.tokens --help" >&2
      exit 2 ;;
    *)
      [[ -z "$ONLY" ]] || {
        echo "✋ ConstraintError: one grove per read — got '$ONLY' and '$1'" >&2
        echo "   └─ read every grove at once: rhx git.crew.tokens" >&2
        exit 2
      }
      ONLY="$1"; shift ;;
  esac
done

# fail fast on a non-numeric bound
for pair in "window:$WINDOW_MIN" "span-5h:$SPAN_5H_MIN" "span-7d:$SPAN_7D_MIN" "timeout:$TIMEOUT"; do
  [[ "${pair#*:}" =~ ^[0-9]+$ ]] || { echo "✋ ConstraintError: --${pair%%:*} must be a whole number, got '${pair#*:}'" >&2; exit 2; }
done
# a span of 0 minutes would divide a burn rate by zero, and `timeout 0` disables the bound so one
# hung grove would freeze the read; refuse each before any probe runs
for pair in "window:$WINDOW_MIN" "span-5h:$SPAN_5H_MIN" "span-7d:$SPAN_7D_MIN"; do
  (( ${pair#*:} >= 1 )) || { echo "✋ ConstraintError: --${pair%%:*} must be at least 1 minute, got '${pair#*:}'" >&2; exit 2; }
done
(( TIMEOUT >= 1 )) || { echo "✋ ConstraintError: --timeout must be at least 1 second, got '$TIMEOUT'" >&2; exit 2; }
command -v jq >/dev/null || { echo "💥 MalfunctionError: jq is absent on this box; install it, then re-run: sudo apt-get install -y jq" >&2; exit 1; }

# the burn span: --since/--until when given, else the last --window minutes
NOW_EPOCH=$(date -u +%s)
SINCE_EPOCH=$((NOW_EPOCH - WINDOW_MIN * 60))
UNTIL_EPOCH=$NOW_EPOCH
if [[ -n "$SINCE_AT" ]]; then
  SINCE_EPOCH=$(date -u -d "$SINCE_AT" +%s 2>/dev/null) || { echo "✋ ConstraintError: --since is not a readable instant: '$SINCE_AT'" >&2; exit 2; }
fi
if [[ -n "$UNTIL_AT" ]]; then
  UNTIL_EPOCH=$(date -u -d "$UNTIL_AT" +%s 2>/dev/null) || { echo "✋ ConstraintError: --until is not a readable instant: '$UNTIL_AT'" >&2; exit 2; }
fi
(( SINCE_EPOCH < UNTIL_EPOCH )) || { echo "✋ ConstraintError: the span is empty — --since must precede --until (and now)" >&2; exit 2; }
# a rate per hour over a span of 0 whole minutes divides by zero; refuse it up front
(( UNTIL_EPOCH - SINCE_EPOCH >= 60 )) || { echo "✋ ConstraintError: the span is under one minute — a burn rate needs ≥ 1 min between --since and --until" >&2; exit 2; }
# a span that begins in the future holds no transcript yet, and its burn would read 0: an idle fleet
(( SINCE_EPOCH <= NOW_EPOCH )) || { echo "✋ ConstraintError: --since is in the future ('$SINCE_AT'); a burn can only be read over time already past" >&2; exit 2; }
SINCE=$(date -u -d "@$SINCE_EPOCH" +%Y-%m-%dT%H:%M:%S)
UNTIL=$(date -u -d "@$UNTIL_EPOCH" +%Y-%m-%dT%H:%M:%S)
SPAN_MIN=$(( (UNTIL_EPOCH - SINCE_EPOCH) / 60 ))
FIND_MIN=$(( (NOW_EPOCH - SINCE_EPOCH) / 60 + 1 ))

######################################################################
# the probe — TOKENWORK_PROBE, the one communicator (work/tokenwork.probe.sh)
######################################################################

grovework_select "$ONLY"

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# .what = run the probe on every grove for one span
run_probes() {
  local payload
  payload="$(grovework_payload_lib)
$(tokenwork_payload_lib)
$(capwork_payload_lib)
export TOK_SINCE='$1' TOK_UNTIL='$2' TOK_FIND_MIN='$3'
$TOKENWORK_PROBE"
  grovework_fanout "$payload" "$TIMEOUT" "$WORK"
}

# .what = fold every probe result into one forest record
# .why  = the render, --json, and calibrate all read one shape
get_forest_record() {
  local rows
  rows=$(grovework_rows "$WORK" "$TIMEOUT" "rhx git.crew.tokens") || exit 1
  jq -c --arg since "$1" --arg until "$2" --argjson spanMin "$3" \
    "$TOKENWORK_JQ_FOREST"' forest_record($since; $until; $spanMin)' <<<"$rows"
}

# .what = a record that did not build is a malfunction, never an empty answer
assert_record() {
  [[ -n "$2" ]] || { echo "💥 MalfunctionError: the $1 record did not build" >&2; exit 1; }
}

######################################################################
# calibrate — the pool's tokens per %, per cap window (capwork)
#
# .what = its own operation: read the cap rows, pair them per window, read
#         the fleet burn between each pair, judge it, then price the headroom
######################################################################
run_calibrate() {
  # first read: the cap rows from every grove, and no transcript (a find window of 0)
  # .note = the cap rows need no transcript; a scan here would cost the grove 8 days of reads for naught
  run_probes "$(date -u -d "@$NOW_EPOCH" +%Y-%m-%dT%H:%M:%S)" "$(date -u -d "@$NOW_EPOCH" +%Y-%m-%dT%H:%M:%S)" 0
  FOREST=$(get_forest_record "" "" 1)
  assert_record "cap" "$FOREST"
  CAPS=$(jq -c '[.groves[] | select(.record) | .record.caps[]] | unique' <<<"$FOREST")
  PAIRS=$(jq -c --argjson span5 "$SPAN_5H_MIN" --argjson span7 "$SPAN_7D_MIN" \
    "$CAPWORK_JQ_DEFS$CAPWORK_JQ_CALIBRATE"' cappairs($span5; $span7)' <<<"$CAPS")
  assert_record "cap pair" "$PAIRS"

  # second read: the fleet burn between each window's pair, then its verdict
  WINDOWS="[]"
  for w in five_hour seven_day; do
    pair=$(jq -c --arg w "$w" '.[] | select(.window == $w)' <<<"$PAIRS")
    t1=$(jq -r '.t1 // empty' <<<"$pair")
    t2=$(jq -r '.t2 // empty' <<<"$pair")
    burn="null"; burned_accounts="[]"
    if [[ -n "$t1" && -n "$t2" ]]; then
      t1e=$(date -u -d "$t1" +%s); t2e=$(date -u -d "$t2" +%s)
      run_probes "$(date -u -d "@$t1e" +%Y-%m-%dT%H:%M:%S)" "$(date -u -d "@$t2e" +%Y-%m-%dT%H:%M:%S)" "$(( (NOW_EPOCH - t1e) / 60 + 1 ))"
      span=$(get_forest_record "$t1" "$t2" "$(( (t2e - t1e) / 60 ))")
      assert_record "span burn" "$span"
      burn=$(jq -c "$CAPWORK_JQ_CALIBRATE"' calburn' <<<"$span")
      burned_accounts=$(jq -c "$CAPWORK_JQ_CALIBRATE"' calburned' <<<"$span")
    fi
    WINDOWS=$(jq -c --argjson pair "$pair" --argjson burn "$burn" --argjson burned "$burned_accounts" \
      "$CAPWORK_JQ_DEFS$CAPWORK_JQ_CALIBRATE"' . + [ $pair | calverdict($burn; $burned) ]' <<<"$WINDOWS")
    assert_record "calibration window" "$WINDOWS"
  done

  # the pool headroom now: per account, the latest read, as a sustainable burn rate
  LATEST=$(jq -c "$CAPWORK_JQ_DEFS$CAPWORK_JQ_CALIBRATE"' caplatest' <<<"$CAPS")
  RECORD=$(jq -n -c --argjson windows "$WINDOWS" --argjson latest "$LATEST" --argjson now "$NOW_EPOCH" \
    "$CAPWORK_JQ_DEFS$CAPWORK_JQ_CALIBRATE"' { windows: ($windows | map(calpool($latest; $now))), latest: $latest }')
  assert_record "calibration" "$RECORD"

  if [[ "$AS_JSON" == "true" ]]; then
    echo "$RECORD"
    exit 0
  fi
  jq -r "$TOKENWORK_JQ_DEFS"'
    "🌲 crew tokens · calibrate (pool of \(.latest | length) accounts with a cap read)",
    ( .windows | length as $len | to_entries[] | .key as $i | .value as $w
      | (if $i == $len - 1 then "   └─ " else "   ├─ " end) + "\($w.window): "
        + (if $w.verdict.state == "calibrated"
           then "\(mtok($w.verdict.tokens_per_pct)) weighted per % · rose \($w.rise_pct)% over \($w.span_min) min against \(mtok($w.burn.weighted)) · pool sustains \(mtok($w.pool.sustainable_per_hour))/h"
           else "⚪ uncalibrated — \($w.verdict.why)" end) )
  ' <<<"$RECORD" || { rc=$?; [[ $rc -eq 141 ]] && exit 0; exit "$rc"; }
  exit 0
}

######################################################################
# read — each crew's burn over the span
######################################################################
run_read() {
run_probes "$SINCE" "$UNTIL" "$FIND_MIN"
FOREST=$(get_forest_record "$SINCE" "$UNTIL" "$SPAN_MIN")
assert_record "forest" "$FOREST"

# a grove the caller named, left unread, is a malfunction of this read
EXIT_CODE=0
if [[ -n "$ONLY" ]] && [[ "$(jq -r '.unreached | length' <<<"$FOREST")" != "0" ]]; then
  EXIT_CODE=1
fi

if [[ "$AS_JSON" == "true" ]]; then
  echo "$FOREST"
  exit "$EXIT_CODE"
fi

jq -r "$TOKENWORK_JQ_DEFS"'
  def hours: (.span_min / 60);
  # .what = why a partial read is partial, in one clause
  # .why  = a crew whose transcript went unread is no absent crew: a row that saw no burn on a
  #         partial read names the cause, never `0 crews` or `no crew burned` (term=false-report)
  def partcause($unread; $unreached):
    if ($unread | length) > 0 then "\(many($unread | length; "transcript")) unread"
    else "unreached: \($unreached | join(", "))" end;
  # .what = the header clause that points to where a partial read lost its burn
  # .why  = the header names the true cause, so it never points to a row that does not exist
  def hdrcause($unread; $unreached):
    if ($unread | length) > 0 and ($unreached | length) > 0 then "see unread and unreached"
    elif ($unread | length) > 0 then "see unread"
    else "see unreached" end;
  . as $f
  | "🌲 crew tokens over \(.span_min) min (cost-weighted\(if .partial then "; a LOWER BOUND — \(hdrcause(.unread // []; .unreached // []))" else "" end))",
    "   ├─ fleet: " + (if .read and .partial and (.fleet.weighted // 0) == 0 then "⚪ unread as a fleet sum — no burn could be read; see each grove row below"
                      elif .read then "\(mtok(.fleet.weighted)) · \(mtok(.fleet.weighted_per_hour))/h"
                      else "⚪ unread — no grove answered (\(.unreached | join(", ")))" end),
    "   ├─ per crew-hour, by kind",
    ( $f.read as $read | .fleet.by_kind | to_entries | length as $len | to_entries[] | .key as $i | .value
      | (if $i == $len - 1 then "   │  └─ " else "   │  ├─ " end)
        + "\(.key): " + (if ($read | not) then "⚪ unread"
          elif .value.crews == 0 and $f.partial then "⚪ unread — \(partcause($f.unread // []; $f.unreached // []))"
          elif .value.crews == 0 then "⚪ no crew of this kind burned in the span"
          else "\(mtok(.value.weighted_per_crew_hour)) over \(many(.value.crews; "crew"))" end) ),
    ( .groves | length as $len | to_entries[] | .key as $gi | .value as $g
      | ($gi == $len - 1) as $lastg
      | (if $lastg then "   └─ " else "   ├─ " end) + "\(grovelabel($g.grove)): "
        + (if $g.state == "read" and ($g.record.crews | length) == 0 and ($g.record.unread | length) > 0
           then "⚪ unread — \(partcause($g.record.unread; [])) · \(many($g.record.config_dirs; "config dir"))"
           elif $g.state == "read"
           then "\(mtok([$g.record.crews[].weighted] | add)) over \(many($g.record.crews | length; "crew")) · \(many($g.record.config_dirs; "config dir"))"
             + (if ($g.record.unread | length) > 0 then " · ⚠️ \($g.record.unread | length) unread" else "" end)
           elif $g.state == "asleep" then "💤 asleep — \($g.hint)"
           elif $g.state == "timeout" then "⏳ timeout — \($g.hint)"
           else "💥 unreadable — \($g.hint)" end),
        ( if $g.state == "read" then
            ( $g.record.crews | length as $clen | to_entries[] | .key as $ci | .value
              | (if $lastg then "      " else "   │  " end)
                + (if $ci == $clen - 1 and ($g.record.unread | length) == 0 then "└─ " else "├─ " end)
                + "\(.crew | split("/") | last) [\(.kind)]: \(mtok(.weighted)) (\(mtok(.weighted / ($f | hours)))/h)"
                + " · \(many(.seats; "seat")) · forks \(mtok(.weighted_fork)) · \(.accounts | join(", "))" ),
            ( $g.record.unread | length as $ulen | to_entries[] | .key as $ui | .value
              | (if $lastg then "      " else "   │  " end)
                + (if $ui == $ulen - 1 then "└─ " else "├─ " end) + "⚠️ unread: \(.)" )
          else empty end ) )
' <<<"$FOREST" || { rc=$?; [[ $rc -eq 141 ]] && exit 0; exit "$rc"; }
exit "$EXIT_CODE"
}

# the verb: one operation per mode
[[ "$MODE" == "calibrate" ]] && run_calibrate
run_read
