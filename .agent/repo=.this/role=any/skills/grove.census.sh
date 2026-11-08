#!/usr/bin/env bash
######################################################################
# .what = read-only census of the grove this runs on: cpu, ram,
#         pressure, fork rate, per-crew ram + token burn, and the
#         boot toll (what a seat or fork pays before its first word)
#
# .why  = the concurrency budget needs measured per-crew costs per grove
#         - git.crew.tokens is absent on this grove, and blind to actor dirs
#         - each read is raw evidence for the criteria and blueprint stones
#
# usage:
#   grove.census.sh                    # 60 min token window, 30s fork sample
#   grove.census.sh --window 180       # token window, in minutes
#   grove.census.sh --sample 60        # fork-rate sample, in seconds
#   grove.census.sh --json             # one json record, for a tick
#   grove.census.sh --since <iso> --until <iso>
#                                      # burn between two utc instants (cap calibration)
#
# guarantee:
#   - read-only: reads /proc and claude transcripts; writes no file
#   - a closed stdout (`| head`) exits 0, with no broken-pipe trace
#   - prints no clock time; only window lengths and a datestamp
#   - usage is deduped per api message id (one call spans many lines)
#   - a crew = the worktree a seat's cwd sits in
#   - a boot = the first api call of a transcript begun in the span; a
#     fork = a transcript under subagents/; a resume also counts, so
#     boots are an upper bound
#   - cost weight is an estimate (api price ratios): input 1,
#     cache write 5m 1.25, cache write 1h 2, cache read 0.1, output 5
######################################################################
set -euo pipefail

# a reader that closes stdout early (`| head`) ends the census quietly, never as a fault
trap 'exit 0' PIPE

WINDOW_MIN=60
SAMPLE_SEC=30
AS_JSON=false
SINCE_AT=""
UNTIL_AT=""

# .what = refuse a valued flag with no value, before `set -u` aborts on an unbound $2
need_value() {
  [[ $# -ge 2 && "$2" != --* ]] || {
    echo "✋ ConstraintError: $1 needs a value" >&2
    echo "   run with --help for usage" >&2
    exit 2
  }
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --window|--sample|--since|--until) need_value "$@" ;;
  esac
  case $1 in
    # rhachet passes these; ignore them
    --skill|--repo|--role)
      shift 2
      ;;
    --window)
      WINDOW_MIN="$2"
      shift 2
      ;;
    --sample)
      SAMPLE_SEC="$2"
      shift 2
      ;;
    --json)
      AS_JSON=true
      shift
      ;;
    --since)
      SINCE_AT="$2"
      shift 2
      ;;
    --until)
      UNTIL_AT="$2"
      shift 2
      ;;
    --help|-h)
      echo "usage: grove.census.sh [--window <min> | --since <iso> [--until <iso>]] [--sample <sec>] [--json]"
      echo ""
      echo "  --window <min>   token burn window, in minutes back from now (default 60)"
      echo "  --since <iso>    token burn from this instant (utc), in place of --window"
      echo "  --until <iso>    token burn up to this instant (utc; default now)"
      echo "  --sample <sec>   fork-rate sample length, in seconds (default 30)"
      echo "  --json           emit one json record in place of the tree"
      exit 0
      ;;
    *)
      echo "✋ ConstraintError: unknown argument: $1" >&2
      echo "   run with --help for usage" >&2
      exit 2
      ;;
  esac
done

# fail fast on a non-numeric window or sample
[[ "$WINDOW_MIN" =~ ^[0-9]+$ ]] || { echo "✋ ConstraintError: --window must be whole minutes, got '$WINDOW_MIN'" >&2; exit 2; }
[[ "$SAMPLE_SEC" =~ ^[0-9]+$ ]] || { echo "✋ ConstraintError: --sample must be whole seconds, got '$SAMPLE_SEC'" >&2; exit 2; }
command -v jq >/dev/null || { echo "💥 MalfunctionError: jq is absent on this grove" >&2; exit 1; }
(( SAMPLE_SEC > 0 )) || { echo "✋ ConstraintError: --sample must be at least 1 second" >&2; exit 2; }

