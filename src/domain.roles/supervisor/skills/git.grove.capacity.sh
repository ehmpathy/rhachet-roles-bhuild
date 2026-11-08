#!/usr/bin/env bash
######################################################################
# .what = how many crews of each kind fit on each grove, which limit
#         binds, and which levers would raise it
#
# .why  = "can we run more?" got a guess, because the fleet's walls
#         were read by verbs that knew naught of each other: grove
#         health in one, token burn in none. a lever was then argued on
#         taste — and a lever only pays on the axis that binds. the
#         largest token cut on record buys zero crews on a grove where
#         cpu binds. this verb reads all four limits at once:
#
#           limit.ram        = (ram usable − reserve) / ram per crew
#           limit.cpu        = (cpus − what the box spends outside every crew)
#                              / cores per crew at work — an ESTIMATE, capped at
#                              the crews at work once the cpu stall reads 🟡+
#           free.cpu         = (cpus − what the whole box spends) / cores per crew,
#                              and 0 while the cpu stall reads 🔴 at 10% or more
#                              on its minute (psi some avg60) or its life (since
#                              boot): a stalled box takes no sprout
#           free.ram         = (ram free − reserve) / ram per crew, and 0 while
#                              the ram full stall (psi full avg60) is above 0, or
#                              the ram life stall (psi some since boot) reads 5%+
#           limit.tokens_5h  = pool burn the 5h caps sustain / burn per crew-hour
#           limit.tokens_7d  = pool burn the 7d caps sustain / burn per crew-hour
#           affordable       = min(all four), and the one that binds
#
#         the token limits are fleet-wide (the pool of accounts spans
#         every grove, F8); the grove limits are per grove
#
# usage:
#   rhx git.grove.capacity                          # every grove + local
#   rhx git.grove.capacity <grove>                  # one grove (or `local`)
#   rhx git.grove.capacity --grove <g> --for behavior
#                                                   # the sprout gate: a slot, or exit 2
#   rhx git.grove.capacity --grove <g> --for behavior --key <branch>
#                                                   # the same, findsert: a retry keeps one hold
#   rhx git.grove.capacity --release <hold>         # drop a hold once its sprout booted
#   rhx git.grove.capacity --levers                 # levers ranked by gain in crews
#   rhx git.grove.capacity --json                   # records, for a tick
#
# args:
#   <grove>      a registered grove name, or `local`; also `--grove <g>`
#   --for        the sprout gate, for one kind: behavior | directive
#   --key        the gate's hold key (the sprout's branch, say); a repeat ask with
#                one key keeps one hold
#   --release    drop the named hold (the id a grant printed)
#   --levers     rank the levers in git.grove.capacity.levers.jsonc per grove
#   --window     burn window for the per-crew-hour cost, minutes (default: 180)
#   --sample     cpu sample, seconds (default: 15)
#   --timeout    seconds to wait per grove; the token scan gets 3× (default: 90)
#   --json       emit one json record in place of the tree
#
# .the costs, per crew, read live
#   ram   = the median rss of the crews of that kind on the grove (rss
#           counts shared pages per process, so it overstates — the
#           count errs low, never high)
#   cpu   = the median cores of the crews of that kind AT WORK in the
#           sample (≥ 0.25 cores); idle crews spend ~0 and say naught
#   tokens = the fleet's weighted burn per crew-hour of that kind, from
#           `git.crew.tokens`, over --window
#   a kind with no crew on a grove borrows the median of all its crews,
#   and says so; a grove with no crew at all reads ⚪, and gives one
#   first-crew slot (unless a stall reads 🔴) so its first sprout can boot
#
# .the order of the reads
#   the cpu sample runs first and alone; the token scans run after it
#   ends. a scan forks hard on a loaded box, so a sample that overlapped
#   one would measure this verb's own load and deny the sprout it caused
#
# .the gate
#   free slots = min over the axes of what the grove has left now, less
#   every live hold. a grant writes a hold under a lock, so two asks for
#   the last slot cannot both win; a hold lapses after 15 min, or
#   on --release. holds live under ~/.rhachet/storage, never in a repo
#   (rule.forbid.timestamps-in-tracked-files: a hold's clock is its mtime)
#
# .the parts, each named once in a lib this verb sources
#   work/grovework.sh       the grove fan-out, the result ladder, the crew kind (F11)
#   work/capacitywork.sh    the model: each limit, the free slots, each lever's gain
#   work/capacitywork.probe.sh  the payload that reads one grove's /proc
#   work/tokenwork.sh       the render defs
#
# guarantee:
#   - read-only, except a gate grant writes one hold file
#   - an unread grove yields no slot, never a guess
#   - an uncalibrated cap yields ⚪, never a number; the count it would
#     bound is marked an upper bound
#   - a token read that fails is a malfunction, never a quiet ⚪
#   - a grant is reported only once its hold is on disk
#   - a lever is ranked only with 2+ reads of its cost; fewer reads list
#     it unranked, none lists it unmeasured
#   - a closed stdout (`| head`) exits 0
#   - exit 0 = read or granted, 1 = malfunction, 2 = constraint or no slot
######################################################################
set -uo pipefail

trap 'exit 0' PIPE

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATH_TOKENS="$SKILL_DIR/git.crew.tokens.sh"
PATH_LEVERS="$SKILL_DIR/git.grove.capacity.levers.jsonc"
# shellcheck source=work/tokenwork.sh
source "$SKILL_DIR/work/tokenwork.sh"
# shellcheck source=work/grovework.sh
source "$SKILL_DIR/work/grovework.sh"
# shellcheck source=work/capacitywork.sh
source "$SKILL_DIR/work/capacitywork.sh"
# shellcheck source=work/capacitywork.probe.sh
source "$SKILL_DIR/work/capacitywork.probe.sh"

ONLY=""
FOR_KIND=""
HOLD_KEY=""
RELEASE=""
LEVERS=false
WINDOW_MIN=180
SAMPLE_SEC=15
HOLD_MIN=15
TIMEOUT=90
AS_JSON=false

print_help() {
  cat <<'HELP'
🌲 git.grove.capacity — how many crews fit, which limit binds, which levers raise it

usage:
  rhx git.grove.capacity                          every grove + local
  rhx git.grove.capacity <grove>                  one grove (or `local`)
  rhx git.grove.capacity --grove <g> --for behavior
                                                  the sprout gate: a slot, or exit 2
  rhx git.grove.capacity --release <hold>         drop a hold once its sprout booted
  rhx git.grove.capacity --levers                 levers ranked by gain in crews
  rhx git.grove.capacity --json                   one json record in place of the tree, for a tick

inputs:
  <grove> | --grove   a registered grove, or `local`          (default: all + local)
                      a grove name is bare, or cloud://<name>
  --for               behavior | directive: the sprout gate, on one grove
                      no slot while the box is stalled:
                      cpu: tasks wait on cpu 10%+ of the time, over the
                           last minute or on average since the box booted
                      ram: every task stalls on ram at all in the last
                           minute, or some task waits on ram 5%+ of the
                           time on average since the box booted
                      an empty grove gives one first-crew slot
                      see: rule.require.bound-grove-concurrency-by-saturation, at
                      .agent/repo=bhuild/role=supervisor/briefs/grove/rule.require.bound-grove-concurrency-by-saturation.md
  --key               the gate's hold key, e.g. the branch
                      a retry whose hold stands is granted at once
  --release           a hold id a grant printed
  --levers            rank the levers per grove
  --window            burn window for the token cost, minutes (default: 180)
  --sample            cpu sample, seconds                     (default: 15)
  --timeout           seconds per grove; token scans get 3×   (default: 90)
  --json              one json record in place of the tree, for a tick

example:
  rhx git.grove.capacity --grove local --for behavior --key beav/feat-surf-forecast
HELP
}

# .what = refuse a flag whose value is absent, before `$2` is read under `set -u`
need_value() {
  [[ $# -ge 2 && "$2" != --* ]] || {
    echo "✋ ConstraintError: $1 needs a value" >&2
    echo "   └─ see: rhx git.grove.capacity --help" >&2
    exit 2
  }
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --skill|--repo|--role) shift 2 ;;
    --grove) need_value "$@"; ONLY="$2"; shift 2 ;;
    --for) need_value "$@"; FOR_KIND="$2"; shift 2 ;;
    --key) need_value "$@"; HOLD_KEY="$2"; shift 2 ;;
    --release) need_value "$@"; RELEASE="$2"; shift 2 ;;
    --levers) LEVERS=true; shift ;;
    --window) need_value "$@"; WINDOW_MIN="$2"; shift 2 ;;
    --sample) need_value "$@"; SAMPLE_SEC="$2"; shift 2 ;;
    --timeout) need_value "$@"; TIMEOUT="$2"; shift 2 ;;
    --json) AS_JSON=true; shift ;;
    --help|-h) print_help; exit 0 ;;
    -*)
      echo "✋ ConstraintError: unknown flag '$1'" >&2
      echo "   ├─ known flags" >&2
      printf '   │  %s\n' '├─ --grove' '├─ --for' '├─ --key' '├─ --release' '├─ --levers' \
        '├─ --window' '├─ --sample' '├─ --timeout' '├─ --json' '└─ --help' >&2
      echo "   └─ see: rhx git.grove.capacity --help" >&2
      exit 2 ;;
    *)
      [[ -z "$ONLY" ]] || {
        echo "✋ ConstraintError: one grove per read — got '$ONLY' and '$1'" >&2
        echo "   └─ read every grove at once: rhx git.grove.capacity" >&2
        exit 2
      }
      ONLY="$1"; shift ;;
  esac
done