# the cost weight and the crew of a cwd: one statement each, owned by the supervisor's libs
#   work/tokenwork.sh  = the api price ratios (usagefields, weighted)
#   work/grovework.sh  = the tree a seat cwd sits in (crewroot)
# .note = the linked role dir first, then the source tree, so a run from either finds them
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || echo "$SCRIPT_DIR")"
source_supervisor_lib() {
  local candidate
  for candidate in "$REPO_ROOT/.agent/repo=bhuild/role=supervisor/skills/work/$1" \
                   "$REPO_ROOT/src/domain.roles/supervisor/skills/work/$1"; do
    # shellcheck source=/dev/null
    [[ -r "$candidate" ]] && { source "$candidate"; return 0; }
  done
  echo "💥 MalfunctionError: the supervisor lib work/$1 is absent; run: npx rhachet roles link --role supervisor" >&2
  exit 1
}
source_supervisor_lib tokenwork.sh
source_supervisor_lib grovework.sh

# the /proc extractors, each named for the field it reads
get_cpu_count() { grep -c '^processor' /proc/cpuinfo; }
# a /proc/meminfo field, in kb
get_meminfo_kb() { awk -v field="$1:" '$1 == field { print $2 }' /proc/meminfo; }
# the load average over 1 min (field 1) or 5 min (field 2)
get_load_avg() { awk -v span="$1" '{ print (span == 1 ? $1 : $2) }' /proc/loadavg; }
# a psi avg60 percent: resource = cpu | memory, kind = some | full; null where psi is absent
get_psi_avg60() {
  [[ -r "/proc/pressure/$1" ]] || { echo null; return 0; }
  awk -v kind="$2" '$1 == kind { for (i = 2; i <= NF; i++) if ($i ~ /^avg60=/) { sub("avg60=", "", $i); print $i } }' "/proc/pressure/$1"
}

# grove totals: cpu, ram, pressure
CPU_COUNT=$(get_cpu_count)
MEM_TOTAL_KB=$(get_meminfo_kb MemTotal)
MEM_AVAIL_KB=$(get_meminfo_kb MemAvailable)
SWAP_TOTAL_KB=$(get_meminfo_kb SwapTotal)
LOAD_1=$(get_load_avg 1)
LOAD_5=$(get_load_avg 5)
PSI_CPU_SOME_60=$(get_psi_avg60 cpu some)
PSI_MEM_SOME_60=$(get_psi_avg60 memory some)
PSI_MEM_FULL_60=$(get_psi_avg60 memory full)

# map each live process to: pid, ppid, comm, pss kb, cwd
# .note = a process may exit mid-read; each read tolerates that and moves on
# .note = read at both ends of the sample: a pid born inside the window is charged to its
#         crew, and a pid dead inside it still gives back its pre-sample ticks (see read_ticks)
# .why each read is ONE pass over /proc (a grep, a find), never a loop that forks per pid:
#      on a loaded grove a per-pid loop took minutes and was itself the top saturator
#      (surgoal.squeeze-the-grove: a census that forks per process IS a saturator)

# one row per pid from /proc/<pid>/stat: pid, ppid, comm, cpu ticks
# .note = the fields after the ")" of comm, by their proc(5) names: state 1, ppid 2,
#         utime 12, stime 13, cutime 14, cstime 15. comm may hold spaces or a ")", so it
#         is cut at the LAST ")"
# .note = a pid that exits between the glob and the read makes grep exit 2; that is the
#         live box, not a fault, so each pass tolerates it (the row is just absent)
read_stat_rows() {
  { grep -h "" /proc/[0-9]*/stat 2>/dev/null || true; } | awk '{
    s = $0; lparen = index(s, "("); rparen = 0
    while ((k = index(substr(s, rparen + 1), ")")) > 0) rparen += k
    comm = substr(s, lparen + 1, rparen - lparen - 1); gsub(/\t/, " ", comm)
    split(substr(s, rparen + 2), f, " ")
    pid = substr(s, 1, lparen - 2); ppid = f[2]
    utime = f[12]; stime = f[13]; cutime = f[14]; cstime = f[15]
    printf "%s\t%s\t%s\t%s\n", pid, ppid, comm, utime + stime + cutime + cstime
  }'
}
# one row per pid: pid, pss kb (from smaps_rollup)
read_pss_rows() {
  { grep -H '^Pss:' /proc/[0-9]*/smaps_rollup 2>/dev/null || true; } \
    | awk '{ split($1, path, "/"); pid = path[3]; print pid "\t" $2 }'
}
# one row per pid: pid, cwd
read_cwd_rows() {
  { find /proc -mindepth 2 -maxdepth 2 -name cwd -printf '%h\t%l\n' 2>/dev/null || true; } \
    | awk -F'\t' '{ pid = substr($1, 7) } pid ~ /^[0-9]+$/ { print pid "\t" $2 }'
}