for pair in "window:$WINDOW_MIN" "sample:$SAMPLE_SEC" "timeout:$TIMEOUT"; do
  [[ "${pair#*:}" =~ ^[0-9]+$ ]] || { echo "✋ ConstraintError: --${pair%%:*} must be a whole number, got '${pair#*:}'" >&2; exit 2; }
  # .note = `timeout 0` disables the bound, so one hung grove would freeze the read; a 0 sample
  #         or window measures naught
  (( ${pair#*:} >= 1 )) || { echo "✋ ConstraintError: --${pair%%:*} must be at least 1, got '${pair#*:}'" >&2; exit 2; }
done
(( SAMPLE_SEC < TIMEOUT )) || { echo "✋ ConstraintError: --sample ($SAMPLE_SEC s) must be shorter than --timeout ($TIMEOUT s), or every grove reads timeout" >&2; exit 2; }
command -v jq >/dev/null || { echo "💥 MalfunctionError: jq is absent on this box; install it, then re-run: sudo apt-get install -y jq" >&2; exit 1; }

HOLD_DIR="$HOME/.rhachet/storage/repo=bhuild/role=supervisor/git.grove.capacity/holds"

# the release: drop one hold, idempotent
if [[ -n "$RELEASE" ]]; then
  [[ "$RELEASE" =~ ^[A-Za-z0-9._@+-]+$ ]] || { echo "✋ ConstraintError: --release takes a hold id, got '$RELEASE'" >&2; exit 2; }
  if [[ -f "$HOLD_DIR/$RELEASE.hold" ]]; then
    rm -f "$HOLD_DIR/$RELEASE.hold" || { echo "💥 MalfunctionError: the hold could not be dropped: $HOLD_DIR/$RELEASE.hold" >&2; exit 1; }
    echo "🌲 grove capacity · release"
    echo "   └─ dropped hold $RELEASE"
  else
    echo "🌲 grove capacity · release"
    echo "   └─ no hold $RELEASE (lapsed, or already dropped)"
  fi
  exit 0
fi

if [[ -n "$FOR_KIND" ]]; then
  [[ "$FOR_KIND" == "behavior" || "$FOR_KIND" == "directive" ]] || {
    echo "✋ ConstraintError: --for takes behavior or directive, got '$FOR_KIND'" >&2
    exit 2
  }
  [[ -n "$ONLY" ]] || {
    echo "✋ ConstraintError: the gate needs one grove — the slot is a grove's to give" >&2
    echo "   └─ e.g.: rhx git.grove.capacity --grove local --for $FOR_KIND" >&2
    exit 2
  }
fi
[[ -z "$HOLD_KEY" || -n "$FOR_KIND" ]] || { echo "✋ ConstraintError: --key names a gate hold, so it needs --for" >&2; exit 2; }
[[ -z "$HOLD_KEY" || "$HOLD_KEY" =~ ^[A-Za-z0-9._/@-]+$ ]] || { echo "✋ ConstraintError: --key takes letters, digits, and . _ / @ -, got '$HOLD_KEY'" >&2; exit 2; }

######################################################################
# the probe — CAPACITYWORK_PROBE, the one communicator (work/capacitywork.probe.sh)
######################################################################

grovework_select "$ONLY"
ONLY="${ONLY#cloud://}"
ONLY="${ONLY#house://}"

# .what = a keyed retry whose hold still stands is granted at once, before any probe
# .why  = its own booted sprout may now stall the box, or the grove may time out; a refusal there
#         would tell the caller to seed a wish whose sprout already runs. a findsert returns the
#         extant, so the retry reads naught but the hold store
if [[ -n "$FOR_KIND" && -n "$HOLD_KEY" ]]; then
  KEYED_ID="${GROVES[0]//[^A-Za-z0-9.-]/_}.${FOR_KIND}.${HOLD_KEY//\//+}"
  mkdir -p "$HOLD_DIR" || { echo "💥 MalfunctionError: the hold dir could not be made: $HOLD_DIR" >&2; exit 1; }
  exec 9> "$HOLD_DIR/.lock" || { echo "💥 MalfunctionError: the hold lock could not be opened: $HOLD_DIR/.lock" >&2; exit 1; }
  flock -w 30 9 || { echo "💥 MalfunctionError: the hold lock did not free inside 30s: $HOLD_DIR/.lock" >&2; exit 1; }
  find "$HOLD_DIR" -maxdepth 1 -name '*.hold' -mmin "+$HOLD_MIN" -delete \
    || { echo "💥 MalfunctionError: lapsed holds could not be dropped: $HOLD_DIR" >&2; exit 1; }
  if [[ -f "$HOLD_DIR/$KEYED_ID.hold" ]]; then
    touch "$HOLD_DIR/$KEYED_ID.hold" || { echo "💥 MalfunctionError: the hold could not be renewed: $HOLD_DIR/$KEYED_ID.hold" >&2; exit 1; }
    flock -u 9
    if [[ "$AS_JSON" == "true" ]]; then
      jq -n -c --arg grove "$ONLY" --arg kind "$FOR_KIND" --arg hold "$KEYED_ID" \
        '{grove: $grove, kind: $kind, granted: true, free: null, held_before: null, binds: null,
          hold: $hold, reheld: true, borrowed: false, unread_axes: [], cpu_stall: null, ram_stall: null, idle: []}'
    else
      echo "🌲 grove capacity · gate"
      echo "   ├─ ✅ a $FOR_KIND slot on $ONLY — the hold this key already took, renewed (no probe: a findsert returns the extant)"
      echo "   └─ held as $KEYED_ID for $HOLD_MIN min"
      echo "      └─ drop it once the sprout boots: rhx git.grove.capacity --release $KEYED_ID"
    fi
    exit 0
  fi
  flock -u 9
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# the grove half first, and alone: the cpu sample must not overlap a token scan
PAYLOAD="$(grovework_payload_lib)
export CAP_SAMPLE='$SAMPLE_SEC'
$CAPACITYWORK_PROBE"
# .note = GIT_GROVE_CAPACITY_FIXTURE_RECORD names a probe record to read in place of local's
#         /proc: the model and the gate then run on a box whose numbers a test controls. the
#         live probe is clamped by the cases that read the real box
# .what = one grove sample: a row per grove, from its own fan-out dir
read_grove_rows() {
  local dir="$1"
  if [[ -n "${GIT_GROVE_CAPACITY_FIXTURE_RECORD:-}" && "${GROVES[*]}" == "local" ]]; then
    jq -c -s '[{grove: "local", state: "read", hint: null, record: .[0]}]' "$GIT_GROVE_CAPACITY_FIXTURE_RECORD" \
      || { echo "💥 MalfunctionError: the fixture record does not parse: $GIT_GROVE_CAPACITY_FIXTURE_RECORD" >&2; return 1; }
    return 0
  fi
  mkdir -p "$dir" || { echo "💥 MalfunctionError: the probe dir could not be made: $dir" >&2; return 1; }
  grovework_fanout "$PAYLOAD" "$TIMEOUT" "$dir"
  grovework_rows "$dir" "$TIMEOUT" "rhx git.grove.capacity"
}
ROWS=$(read_grove_rows "$WORK/probe.first") || exit 1

# .what = refuse the gate before the token scan where the grove half alone already says no
# .why  = an unread grove gives no verdict, and a 🔴 cpu stall frees no cpu slot whatever the
#         tokens say; the scan would only add load to a box that cannot take the sprout
gate_refuse_early() {
  local row state cpumark rammark cpuwhy ramwhy
  row=$(jq -c '.[0]' <<<"$ROWS")
  state=$(jq -r '.state' <<<"$row")
  # the marks come from the model's own stall defs, so the gate and the model grade one line one way.
  # each mark folds the minute and the life row; the why names the row that drove a 🔴
  if [[ "$state" == "read" ]]; then
    IFS=$'\t' read -r cpumark cpuwhy rammark ramwhy < <(jq -r --argjson tokens null --argjson cal null "$CAPACITYWORK_JQ_MODEL"'
      .record as $r | stall($r) as $c | ramstall($r) as $m
      | [ ($c.mark // "-"), cpustallwhy($c), ($m.mark // "-"), ramstallwhy($m) ] | @tsv' <<<"$row") \
      || { echo "💥 MalfunctionError: the stall grade did not read ($ONLY)" >&2; exit 1; }
  fi
  if [[ "$state" != "read" ]]; then
    if [[ "$AS_JSON" == "true" ]]; then
      jq -c --arg kind "$FOR_KIND" '{grove, kind: $kind, granted: false, why: "the grove is unread (\(.state))", hint}' <<<"$row"
    else
      label="grove $ONLY"; [[ "$ONLY" == grove* ]] && label="$ONLY"   # never `grove grove-…`
      echo "✋ ConstraintError: no slot — $label is unread ($state), so the gate gives no verdict" >&2
      echo "   └─ $(jq -r '.hint' <<<"$row")" >&2
    fi
    exit 2
  fi
  if [[ "$cpumark" == "🔴" ]]; then
    if [[ "$AS_JSON" == "true" ]]; then
      jq -n -c --arg grove "$ONLY" --arg kind "$FOR_KIND" --arg why "$cpuwhy" \
        '{grove: $grove, kind: $kind, granted: false, why: $why}'
    else
      echo "✋ ConstraintError: no $FOR_KIND slot on $ONLY" >&2
      echo "   ├─ $cpuwhy" >&2
      echo "   └─ read every grove's free slots, then sprout where one is free — or seed the wish for later" >&2
      echo "      ├─ rhx git.grove.capacity" >&2
      echo "      └─ rhx radio.task.push --via gh.issues --into <org/repo> --title '<title>' --description @stdin" >&2
    fi
    exit 2
  fi
  # a memory full stall above 0 means the box stopped outright: no sprout, whatever mem_avail reads
  if [[ "$rammark" == "🔴" ]]; then
    if [[ "$AS_JSON" == "true" ]]; then
      jq -n -c --arg grove "$ONLY" --arg kind "$FOR_KIND" --arg why "$ramwhy" \
        '{grove: $grove, kind: $kind, granted: false, why: $why}'
    else
      echo "✋ ConstraintError: no $FOR_KIND slot on $ONLY" >&2
      echo "   ├─ $ramwhy" >&2
      echo "   └─ read every grove's free slots, then sprout where one is free — or seed the wish for later" >&2
      echo "      ├─ rhx git.grove.capacity" >&2
      echo "      └─ rhx radio.task.push --via gh.issues --into <org/repo> --title '<title>' --description @stdin" >&2
    fi
    exit 2
  fi
}
[[ -n "$FOR_KIND" ]] && gate_refuse_early

# .what = the slots the live holds take from this ask, in slots of the asked kind
# .why  = a hold is a sprout not yet booted, so its cost is not yet in the live read. three
#         rules keep the count true:
#         - a hold names its box (host:port), never a registry name, so one box's holds are one set
#         - a token axis is fleet-wide (one pool of accounts), so where one binds, every hold counts
#         - a hold of the other kind counts at the exchange rate on the axis that binds (1 if unread)
# .note = either axis on a token pool makes the count fleet-wide: the limit's axis (BINDS) or the
#         axis that caps the free slots now (FREE_BINDS). a gate that scoped on one alone let a
#         second grove grant the last token slot a first grove held
# .in   = HOLD_DIR, HOLD_BOX, HOLD_MIN, BINDS, FREE_BINDS; KEYED_ID + REHELD (an ask's own hold is skipped)
# .what = the live holds this ask counts, one per line: id, kind, minutes before it lapses
# .note = the one filter the count and the refusal both read, so the two never name two sets
get_counted_holds() {
  local f hbox hkind fleet=false now mtime
  [[ "$BINDS" == tokens_* || "$FREE_BINDS" == tokens_* ]] && fleet=true
  now=$(date +%s)
  for f in "$HOLD_DIR"/*.hold; do
    [[ -f "$f" ]] || continue
    [[ "$REHELD" == "true" && "$f" == "$HOLD_DIR/$KEYED_ID.hold" ]] && continue
    hbox=$(awk -F= '$1 == "box" { print $2 }' "$f")
    hkind=$(awk -F= '$1 == "kind" { print $2 }' "$f")
    [[ "$fleet" == "true" || "$hbox" == "$HOLD_BOX" ]] || continue
    mtime=$(stat -c %Y "$f") || { echo "💥 MalfunctionError: the hold could not be read: $f" >&2; return 1; }
    printf '%s\t%s\t%s\n' "$(basename "$f" .hold)" "$hkind" "$(( HOLD_MIN - (now - mtime) / 60 ))"
  done
}

# .in   = HOLDS (get_counted_holds), FOR_KIND, GROVE_ROW
get_held_slots() {
  local hid hkind hleft same=0 other=0
  while IFS=$'\t' read -r hid hkind hleft; do
    [[ -n "$hid" ]] || continue
    if [[ "$hkind" == "$FOR_KIND" ]]; then same=$((same + 1)); else other=$((other + 1)); fi
  done <<<"$HOLDS"
  # a weight that did not compute would count every other-kind hold as 0 and over-grant
  # .note = the model defs read $tokens and $cal; the weight reads neither, so both bind null
  jq -n -r --argjson row "$GROVE_ROW" --arg k "$FOR_KIND" --argjson same "$same" --argjson other "$other" \
    --argjson tokens null --argjson cal null \
    "$CAPACITYWORK_JQ_MODEL"' held_slots($row.kinds; $k; $same; $other)' \
    || { echo "💥 MalfunctionError: the hold weight did not compute ($FOR_KIND on $ONLY)" >&2; return 1; }
}

# the token half, once the sample is done: the fleet burn per crew-hour, and the pool calibration
# .note = always the whole fleet: the pool of accounts spans every grove, so a token
#         limit read from one grove alone would overstate what the pool sustains
# .note = the token half scans transcripts, the grove half reads /proc: measured on a 4-cpu
#         grove at load 37–56, the scan took 135–227s while a grove probe took seconds. one
#         shared budget lost the token half on every default read, so it gets 3× the budget
# .note = the two token reads run one after the other, never at once: each is a fleet-wide
#         scan, and two at once on a loaded box contend for the same cpu the read measures
TOKENS_TIMEOUT=$((TIMEOUT * 3))
bash "$PATH_TOKENS" --window "$WINDOW_MIN" --timeout "$TOKENS_TIMEOUT" --json > "$WORK/tokens.json" 2> "$WORK/tokens.err"
echo $? > "$WORK/tokens.rc"
bash "$PATH_TOKENS" calibrate --timeout "$TOKENS_TIMEOUT" --json > "$WORK/cal.json" 2> "$WORK/cal.err"
echo $? > "$WORK/cal.rc"

# .what = one token read's record; a read that failed is a malfunction, never a quiet ⚪
# .note = a grove the token read could not reach is already a row in its record (state
#         timeout / asleep / unreadable), so a failed exit here means the verb itself broke
read_token_record() {
  local name="$1" rc record
  rc=$(cat "$WORK/$name.rc" 2>/dev/null || echo 1)
  if [[ "$rc" != "0" ]] || ! record=$(jq -c '.' "$WORK/$name.json" 2>/dev/null) || [[ -z "$record" ]]; then
    echo "💥 MalfunctionError: the token read failed ($name, exit $rc)" >&2
    echo "   └─ $(head -1 "$WORK/$name.err" 2>/dev/null || true)" >&2
    exit 1
  fi
  printf '%s\n' "$record"
}
TOKENS=$(read_token_record tokens) || exit 1
CAL=$(read_token_record cal) || exit 1

# .what = the gate grants on a grove sample taken AFTER the token scans, just before the lock
# .why  = the scans take minutes on a loaded box. inside them a crew can boot and release its
#         hold, its cost not yet in a sample taken before them, so the first sample would grant
#         a box fuller than it reads. the first sample still serves the early refusal
if [[ -n "$FOR_KIND" ]]; then
  ROWS=$(read_grove_rows "$WORK/probe.fresh") || exit 1
fi
# .note = the gate reads only the slots, never the levers: a fault in the levers table must not
#         turn every sprout gate into a malfunction
LEVER_ROWS='[]'
if [[ -z "$FOR_KIND" ]]; then
  LEVER_ROWS=$(jq -c '.levers' "$PATH_LEVERS") || { echo "💥 MalfunctionError: the levers table is unreadable: $PATH_LEVERS" >&2; exit 1; }
fi

######################################################################
# the model — per grove × kind: the costs, the four limits, the free slots,
# the exchange rate, and each lever's gain (work/capacitywork.sh)
######################################################################
MODEL=$(jq -n -c --argjson groves "$ROWS" --argjson tokens "$TOKENS" --argjson cal "$CAL" \
  --argjson levers "$LEVER_ROWS" --argjson windowMin "$WINDOW_MIN" "$CAPACITYWORK_JQ_MODEL"'
  { window_min: $windowMin,
    tokens: { read: tokread, partial: (($tokens // {}).partial // null),
              unread: (($tokens // {}).unread // []),
              unreached: [tokgroves[] | select(.state != "read") | {grove, state}],
              fleet_per_hour: fleetph,
              per_crew_hour: { behavior: burnph("behavior"), directive: burnph("directive") },
              five_hour: calwindow("five_hour"), seven_day: calwindow("seven_day") },
    groves: ($groves | map(. as $g
      | if $g.state != "read" then $g + {kinds: null} else
          ($g.record) as $r
          | idle_crews($r) as $idle
          | (["behavior", "directive"] | map(. as $k | costs($r; $k) as $c | { (.): ($c + limits($r; $c)) }) | add) as $kinds
          | $g + {
              crews_live: ($r.crews | length),
              crews_at_work: crewsatwork($r),
              seats_live: ([$r.crews[].seats] | add // 0),
              cpu_stall: stall($r),
              ram_stall: ramstall($r),
              idle: ($idle | map({crew: (.crew | split("/") | last), ram_gb: (.rss_kb / 1048576 * 100 | floor / 100)})),
              kinds: $kinds,
              exchange: exchange($kinds),
              levers: ranked($levers | map(. as $l
                | $l + { gain: lever_gain($r; $kinds.behavior; ([$idle[].rss_kb] | add // 0); $l),
                         binds: $kinds.behavior.binds,
                         rank: lever_rank($l) })) }
        end)) }')
MODEL_RC=$?

# a model that did not build is a malfunction, never an empty render with exit 0
if [[ "$MODEL_RC" != "0" || -z "$MODEL" ]]; then
  echo "💥 MalfunctionError: the capacity model did not build (jq exit $MODEL_RC)" >&2
  exit 1
fi

######################################################################
# the gate — a slot for one kind on one grove, held under a lock
######################################################################
if [[ -n "$FOR_KIND" ]]; then
  # an unread grove was refused before the token scan (gate_refuse_early)
  GROVE_ROW=$(jq -c '.groves[0]' <<<"$MODEL")

  # a hold names its box by host:port, so two registry names for one box share one hold set
  HOLD_BOX="${GROVES[0]//[^A-Za-z0-9.-]/_}"

  # the gate inputs, in one read: the free slots, the two axes that bind, the unread axes, the borrow mark
  IFS=$'\t' read -r FREE BINDS FREE_BINDS UPPER BORROWED < <(jq -r --arg k "$FOR_KIND" '
    .kinds[$k] | [ (.free_slots // "null"), (.binds // "none"), (.free_binds // "none"),
                   (.unread_axes | join(", ") | if . == "" then "-" else . end), (.borrowed // false) ] | @tsv' <<<"$GROVE_ROW") \
    || { echo "💥 MalfunctionError: the gate inputs did not read ($FOR_KIND on $ONLY)" >&2; exit 1; }
  # .note = an empty field would collapse under read's tab split, so no unread axis reads "-"
  [[ "$UPPER" == "-" ]] && UPPER=""

  mkdir -p "$HOLD_DIR" || { echo "💥 MalfunctionError: the hold dir could not be made: $HOLD_DIR" >&2; exit 1; }
  exec 9> "$HOLD_DIR/.lock" || { echo "💥 MalfunctionError: the hold lock could not be opened: $HOLD_DIR/.lock" >&2; exit 1; }
  flock -w 30 9 || { echo "💥 MalfunctionError: the hold lock did not free inside 30s: $HOLD_DIR/.lock" >&2; exit 1; }

  # lapse the holds past their bound, then count the live ones on this grove
  # a lapsed hold that cannot be dropped would shrink the slots in silence, so it fails loud
  find "$HOLD_DIR" -maxdepth 1 -name '*.hold' -mmin "+$HOLD_MIN" -delete \
    || { echo "💥 MalfunctionError: lapsed holds could not be dropped: $HOLD_DIR" >&2; exit 1; }

  # a keyed ask findserts: the hold of an earlier ask with the same key is this one
  # .note = `/` maps to `+`, a character --key refuses, so `beav/x` and `beav.x` stay two holds
  HOLD_ID=""
  REHELD=false
  KEYED_ID=""
  if [[ -n "$HOLD_KEY" ]]; then
    KEYED_ID="${HOLD_BOX}.${FOR_KIND}.${HOLD_KEY//\//+}"
    if [[ -f "$HOLD_DIR/$KEYED_ID.hold" ]]; then
      HOLD_ID="$KEYED_ID"
      REHELD=true
    fi
  fi
  HOLDS=$(get_counted_holds) || exit 1
  HELD=$(get_held_slots) || exit 1

  # .note = a reheld ask already owns its slot, so it is granted and renewed whatever the box
  #         reads now: its own sprout may have booted (its cost now in the live read), or another
  #         hold may have taken the last free slot since. a findsert returns the extant
  GRANTED=false
  if [[ "$REHELD" == "true" ]] || { [[ "$FREE" != "null" ]] && (( HELD < FREE )); }; then
    [[ -n "$HOLD_ID" ]] || HOLD_ID="${KEYED_ID:-${HOLD_BOX}.${FOR_KIND}.$$.$RANDOM}"
    # the hold IS the race guard: a grant whose hold did not land would let a racer take the slot
    printf 'box=%s\ngrove=%s\nkind=%s\n' "$HOLD_BOX" "$ONLY" "$FOR_KIND" > "$HOLD_DIR/$HOLD_ID.hold" \
      && [[ -f "$HOLD_DIR/$HOLD_ID.hold" ]] \
      || { echo "💥 MalfunctionError: the hold could not be written: $HOLD_DIR/$HOLD_ID.hold" >&2; exit 1; }
    GRANTED=true
  fi
  flock -u 9

  if [[ "$AS_JSON" == "true" ]]; then
    jq -n -c --arg grove "$ONLY" --arg kind "$FOR_KIND" --argjson granted "$GRANTED" --arg free "$FREE" \
      --argjson held "$HELD" --arg binds "$BINDS" --arg hold "$HOLD_ID" --arg upper "$UPPER" --argjson row "$GROVE_ROW" \
      --argjson reheld "$REHELD" --arg borrowed "$BORROWED" '
      { grove: $grove, kind: $kind, granted: $granted,
        free: (if $free == "null" then null else ($free | tonumber) end), held_before: $held, binds: $binds,
        hold: (if $granted and $hold != "" then $hold else null end),
        reheld: ($granted and $reheld),
        borrowed: ($borrowed == "true"),
        unread_axes: ($upper | split(", ") | map(select(length > 0))),
        cpu_stall: $row.cpu_stall,
        ram_stall: $row.ram_stall,
        idle: $row.idle }'
  elif [[ "$GRANTED" == "true" ]]; then
    echo "🌲 grove capacity · gate"
    if [[ "$REHELD" == "true" ]]; then
      echo "   ├─ ✅ a $FOR_KIND slot on $ONLY — the hold this key already took, renewed (binds: $BINDS)"
    else
      echo "   ├─ ✅ a $FOR_KIND slot on $ONLY — $((FREE - HELD - 1)) left after this one (binds: $BINDS)"
    fi
    if [[ "$FREE_BINDS" == "first_crew" ]]; then
      echo "   ├─ ⚪ the first crew: $ONLY holds no crew to read a cost from, so it gives one slot; the crew it boots gives the cost every later ask reads"
    elif [[ -n "$UPPER" ]]; then
      echo "   ├─ ⚪ an upper bound: unread axes — $UPPER"
    fi
    [[ "$BORROWED" == "true" ]] && echo "   ├─ ⚪ an estimate: no $FOR_KIND crew on $ONLY, so its cost is borrowed from the median of all its crews"
    echo "   └─ held as $HOLD_ID for $HOLD_MIN min"
    echo "      └─ drop it once the sprout boots: rhx git.grove.capacity --release $HOLD_ID"
  else
    {
      echo "✋ ConstraintError: no $FOR_KIND slot on $ONLY"
      if [[ "$FREE" == "null" ]]; then
        echo "   ├─ the cost of a $FOR_KIND crew is unread here: no crew on this grove to read it from"
      else
        echo "   ├─ free: $FREE · held by sprouts in flight: $HELD · binds: $BINDS"
      fi
      jq -r --argjson tokens null --argjson cal null "$CAPACITYWORK_JQ_MODEL"'
        (if .cpu_stall.mark == "🔴" then "   ├─ \(cpustallwhy(.cpu_stall))" else empty end),
        (if .ram_stall.mark == "🔴" then "   ├─ \(ramstallwhy(.ram_stall))" else empty end)' <<<"$GROVE_ROW"
      # the holds this ask counted: a sprout not yet booted, each with its id, its kind, its lapse
      if [[ -n "$HOLDS" ]]; then
        echo "   ├─ held by sprouts in flight — each lapses on its own, or on --release"
        awk -F'\t' 'NF { rows[++n] = $0 } END {
          for (i = 1; i <= n; i++) { split(rows[i], f, "\t")
            printf "   │  %s %s · %s · lapses in %d min\n", (i == n ? "└─" : "├─"), f[1], f[2], (f[3] < 0 ? 0 : f[3]) } }' <<<"$HOLDS"
        echo "   ├─ a hold whose sprout already booted holds its slot twice; drop it: rhx git.grove.capacity --release <hold>"
      fi
      # .note = the advice names what frees a slot on the axis that caps it: where the box has room
      #         and the holds alone fill it, a fell frees naught; where a token pool caps it, a fell
      #         frees no token slot; else the crews a fell would free
      # .note = idle is not fellable: a crew parked at a human gate reads idle and must keep its
      #         context. only `git.crew.poll --fellable` (merged and clean) says a crew may be felled
      BOX_HAS_ROOM=false
      [[ "$FREE" != "null" ]] && (( FREE > 0 )) && BOX_HAS_ROOM=true
      if [[ "$BOX_HAS_ROOM" == "false" && "$FREE_BINDS" == tokens_* ]]; then
        echo "   ├─ the token pool caps the free slots ($FREE_BINDS): a fell frees no token slot; the pool frees one as its burn falls or its window resets"
        echo "   ├─ read the pool: rhx git.crew.tokens calibrate"
      fi
      if [[ "$BOX_HAS_ROOM" == "false" && "$FREE_BINDS" != tokens_* ]]; then
        jq -r '
          if (.idle | length) > 0 then
            "   ├─ idle crews — no cpu now and no burn in the window; fell one only once its work is done",
            (.idle | length as $n | to_entries[] | "   │  " + (if .key == $n - 1 then "└─ " else "├─ " end) + "\(.value.crew) · \(.value.ram_gb)G"),
            "   ├─ to see which crews may be felled: rhx git.crew.poll --fellable"
          else "   ├─ idle crews: none — each crew here spends cpu now, or burned tokens in the window",
               "   ├─ a crew whose pr merged can still read busy; to see which may be felled: rhx git.crew.poll --fellable" end' <<<"$GROVE_ROW"
      fi
      echo "   └─ read every grove's free slots, then sprout where one is free — or seed the wish for later"
      echo "      ├─ rhx git.grove.capacity"
      echo "      └─ rhx radio.task.push --via gh.issues --into <org/repo> --title '<title>' --description @stdin"
    } >&2
  fi
  [[ "$GRANTED" == "true" ]] && exit 0
  exit 2
fi

if [[ "$AS_JSON" == "true" ]]; then
  echo "$MODEL"
  exit 0
fi

######################################################################
# render
######################################################################
jq -r --argjson levers "$LEVERS" --argjson timeout "$TIMEOUT" "$TOKENWORK_JQ_DEFS"'
  def unreached: (.tokens.unreached // [] | map("\(.grove) \(.state)") | join(", "));
  def partwhy:
    if (.tokens.unreached // [] | length) > 0 then "unreached: \(unreached)"
    elif (.tokens.unread // [] | length) > 0 then "\(many(.tokens.unread | length; "transcript")) unread, e.g. \(.tokens.unread[0])"
    else "a partial read" end;
  # .note = a longer timeout cures a timeout and naught else; an asleep or unreadable grove
  #         names its own cause on its row below
  def rereadhint:
    if (.tokens.unreached // [] | map(select(.state == "timeout")) | length) > 0
    then "; re-read once: rhx git.grove.capacity --timeout \($timeout * 2)"
    else "; each grove row below names why" end;
  # .note = the model leaves a partial fleet sum null (fleetph), so the render must too: a null
  #         through mtok prints 0, an idle fleet in the voice of a measure (term=false-report)
  def tokline:
    if .tokens.read and .tokens.fleet_per_hour == null then "⚪ unread as a fleet sum — \(partwhy)\(rereadhint)"
    elif .tokens.read then "\(mtok(.tokens.fleet_per_hour))/h now"
      + (if (.tokens.unreached // [] | length) > 0 then " (a lower bound — unreached: \(unreached))"
         elif (.tokens.unread // [] | length) > 0 then " (a lower bound — \(many(.tokens.unread | length; "transcript")) unread, e.g. \(.tokens.unread[0]))"
         elif .tokens.partial then " (a lower bound)" else "" end)
    elif (.tokens.unreached // [] | length) > 0 then "⚪ unread — \(unreached)\(rereadhint)"
    else "⚪ unread" end;
  def num($x): if $x == null then "⚪" else "\($x)" end;
  # .what = one stall on the grove row: its mark (the worse of the minute and the life row),
  #         the minute percent, and the life percent beside it
  # .note = `label` is a jq keyword, so the param is $name
  def stallseg($name; $s):
    if $s.mark == null then " · \($name) ⚪"
    else " · \($name) \($s.mark) \(num($s.pct))%"
      + (if $s.life_pct != null then " (since boot \($s.life_text)%)" else "" end)
      + (if $s.mark == "🔴" then ", no sprout" else "" end) end;
  def est($c; $axis; $x): if $x == null then "⚪" elif ($c.estimates | index($axis)) then "~\($x) (est.)" else "\($x)" end;
  def calline($w; $name):
    if $w == null then "\($name) ⚪ unread"
    elif $w.verdict.state == "calibrated" then "\($name) \(mtok($w.pool.sustainable_per_hour))/h sustained"
    else "\($name) ⚪ \($w.verdict.why)" end;
  def kindline($k; $c):
    if $c.first_crew then "\($k): ⚪ no crew here to read its cost from · first-crew slots free \(num($c.free_slots)), then the crew it boots gives the cost"
    elif $c.affordable == null and $c.live == 0 and ($c.ram_kb == null) then "\($k): ⚪ no crew here to read its cost from"
    else "\($k): affordable \(est($c; $c.binds; $c.affordable))\(if $c.upper_bound then " (upper bound)" else "" end) · binds \($c.binds // "⚪") · free slots \(num($c.free_slots))"
      + " · ram \(num($c.limits.ram)) · cpu \(est($c; "cpu"; $c.limits.cpu)) · tokens_5h \(num($c.limits.tokens_5h)) · tokens_7d \(num($c.limits.tokens_7d))"
      + (if $c.borrowed then " · costs borrowed from the grove median" else "" end) end;
  . as $m
  | "🌲 grove capacity (token cost over \(.window_min) min)",
    "   ├─ tokens, fleet-wide: \(tokline)",
    "   │  ├─ per crew-hour: behavior \(if .tokens.per_crew_hour.behavior then mtok(.tokens.per_crew_hour.behavior) else "⚪" end) · directive \(if .tokens.per_crew_hour.directive then mtok(.tokens.per_crew_hour.directive) else "⚪" end)",
    "   │  ├─ \(calline(.tokens.five_hour; "5h:"))",
    "   │  └─ \(calline(.tokens.seven_day; "7d:"))",
    ( .groves | length as $len | to_entries[] | .key as $gi | .value as $g
      | ($gi == $len - 1) as $lastg
      | (if $lastg then "   └─ " else "   ├─ " end) + "\(grovelabel($g.grove)): "
        + (if $g.state == "read"
           then "\($g.record.cpus) cpu · \($g.record.mem_avail_kb / 1048576 * 10 | floor / 10)G free of \($g.record.mem_total_kb / 1048576 * 10 | floor / 10)G · \($g.crews_live) crews live, \($g.crews_at_work) at work"
             + " · busy \($g.record.busy_cores) of \($g.record.cpus) · \($g.record.forks_per_sec) forks/s"
             + (if $g.seats_live > 0 then " (\($g.record.forks_per_sec / $g.seats_live * 10 | floor / 10) per seat)" else "" end)
             + stallseg("cpu stall"; $g.cpu_stall) + stallseg("ram full stall"; $g.ram_stall)
           elif $g.state == "asleep" then "💤 asleep — no slot — \($g.hint)"
           elif $g.state == "timeout" then "⏳ timeout — no slot — \($g.hint)"
           else "💥 unreadable — no slot — \($g.hint)" end),
      ( if $g.state == "read" then
          ( (if $lastg then "      " else "   │  " end) + "├─ " + kindline("behavior"; $g.kinds.behavior) ),
          ( (if $lastg then "      " else "   │  " end) + "├─ " + kindline("directive"; $g.kinds.directive) ),
          ( (if $lastg then "      " else "   │  " end) + (if $levers then "├─ " else "└─ " end)
            + "exchange: " + (if $g.exchange then "1 directive ≈ \($g.exchange.behavior_per_directive) behavior (on \($g.exchange.axis))\(if $g.exchange.borrowed then " — ⚪ an estimate: a cost is borrowed, so this is no measure" else "" end)" else "⚪ a directive cost is unread on the axis that binds" end) ),
          ( if $levers then
              ( (if $lastg then "      " else "   │  " end) + "└─ levers, by gain in behavior slots against \($g.kinds.behavior.binds // "⚪")" ),
              ( $g.levers | length as $ln | to_entries[] | .key as $li | .value
                | (if $lastg then "         " else "   │     " end) + (if $li == $ln - 1 then "└─ " else "├─ " end)
                  + (if .rank == "ranked" then "#\($li + 1) " else "" end)
                  + "\(.slug): "
                  + (if .rank == "unmeasured" then "unmeasured — listed, never ranked"
                     else "\(if .gain == null then "⚪" elif .gain > 0 then "+\(.gain)" else "+0" end) crews"
                       + " · cuts \(.axis)\(if .shape == "cost-cut" then " \(.cut * 100 | floor)%" else "" end)"
                       + " · \(.tier) · \(.reads) read\(if .reads == 1 then "" else "s" end)"
                       + (if .rank == "unranked" then " · unranked" else "" end) end) )
            else empty end )
        else empty end ) ),
    "",
    "🥥 next",
    "   ├─ ask for a slot: rhx git.grove.capacity --grove <g> --for behavior --key <branch>",
    "   ├─ rank the levers: rhx git.grove.capacity --levers",
    "   └─ calibrate the caps: rhx git.crew.tokens calibrate"
' <<<"$MODEL" || { rc=$?; [[ $rc -eq 141 ]] && exit 0; exit "$rc"; }
exit 0