# map each live process to: pid, ppid, comm, pss kb, cwd
# .note = a process may exit mid-read; a pid absent from one pass reads pss 0 or no cwd
# .note = read at both ends of the sample: a pid born inside the window is charged to its
#         crew, and a pid dead inside it still gives back its pre-sample ticks (see read_ticks)
read_proc_rows() {
  local tag="$1"
  awk -F'\t' -v tag="$tag" '
    FILENAME == ARGV[1] { pss[$1] = $2; next }
    FILENAME == ARGV[2] { cwd[$1] = $2; next }
    { printf "%s\t%s\t%s\t%s\t%s\t%s\n", tag, $1, $2, $3, (($1 in pss) ? pss[$1] : 0), cwd[$1] }
  ' <(read_pss_rows) <(read_cwd_rows) <(read_stat_rows)
}
PROC_ROWS_A=$(read_proc_rows a)

# cpu ticks per process: utime + stime + cutime + cstime
# .note = a child reaped mid-sample lands its WHOLE life in its parent's cutime, the part
#         before the sample too. the delta below charges each pid (b - a), absent = 0, so a
#         pid gone by b gives back its pre-sample ticks and the parent's jump nets to the window
read_ticks() { read_stat_rows | awk -F'\t' '{ print $1 "\t" $4 }'; }
# the whole box's busy jiffies: user + nice + system + irq + softirq + steal
# .note = idle and iowait wait; guest is already inside user (proc(5)), so neither counts
read_cpu_busy() {
  # .note = `sys`, never `system`: system() is an awk builtin, and the program would not parse
  awk '/^cpu / { user = $2; nice = $3; sys = $4; irq = $7; softirq = $8; steal = $9
                 print user + nice + sys + irq + softirq + steal }' /proc/stat
}
# the box's fork counter since boot
read_forks_total() { awk '/^processes / { print $2 }' /proc/stat; }

# one sample window for fork rate and cpu spend
CLK_TCK=$(getconf CLK_TCK)
# .note = a tick read walks all of /proc and takes seconds, so the per-crew span is
#         measured end to end, never assumed to be --sample
SPAN_START_NS=$(date +%s%N)
TICKS_A=$(read_ticks)
BUSY_A=$(read_cpu_busy)
FORKS_BEFORE=$(read_forks_total)
sleep "$SAMPLE_SEC"
FORKS_AFTER=$(read_forks_total)
BUSY_B=$(read_cpu_busy)
TICKS_B=$(read_ticks)
# .what = a quotient as a json number, to $3 decimals
# .why bc prints ".52" for a sub-1 quotient, which --argjson refuses as json; awk prints "0.52"
get_quotient() { awk -v a="$1" -v b="$2" -v dp="$3" 'BEGIN { printf "%." dp "f", a / b }'; }
TICK_SPAN_SEC=$(get_quotient "$(( $(date +%s%N) - SPAN_START_NS ))" 1000000000 3)
PROC_ROWS_B=$(read_proc_rows b)
FORKS_PER_SEC=$(get_quotient "$((FORKS_AFTER - FORKS_BEFORE))" "$SAMPLE_SEC" 2)
CORES_BUSY=$(get_quotient "$((BUSY_B - BUSY_A))" "$((CLK_TCK * SAMPLE_SEC))" 2)
TICK_DELTA_JSON=$(
  printf '%s\n%s\n' "$(echo "$TICKS_A" | sed 's/^/a\t/')" "$(echo "$TICKS_B" | sed 's/^/b\t/')" | jq -R -s '
    split("\n") | map(select(length > 0) | split("\t"))
    | reduce .[] as $r ({}; .[$r[1]][$r[0]] = ($r[2] | tonumber))
    | with_entries(.value = ((.value.b // 0) - (.value.a // 0)))
  '
)

# per crew ram + cpu: each top claude seat plus all its descendants, grouped by worktree
PROC_ROWS=$(printf '%s\n%s\n' "$PROC_ROWS_A" "$PROC_ROWS_B")
PROCS_JSON=$(
  echo "$PROC_ROWS" | jq -R -s '
    split("\n") | map(select(length > 0) | split("\t")
      | {at: .[0], pid: .[1], ppid: .[2], comm: .[3], pss: (.[4] | tonumber), cwd: .[5]})
    # one row per pid: the b read wins; a pid gone by b keeps its a row, with no ram
    | reduce .[] as $p ({}; if $p.at == "b" or .[$p.pid] == null
        then .[$p.pid] = ($p | if .at == "a" then .pss = 0 else . end) else . end)
    | [.[]]
  '
)
CREW_RAM_JSON=$(
  echo "$PROCS_JSON" | jq --argjson dticks "$TICK_DELTA_JSON" --argjson hz "$CLK_TCK" --argjson sec "$TICK_SPAN_SEC" \
    --arg home "$HOME" "$GROVEWORK_JQ_CREW"'
    . as $procs
    | (reduce $procs[] as $p ({}; .[$p.ppid] += [$p.pid])) as $kids
    | (reduce $procs[] as $p ({}; .[$p.pid] = $p)) as $byPid
    | def tree($id): [$id] + ([($kids[$id] // [])[] | tree(.)] | add // []);
    def crew($cwd): crewroot($cwd; $home);
    def cores($t): ([$t, 0] | max | . / $hz / $sec * 100 | floor / 100);
    [ $procs[] | select(.comm == "claude.exe" or .comm == "claude")
      | select(($byPid[.ppid].comm // "") as $pc | ($pc != "claude.exe" and $pc != "claude"))
      | . as $seat
      | (tree($seat.pid)) as $ids
      | { crew: crew($seat.cwd), seat: true, ids: $ids,
          parent: ($byPid[$seat.ppid].comm // "?") } ] as $seats
    | ([$seats[].ids[]] | map({(.): true}) | add // {}) as $inTree
    # a process outside every seat tree, with its cwd in a crew worktree, is that crew'"'"'s
    | ([ $procs[] | select($inTree[.pid] | not) | select(.cwd | test("/_worktrees/[^/]+"))
         | { crew: crew(.cwd), seat: false, ids: [.pid], parent: "cwd" } ]) as $strays
    | ([$seats[].ids[], $strays[].ids[]] | map({(.): true}) | add // {}) as $inCrew
    | { crews: ($seats + $strays
        | map(. + { pss_kb: ([.ids[] | ($byPid[.].pss // 0)] | add // 0),
                    ticks: ([.ids[] | ($dticks[.] // 0)] | add // 0) })
        | group_by(.crew)
        | map({ crew: .[0].crew, seats: (map(select(.seat)) | length),
                seat_parents: (map(select(.seat) | .parent) | group_by(.) | map({(.[0]): length}) | add // {}),
                procs: (map(.ids | length) | add), pss_kb: (map(.pss_kb) | add),
                cores: cores(map(.ticks) | add) })),
        # the rest of the grove: busy cpu in no crew, by command
        outside: ([ $procs[] | select($inCrew[.pid] | not) | {comm, t: ($dticks[.pid] // 0)} ]
          | group_by(.comm) | map({comm: .[0].comm, cores: cores(map(.t) | add)})
          | map(select(.cores > 0)) | sort_by(-.cores)) }
  '
)
CREW_OUTSIDE_JSON=$(echo "$CREW_RAM_JSON" | jq '.outside')
CREW_RAM_JSON=$(echo "$CREW_RAM_JSON" | jq '.crews')

# token burn span: --since/--until when given, else the last --window minutes
NOW_EPOCH=$(date -u +%s)
SINCE_EPOCH=$((NOW_EPOCH - WINDOW_MIN * 60))
UNTIL_EPOCH=$NOW_EPOCH
if [[ -n "$SINCE_AT" ]]; then
  SINCE_EPOCH=$(date -u -d "$SINCE_AT" +%s 2>/dev/null) || { echo "✋ ConstraintError: --since is not a readable instant: '$SINCE_AT'" >&2; exit 2; }
fi
if [[ -n "$UNTIL_AT" ]]; then
  UNTIL_EPOCH=$(date -u -d "$UNTIL_AT" +%s 2>/dev/null) || { echo "✋ ConstraintError: --until is not a readable instant: '$UNTIL_AT'" >&2; exit 2; }
fi
(( SINCE_EPOCH < UNTIL_EPOCH )) || { echo "✋ ConstraintError: the span is empty: --since must precede --until (and now)" >&2; exit 2; }
# a rate per hour over 0 whole minutes divides by zero; refuse it up front, as git.crew.tokens does
(( UNTIL_EPOCH - SINCE_EPOCH >= 60 )) || { echo "✋ ConstraintError: the span is under one minute — a burn rate needs ≥ 1 min between --since and --until" >&2; exit 2; }
# a span that begins in the future holds no transcript yet, and its burn would read 0: an idle fleet
(( SINCE_EPOCH <= NOW_EPOCH )) || { echo "✋ ConstraintError: --since is in the future ('$SINCE_AT'); a burn can only be read over time already past" >&2; exit 2; }
SINCE=$(date -u -d "@$SINCE_EPOCH" +%Y-%m-%dT%H:%M:%S)
UNTIL=$(date -u -d "@$UNTIL_EPOCH" +%Y-%m-%dT%H:%M:%S)
WINDOW_MIN=$(( (UNTIL_EPOCH - SINCE_EPOCH) / 60 ))
FIND_MIN=$(( (NOW_EPOCH - SINCE_EPOCH) / 60 + 1 ))

# token burn per crew, from every claude config dir on this grove
CONFIG_DIRS=()
[[ -d "$HOME/.claude/projects" ]] && CONFIG_DIRS+=("$HOME/.claude")
for d in "$HOME"/git/*/_worktrees/*/.agent/.actors/*/brain/.claude "$HOME"/git/*/*/.agent/.actors/*/brain/.claude; do
  [[ -d "$d/projects" ]] && CONFIG_DIRS+=("$d")
done

# the account a config dir is signed in to NOW (transcripts record none)
# .note = a swap overwrites this, so burn before the last swap is misattributed
# .note = an absent config reads `unknown`; a config that exists and does not parse reads
#         `unparsed:<file>`, so the caller names it in the unread list (as tokenwork.probe does)
read_account() {
  local cfg="$1" file account
  for file in "$cfg/.claude.json" "$(dirname "$cfg")/.claude.json"; do
    [[ -f "$file" ]] || continue
    if account=$(jq -r '.oauthAccount.emailAddress // "unsigned"' "$file" 2>/dev/null); then
      echo "$account"
    else
      echo "unparsed:$file"
    fi
    return 0
  done
  echo "unknown"
}

# one pass over every transcript touched in the span; each row is tagged:
#   use  = an api call inside the span (burn)
#   boot = the transcript's true first api call (the boot toll); kept below only if it began in the span
SPAN_LINES=$(
  for cfg in "${CONFIG_DIRS[@]}"; do
    actor=$(echo "$cfg" | sed -n 's#.*/\.actors/\([^/]*\)/brain/\.claude$#\1#p')
    account=$(read_account "$cfg")
    if [[ "$account" == unparsed:* ]]; then
      jq -n -c --arg file "${account#unparsed:} (does not parse)" '{t: "unread", file: $file}'
      account="unparsed"
    fi
    find "$cfg/projects" -name '*.jsonl' -mmin "-$FIND_MIN" 2>/dev/null | while read -r file; do
      fork=false
      [[ "$file" == */subagents/* ]] && fork=true
      # a transcript that does not parse is named in an unread row, never dropped in silence
      # .note = fromjson? skips one torn line (a write in flight), so only a whole-file fault counts
      jq -R -c --arg since "$SINCE" --arg until "$UNTIL" --arg actor "${actor:-home}" --arg account "$account" --argjson fork "$fork" '
        fromjson? | select(.timestamp? != null and .timestamp >= $since and .timestamp < $until)
        | if .message.usage? != null then
            { t: "use", id: (.message.id // .uuid), cwd: (.cwd // ""), actor: $actor, account: $account, fork: $fork,
              session: (.sessionId // ""), u: .message.usage }
          elif .attachment.durationMs? != null then
            { t: "hook", id: (.uuid // ""), ms: .attachment.durationMs, event: (.attachment.hookEvent // "") }
          else empty end
      ' "$file" 2>/dev/null || jq -n -c --arg file "$file" '{t: "unread", file: $file}'
      (jq -c --argjson fork "$fork" '
        select(.message.usage? != null and .timestamp? != null)
        | { t: "boot", at: .timestamp, fork: $fork, u: .message.usage }
      ' "$file" 2>/dev/null || true) | head -n 1
    done
  done
)
TOKEN_LINES=$(printf '%s\n' "$SPAN_LINES" | jq -c 'select(.t? == "use")')
UNREAD_JSON=$(printf '%s\n' "$SPAN_LINES" | jq -s -c 'map(select(.t? == "unread") | .file)')

# the hook toll: each hook run's wall time, as the transcript records it (attachment.durationMs)
# .note = wall time, not cpu: a hook chain that waits (a stalled box, a network call) reads long
#         and spends little, so cores_at_most is an upper bound on the cpu the hooks spent
HOOKS_JSON=$(
  printf '%s\n' "$SPAN_LINES" | jq -s -c --argjson window "$WINDOW_MIN" '
    map(select(.t? == "hook")) | unique_by(.id)
    | { runs: length,
        pre_tool_use: (map(select(.event == "PreToolUse")) | length),
        wall_sec: ((map(.ms) | add // 0) / 1000 | floor),
        cores_at_most: (if $window == 0 then 0 else ((map(.ms) | add // 0) / 1000 / ($window * 60) * 100 | floor / 100) end) }
  '
)

# the boot toll: what a seat or fork pays before its first word (a fresh cache write)
# .note = a "boot" = the first api call of a transcript file; a fork = a transcript under
#         subagents/. a resume continues an older transcript and also counts, so boots are an upper bound
BOOT_MD_JSON=$(
  for cfg in "${CONFIG_DIRS[@]}"; do
    size=0
    [[ -f "$cfg/boot.md" ]] && size=$(wc -c < "$cfg/boot.md")
    printf '%s\n' "$size"
  done | jq -s -c 'sort | { dirs: length, with_boot: (map(select(. > 0)) | length),
    median_bytes: (if length == 0 then 0 else .[(length / 2 | floor)] end), max_bytes: (max // 0) }'
)
BOOTS_JSON=$(
  printf '%s\n' "$SPAN_LINES" | jq -s -c --arg since "$SINCE" --arg until "$UNTIL" --argjson window "$WINDOW_MIN" --argjson bootMd "$BOOT_MD_JSON" "$TOKENWORK_JQ_WEIGHT"'
    # .note = the toll is the prompt side alone (output 0): what a boot pays before its first word
    map(select(.t? == "boot" and .at >= $since and .at < $until)
      | {fork} + (.u | usagefields | .output = 0)) as $all
    | def median($xs): ($xs | sort) as $s | if ($s | length) == 0 then 0 else $s[($s | length / 2 | floor)] end;
    def stats($rows):
      ($rows | map(weighted)) as $wt
      | { boots: ($rows | length),
          prompt_median: median($rows | map(.input + .write5m + .write1h + .read)),
          cache_write_median: median($rows | map(.write5m + .write1h)),
          weighted_total: ($wt | add // 0 | floor),
          weighted_per_hour: (if $window == 0 then 0 else (($wt | add // 0) * 60 / $window | floor) end) };
    { boot_md: $bootMd,
      seats: stats($all | map(select(.fork | not))),
      forks: stats($all | map(select(.fork))) }
  '
)

# burn per account, by the account each config dir is signed in to now
ACCOUNT_TOKENS_JSON=$(
  echo "$TOKEN_LINES" | jq -s "$TOKENWORK_JQ_WEIGHT"'
    unique_by(.id)
    | map({ account, cfg: .actor, weighted: (.u | usagefields | weighted) })
    | group_by(.account)
    | map({ account: .[0].account, config_dirs: (map(.cfg) | unique | length),
            weighted: (map(.weighted) | add | floor) })
    | sort_by(-.weighted)
  '
)

CREW_TOKENS_JSON=$(
  echo "$TOKEN_LINES" | jq -s --argjson hours "$(get_quotient "$WINDOW_MIN" 60 4)" --arg home "$HOME" \
    "$TOKENWORK_JQ_WEIGHT$GROVEWORK_JQ_CREW"'
    # a call from a cwd in no repo (a smoke test, a scratch ask) pools in one "(outside any repo)" row
    def crew($cwd): crewroot($cwd; $home);
    unique_by(.id)
    | map(. + (.u | usagefields))
    | map(. + { weighted: weighted })
    | group_by(crew(.cwd))
    | map({
        crew: crew(.[0].cwd),
        sessions: (map(.session) | unique | length),
        actors: (map(.actor) | unique),
        calls: length,
        calls_fork: (map(select(.fork)) | length),
        input: (map(.input) | add), write5m: (map(.write5m) | add), write1h: (map(.write1h) | add),
        read: (map(.read) | add), output: (map(.output) | add),
        raw: (map(.input + .write5m + .write1h + .read + .output) | add),
        weighted: (map(.weighted) | add | floor),
        weighted_fork: (map(select(.fork) | .weighted) | add // 0 | floor) })
    | map(. + { weighted_per_hour: ((.weighted / $hours) | floor) })
    | sort_by(-.weighted)
  '
)

RECORD=$(jq -n \
  --arg host "$(hostname)" --arg date "$(date -u +%Y-%m-%d)" \
  --argjson cpus "$CPU_COUNT" --argjson memTotalKb "$MEM_TOTAL_KB" --argjson memAvailKb "$MEM_AVAIL_KB" \
  --argjson swapKb "$SWAP_TOTAL_KB" --argjson load1 "$LOAD_1" --argjson load5 "$LOAD_5" \
  --arg psiCpu "$PSI_CPU_SOME_60" --arg psiMemSome "$PSI_MEM_SOME_60" --arg psiMemFull "$PSI_MEM_FULL_60" \
  --argjson forksPerSec "$FORKS_PER_SEC" --argjson sampleSec "$SAMPLE_SEC" --argjson windowMin "$WINDOW_MIN" \
  --argjson coresBusy "$CORES_BUSY" --argjson accounts "$ACCOUNT_TOKENS_JSON" \
  --argjson ram "$CREW_RAM_JSON" --argjson tokens "$CREW_TOKENS_JSON" --argjson outside "$CREW_OUTSIDE_JSON" --argjson boots "$BOOTS_JSON" --argjson unread "$UNREAD_JSON" \
  --argjson hooks "$HOOKS_JSON" '
  # .what = the rows of one crew root from a set, and a sum of one field over them
  def rowsof($rows; $c): [$rows[] | select(.crew == $c)];
  def sumof($rows; $f; $zero): ([$rows[] | .[$f]] | add // $zero);
  # .what = one crew: its ram now (pss, in G) joined to its token burn over the span, by crew root
  # .note = a crew with ram and no burn reads tokens null ("no burn in window"), never 0
  def census_crew($c; $ram; $tokens):
    rowsof($ram; $c) as $r
    | { crew: ($c | split("/") | last),
        ram_gb: (sumof($r; "pss_kb"; 0) / 1048576 * 100 | floor / 100),
        seats_live: sumof($r; "seats"; 0),
        seat_parents: sumof($r; "seat_parents"; {}),
        procs: sumof($r; "procs"; 0),
        cores: sumof($r; "cores"; 0),
        tokens: ((rowsof($tokens; $c) | first) // null | if . then del(.crew) else . end) };
  # .what = every crew root that holds ram now or burned in the span, each joined once
  def census_crews($ram; $tokens): ([$ram[].crew, $tokens[].crew] | unique | map(census_crew(.; $ram; $tokens)));

  { grove: $host, date: $date,
    cpu: { count: $cpus, busy_cores: $coresBusy, load1: $load1, load5: $load5, psi_some_avg60: $psiCpu,
           outside_crews: $outside },
    ram: { total_gb: ($memTotalKb / 1048576 * 10 | floor / 10), avail_gb: ($memAvailKb / 1048576 * 10 | floor / 10),
           swap_gb: ($swapKb / 1048576 * 10 | floor / 10), psi_some_avg60: $psiMemSome, psi_full_avg60: $psiMemFull },
    forks: { per_sec: $forksPerSec, sample_sec: $sampleSec },
    window_min: $windowMin,
    transcripts_unread: $unread,
    accounts: $accounts,
    boots: $boots,
    hooks: $hooks,
    crews: census_crews($ram; $tokens) }
')

# emit json for a tick
if [[ "$AS_JSON" == "true" ]]; then
  echo "$RECORD"
  exit 0
fi

# emit the tree for a human
# .note = the account rows read "signed in now", never "burned by"; see read_account
echo "$RECORD" | jq -r '
  def mtok($x): "\(($x // 0) / 1000000 * 10 | floor / 10)M";
  def ktok($x): "\(($x // 0) / 1000 | floor)K";
  def atok($x): if ($x // 0) >= 1000000 then mtok($x) else ktok($x) end;
  "🐚 grove.census",
  "   ├─ grove: \(.grove) (\(.date))",
  "   ├─ cpu: \(.cpu.busy_cores) of \(.cpu.count) cores busy over \(.forks.sample_sec)s · load \(.cpu.load1) / \(.cpu.load5) · psi some avg60 \(.cpu.psi_some_avg60)%",
  "   ├─ cpu in crews: \(if (.crews | length) == 0 then "⚪ no crew live" else "\(([.crews[].cores] | add // 0) * 100 | floor / 100) cores" end) · outside crews: \([.cpu.outside_crews[].cores] | add // 0 | . * 100 | floor / 100) cores (\(.cpu.outside_crews[:3] | map("\(.comm) \(.cores)") | join(", ")))",
  "   ├─ ram: \(.ram.avail_gb)G avail of \(.ram.total_gb)G · swap \(.ram.swap_gb)G · psi some \(.ram.psi_some_avg60)% full \(.ram.psi_full_avg60)%",
  "   ├─ forks: \(.forks.per_sec)/s over \(.forks.sample_sec)s",
  "   ├─ account burn over \(.window_min) min: \(mtok([.crews[].tokens.weighted // 0] | add)) weighted · \(mtok([.crews[].tokens.raw // 0] | add)) raw"
    + (if (.transcripts_unread | length) > 0 then " (a lower bound: \(.transcripts_unread | length) transcripts unread — e.g. \(.transcripts_unread[0]))" else "" end),
  "   ├─ accounts (signed in now — a swap inside the span misattributes)",
  ( .accounts | length as $len | to_entries[] |
    (if .key == ($len - 1) then "   │  └─ " else "   │  ├─ " end)
    + "\(.value.account): \(mtok(.value.weighted)) weighted · \(.value.config_dirs) config dirs" ),
  "   ├─ boot toll over the \(.window_min) min span (first call of each transcript begun in it; resumes count, so an upper bound)",
  "   │  ├─ boot.md: \(.boots.boot_md.with_boot) of \(.boots.boot_md.dirs) config dirs · median \(.boots.boot_md.median_bytes / 1024 | floor)KB · max \(.boots.boot_md.max_bytes / 1024 | floor)KB",
  "   │  ├─ seats: \(.boots.seats.boots) boots · first prompt median \(ktok(.boots.seats.prompt_median)) · written fresh median \(ktok(.boots.seats.cache_write_median)) · toll \(atok(.boots.seats.weighted_total)) (\(atok(.boots.seats.weighted_per_hour))/h)",
  "   │  └─ forks: \(.boots.forks.boots) boots · first prompt median \(ktok(.boots.forks.prompt_median)) · written fresh median \(ktok(.boots.forks.cache_write_median)) · toll \(atok(.boots.forks.weighted_total)) (\(atok(.boots.forks.weighted_per_hour))/h)",
  "   ├─ hooks over the \(.window_min) min span: \(.hooks.runs) runs (\(.hooks.pre_tool_use) PreToolUse) · \(.hooks.wall_sec)s wall · ≤ \(.hooks.cores_at_most) cores (wall time, so an upper bound on their cpu)",
  "   └─ crews (ram now · tokens over the \(.window_min) min span, cost-weighted)",
  ( .crews | sort_by(-(.tokens.weighted // 0)) | length as $len | to_entries[] |
    (if .key == ($len - 1) then "      └─ " else "      ├─ " end)
    + "\(.value.crew): \(.value.ram_gb)G · \(.value.cores) cores · \(.value.seats_live) seats · \(.value.procs) procs"
    + (if .value.seats_live > 1 then " (seat parents: \(.value.seat_parents | to_entries | map("\(.key)×\(.value)") | join(", ")))" else "" end)
    + (if .value.tokens then
        " · \(mtok(.value.tokens.weighted)) weighted (\(mtok(.value.tokens.weighted_per_hour))/h)"
        + " · raw \(mtok(.value.tokens.raw)) · out \(mtok(.value.tokens.output))"
        + " · forks \(mtok(.value.tokens.weighted_fork))"
      else " · no burn in window" end) )
' || {
  # a reader that closed stdout early kills jq with SIGPIPE (exit 141); that is not a fault
  rc=$?
  [[ $rc -eq 141 ]] && exit 0
  exit "$rc"
}